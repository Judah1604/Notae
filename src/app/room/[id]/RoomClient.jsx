"use client";
import { useState } from "react";
import "../../styles/room.css";
import XMarker from "../components/XMarker";
import ScribbleMarker from "../components/ScribbleMarker";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRef } from "react";

const supabase = createClient();
export default function RoomClient({ room_id }) {
	const [pins, setPins] = useState([]);
	const [commentActive, setCommentActive] = useState(false);
	const [comment, setComment] = useState("");
	const [targetId, setTargetId] = useState(0);
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

		async function load() {
			try {
				await fetchRoomImage();
				await loadMembers();
			} finally {
				setIsLoading(false);
			}
		}

		load();
	}, [room_id]);

	function getContrastColor(hex) {
		const cleanHex = hex.replace("#", "");

		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);

		const brightness = (r * 299 + g * 587 + b * 114) / 1000;

		return brightness > 128 ? "#000000" : "#FFFFFF";
	}

	function findAuthor(pin) {
		const author = roomInfo.members.find(
			(member) => member.id === pin.authorId,
		);
		return author;
	}

	function handleImageClick(e) {
		const MIN_DISTANCE = 0.04;
		const rect = e.currentTarget.getBoundingClientRect();
		const id = crypto.randomUUID();

		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;

		const tooClose = pins.some((pin) => {
			const dx = pin.x - x;
			const dy = pin.y - y;

			return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE;
		});

		const markerType = Math.random() < 0.5 ? "x" : "scribble";

		if (!tooClose && targetId === 0 && !activeDeleteId) {
			setTargetId(id);
			setPins((prev) => [
				...prev,
				{ id, x, y, markerType, authorId: currentUser.id },
			]);
			setCommentActive(true);
			commentRef.current?.focus();
		}
	}

	const deletePin = (id) => {
		setPins((prev) => prev.filter((pin) => pin.id !== id));
		setActiveDeleteId(null);
		setCommentActive(false);
	};

	const handleSubmit = () => {
		if (comment !== "") {
			setPins((prev) =>
				prev.map((pin) =>
					pin.id === targetId ? { ...pin, comment } : pin,
				),
			);

			setTargetId(0);
			setComment("");
			setCommentActive(false);
		} else {
			alert("Please type in a comment!");
		}
	};
	const handleClose = () => {
		setPins((prev) => prev.filter((pin) => pin.id !== targetId));
		setTargetId(0);
		setComment("");
		setCommentActive(false);
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
								{roomInfo.creator_id === user.id && (
									<div className="creator">Creator</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
			{isLoading ? (
				<p className="text-center mt-3">Loading room information...</p>
			) : !currentUser ? (
				<p>Unable to load your room membership.</p>
			) : (
				<>
					<div className="preview">
						<div
							className="image-wrapper"
							onClick={handleImageClick}
						>
							<img src={imageUrl} alt="File Preview" />
							{pins.map((pin, index) => (
								<div
									key={index}
									className="pin"
									style={{
										left: `${pin.x * 100}%`,
										top: `${pin.y * 100}%`,
									}}
								>
									{pin.markerType === "x" ? (
										<XMarker
											color={findAuthor(pin)?.color}
											onClick={() => {
												e.stopPropagation();
												setActiveDeleteId(pin.id);
											}}
										/>
									) : (
										<ScribbleMarker
											color={findAuthor(pin)?.color}
											onClick={() => {
												e.stopPropagation();
												setActiveDeleteId(pin.id);
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
													findAuthor(pin)?.color,
												),
											}}
										>
											{findAuthor(pin)?.name}
										</div>
									</div>
									<div
										className={
											activeDeleteId === pin.id
												? "deletepin active"
												: "deletepin"
										}
										onClick={() => {
											e.stopPropagation();
											deletePin(pin.id);
										}}
									>
										<img src="/icons/trash-2.svg" alt="" />
										Delete Pin
									</div>
								</div>
							))}
						</div>
					</div>
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
				</>
			)}
		</div>
	);
}
