"use client";
import { useState } from "react";
import "../../styles/room.css";
import XMarker from "../components/XMarker";
import ScribbleMarker from "../components/ScribbleMarker";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRef } from "react";
import { TransformComponent } from "react-zoom-pan-pinch";
import { TransformWrapper } from "react-zoom-pan-pinch";
import { formatTime } from "@/lib/timeAgo";
import PinsSidebar from "../components/PinsSidebar";
import ShareModal from "../components/ShareModal";

const supabase = createClient();
export default function RoomClient({ room_id }) {
	const [pins, setPins] = useState([]);
	const [commentActive, setCommentActive] = useState(false);
	const [comment, setComment] = useState("");
	const [currentUser, setCurrentUser] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [roomInfo, setRoomInfo] = useState({
		name: "Loading...",
		creator_id: null,
		members: [],
	});
	const [activeUsers, setActiveUsers] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const commentRef = useRef(null);
	const zoomRef = useRef(null);
	const defaultPin = {
		x: 0,
		y: 0,
		markerType: "x",
		comment: "",
	};
	const [activePin, setActivePin] = useState(defaultPin);
	const [pinDetail, setPinDetail] = useState(null);
	const displayPins = commentActive
		? [
				...pins,
				{
					...activePin,
					id: "active",
					authorId: currentUser?.id,
					comment,
				},
			]
		: pins;

	const [reply, setReply] = useState("");
	const [replies, setReplies] = useState([]);
	const [repliesLoading, setRepliesLoading] = useState(false);
	const [inputMode, setInputMode] = useState({
		mode: "normal",
		to: "reply",
		idToEdit: null,
	});
	const [shareModalActive, setShareModalActive] = useState(false);

	const notify = (message, type, subject) => {
		setNotifications((prev) => {
			const lastnotif = prev[prev.length - 1];

			if (lastnotif?.subject === subject && lastnotif?.type === type) {
				return prev;
			}

			const id = crypto.randomUUID();

			setTimeout(() => {
				setNotifications((items) =>
					items.filter((item) => item.id !== id),
				);
			}, 3000);

			return [...prev, { id, message, type, subject }];
		});
	};

	useEffect(() => {
		if (!room_id || !currentUser?.id || !roomInfo?.members) return;

		const channel = supabase.channel(`room-presence-${room_id}`, {
			config: {
				presence: {
					key: currentUser.id,
				},
			},
		});

		channel
			.on("presence", { event: "sync" }, () => {
				const state = channel.presenceState();

				const users = Object.values(state).flat();

				const onlineMembers = roomInfo.members.filter((member) =>
					users.some((user) => user.user_id === member.id),
				);
				setActiveUsers(onlineMembers);
			})
			.on("presence", { event: "join" }, ({ newPresences }) => {
				// console.log("Joined:", newPresences);

				const joinedMember = roomInfo.members.filter((member) =>
					newPresences.some((user) => user.user_id === member.id),
				);
				notify(
					`${joinedMember[0].name} joined the room`,
					"join",
					joinedMember[0].name,
				);
			})
			.on("presence", { event: "leave" }, ({ leftPresences }) => {
				// console.log("Left:", leftPresences);

				const leftMember = roomInfo.members.filter((member) =>
					leftPresences.some((user) => user.user_id === member.id),
				);
				notify(
					`${leftMember[0].name} left the room`,
					"leave",
					leftMember[0].name,
				);
			})
			.subscribe(async (status) => {
				if (status === "SUBSCRIBED") {
					await channel.track({
						user_id: currentUser.id,
						online_at: new Date().toISOString(),
					});
				}
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [room_id, currentUser?.id]);
	useEffect(() => {
		const channel = supabase
			.channel(`room-${room_id}-pins`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "pins",
					filter: `room_id=eq.${room_id}`,
				},
				(payload) => {
					const newPin = payload.new;

					setPins((prev) => {
						// Prevent duplicate pins
						if (prev.some((pin) => pin.id === newPin.id)) {
							return prev;
						}

						return [
							...prev,
							{
								id: newPin.id,
								x: newPin.x,
								y: newPin.y,
								authorId: newPin.author_id,
								markerType: newPin.marker_type,
								comment: newPin.comment,
							},
						];
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "pins",
					filter: `room_id=eq.${room_id}`,
				},
				(payload) => {
					const updatedPin = payload.new;

					setPins((prev) =>
						prev.map((pin) =>
							pin.id === updatedPin.id
								? { ...pin, comment: updatedPin.comment }
								: pin,
						),
					);

					setPinDetail((prev) =>
						prev?.id === updatedPin.id
							? { ...prev, comment: updatedPin.comment }
							: prev,
					);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "pins",
				},
				(payload) => {
					const deletedPinId = payload.old.id;

					setPins((prev) =>
						prev.filter((pin) => pin.id !== deletedPinId),
					);
				},
			)

			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [room_id]);

	useEffect(() => {
		if (!pinDetail?.id) return;

		const channel = supabase
			.channel(`replies-${pinDetail.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "replies",
					filter: `pin_id=eq.${pinDetail.id}`,
				},
				(payload) => {
					const newReply = payload.new;

					setReplies((currentReplies) => {
						// Prevent duplicate replies from local inserts and realtime events.
						if (
							currentReplies.some(
								(item) => item.id === newReply.id,
							)
						) {
							return currentReplies;
						}

						return [...currentReplies, newReply];
					});
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [pinDetail?.id, supabase]);

	useEffect(() => {
		async function fetchRoomImage() {
			// console.log(room_id);
			const { data: room, error: roomError } = await supabase
				.from("rooms")
				.select("*")
				.eq("id", room_id)
				.single();

			if (roomError) {
				console.error("Room fetch failed:", roomError);
				return;
			}

			if (!room.image_path) {
				console.error("This room has no image path.");
				return;
			}

			setRoomInfo((prev) => ({ ...prev, name: room.name }));

			const { data, error } = await supabase.storage
				.from("designs")
				.createSignedUrl(room.image_path, 3600);

			if (error) {
				console.error("Signed URL generation failed:", error);
				return;
			}

			setImageUrl(data.signedUrl);
		}
		async function loadMembers() {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();

			if (authError || !user) {
				console.error("Authentication failed:", authError);
				return;
			}

			const { data, error } = await supabase
				.from("room_members")
				.select("user_id, profiles(display_name, color)")
				.eq("room_id", room_id);

			if (error) {
				console.error("Members fetch failed:", error);
				return;
			}

			let members = data.map((m) => ({
				id: m.user_id,
				name: m.profiles?.display_name,
				color: m.profiles?.color,
			}));

			const isMember = members.some((m) => m.id === user.id);

			if (!isMember) {
				const { error: insertError } = await supabase
					.from("room_members")
					.insert({
						room_id,
						user_id: user.id,
					});

				if (insertError) {
					console.error("Membership creation failed:", insertError);
					return;
				}

				// Fetch again so the newly added member is included.
				const { data: refreshed, error: refreshError } = await supabase
					.from("room_members")
					.select("user_id, profiles(display_name, color)")
					.eq("room_id", room_id);

				if (refreshError) {
					console.error("Members refresh failed:", refreshError);
					return;
				}

				members = refreshed.map((m) => ({
					id: m.user_id,
					name: m.profiles?.display_name,
					color: m.profiles?.color,
				}));
			}

			const { data: creator, error: creatorErr } = await supabase
				.from("rooms")
				.select("created_by")
				.eq("id", room_id)
				.single();

			if (creatorErr) console.error(creatorErr);

			setRoomInfo((prev) => ({
				...prev,
				members,
				creator_id: creator.created_by,
			}));
			setCurrentUser(members.find((m) => m.id === user.id) ?? null);
		}

		async function fetchPins() {
			const { data: fetchedPins, error: pinsErr } = await supabase
				.from("pins")
				.select("*")
				.eq("room_id", room_id)
				.order("created_at", { ascending: false });

			if (pinsErr) {
				console.error(pinsErr);
				return;
			}

			const { data: replyData, error: replyErr } = await supabase
				.from("replies")
				.select("pin_id");

			if (replyErr) {
				console.error(replyErr);
				return;
			}

			const replyCounts = replyData.reduce((acc, reply) => {
				acc[reply.pin_id] = (acc[reply.pin_id] || 0) + 1;
				return acc;
			}, {});

			setPins(
				fetchedPins.map((pin) => ({
					id: pin.id,
					x: pin.x,
					y: pin.y,
					authorId: pin.author_id,
					markerType: pin.marker_type,
					comment: pin.comment,
					created_at: pin.created_at,
					replyCount: replyCounts[pin.id] || 0,
				})),
			);
		}

		async function load() {
			try {
				await fetchRoomImage();
				await loadMembers();
				await fetchPins();
				console.log(activeUsers);
			} finally {
				setIsLoading(false);
			}
		}

		load();
	}, [room_id]);

	function getContrastColor(hex) {
		if (!hex) return;
		const cleanHex = hex.replace("#", "");

		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);

		const brightness = (r * 299 + g * 587 + b * 114) / 1000;

		return brightness > 128 ? "#000000" : "#FFFFFF";
	}

	function findAuthor(input) {
		const author =
			typeof input === "object"
				? roomInfo.members.find(
						(member) => member.id === input?.authorId,
					)
				: roomInfo.members.find((member) => member.id === input);
		return author;
	}

	function handleImageClick(e) {
		const MIN_DISTANCE = 0.04;
		const rect = e.currentTarget.getBoundingClientRect();

		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;

		const tooClose = pins.some((pin) => {
			const dx = pin.x - x;
			const dy = pin.y - y;

			return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE;
		});

		const markerType = Math.random() < 0.5 ? "x" : "scribble";

		if (!tooClose) {
			setActivePin({
				...defaultPin,
				x,
				y,
				markerType,
			});
			setCommentActive(true);
			commentRef.current?.focus();
		}
	}

	const deletePin = async (pinId) => {
		const { error } = await supabase
			.from("pins")
			.delete()
			.eq("id", pinId)
			.eq("room_id", room_id);

		if (error) {
			console.error("Error deleting pin:", error);
			return;
		}

		setPins((prev) => prev.filter((pin) => pin.id !== pinId));
		setPinDetail(null);
	};
	const deleteReply = async (replyId) => {
		const { error } = await supabase
			.from("replies")
			.delete()
			.eq("id", replyId);

		if (error) {
			console.error("Error deleting reply:", error);
			return;
		}

		setReplies((prev) => prev.filter((reply) => reply.id !== replyId));
	};

	const handleSubmit = async () => {
		if (!comment.trim()) {
			alert("Please type in a comment!");
			return;
		}

		const { data, error } = await supabase
			.from("pins")
			.insert({
				room_id,
				author_id: currentUser.id,
				x: activePin.x,
				y: activePin.y,
				marker_type: activePin.markerType,
				comment: comment.trim(),
			})
			.select()
			.single();

		if (error) {
			console.error("Pin creation failed:", error);
			return;
		}

		const { data: replyData, error: replyErr } = await supabase
			.from("replies")
			.select("pin_id");

		if (replyErr) {
			console.error(replyErr);
			return;
		}

		const replyCounts = replyData.reduce((acc, reply) => {
			acc[reply.pin_id] = (acc[reply.pin_id] || 0) + 1;
			return acc;
		}, {});

		const savedPin = {
			id: data.id,
			x: data.x,
			y: data.y,
			markerType: data.marker_type,
			authorId: data.author_id,
			comment: data.comment,
			created_at: data.created_at,
			replyCount: replyCounts[data.id] || 0,
		};

		setPins((prev) => [savedPin, ...prev]);
		setActivePin(defaultPin);
		setComment("");
		setCommentActive(false);
	};
	const handleClose = () => {
		setActivePin(defaultPin);
		setComment("");
		setCommentActive(false);
	};

	const showPinDetails = async (pin) => {
		// console.log(pin);
		setPinDetail(pin);

		try {
			setRepliesLoading(true);

			const { data: repliesData, error } = await supabase
				.from("replies")
				.select("*")
				.eq("pin_id", pin.id);

			if (error) {
				console.error(error);
			}

			setReplies(repliesData);
		} finally {
			setRepliesLoading(false);
		}
	};
	const addReply = async (pin) => {
		if (!reply.trim()) {
			alert("Please write your reply");
			return;
		}
		// console.log(pinDetail)

		const { data, error } = await supabase
			.from("replies")
			.insert({
				pin_id: pin.id,
				author_id: currentUser.id,
				text: reply.trim(),
			})
			.select()
			.single();

		if (error) console.error(error);

		setReplies((currentReplies) => {
			if (currentReplies.some((item) => item.id === data.id)) {
				return currentReplies;
			}

			return [...currentReplies, data];
		});

		setReply("");
	};

	const editComment = async (pin_id) => {
		const { data, error } = await supabase
			.from("pins")
			.update({
				comment: reply,
			})
			.eq("id", pin_id)
			.select()
			.single();

		if (error) {
			console.error(error);
			return;
		}

		setPins((prev) =>
			prev.map((pin) =>
				pin.id === pin_id ? { ...pin, comment: data.comment } : pin,
			),
		);

		setPinDetail((prev) =>
			prev?.id === pin_id ? { ...prev, comment: data.comment } : prev,
		);

		setReply("");
		setInputMode((prev) => ({ ...prev, mode: "normal", to: "reply" }));
		alert("Pin has been updated successfully");
	};
	const editReply = async (reply_id) => {
		const { data, error } = await supabase
			.from("replies")
			.update({
				text: reply,
			})
			.eq("id", reply_id)
			.select()
			.single();

		if (error) {
			console.error(error);
			return;
		}

		setReplies((prev) =>
			prev.map((reply) =>
				reply.id === reply_id ? { ...reply, text: data.text } : reply,
			),
		);

		setReply("");
		setInputMode((prev) => ({
			...prev,
			mode: "normal",
			to: "reply",
			idToEdit: null,
		}));
		alert("Reply has been updated successfully");
	};

	return (
		<div className="wrapper">
			<PinsSidebar
				pins={pins}
				findAuthor={findAuthor}
				zoomRef={zoomRef}
				roomInfo={roomInfo}
				showPinDetails={showPinDetails}
			/>
			<div className="content">
				<div className="top">
					<div className="members">
						{activeUsers.map((user) => (
							<div
								key={user.id}
								className="marker"
								style={{ backgroundColor: user.color }}
							></div>
						))}
						<div className="count">
							{activeUsers.length > 3
								? `+${activeUsers.length - 3}`
								: ""}
						</div>
						<div className="members-drop">
							{activeUsers.map((user) => (
								<div className="item" key={user.id}>
									<div
										className="marker"
										style={{
											backgroundColor: user.color,
										}}
									></div>
									<span>{user.name}</span>
									{roomInfo.creator_id === user.id ? (
										<div className="creator">Creator</div>
									) : currentUser.id === user.id ? (
										<div className="creator">You</div>
									) : (
										""
									)}
								</div>
							))}
						</div>
					</div>
					<button
						className="btn"
						onClick={() => setShareModalActive(true)}
					>
						Share
					</button>
				</div>
				<div className="disclaimer">
					Pinch and pan to navigate canvas.
				</div>
				{isLoading ? (
					<p className="text-center mt-3">
						Loading room information...
					</p>
				) : !currentUser ? (
					<p>Unable to load your room membership.</p>
				) : (
					<>
						<TransformWrapper>
							{({ zoomToElement }) => {
								zoomRef.current = zoomToElement;

								return (
									<TransformComponent>
										<div className="preview">
											<div
												className="image-wrapper"
												onClick={handleImageClick}
											>
												<img
													src={imageUrl}
													alt="File Preview"
												/>
												{displayPins.map((pin) => (
													<div
														key={pin.id}
														id={`pin-${pin.id}`}
														className="pin"
														style={{
															left: `${pin.x * 100}%`,
															top: `${pin.y * 100}%`,
														}}
													>
														{pin.markerType ===
														"x" ? (
															<XMarker
																color={
																	findAuthor(
																		pin,
																	)?.color
																}
																onClick={(
																	e,
																) => {
																	e.stopPropagation();

																	showPinDetails(
																		pin,
																	);
																}}
															/>
														) : (
															<ScribbleMarker
																color={
																	findAuthor(
																		pin,
																	)?.color
																}
																onClick={(
																	e,
																) => {
																	e.stopPropagation();

																	showPinDetails(
																		pin,
																	);
																}}
															/>
														)}
														<div
															className={
																!pin.comment
																	? "comment-card d-none"
																	: "comment-card"
															}
															style={{
																backgroundColor:
																	findAuthor(
																		pin,
																	)?.color,
																color: getContrastColor(
																	findAuthor(
																		pin,
																	)?.color,
																),
															}}
														>
															{pin.comment}
															<div
																className="username"
																style={{
																	color: getContrastColor(
																		findAuthor(
																			pin,
																		)
																			?.color,
																	),
																}}
															>
																{
																	findAuthor(
																		pin,
																	)?.name
																}
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									</TransformComponent>
								);
							}}
						</TransformWrapper>
						<div
							className={
								commentActive
									? "comment-input active"
									: "comment-input"
							}
						>
							<input
								type="text"
								className="form-control"
								placeholder="Enter your comment"
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleSubmit();
									} else if (e.key === "Escape") {
										handleClose();
									}
								}}
								ref={commentRef}
							/>
							<div className="btns">
								<img
									src="/icons/x.svg"
									alt="x"
									className="close"
									onClick={handleClose}
								/>
								<img
									src="/icons/arrow-up.svg"
									alt="arrow-up"
									className="submit"
									onClick={handleSubmit}
								/>
							</div>
						</div>
						<div className="notifications">
							{notifications.map((notification) => (
								<div
									className="notification"
									key={notification.id}
								>
									{notification.message}
								</div>
							))}
						</div>
						<div
							className={
								pinDetail ? "pin-details active" : "pin-details"
							}
						>
							<div className="title">
								<div className="items">
									<img
										src="/icons/x.svg"
										alt=""
										className="close"
										onClick={() => {
											setPinDetail(null);
										}}
									/>
									<span>
										{pinDetail?.authorId ===
										currentUser?.id ? (
											<>Your Pin</>
										) : (
											findAuthor(pinDetail)?.name +
											"'s Pin"
										)}
									</span>
								</div>
								{pinDetail?.authorId === currentUser?.id && (
									<img
										src="/icons/trash-2.svg"
										alt=""
										onClick={() => deletePin(pinDetail.id)}
									/>
								)}
							</div>
							<div className="chat">
								<div
									className={"comment-card"}
									style={{
										backgroundColor:
											findAuthor(pinDetail)?.color,
										color: getContrastColor(
											findAuthor(pinDetail)?.color,
										),
									}}
								>
									{pinDetail?.comment}
									{pinDetail?.authorId ===
										currentUser?.id && (
										<img
											src="/icons/edit-3.svg"
											alt=""
											onClick={() => {
												setInputMode((prev) => ({
													...prev,
													mode: "edit",
													to: "comment",
												}));
												setReply(pinDetail.comment);
											}}
										/>
									)}
								</div>
								{repliesLoading ? (
									<span className="text-center mt-2">
										Loading replies...
									</span>
								) : (
									<div className="replies mt-2">
										{replies.length === 0 ? (
											<span className="text-center">
												No replies found
											</span>
										) : (
											<>
												{replies.map((reply) => (
													<div
														className={
															"comment-card reply"
														}
														key={reply.id}
													>
														{reply.text}
														<div className="items">
															<div
																className="marker"
																style={{
																	backgroundColor:
																		findAuthor(
																			reply.author_id,
																		)
																			?.color,
																}}
															></div>
															<div className="username">
																{
																	findAuthor(
																		reply.author_id,
																	)?.name
																}
															</div>

															<div className="time">
																{formatTime(
																	reply.created_at,
																)}
															</div>
															{reply.author_id ===
																currentUser?.id && (
																<>
																	<div
																		className="edit"
																		onClick={() => {
																			setInputMode(
																				(
																					prev,
																				) => ({
																					...prev,
																					mode: "edit",
																					to: "reply",
																					idToEdit:
																						reply.id,
																				}),
																			);
																			setReply(
																				reply.text,
																			);
																		}}
																	>
																		Edit
																	</div>
																	<img
																		src="/icons/trash-2.svg"
																		alt=""
																		className="delete-reply"
																		onClick={() =>
																			deleteReply(
																				reply.id,
																			)
																		}
																	/>
																</>
															)}
														</div>
													</div>
												))}
											</>
										)}
									</div>
								)}
							</div>
							<div className="disclaimer">Enter to send</div>

							<div className="input">
								<input
									type="text"
									className="form-control"
									placeholder="Enter your reply"
									value={reply}
									onChange={(e) => setReply(e.target.value)}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" &&
											inputMode.mode === "normal"
										) {
											addReply(pinDetail);
										} else if (
											e.key === "Enter" &&
											inputMode.mode === "edit" &&
											inputMode.to === "comment"
										) {
											editComment(pinDetail.id);
										} else if (
											e.key === "Enter" &&
											inputMode.mode === "edit" &&
											inputMode.to === "reply"
										) {
											editReply(inputMode.idToEdit);
										}
									}}
								/>
							</div>
						</div>
						<ShareModal
							roomInfo={roomInfo}
							currentUser={currentUser}
							shareModalActive={shareModalActive}
							setShareModalActive={setShareModalActive}
                            activeUsers={activeUsers}
						/>
					</>
				)}
			</div>
		</div>
	);
}
