"use client";
import "@/app/styles/join-room.css";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";

const supabase = createClient();
function JoinRoomClient({ room_id }) {
	const [user_id, setUserID] = useState(null);
	const [roomName, setRoomName] = useState(null);
	const router = useRouter();

	useEffect(() => {
		async function getUserData() {
			const {
				data: { user: authUser },
				error,
			} = await supabase.auth.getUser();

			if (error || !authUser) {
				router.replace("/login");
				return null;
			}

			setUserID(authUser.id);

            return authUser.id
		}
		async function loadRoomName() {
			const { data: room, error } = await supabase
				.from("rooms")
				.select("name")
				.eq("id", room_id)
				.single();

			if (error || !room) {
				console.error(error);
				return;
			}
			setRoomName(room.name);
		}

		async function load() {
			const user = await getUserData();

			if (!user) return;

			await loadRoomName();
		}
		load();
	}, [room_id]);

	async function joinRoom() {
		const { error } = await supabase
			.from("room_members")
			.insert({ room_id, user_id });

		if (error) {
			console.error(error);
			return;
		}

		router.replace(`/room/${room_id}`);
	}

	return (
		<div className="join-room">
			{roomName ? (
				<div className="content">
					<h2>
						Do you want to accept the invitation to join{" "}
						<span>{roomName}</span>
					</h2>
					<div className="btns">
						<a href="/home" className="btn secondary">
							Go back home
						</a>
						<button className="btn primary" onClick={joinRoom}>
							Join Room
						</button>
					</div>
				</div>
			) : (
				<p>Loading room confirmation...</p>
			)}
		</div>
	);
}

export default JoinRoomClient;
