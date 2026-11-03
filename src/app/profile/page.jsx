"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import "../styles/dashboard.css";
import Topbar from "../utils/components/Topbar";

const supabase = createClient();
function page() {
	const [user, setUser] = useState({
		id: null,
		name: "Loading...",
		color: "#000000",
	});
	const router = useRouter();

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

			// console.log("User data:", userData);

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

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.replace("/login");
		router.refresh();
	};

	return (
		<div className="home">
			<Topbar user={user} />

			<div className="profile p-3">
				<button onClick={handleLogout}>Sign out</button>
			</div>
		</div>
	);
}

export default page;
