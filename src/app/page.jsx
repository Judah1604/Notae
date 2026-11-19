import "./styles/landing.css";

export default function Home() {
	return (
		<div>
			<div className="nav">
				<img src="/logo.svg" alt="Notae" />
				<div className="links">
					<a href="/login" className="btn secondary">
						Login
					</a>
					<a href="/signup" className="btn primary">
						Create account
					</a>
				</div>
			</div>
			<div className="hero">
				<h1>Feedback belongs on the design.</h1>
				<p>
					A shared space for thoughtful design reviews.
					<br />
					Pin comments, discuss details, and move forward together.
				</p>
				<a href="/signup" className="btn primary">
					Get Started
				</a>
				<img src="/screenshot.png" className="screenshot" alt="Snapshot" />
			</div>
		</div>
	);
}
