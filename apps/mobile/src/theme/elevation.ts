import type { ElevationToken } from "@personal-os/tokens";
import { Platform, type ViewStyle } from "react-native";

export type PoShadowStyle = Pick<
	ViewStyle,
	"shadowColor" | "shadowOpacity" | "shadowRadius" | "shadowOffset" | "elevation"
>;

/** Converts an elevation token into native shadow props (Android uses `elevation`). */
export function toShadowStyle(token: ElevationToken): PoShadowStyle {
	if (Platform.OS === "android") {
		return { elevation: Math.round(token.radius / 2), shadowColor: token.color };
	}
	return {
		shadowColor: token.color,
		shadowOpacity: token.opacity,
		shadowRadius: token.radius / 2,
		shadowOffset: { width: 0, height: token.offsetY },
	};
}
