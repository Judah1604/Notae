import { supabase } from "@/lib/supabase/supabase";
import { redirect } from "next/dist/server/api-utils";

export const signupAction = async (formData) => {
	const { data, error } = await supabase.auth.signUp({
		email: "tejsns3@gmail.com",
		password: "testpass123",
	});

	if (error) {
		console.error(error);
		return;
	}

	if (data.session) {
		redirect('/')
	}
};
