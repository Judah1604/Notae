import { useRouter } from "next/navigation";

function LeaveContent({ user, room, setModal, supabase }) {
	const router = useRouter();

	async function leaveRoom() {
		if (!room || !user) return;

		const { error } = await supabase
			.from("room_members")
			.delete()
			.eq("room_id", room.id)
			.eq("user_id", user.id);

		if (error) {
			console.error("Failed to leave room:", error);
			return;
		}

		setModal((prev) => ({ ...prev, isActive: false }));
		router.push("/home");
        router.refresh();
	}

	return (
		<div className="content">
			<h2>
				Are you sure you want to leave <span>{room.name}?</span>
			</h2>
			<div className="btns">
				<button
					className="btn secondary"
					onClick={() =>
						setModal((prev) => ({ ...prev, isActive: false }))
					}
				>
					Cancel and Close
				</button>
				<button className="btn primary" onClick={leaveRoom}>
					Leave Room
				</button>
			</div>
		</div>
	);
}

export default LeaveContent;
