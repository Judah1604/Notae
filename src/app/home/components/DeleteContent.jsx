import { useRouter } from "next/navigation";

function DeleteContent({ user, room, setModal, supabase }) {

	async function deleteRoom() {
		if (!room || !user) return;

		// Remove the image first
		if (room.image_path) {
			const { error: storageError } = await supabase.storage
				.from("designs")
				.remove([room.image_path]);

			if (storageError) {
				console.error("Failed to delete room image:", storageError);
				return;
			}
		}

		// Delete the room
		const { error } = await supabase
			.from("rooms")
			.delete()
			.eq("id", room.id)
			.eq("created_by", user.id);

		if (error) {
			console.error("Failed to delete room:", error);
			return;
		}

		setModal((prev) => ({ ...prev, isActive: false }));

		window.location.href = "/home";
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
				<button className="btn primary" onClick={deleteRoom}>
					Delete Room
				</button>
			</div>
		</div>
	);
}

export default DeleteContent;
