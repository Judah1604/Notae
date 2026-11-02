'use server'
import { supabase } from "@/lib/supabase/supabase";
import { redirect } from "next/navigation";

export const signupAction = async (formData) => {
    
	const { data, error } = await supabase.auth.signUp({
		email: formData.email,
		password: formData.password,
		options: {
			data: {
				display_name: formData.username,
			},
		},
	});

	if (error) {
		console.error(error);
		return;
	}

	if (data.session) {
		redirect("/home");
	}
};
