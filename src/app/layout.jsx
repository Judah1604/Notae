import { EB_Garamond, Geist, Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});
const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});
const eb_garamond = EB_Garamond({
	variable: "--font-eb_garamond",
	subsets: ["latin"],
});

export const metadata = {
	title: "Notae",
	description:
		"Real-time design critique board: pin comments on a design, synced live across the room.",
};

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${inter.variable} ${eb_garamond.variable}`}
		>
			<body>
				{children} <Analytics />
			</body>
		</html>
	);
}
