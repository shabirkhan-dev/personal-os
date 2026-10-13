import type { Metadata } from "next";
import type { ReactNode } from "react";
import { themeCss } from "./theme-css";

export const metadata: Metadata = {
	title: "Personal OS",
	description: "Your life, in one place.",
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
