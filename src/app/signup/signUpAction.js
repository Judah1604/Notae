"use server";
import { generateUserColor } from "@/lib/color";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const signupAction = async (formData) => {
    const supabase = await createClient();
	const color = generateUserColor();

	const { data, error: signError } = await supabase.auth.signUp({
		email: formData.email,
		password: formData.password,
		options: {
			data: {
				display_name: formData.username,
				color: color,
			},
		},
	});
	if (signError) {
		console.error(signError);
		return {
			error:
				signError.code === "weak_password"
					? "Password length must be more than 6 characters"
					: "Signup failed. Please try again.",
		};
	}

	if (data.session) {
		redirect("/home");
	}

	return { error: "Check your email to confirm your account." };
};
