export default function XMarker({ color, animate = true }) {
	return (
		<svg
			className={`marker ${animate ? "draw" : ""}`}
			viewBox="0 0 40 40"
			width="32"
			height="32"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M10 10 L30 30"
				stroke={color}
				strokeWidth="3.5"
				strokeLinecap="round"
				className="stroke-one"
			/>
			<path
				d="M30 10 L10 30"
				stroke={color}
				strokeWidth="3.5"
				strokeLinecap="round"
				className="stroke-two"
			/>
		</svg>
	);
}
