import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { appDescription, appName } from "@/lib/shared";
import "./global.css";

export const metadata: Metadata = {
	title: {
		default: appName,
		template: `%s | ${appName}`,
	},
	description: appDescription,
	keywords: ["personal-os", "life-os", "routines", "finance", "skincare", "food", "fashion", "wellness", "habits", "productivity", "nextjs", "expo"],
	openGraph: {
		title: appName,
		description: appDescription,
		siteName: appName,
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: appName,
		description: appDescription,
	},
	robots: { index: true, follow: true },
};

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
