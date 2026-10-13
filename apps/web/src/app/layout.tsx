import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { themeCss } from "./theme-css";

const description =
	"Plans, money, workouts, skincare, food and outfits in one app that builds your day around you. Coming soon to Android and iOS.";

export const metadata: Metadata = {
	title: "Personal OS — your whole life, in one calm place",
	description,
	openGraph: {
		title: "Personal OS",
		description,
		type: "website",
	},
};

export const viewport: Viewport = {
	themeColor: "#0e0e0e",
	colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				{/* Token-generated CSS variables; static and built from @personal-os/tokens. */}
				{/* oxlint-disable-next-line react/no-danger */}
				<style dangerouslySetInnerHTML={{ __html: themeCss }} />
			</head>
			<body>{children}</body>
		</html>
	);
}
