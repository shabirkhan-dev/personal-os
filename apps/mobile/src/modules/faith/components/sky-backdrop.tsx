import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, Rect, Stop } from "react-native-svg";
import { usePoTheme } from "@/theme";
import { useFaithToday } from "../hooks/use-faith-today";
import type { Phase } from "../lib/prayer-times";

const HEIGHT = 300;
const TILE = 56;

/** An eight-pointed star (two overlapping squares), the tile of the Sky pattern. */
function starPath(cx: number, cy: number, r: number): string {
	const square = (turn: number) =>
		Array.from({ length: 4 }, (_, index) => {
			const angle = turn + (index * Math.PI) / 2;
			return `${index === 0 ? "M" : "L"}${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`;
		}).join(" ") + " Z";
	return `${square(0)} ${square(Math.PI / 4)}`;
}

const STAR = starPath(TILE / 2, TILE / 2, 14);

/**
 * Faith's Sky header: a faint geometric pattern that fades into the page, with the sun by day and
 * the moon around Fajr and at night. The glow on top of it follows the same part of the day.
 */
export function SkyBackdrop() {
	const { phase } = useFaithToday();
	return <Sky phase={phase} />;
}

export function Sky({ phase }: { phase: Phase }) {
	const { colors } = usePoTheme();
	const night = phase === "fajr" || phase === "isha";
	const disk = phase === "maghrib" ? colors.statusCautionSubtle : colors.bgHover;

	return (
		<View
			pointerEvents="none"
			style={styles.wrap}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			<Svg width="100%" height={HEIGHT}>
				<Defs>
					<Pattern id="sky-tile" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
						<Path d={STAR} stroke={colors.borderDefault} strokeWidth={1} fill="none" />
					</Pattern>
					<LinearGradient id="sky-fade" x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0" stopColor={colors.bgApp} stopOpacity={0} />
						<Stop offset="1" stopColor={colors.bgApp} stopOpacity={1} />
					</LinearGradient>
				</Defs>
				<Rect width="100%" height={HEIGHT} fill="url(#sky-tile)" opacity={0.7} />
				<Rect y={HEIGHT * 0.35} width="100%" height={HEIGHT * 0.65} fill="url(#sky-fade)" />
			</Svg>
			<View style={styles.body}>
				<Svg width={120} height={120}>
					<G opacity={0.9}>
						<Circle
							cx={60}
							cy={60}
							r={58}
							stroke={colors.borderDefault}
							strokeWidth={1}
							fill="none"
						/>
						<Circle
							cx={60}
							cy={60}
							r={44}
							stroke={colors.borderDefault}
							strokeWidth={1}
							fill="none"
						/>
						<Circle cx={60} cy={60} r={30} fill={disk} />
						{night ? <Circle cx={72} cy={52} r={26} fill={colors.bgApp} /> : null}
					</G>
				</Svg>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { position: "absolute", top: 0, left: 0, right: 0, height: HEIGHT },
	body: { position: "absolute", top: -14, right: -14 },
});
