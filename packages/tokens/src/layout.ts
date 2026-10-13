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
