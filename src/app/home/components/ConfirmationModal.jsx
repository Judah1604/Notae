import React from "react";

function ConfirmationModal({ modal, setModal }) {
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
					<LeaveContent modal={modal} setModal={setModal} />
				) : modal.type === "delete" ? (
					<DeleteContent modal={modal} setModal={setModal} />
				) : (
					""
				)}
			</div>
		</div>
	);
}

export default ConfirmationModal;

function LeaveContent({ modal, setModal }) {
	return (
		<div className="content">
			<h2>Are you sure you want to leave {modal?.object.name}</h2>
			<div className="btns">
				<button
					className="btn"
					onClick={() =>
						setModal((prev) => ({ ...prev, isActive: false }))
					}
				>
					Cancel and Close
				</button>
				<button className="btn">Leave Room</button>
			</div>
		</div>
	);
}
function DeleteContent({ modal, setModal }) {
	return (
		<div className="content">
			<h2>Are you sure you want to delete {modal?.object.name}</h2>
			<div className="btns">
				<button
					className="btn"
					onClick={() =>
						setModal((prev) => ({ ...prev, isActive: false }))
					}
				>
					Cancel and Close
				</button>
				<button className="btn">Delete Room</button>
			</div>
		</div>
	);
}
