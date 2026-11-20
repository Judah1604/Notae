import { useState } from "react";

function DeletePinContent({ functoExec, setModal }) {
	const [hasDeleted, setHasDeleted] = useState(false);

	async function exec() {
		if (hasDeleted || !functoExec) return;

		setHasDeleted(true);

		try {
			await functoExec();
			setModal((prev) => ({ ...prev, isActive: false }));
		} catch (error) {
			console.error("Failed to delete pin:", error);
			setHasDeleted(false);
		}
	}

	return (
		<div className="content">
			<h2>Are you sure you want to delete this pin?</h2>

			<div className="btns">
				<button
					className="btn secondary"
					onClick={() =>
						setModal((prev) => ({
							...prev,
							isActive: false,
						}))
					}
				>
					Cancel and Close
				</button>

				<button
					className="btn primary loader"
					disabled={hasDeleted}
					onClick={exec}
				>
					{hasDeleted ? (
						<>
							<span className="spinner" />
							Deleting pin...
						</>
					) : (
						"Delete Pin"
					)}
				</button>
			</div>
		</div>
	);
}

export default DeletePinContent;
