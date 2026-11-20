import React from "react";
import "./styles/notfound.css";

function notFound() {
	return (
		<div className="not_found">
			<h1>404</h1>

			<p>The page doesn't exist.</p>
			<a href="/home" className="btn secondary">
				Go back home
			</a>
		</div>
	);
}

export default notFound;
