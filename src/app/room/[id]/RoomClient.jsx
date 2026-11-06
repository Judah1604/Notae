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

const supabase = createClient();
export default function RoomClient({ room_id }) {
	const [pins, setPins] = useState([]);
	const [commentActive, setCommentActive] = useState(false);
	const [comment, setComment] = useState("");
	const [currentUser, setCurrentUser] = useState(null);
	const [activeDeleteId, setActiveDeleteId] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [roomInfo, setRoomInfo] = useState({
		name: "Loading...",
		creator_id: null,
		members: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const commentRef = useRef(null);
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
				.eq("room_id", room_id);

			if (pinsErr) console.error(pinsErr);

			setPins(
				fetchedPins.map((pin) => ({
					id: pin.id,
					x: pin.x,
					y: pin.y,
					authorId: pin.author_id,
					markerType: pin.marker_type,
					comment: pin.comment,
				})),
			);
		}

		async function load() {
			try {
				await fetchRoomImage();
				await loadMembers();
				await fetchPins();
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

	function findAuthor(pin) {
		const author = roomInfo.members.find(
			(member) => member.id === pin?.authorId,
		);
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

		if (!tooClose && !activeDeleteId) {
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
		setActiveDeleteId(null);
	};

	function copyLink() {
		const currentUrl = window.location.href;

		navigator.clipboard.writeText(currentUrl);
	}

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

		const savedPin = {
			id: data.id,
			x: data.x,
			y: data.y,
			markerType: data.marker_type,
			authorId: data.author_id,
			comment: data.comment,
		};

		setPins((prev) => [...prev, savedPin]);
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
	};

	return (
		<div className="wrapper">
			<div className="top">
				<div className="back">
					<a href="/home">
						<img src="/icons/chevron-left.svg" alt="" /> Back
					</a>
				</div>
				<div className="title">{roomInfo?.name || "Loading..."}</div>
				<div className="items">
					<div className="members">
						{roomInfo.members.map((user) => (
							<div
								key={user.id}
								className="marker"
								style={{ backgroundColor: user.color }}
							></div>
						))}
						<div className="count">
							{roomInfo.members.length > 3
								? `+${roomInfo.members.length - 3}`
								: ""}
						</div>
						<div className="members-drop">
							{roomInfo.members.map((user) => (
								<div className="item" key={user.id}>
									<div
										className="marker"
										style={{ backgroundColor: user.color }}
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
					<button className="btn" onClick={copyLink}>
						<img src="/icons/link.svg" alt="" />
						Copy Link
					</button>
				</div>
			</div>
			<div className="disclaimer">Pinch and pan to navigate canvas.</div>
			{isLoading ? (
				<p className="text-center mt-3">Loading room information...</p>
			) : !currentUser ? (
				<p>Unable to load your room membership.</p>
			) : (
				<>
					<TransformWrapper>
						<TransformComponent>
							<div className="preview">
								<div
									className="image-wrapper"
									onClick={handleImageClick}
								>
									<img src={imageUrl} alt="File Preview" />
									{displayPins.map((pin) => (
										<div
											key={pin.id}
											className="pin"
											style={{
												left: `${pin.x * 100}%`,
												top: `${pin.y * 100}%`,
											}}
										>
											{pin.markerType === "x" ? (
												<XMarker
													color={
														findAuthor(pin)?.color
													}
													onClick={(e) => {
														e.stopPropagation();
														setActiveDeleteId(
															pin.id,
														);
														showPinDetails(pin);
													}}
												/>
											) : (
												<ScribbleMarker
													color={
														findAuthor(pin)?.color
													}
													onClick={(e) => {
														e.stopPropagation();
														setActiveDeleteId(
															pin.id,
														);
														showPinDetails(pin);
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
														findAuthor(pin)?.color,
													color: getContrastColor(
														findAuthor(pin)?.color,
													),
												}}
											>
												{pin.comment}
												<div
													className="username"
													style={{
														color: getContrastColor(
															findAuthor(pin)
																?.color,
														),
													}}
												>
													{findAuthor(pin)?.name}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</TransformComponent>
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
					<div
						className={
							activeDeleteId
								? "pin-details active"
								: "pin-details"
						}
					>
						<div className="title">
							<div className="items">
								<img
									src="/icons/x.svg"
									alt=""
									className="close"
									onClick={() => setActiveDeleteId(null)}
								/>
								<span>{findAuthor(pinDetail)?.name}'s Pin</span>
							</div>
							{pinDetail?.authorId === currentUser?.id && (
								<img
									src="/icons/trash-2.svg"
									alt=""
									onClick={() => deletePin(activeDeleteId)}
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
								<div
									className="username"
									style={{
										color: getContrastColor(
											findAuthor(pinDetail)?.color,
										),
									}}
								>
									{findAuthor(pinDetail)?.name}
								</div>
							</div>
						</div>
						<div className="disclaimer">Enter to send</div>

						<div className="input">
							<input
								type="text"
								className="form-control"
								placeholder="Enter your reply"
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
