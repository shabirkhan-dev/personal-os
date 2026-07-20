import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { themeInitScript } from "@/components/theme";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://github.com/shabirkhan-dev/personal-os"),
	title: {
		default: "Personal OS",
		template: "%s | Personal OS",
	},
	description: "Personal OS — your life in one place: routines, finance, skincare, food, fashion, and daily care.",
	keywords: ["personal-os", "personal", "productivity", "bun", "turborepo", "monorepo", "nextjs", "nestjs", "expo", "typescript", "fullstack", "docker"],
	applicationName: "Personal OS",
	creator: "Personal OS",
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "Personal OS",
		title: "Personal OS",
		description: "Personal OS — your life in one place: routines, finance, skincare, food, fashion, and daily care.",
	},
	twitter: {
		card: "summary_large_image",
		title: "Personal OS",
		description: "Personal OS — your life in one place: routines, finance, skincare, food, fashion, and daily care.",
	},
	robots: { index: true, follow: true },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static FOUC bootstrap, not user input */}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
			</head>
			<body className="font-sans antialiased" suppressHydrationWarning>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
