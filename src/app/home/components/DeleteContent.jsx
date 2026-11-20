import { useState } from "react";

function DeleteContent({ user, room, setModal, supabase }) {
	const [hasDeleted, setHasDeleted] = useState(false);

	async function deleteRoom() {
		if (!room || !user || hasDeleted) return;

		setHasDeleted(true);

		try {
			// 1. Delete room memberships
			const { error: memberError } = await supabase
				.from("room_members")
				.delete()
				.eq("room_id", room.id);

			if (memberError) throw memberError;

			// 2. Delete the room image
			if (room.image_path) {
				const { error: storageError } = await supabase.storage
					.from("designs")
					.remove([room.image_path]);

				if (storageError) throw storageError;
			}

			// 3. Delete the room
			const { data, error } = await supabase
				.from("rooms")
				.delete()
				.eq("id", room.id)
				.eq("created_by", user.id)
				.select();

			if (error) throw error;

			if (!data?.length) {
				throw new Error(
					"No room was deleted. Check ownership and RLS.",
				);
			}

			// 4. Close modal and navigate
			setModal((prev) => ({ ...prev, isActive: false }));
			window.location.href = "/home";
		} catch (error) {
			console.error("Failed to delete room:", error);
			alert(error.message || "Room deletion failed.");
			setHasDeleted(false);
		}
	}

	return (
		<div className="content">
			<h2>
				Are you sure you want to delete <span>{room.name}?</span>
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
					disabled={hasDeleted}
					onClick={deleteRoom}
				>
					{hasDeleted ? (
						<>
							<span className="spinner" />
							Deleting room...
						</>
					) : (
						"Delete Room"
					)}
				</button>
			</div>
		</div>
	);
}

export default DeleteContent;
