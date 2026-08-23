/**
 * Personal OS Mobile Design System
 * Primary tokens are declared in `src/global.css` via Tailwind CSS / Uniwind @theme inline.
 * Use Tailwind utility classes directly in JSX:
 * - `bg-background`, `bg-card`, `bg-popover`, `bg-primary`, `bg-secondary`, `bg-muted`, `bg-accent`, `bg-destructive`
 * - `text-foreground`, `text-card-foreground`, `text-muted-foreground`, `text-primary-foreground`
 * - `border-border`, `border-input`, `ring-ring`
 * - `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-4xl`
 */

export const ShadcnTokens = {
	background: "#0B0C10",
	foreground: "#FFFFFF",
	card: "#15161A",
	cardForeground: "#FFFFFF",
	popover: "#15161A",
	popoverForeground: "#FFFFFF",
	primary: "#00E676",
	primaryForeground: "#000000",
	secondary: "#1F2026",
	secondaryForeground: "#FFFFFF",
	muted: "#1A1B20",
	mutedForeground: "#888888",
	accent: "#1F2026",
	accentForeground: "#FFFFFF",
	destructive: "#FF1744",
	destructiveForeground: "#FFFFFF",
	border: "rgba(255, 255, 255, 0.08)",
	input: "rgba(255, 255, 255, 0.10)",
	ring: "#00E676",
	radius: 16,
} as const;

// Backward-compatible NeonColors proxying the canonical tokens
export const NeonColors = {
	background: ShadcnTokens.background,
	surface: ShadcnTokens.card,
	card: {
		gradient: ["#222222", "#141414"] as const,
		border: ShadcnTokens.border,
	},
	text: {
		primary: ShadcnTokens.foreground,
		secondary: ShadcnTokens.mutedForeground,
		muted: "#444444",
	},
	accent: {
		green: "#00E676",
		orange: "#FF6D00",
		blue: "#00B0FF",
		red: ShadcnTokens.destructive,
		purple: "#D500F9",
		yellow: "#FFEA00",
		cyan: "#18FFFF",
		pink: "#FF007F",
		teal: "#00BFA5",
	},
};

export const NeonShadows = {
	glow: {
		shadowColor: "#FFFFFF",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 10,
		elevation: 10,
	},
};
