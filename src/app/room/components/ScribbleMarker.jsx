export default function ScribbleMarker({ color, animate = true, onClick }) {
	return (
		<svg
			className={`marker ${animate ? "draw" : ""}`}
			viewBox="0 0 40 40"
			width="32"
			height="32"
			xmlns="http://www.w3.org/2000/svg"
            onClick={onClick}
		>
			<path
				d="M21 7 C31 5 35 16 29 24 C23 33 9 34 7 23 C5 13 15 5 23 9 C31 13 29 25 18 29"
				fill="none"
				stroke={color}
				strokeWidth="3"
				strokeLinecap="round"
				className="scribble-path"
			/>
		</svg>
	);
}
