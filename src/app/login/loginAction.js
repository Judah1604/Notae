"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const loginAction = async (formData) => {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.signInWithPassword({
		email: formData.email,
		password: formData.password,
	});

	if (error) {
		return { error: error.message };
	}

	redirect("/");
};
