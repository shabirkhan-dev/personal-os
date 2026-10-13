import { type ColorTokens, glowOpacity } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { usePoTheme } from "@/theme";

export type GlowProps = {
	tone: keyof ColorTokens;
	/** Ellipse box in the frame, before blur (Figma geometry). */
	width?: number;
	height?: number;
	left?: number;
	top?: number;
	/** Figma layer-blur radius; widens the gradient falloff. */
	blur?: number;
	/** Which glow strength token to use (hero light, card light or member card). */
	strength?: "hero" | "card" | "member";
};

/**
 * Soft coloured light from the Onboarding frames: a token-coloured ellipse with a large
 * layer blur, reproduced as a radial gradient so it renders natively without filters.
 */
export function Glow({
	tone,
	width = 380,
	height = 260,
	left = 5,
	top = -150,
	blur = 120,
	strength = "hero",
}: GlowProps) {
	const { colors, mode } = usePoTheme();
	const opacity = glowOpacity[mode][strength];
	const color = colors[tone];
	const boxWidth = width + blur * 2;
	const boxHeight = height + blur * 2;
	const gradientId = `glow-${tone}`;

	return (
		<View
			pointerEvents="none"
			style={[
				styles.box,
				{ left: left - blur, top: top - blur, width: boxWidth, height: boxHeight, opacity },
			]}
		>
			<Svg width={boxWidth} height={boxHeight}>
				<Defs>
					<RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
						<Stop offset="0" stopColor={color} stopOpacity={1} />
						<Stop offset="0.3" stopColor={color} stopOpacity={0.9} />
						<Stop offset="0.55" stopColor={color} stopOpacity={0.45} />
						<Stop offset="0.8" stopColor={color} stopOpacity={0.1} />
						<Stop offset="1" stopColor={color} stopOpacity={0} />
					</RadialGradient>
				</Defs>
				<Ellipse
					cx={boxWidth / 2}
					cy={boxHeight / 2}
					rx={boxWidth / 2}
					ry={boxHeight / 2}
					fill={`url(#${gradientId})`}
				/>
			</Svg>
		</View>
	);
}

const styles = StyleSheet.create({
	box: { position: "absolute" },
});
