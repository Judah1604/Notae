export default async function getUserData( supabase, setUser, router ) {
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
