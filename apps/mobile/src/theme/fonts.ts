import { AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import type { TextStyleToken } from "@personal-os/tokens";
import { Platform, type TextStyle } from "react-native";

/** Fonts loaded at startup with `useFonts(poFontAssets)`. */
export const poFontAssets = { JetBrainsMono_400Regular, AmiriQuran_400Regular };

const sansFamily = Platform.select({
	// SF Pro is the iOS system font, so no family is needed there.
	ios: undefined,
	android: "sans-serif",
	default: '"SF Pro Text", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif',
});

const sansMediumFamily = Platform.select({
	ios: undefined,
	android: "sans-serif-medium",
	default: sansFamily,
});

export type PoTextStyle = Pick<
	TextStyle,
	"fontFamily" | "fontSize" | "lineHeight" | "letterSpacing" | "fontWeight" | "textTransform"
>;

/** Converts a PO text-style token into a React Native text style. */
export function toTextStyle(token: TextStyleToken): PoTextStyle {
	const isMedium = token.weight === "medium";
	const fontFamily =
		token.family === "quran"
			? "AmiriQuran_400Regular"
			: token.family === "mono"
				? "JetBrainsMono_400Regular"
				: isMedium
					? sansMediumFamily
					: sansFamily;

	return {
		fontFamily,
		fontSize: token.size,
		lineHeight: token.lineHeight,
		letterSpacing: token.letterSpacing,
		// Figma uses SF Pro Medium (510); 500 is the closest native weight.
		fontWeight: isMedium && Platform.OS !== "android" ? "500" : "400",
		textTransform: token.uppercase ? "uppercase" : "none",
	};
}
