import { timeAgo } from "@/lib/timeAgo";
import React from "react";
import { useState } from "react";

function RoomCard({ room, user, setModal }) {
	const [optionsDrop, setOptionsDrop] = useState(false);

	return (
		<div className="room" key={room.id}>
			<a href={"/room/" + room.id}>
				<img src={room.imageUrl} alt={room.name} className="display" />
			</a>
			<div className="visitor-count">
				<img src="/icons/eye.svg" alt="" />
				{room.membersLen}
			</div>
			<div className="info">
				{room.name}
				<div className="items">
					<span>Created {timeAgo(room.created_at)}</span>
					<div className="options">
						<img
							src="/icons/more-horizontal.svg"
							alt=""
							onClick={() => setOptionsDrop(!optionsDrop)}
						/>
						<div className={optionsDrop ? "drop active" : "drop"}>
							{room.created_by === user.id && (
								<div
									className="deletebtn"
									onClick={() =>
										setModal((prev) => ({
											...prev,
											type: "delete",
											isActive: true,
											object: {room, user},
										}))
									}
								>
									Delete Room
								</div>
							)}
							{room.created_by !== user.id && (
								<div
									className="leavebtn"
									onClick={() =>
										setModal((prev) => ({
											...prev,
											type: "leave",
											isActive: true,
											object: {room, user},
										}))
									}
								>
									Leave Room
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default RoomCard;
