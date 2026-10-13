/**
 * Semantic colour tokens from the Figma "Color" variable collection (Kit v2).
 * Values are the resolved primitives for each mode; Dark is the product default.
 */
export type ColorMode = "light" | "dark";

export type ColorTokens = {
	bgCanvas: string;
	bgApp: string;
	bgSubtle: string;
	bgSurface: string;
	bgHover: string;
	bgSelected: string;
	bgInverse: string;
	textPrimary: string;
	textSecondary: string;
	textTertiary: string;
	textInverse: string;
	textOnAccent: string;
	textLink: string;
	textDanger: string;
	textSuccess: string;
	textWarning: string;
	borderDefault: string;
	borderStrong: string;
	accentDefault: string;
	accentSubtle: string;
	accentSubtleBorder: string;
	statusSuccess: string;
	statusSuccessSubtle: string;
	statusDanger: string;
	statusDangerSubtle: string;
	statusWarningSubtle: string;
	statusWarningBorder: string;
	statusCaution: string;
	statusCautionSubtle: string;
	statusViolet: string;
	statusVioletSubtle: string;
	statusVioletBorder: string;
};

export const colors: Record<ColorMode, ColorTokens> = {
	light: {
		bgCanvas: "#f5f5f5",
		bgApp: "#ffffff",
		bgSubtle: "#fafafa",
		bgSurface: "#ffffff",
		bgHover: "#fafafa",
		bgSelected: "#ebebeb",
		bgInverse: "#1b1b1b",
		textPrimary: "#292929",
		textSecondary: "#5d5d5d",
		textTertiary: "#9e9e9e",
		textInverse: "#ffffff",
		textOnAccent: "#ffffff",
		textLink: "#2d7cf6",
		textDanger: "#e5484d",
		textSuccess: "#30a46c",
		textWarning: "#f0803c",
		borderDefault: "#f2f2f2",
		borderStrong: "#e3e3e3",
		accentDefault: "#2d7cf6",
		accentSubtle: "#eaf2fe",
		accentSubtleBorder: "#d3e4fd",
		statusSuccess: "#30a46c",
		statusSuccessSubtle: "#e6f6ee",
		statusDanger: "#e5484d",
		statusDangerSubtle: "#fdecec",
		statusWarningSubtle: "#fef0e6",
		statusWarningBorder: "#f9c4a1",
		statusCaution: "#e5a50a",
		statusCautionSubtle: "#fef7dc",
		statusViolet: "#8e5cf0",
		statusVioletSubtle: "#f1eafd",
		statusVioletBorder: "#cab6f9",
	},
	dark: {
		bgCanvas: "#0e0e0e",
		bgApp: "#141414",
		bgSubtle: "#1b1b1b",
		bgSurface: "#212121",
		bgHover: "#212121",
		bgSelected: "#292929",
		bgInverse: "#ffffff",
		textPrimary: "#ebebeb",
		textSecondary: "#a3a3a3",
		textTertiary: "#7f7f7f",
		textInverse: "#141414",
		textOnAccent: "#ffffff",
		textLink: "#5b9bf8",
		textDanger: "#f0686d",
		textSuccess: "#4bbe88",
		textWarning: "#f5985c",
		borderDefault: "#303030",
		borderStrong: "#3d3d3d",
		accentDefault: "#2d7cf6",
		accentSubtle: "#0b2144",
		accentSubtleBorder: "#10305f",
		statusSuccess: "#4bbe88",
		statusSuccessSubtle: "#143a28",
		statusDanger: "#f0686d",
		statusDangerSubtle: "#4a1d1f",
		statusWarningSubtle: "#4a2a14",
		statusWarningBorder: "#8c4c24",
		statusCaution: "#edb92e",
		statusCautionSubtle: "#46360b",
		statusViolet: "#a382f5",
		statusVioletSubtle: "#2e1d55",
		statusVioletBorder: "#543693",
	},
};

/** Default mode when the system does not report a colour scheme. */
export const defaultColorMode: ColorMode = "dark";

/** Fill opacity of the blurred colour glows per mode (Onboarding v5 frames). */
export const glowOpacity: Record<ColorMode, { hero: number; card: number; member: number }> = {
	light: { hero: 0.16, card: 0.16, member: 0.16 },
	dark: { hero: 1, card: 0.22, member: 0.18 },
};
