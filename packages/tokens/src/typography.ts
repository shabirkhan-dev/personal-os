/**
 * PO text styles from Figma (Kit v2). One family for the whole app: the platform UI font
 * (SF Pro on iOS, Roboto on Android), with tabular figures for times and numbers. Only Quran text
 * and duas use another font, Amiri Quran, since the system font can't set it properly.
 */
export type FontFamilyToken = "sans" | "quran";
export type FontWeightToken = "regular" | "medium";

export type TextStyleToken = {
	family: FontFamilyToken;
	weight: FontWeightToken;
	size: number;
	lineHeight: number;
	letterSpacing: number;
	uppercase?: boolean;
	/** Same-width digits, so times and numbers line up in columns. */
	tabular?: boolean;
};

export const textStyles = {
	hero40: { family: "sans", weight: "regular", size: 40, lineHeight: 44, letterSpacing: -1 },
	display36: { family: "sans", weight: "regular", size: 36, lineHeight: 42, letterSpacing: -0.9 },
	title30: { family: "sans", weight: "medium", size: 30, lineHeight: 36, letterSpacing: -0.5 },
	title18: { family: "sans", weight: "medium", size: 18, lineHeight: 26, letterSpacing: -0.15 },
	body15: { family: "sans", weight: "regular", size: 15, lineHeight: 22, letterSpacing: 0 },
	row15: { family: "sans", weight: "medium", size: 15, lineHeight: 22, letterSpacing: 0 },
	text14: { family: "sans", weight: "regular", size: 14, lineHeight: 20, letterSpacing: -0.15 },
	text14Medium: {
		family: "sans",
		weight: "medium",
		size: 14,
		lineHeight: 20,
		letterSpacing: -0.15,
	},
	meta13: { family: "sans", weight: "regular", size: 13, lineHeight: 18, letterSpacing: 0 },
	tab11: { family: "sans", weight: "medium", size: 11, lineHeight: 14, letterSpacing: 0 },
	/** Times, counts and amounts. Kept as "mono13" for its numbers, now in the sans family. */
	mono13: {
		family: "sans",
		weight: "regular",
		size: 13,
		lineHeight: 18,
		letterSpacing: 0,
		tabular: true,
	},
	eyebrow11: {
		family: "sans",
		weight: "medium",
		size: 11,
		lineHeight: 14,
		letterSpacing: 0.6,
		uppercase: true,
	},
	/** Arabic: the Ayah card and the Tasbih list; the large size for flashcards. */
	arabic20: { family: "quran", weight: "regular", size: 20, lineHeight: 36, letterSpacing: 0 },
	arabic30: { family: "quran", weight: "regular", size: 30, lineHeight: 54, letterSpacing: 0 },
	arabic56: { family: "quran", weight: "regular", size: 56, lineHeight: 96, letterSpacing: 0 },
} as const satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;
