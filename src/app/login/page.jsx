"use client";
import { useState } from "react";
import "../styles/authform.css";
import { loginAction } from "./loginAction";

function page() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState(null);

	const handleChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const result = await loginAction(formData);
		if (result.error) {
			setError(result.error);

			if (result.error === "Invalid Username or Password") {
				setFormData((prev) => ({ ...prev, password: "" }));
			}
			console.error("Login error:", result.error);
		}
	};

	return (
		<div className="wrapper">
			<form onSubmit={handleSubmit}>
				<div className="header">
					<h1>
						Welcome to <span>notae</span>.
					</h1>{" "}
					<p>
						Pick up where you left off, share your thoughts, and
						keep making better things together.
					</p>
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
					Continue to your account
				</button>
				<div className="extra">
					<div className="account">
						Don't have an account yet?{" "}
						<a href="/signup">Create one</a>
					</div>
					<div className="error">{error && <p>{error}</p>}</div>
				</div>
			</form>
		</div>
	);
}

export default page;
