"use client";
import { useState } from "react";
import "../styles/dashboard.css";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "../components/Topbar";
import { useRouter } from "next/navigation";

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
	const [hasCreated, setHasCreated] = useState(false);
	const [createProgress, setCreateProgress] = useState("Creating room...");
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
			await getUserData(supabase, setUser);
		}

		load();
	}, []);

	async function checkDuplicateRoomName() {
		const normalizedName = roomName.trim().toLowerCase();

		const { data, error } = await supabase
			.from("rooms")
			.select("id, name")
			.eq("created_by", user.id);

		if (error) throw error;

		return data.some(
			(room) => room.name.trim().toLowerCase() === normalizedName,
		);
	}

	const handleFileChange = (event) => {
		const file = event.target.files[0];
		const MAX_FILE_SIZE = 6 * 1024 * 1024;

		if (!file) return;

		if (file.size > MAX_FILE_SIZE) {
			alert("Image must be 6MB or smaller");
			event.target.value = "";
			return;
		}

		if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
			alert("Please select a PNG, JPEG, or WebP image.");
			return;
		}

		setSelectedFile(file);
		setImageSrc(URL.createObjectURL(file));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (hasCreated) return;

		if (!selectedFile) {
			alert("Please select an image.");
			return;
		}

		if (!user.id) {
			alert("User information is still loading.");
			return;
		}

		if (!roomName.trim()) {
			alert("Please enter a valid room name.");
			return;
		}

		setHasCreated(true);

		const isDuplicate = await checkDuplicateRoomName();
		if (isDuplicate) {
			 alert(
					"You already have a room with this name. Please choose another name.",
				);
			return;
		}

		try {
			// 1. Create room
			const { data: room, error: roomError } = await supabase
				.from("rooms")
				.insert({
					name: roomName.trim(),
					created_by: user.id,
				})
				.select()
				.single();

			if (roomError) throw roomError;
			setCreateProgress("Making you a member");

			// 2. Add creator to room_members
			const { error: memberError } = await supabase
				.from("room_members")
				.insert({
					room_id: room.id,
					user_id: user.id,
				});

			if (memberError) throw memberError;

			setCreateProgress("Uploading your image to the room");

			// 3. Upload image
			const extension = selectedFile.name.split(".").pop();
			const filePath = `${room.id}/design.${extension}`;

			const { data: uploadedFile, error: uploadError } =
				await supabase.storage
					.from("designs")
					.upload(filePath, selectedFile);

			if (uploadError) throw uploadError;

			setCreateProgress("Saving image path");

			// 4. Save image path
			const { error: imageError } = await supabase
				.from("rooms")
				.update({ image_path: uploadedFile.path })
				.eq("id", room.id);

			if (imageError) throw imageError;

			setCreateProgress("Redirecting you to your newly created room!");

			// 5. Navigate
			router.push(`/room/${room.id}`);
		} catch (error) {
			console.error("Room creation failed:", error);
			alert(error.message || "Something went wrong creating the room.");
			setHasCreated(false);
		}
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
						<div className="items">
							<span>File max: 6MB</span>
							<button
								type="submit"
								className="loader"
								disabled={hasCreated}
							>
								{hasCreated ? (
									<>
										<span className="spinner" />
										{createProgress}
									</>
								) : (
									"Create Room"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default page;
