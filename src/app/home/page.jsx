"use client";
import { redirect, usePathname } from "next/navigation";
import "../styles/dashboard.css";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

function page() {
	const supabase = createClient();
	const [userData, setUserData] = useState({
		display_name: "Loading...",
		id: 0,
	});
	const [profileColor, setProfileColor] = useState("#3977D5");
	const pathname = usePathname();
	const menuItems = [
		{ name: "Home", path: "/home" },
		{ name: "Profile", path: "/profile" },
	];

	useEffect(() => {
		async function getUserData() {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			if (error) {
				console.error(error);
			}

			if (!user) {
				redirect("/login");
			}

			setUserData((prev) => ({
				...prev,
				display_name: user.user_metadata.display_name,
				id: user.id,
			}));
		}
		async function getProfile() {
			const { data: profile, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.single();

			if (error) {
				console.error(error);
			}

			if (profile) {
				setProfileColor(profile.color);
			}
		}
		async function load() {
			await getUserData();
			await getProfile();
		}

		load();
	}, []);

	return (
		<div className="home">
			<div className="topbar">
				<div className="title">
					<img src="/logo.svg" alt="Notae" />
					<div className="account">
						<div
							className="marker"
							style={{ backgroundColor: profileColor }}
						></div>
						<div className="name">{userData?.display_name}</div>
					</div>
				</div>
				<div className="menu">
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
			</div>

			<div className="rooms">
				<div className="room">
					<a href="/room">
						<img src="/reach.png" alt="" className="display" />
					</a>
					<div className="visitor-count">
						<img src="/icons/eye.svg" alt="" />3
					</div>
					<div className="info">
						Janus Room
						<div className="deletebtn">
							<img
								src="/icons/trash-2.svg"
								alt=""
								title="Delete Room"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default page;
