"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const loginAction = async (formData) => {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.signInWithPassword({
		email: formData.email,
		password: formData.password,
	});

	// console.log("Login data:", data);
	console.log("Login error:", error);

	if (error) {
		console.error(error);
		return {
			error:
				error.code === "invalid_credentials"
					? "Invalid Username or Password"
					: "Login failed. Please try again.",
		};
	} else if (!data.session) {
		return { error: "Login failed. Please try again." };
	}

	if (data.session) {
		redirect("/home");
	}
};
