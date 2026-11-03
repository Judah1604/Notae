import { usePathname } from "next/navigation";
import React from "react";

function Topbar({ user }) {
	const pathname = usePathname();
	const menuItems = [
		{ name: "Home", path: "/home" },
		{ name: "Profile", path: "/profile" },
	];
	return (
		<div className="topbar">
			<div className="title">
				<img src="/logo.svg" alt="Notae" />
				<div className="account">
					<div
						className="marker"
						style={{ backgroundColor: user.color }}
					></div>
					<div className="name">{user.name}</div>
				</div>
			</div>
			<div className="menu">
				<div className="links">
					{menuItems.map((item) => (
						<a
							key={item.path}
							href={item.path}
							className={
								pathname.includes(item.path) ? "active" : ""
							}
						>
							{item.name}
						</a>
					))}
				</div>
				<a href="/create-room" className="btn">
					<img src="/icons/plus.svg" alt="" />
					Create new Room
				</a>
			</div>
		</div>
	);
}

export default Topbar;
