import { useState } from "react";

function LeaveContent({ user, room, setModal, supabase }) {
	const [hasLeft, setHasLeft] = useState(false);

	async function leaveRoom() {
		if (!room || !user | hasLeft) return;

		setHasLeft(true);

		try {
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
			window.location.href = "/home";
		} catch (error) {
			console.error("Failed to leave room:", error);
			alert(error.message || "Leaving Room failed.");
			setHasLeft(false);
		}
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
				<button
					className="btn primary loader"
					disabled={hasLeft}
					onClick={leaveRoom}
				>
					{hasLeft ? (
						<>
							<span className="spinner" />
							Leaving room...
						</>
					) : (
						"Leave Room"
					)}
				</button>
			</div>
		</div>
	);
}

export default LeaveContent;
