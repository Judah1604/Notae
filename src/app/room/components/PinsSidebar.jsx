import { formatTime } from "@/lib/timeAgo";
import React from "react";
import { useState } from "react";

function PinsSidebar({
	pins,
	findAuthor,
	setPinDetail,
	zoomRef,
	roomInfo,
}) {
    const [sideBarActive, setSideBarActive] = useState(true);

	return (
		<div className={sideBarActive ? "pins-sidebar active" : "pins-sidebar"}>
			<div className="header">
				<a href="/home">
					<img src="/icons/chevron-left.svg" alt="" />
				</a>
				<h3>{roomInfo?.name || "Loading..."}</h3>
			</div>
			<div className="pins">
				{pins.length === 0 ? (
					<p className="text-center">No pins to show yet</p>
				) : (
					pins.map((pin) => (
						<div
							className="pin"
							key={pin.id}
							onClick={() => setPinDetail(pin)}
						>
							<div className="up">
								<div className="name">
									<div
										className="marker"
										style={{
											backgroundColor:
												findAuthor(pin)?.color,
										}}
									></div>
									{findAuthor(pin)?.name}
								</div>
								<div className="time">
									{formatTime(pin.created_at)}
								</div>
							</div>
							<div className="comment">{pin.comment}</div>
							<div className="bottom">
								<div className="reply-count">
									{pin.replyCount === 0
										? "0 replies"
										: pin.replyCount === 1
											? "1 reply"
											: pin.replyCount + " replies"}
								</div>
								<span
									onClick={() => {
										zoomRef.current?.(
											`pin-${pin.id}`,
											3,
											500,
											"easeOut",
										);
									}}
								>
									Click to locate
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export default PinsSidebar;
