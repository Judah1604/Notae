"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import "../styles/dashboard.css";
import Topbar from "../utils/components/Topbar";
import timeAgo from "../../lib/timeAgo";

const supabase = createClient();
function page() {
	const router = useRouter();
	const [rooms, setRooms] = useState([]);
	const [user, setUser] = useState({
		id: null,
		name: "Loading...",
		color: "#000000",
	});

	const fetchMoreRoomInfo = async (image_path, room_id) => {
		const { data, error } = await supabase.storage
			.from("designs")
			.createSignedUrl(image_path, 3600);

		if (error) {
			console.error("Signed URL generation failed:", error);
			return;
		}

		const { data: roomMembers, error: memError } = await supabase
			.from("room_members")
			.select("*")
			.eq("room_id", room_id);

		if (memError) console.error(memError);
        console.log(roomMembers, room_id)

		return { imageUrl: data.signedUrl, membersLen: roomMembers.length };
	};

	useEffect(() => {
		async function getUserData() {
			const {
				data: { user: userData },
				error,
			} = await supabase.auth.getUser();

			if (error) {
				console.error(error);
			}

			if (!userData) {
				router.replace("/login");
				return;
			}

			// console.log("User data:", userData);

			setUser((prev) => ({
				...prev,
				name: userData.user_metadata.display_name,
				id: userData.id,
			}));

			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", userData.id)
				.single();

			if (profileError) {
				console.error(profileError);
			}

			setUser((prev) => ({
				...prev,
				color: profile?.color || "#000000",
			}));

			return userData.id;
		}
		async function loadRooms(userId) {
			const { data: roomsData, error: roomsError } = await supabase
				.from("rooms")
				.select("*")
				.eq("created_by", userId);

			if (roomsError) console.error(roomsError);

			const updatedRoomsData = await Promise.all(
				(roomsData ?? [])
					.filter((room) => room.image_path)
					.map(async (room) => ({
						...room,
						...(await fetchMoreRoomInfo(room.image_path, room.id)),
					})),
			);

			setRooms(updatedRoomsData);
			// console.log(roomsData);
		}

		async function load() {
			const userId = await getUserData();

			if (userId) {
				await loadRooms(userId);
			}
		}

		load();
	}, []);

	return (
		<div className="home">
			<Topbar user={user} />

			<div className="rooms">
				{rooms.length === 0 ? (
					<p className="text-center">Loading your rooms...</p>
				) : (
					rooms.map((room) => (
						<div className="room" key={room.id}>
							<a href="/room">
								<img
									src={room.imageUrl}
									alt={room.name}
									className="display"
								/>
							</a>
							<div className="visitor-count">
								<img src="/icons/eye.svg" alt="" />{room.membersLen}
							</div>
							<div className="info">
								{room.name}
								<div className="items">
									<span>
										Created {timeAgo(room.created_at)}
									</span>
									<div className="deletebtn">
										<img
											src="/icons/trash-2.svg"
											alt=""
											title="Delete Room"
										/>
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export default page;
