import React from "react";
import { useState } from "react";

function ShareModal({
	roomInfo,
	currentUser,
	shareModalActive,
	setShareModalActive,
	activeUsers,
}) {
	const [isCopying, setIsCopying] = useState(false);
	const currentUrl = window.location.href;
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	async function copyLink() {
		setIsCopying(true);
		try {
			navigator.clipboard.writeText(currentUrl);
			await delay(3000);
		} finally {
			setIsCopying(false);
		}
	}

	function isOnline(userId) {
		const bool = activeUsers.some((member) => member.id === userId),
			className = bool ? "marker online" : "marker";

		return className;
	}

	return (
		<div
			className={shareModalActive ? "share-modal active" : "share-modal"}
		>
			<div
				className="backdrop"
				onClick={() => setShareModalActive(false)}
			></div>
			<div className="dialog">
				<div className="copy">
					<h2>Room Information</h2>
					<div className="items">
						<button className="copyLink btn" onClick={copyLink}>
							<img src="/icons/link.svg" alt="" />
							{isCopying ? "Copied" : "Copy Link"}
						</button>
						<img
							src="/icons/x.svg"
							alt=""
							className="close-modal"
							onClick={() => setShareModalActive(false)}
						/>
					</div>
				</div>
				<div className="members">
					{roomInfo.members.map((user) => (
						<div className="item" key={user.id}>
							<div
								className={isOnline(user.id)}
								style={{
									backgroundColor: user.color,
								}}
							></div>
							<span>{user.name}</span>
							{roomInfo.creator_id === user.id ? (
								<div className="creator">Creator</div>
							) : currentUser.id === user.id ? (
								<div className="creator">You</div>
							) : (
								""
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default ShareModal;
