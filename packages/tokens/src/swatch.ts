/**
 * Garment colours for the Fashion module: the dot beside a piece and the colour-story bar. They
 * describe clothes, not the interface, so they are the same in light and dark mode.
 */
export const swatches = {
	navy: "#1f2a44",
	indigo: "#2b3550",
	blue: "#3b6ea8",
	white: "#f2f2ee",
	cream: "#ece3cf",
	grey: "#8a8d91",
	charcoal: "#3a3d42",
	black: "#151515",
	olive: "#556b3a",
	green: "#3f7d5a",
	beige: "#d8c3a0",
	khaki: "#c3a77a",
	brown: "#6b4a32",
	burgundy: "#6e2433",
	red: "#a33a3a",
	silver: "#b8bcc2",
	other: "#9aa0a6",
} as const;

export type SwatchName = keyof typeof swatches;
