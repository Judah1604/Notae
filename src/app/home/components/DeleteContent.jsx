import { useRouter } from "next/navigation";

function DeleteContent({ user, room, setModal, supabase }) {
	const router = useRouter();

	async function deleteRoom() {
		if (!room || !user) return;

		const { error } = await supabase
			.from("rooms")
			.delete()
			.eq("id", room.id)
			.eq("created_by", user.id);

		if (error) {
			console.error("Failed to delete room:", error);
			return;
		}

		router.push("/home");
        router.refresh();
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
