"use client";
import { useState } from "react";
import "../styles/authform.css";
import { signupAction } from "./signUpAction";

function page() {
	const [formData, setFormData] = useState({ email: "", password: "" });

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
					<h1>Let's get you signed up</h1>
					<p>Sign up</p>
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
					Sign up
				</button>
			</form>
		</div>
	);
}

export default page;
