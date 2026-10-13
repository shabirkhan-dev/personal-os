/** Spacing scale from the Figma "Spacing" collection. */
export const space = {
	0: 0,
	4: 4,
	6: 6,
	8: 8,
	16: 16,
	24: 24,
	32: 32,
} as const;

/** Radius tokens from the Figma "Radius" collection (Default mode). */
export const radius = {
	xs: 4,
	lg: 12,
	"2xl": 20,
	/** Fully rounded pill / circle. */
	full: 999,
} as const;

/** Stroke widths used by Kit v2 components. */
export const stroke = {
	hairline: 1,
	/** Selected card border (Kit v2: surface + 1.5px accent border). */
	selected: 1.5,
	/** Unchecked checkbox ring. */
	ring: 1.75,
} as const;

/** Drop shadows from the Kit v2 card effects (the shadow colour is black in both modes). */
export const elevation = {
	/** Personal card (frame 15): 0 24 24 at 50%. */
	card: { color: "#000000", opacity: 0.5, offsetY: 24, radius: 24 },
	/** OS card (frame 18): 0 24 48 at 50%. */
	floating: { color: "#000000", opacity: 0.5, offsetY: 24, radius: 48 },
	/** OS card pocket lip (frame 18): 0 −8 24 at 35%. */
	pocket: { color: "#000000", opacity: 0.35, offsetY: -8, radius: 24 },
} as const;

export type ElevationToken = (typeof elevation)[keyof typeof elevation];
