import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { atlasThemeScript, SITE } from "@/modules/landing";
import "@/modules/landing/styles/landing.css";

const jakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-jakarta",
	display: "swap",
});

const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-fraunces",
	display: "swap",
});

const jetbrains = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains",
	display: "swap",
});

export const metadata: Metadata = {
	title: SITE.title,
	description: SITE.description,
	openGraph: {
		title: SITE.title,
		description: SITE.description,
		siteName: SITE.name,
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: SITE.title,
		description: SITE.description,
	},
};

export default function LandingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<>
			{/* Apply the stored landing theme before paint to avoid a flash. */}
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: required to run the theme script before hydration
				dangerouslySetInnerHTML={{ __html: atlasThemeScript }}
			/>
			<div className={cn(jakarta.variable, fraunces.variable, jetbrains.variable)}>{children}</div>
		</>
	);
}

