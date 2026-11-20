import DeleteContent from "./DeleteContent";
import DeletePinContent from "./DeletePinContent";
import LeaveContent from "./LeaveContent";

function ConfirmationModal({ modal, setModal, supabase }) {
	if (!modal?.isActive) return null;

	if (modal.type !== "pin" && !modal?.object?.room && !modal?.object?.user)
		return null;

	const room = modal?.object?.room,
		user = modal?.object?.user,
		functoExec = modal?.function;

	return (
		<div
			className={
				modal.isActive
					? "confirmation-modal active"
					: "confirmation-modal"
			}
		>
			<div
				className="backdrop"
				onClick={() =>
					setModal((prev) => ({ ...prev, isActive: false }))
				}
			></div>
			<div className="dialog">
				{modal.type === "leave" ? (
					<LeaveContent
						modal={modal}
						setModal={setModal}
						user={user}
						room={room}
						supabase={supabase}
					/>
				) : modal.type === "delete" ? (
					<DeleteContent
						modal={modal}
						setModal={setModal}
						user={user}
						room={room}
						supabase={supabase}
					/>
				) : modal.type === "pin" ? (
					<DeletePinContent functoExec={functoExec} setModal={setModal} />
				) : (
					""
				)}
			</div>
		</div>
	);
}

export default ConfirmationModal;
