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
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL ?? "https://github.com/shabirkhan-dev/personal-os",
	),
	title: {
		default: "Personal OS",
		template: "%s | Personal OS",
	},
	description:
		"Personal life operating system — track routines, finance, skincare, food, fashion, and daily habits in one web and mobile app.",
	keywords: [
		"personal-os",
		"life-os",
		"routines",
		"finance",
		"skincare",
		"food",
		"fashion",
		"wellness",
		"habits",
		"productivity",
		"nextjs",
		"expo",
	],
	applicationName: "Personal OS",
	creator: "Personal OS",
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "Personal OS",
		title: "Personal OS — life in one place",
		description:
			"Personal life operating system — track routines, finance, skincare, food, fashion, and daily habits in one web and mobile app.",
	},
	twitter: {
		card: "summary_large_image",
		title: "Personal OS — life in one place",
		description:
			"Personal life operating system — track routines, finance, skincare, food, fashion, and daily habits in one web and mobile app.",
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
