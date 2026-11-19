export function timeAgo(timestamp) {
	const date = new Date(
		timestamp.includes("Z") || /[+-]\d{2}:\d{2}$/.test(timestamp)
			? timestamp
			: timestamp.replace(" ", "T") + "Z",
	);

	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

	if (seconds < 60) return "Just now";

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;

	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks}w ago`;

	const months = Math.floor(days / 30);
	if (months < 12) return `${months}mo ago`;

	return `${Math.floor(days / 365)}y ago`;
}

export function formatTime(timestamp) {
	return new Date(timestamp).toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "Africa/Lagos",
	});
}
