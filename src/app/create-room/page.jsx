"use client";
import { useState } from "react";
import "../styles/dashboard.css";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "../components/Topbar";

const supabase = createClient();

function page() {
	const [user, setUser] = useState({
		id: null,
		name: "Loading...",
		color: "#000000",
	});
	const [selectedFile, setSelectedFile] = useState(null);
	const [imageSrc, setImageSrc] = useState("");
	const [roomName, setRoomName] = useState("");

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
			await getUserData(supabase, setUser, router);
		}

		load();
	}, []);

	const handleFileChange = (event) => {
		const file = event.target.files[0];

		if (!file) return;

		if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
			alert("Please select a PNG, JPEG, or WebP image.");
			return;
		}

		setSelectedFile(file);
		setImageSrc(URL.createObjectURL(file));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!selectedFile) {
			alert("Please select an image.");
			return;
		}

		if (!user.id) {
			alert("User information is still loading.");
			return;
		}

		// 1. Create room
		const { data: room, error: roomError } = await supabase
			.from("rooms")
			.insert({
				name: roomName,
				created_by: user.id,
			})
			.select()
			.single();

		if (roomError) {
			console.error("Room creation failed:", {
				message: roomError.message,
				code: roomError.code,
				details: roomError.details,
				hint: roomError.hint,
			});

			alert(roomError.message);
			return;
		}

		console.log("Room created:", room);

		// 2. Add creator to room_members
		const { error: memberError } = await supabase
			.from("room_members")
			.insert({
				room_id: room.id,
				user_id: user.id,
			});

		if (memberError) {
			console.error("Membership creation failed:", memberError);
			return;
		}

		// 3. Upload image to Storage
		const extension = selectedFile.name.split(".").pop();

		const filePath = `${room.id}/design.${extension}`;

		const { data: uploadedFile, error: uploadError } =
			await supabase.storage
				.from("designs")
				.upload(filePath, selectedFile);

		if (uploadError) {
			console.error("Image upload failed:", uploadError);
			return;
		}

		// 4. Save image information to room
		const { error: imageError } = await supabase
			.from("rooms")
			.update({
				image_path: uploadedFile.path,
			})
			.eq("id", room.id);

		if (imageError) {
			console.error("Image information update failed:", imageError);
			return;
		}

		// 5. Navigate to room
		redirect(`/room/${room.id}`);
	};

	return (
		<div className="create_room">
			<Topbar user={user} />
			<div className="section mt-3 px-4">
				<h2>Create Room</h2>
				<div className="wrapper">
					<div className="img-upload">
						<input
							type="file"
							accept="image/png,image/jpeg,image/webp"
							name="Image Upload"
							className="form-control"
							onChange={handleFileChange}
						/>
						<div className="image">
							{imageSrc === "" ? (
								<div className="no-image">
									Please pick a file to see it.
								</div>
							) : (
								<img
									className="img-preview"
									src={imageSrc}
									alt="File Preview"
								/>
							)}
						</div>
					</div>
					<form className="text" onSubmit={handleSubmit}>
						<div className="form-group">
							<label htmlFor="roomname">Room name</label>
							<input
								type="text"
								id="roomname"
								name="roomname"
								className="form-control"
								placeholder="Enter the room's name"
								required
								value={roomName}
								onChange={(e) => setRoomName(e.target.value)}
							/>
						</div>
						<button type="submit">Create Room</button>
					</form>
				</div>
			</div>
		</div>
	);
}

export default page;
