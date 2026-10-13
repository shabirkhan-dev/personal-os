import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { AboutPageContent, AgentShell, atlasThemeScript } from "@/modules/landing";
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
	title: "About — Starter",
	description:
		"A Bun + Turborepo monorepo starter for production-grade products. Meet the team behind Starter.",
};

export default function AboutPage() {
	return (
		<>
			<script
				// Intentional: theme before paint. No oxlint equivalent for Biome's noDangerouslySetInnerHtml, so this documents the choice rather than suppressing.
				dangerouslySetInnerHTML={{ __html: atlasThemeScript }}
			/>
			<div className={cn(jakarta.variable, fraunces.variable, jetbrains.variable)}>
				<AgentShell>
					<AboutPageContent />
				</AgentShell>
			</div>
		</>
	);
}
