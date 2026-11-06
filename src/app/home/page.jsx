"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import "../styles/dashboard.css";
import Topbar from "../components/Topbar";
import { timeAgo } from "@/lib/timeAgo";

const supabase = createClient();
function page() {
	const router = useRouter();
	const [rooms, setRooms] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState({
		id: null,
		name: "Loading...",
		color: "#000000",
	});
	const [roomsType, setRoomsType] = useState("all");

	async function fetchMoreRoomInfo(room) {
		const [imageResult, membersResult] = await Promise.all([
			room.image_path
				? supabase.storage
						.from("designs")
						.createSignedUrl(room.image_path, 3600)
				: Promise.resolve({ data: null, error: null }),

			supabase
				.from("room_members")
				.select("user_id", { count: "exact", head: true })
				.eq("room_id", room.id),
		]);

		return {
			...room,
			imageUrl: imageResult.data?.signedUrl || null,
			membersLen: membersResult.count ?? 0,
		};
	}

	// Fetch rooms based on selected filter
	async function loadRooms(userId, type) {
		if (!userId) return;

		let roomData = [];

		if (type === "owned") {
			// Rooms created by the current user
			const { data, error } = await supabase
				.from("rooms")
				.select("*")
				.eq("created_by", userId);

			if (error) {
				console.error("Error fetching owned rooms:", error);
				setRooms([]);
				return;
			}

			roomData = data || [];
		} else {
			// Get all rooms the current user belongs to
			const { data: memberships, error: membershipError } = await supabase
				.from("room_members")
				.select("room_id")
				.eq("user_id", userId);

			if (membershipError) {
				console.error("Error fetching memberships:", membershipError);
				setRooms([]);
				return;
			}

			const roomIds =
				memberships?.map((membership) => membership.room_id) || [];

			if (roomIds.length === 0) {
				setRooms([]);
				return;
			}

			let query = supabase.from("rooms").select("*").in("id", roomIds);

			// Joined means rooms the user belongs to but did not create
			if (type === "joined") {
				query = query.neq("created_by", userId);
			}

			const { data, error } = await query;

			if (error) {
				console.error("Error fetching rooms:", error);
				setRooms([]);
				return;
			}

			roomData = data || [];
		}

		// Fetch signed URLs and member counts
		const updatedRooms = await Promise.all(
			roomData.map((room) => fetchMoreRoomInfo(room)),
		);

		setRooms(updatedRooms);
	}

	// Fetch authenticated user and profile
	async function getUserData() {
		const {
			data: { user: authUser },
			error,
		} = await supabase.auth.getUser();

		if (error || !authUser) {
			router.replace("/login");
			return null;
		}

		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("display_name, color")
			.eq("id", authUser.id)
			.single();

		if (profileError) {
			console.error("Error fetching profile:", profileError);
		}

		const userData = {
			id: authUser.id,
			name: profile?.display_name || "User",
			color: profile?.color || "#000000",
		};

		setUser(userData);

		return authUser.id;
	}

	// Initial authentication and room loading
	useEffect(() => {
		async function initialize() {
			try {
				const userId = await getUserData();

				if (userId) {
					await loadRooms(userId, roomsType);
				}
			} catch (error) {
				console.error("Dashboard initialization failed:", error);
			} finally {
				setIsLoading(false);
			}
		}

		initialize();
	}, []);

	// Reload rooms when the selected filter changes
	useEffect(() => {
		if (!user.id) return;

		loadRooms(user.id, roomsType);
	}, [roomsType, user.id]);

	function handleChange(event) {
		setRoomsType(event.target.value);
	}

	return (
		<div className="home">
			<Topbar user={user} />
			<div className="rooms-wrapper">
				<div className="header">
					<h2>Rooms</h2>

					<div className="items">
						<div className="rooms-select">
							<select
								name="rooms-type"
								className="form-select"
								value={roomsType}
								onChange={handleChange}
							>
								<option value="all">All</option>
								<option value="owned">Owned</option>
								<option value="isMember">Is member of</option>
							</select>
						</div>
						<a href="/create-room" className="btn">
							<img src="/icons/plus.svg" alt="" />
							Create new Room
						</a>
					</div>
				</div>
				{isLoading ? (
					<p className="text-center mt-5">Loading your rooms...</p>
				) : rooms.length === 0 ? (
					<p className="text-center mt-5">
						You haven't made a room yet.
					</p>
				) : (
					<div className="rooms">
						{rooms.map((room) => (
							<div className="room" key={room.id}>
								<a href={"/room/" + room.id}>
									<img
										src={room.imageUrl}
										alt={room.name}
										className="display"
									/>
								</a>
								<div className="visitor-count">
									<img src="/icons/eye.svg" alt="" />
									{room.membersLen}
								</div>
								<div className="info">
									{room.name}
									<div className="items">
										<span>
											Created {timeAgo(room.created_at)}
										</span>
										{room.created_by === user.id && (
											<div className="deletebtn">
												<img
													src="/icons/trash-2.svg"
													alt=""
													title="Delete Room"
												/>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default page;