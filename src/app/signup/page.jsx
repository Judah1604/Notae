"use client";
import { useState } from "react";
import "../styles/authform.css";
import { signupAction } from "./signUpAction";

function page() {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});

	const handleChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		await signupAction(formData);
	};

	return (
		<div className="wrapper">
			<form onSubmit={handleSubmit}>
				<div className="header">
					<h1>
						Welcome to <span>notae</span>.
					</h1>
					<p>
						Create an account to start sharing designs, exchanging
						feedback, and collaborating with others.
					</p>
				</div>

				<div className="form-group">
					<label htmlFor="name">Display name</label>
					<input
						type="text"
						id="name"
						name="username"
						className="form-control"
						placeholder="Enter your display name"
						value={formData.username}
						onChange={(e) => handleChange(e)}
						required
					/>
				</div>
				<div className="form-group">
					<label htmlFor="email">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						className="form-control"
						placeholder="Enter your email"
						value={formData.email}
						onChange={(e) => handleChange(e)}
						required
					/>
				</div>
				<div className="form-group">
					<label htmlFor="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						className="form-control"
						placeholder="Enter your password"
						value={formData.password}
						onChange={(e) => handleChange(e)}
						required
					/>
				</div>
				<button type="submit" className="btn btn-primary">
					Create Account
				</button>
				<div className="extra">
					Already have an account? <a href="/login">Log in</a>
				</div>
			</form>
		</div>
	);
}

export default page;
