"use client";
import { useState } from "react";
import "../styles/room.css";

export default function page() {
	const [pins, setPins] = useState([]);
	const [commentActive, setCommentActive] = useState(false);
	const [comment, setComment] = useState("");
	const [targetId, setTargetId] = useState(0);

	function handleImageClick(e) {
        const MIN_DISTANCE = 0.04;
		const rect = e.currentTarget.getBoundingClientRect();
		const id = crypto.randomUUID();

		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;

		const tooClose = pins.some((pin) => {
			const dx = pin.x - x;
			const dy = pin.y - y;

			return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE;
		});

		if (!tooClose && targetId === 0) {
			setTargetId(id);
			setPins((prev) => [...prev, { id, x, y }]);
			setCommentActive(true);
		}
	}

	const handleSubmit = () => {
		if (comment !== "") {
			setPins((prev) =>
				prev.map((pin) =>
					pin.id === targetId ? { ...pin, comment } : pin,
				),
			);

			setTargetId(0);
			setComment("");
			setCommentActive(false);
		} else {
			alert("Please type in a comment!");
		}
	};
	const handleClose = () => {
		setPins((prev) => prev.filter((pin) => pin.id !== targetId));
		setTargetId(0);
		setComment("");
		setCommentActive(false);
	};

	return (
		<div className="wrapper">
			<div className="preview">
				<div className="image-wrapper" onClick={handleImageClick}>
					<img src="/reach.png" alt="File Preview" />
					{pins.map((pin, index) => (
						<div
							key={index}
							className="pin"
							style={{
								left: `${pin.x * 100}%`,
								top: `${pin.y * 100}%`,
							}}
						>
                            <div className="marker"></div>
                            <div className="comment-card">{pin.comment}</div>
                        </div>
					))}
				</div>
			</div>
			<div
				className={
					commentActive ? "comment-input active" : "comment-input"
				}
			>
				<input
					type="text"
					className="form-control"
					placeholder="Enter your comment"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
				/>
				<div className="btns">
					<img
						src="/icons/x.svg"
						alt="x"
						className="close"
						onClick={handleClose}
					/>
					<img
						src="/icons/arrow-up.svg"
						alt="arrow-up"
						className="submit"
						onClick={handleSubmit}
					/>
				</div>
			</div>
		</div>
	);
}
