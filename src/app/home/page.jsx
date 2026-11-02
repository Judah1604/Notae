"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import "../styles/dashboard.css";

const supabase = createClient();
function page() {
	const [user, setUser] = useState({
		id: null,
		name: "Loading...",
		color: "#000000",
	});
	const pathname = usePathname();
	const router = useRouter();
	const menuItems = [
		{ name: "Home", path: "/home" },
		{ name: "Profile", path: "/profile" },
	];

	useEffect(() => {
		async function getUserData() {
			const {
				data: { user: userData },
				error,
			} = await supabase.auth.getUser();

			if (error) {
				console.error(error);
			}

			if (!userData) {
				router.replace("/login");
				return;
			}

			console.log("User data:", userData);

			setUser((prev) => ({
				...prev,
				name: userData.user_metadata.display_name,
				id: userData.id,
			}));

			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", userData.id)
				.single();

			if (profileError) {
				console.error(profileError);
			}

			setUser((prev) => ({
				...prev,
				color: profile?.color || "#000000",
			}));
		}
		async function load() {
			await getUserData();
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
