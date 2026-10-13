import type { ColorTokens } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Glow } from "@/components/ui/glow";
import { PoText } from "@/components/ui/po-text";
import { rise, usePoTheme } from "@/theme";

type Stat = {
	label: string;
	value: string;
	suffix: string;
	tone: keyof ColorTokens;
	dimmed?: boolean;
};

const stats: readonly Stat[] = [
	{ label: "Finance · saved this month", value: "Rs 18,500", suffix: ".00", tone: "statusCaution" },
	{ label: "Workout · burned today", value: "486", suffix: " kcal", tone: "statusDanger" },
	{
		label: "Skincare · routine streak",
		value: "12",
		suffix: " days",
		tone: "statusViolet",
		dimmed: true,
	},
];

/** Frame 05 preview: three module "homes", each with its own colour light. */
export function HomesPreview() {
	const { colors } = usePoTheme();

	return (
		<View style={styles.list}>
			{stats.map((stat, index) => (
				<Animated.View key={stat.label} entering={rise(90 * index)}>
					<View
						style={[
							styles.card,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
							stat.dimmed ? styles.dimmed : null,
						]}
					>
						<Glow
							tone={stat.tone}
							width={240}
							height={120}
							left={59}
							top={-96}
							blur={60}
							strength="card"
						/>
						<PoText variant="meta13" tone="textSecondary">
							{stat.label}
						</PoText>
						<PoText variant="hero40">
							{stat.value}
							<PoText variant="hero40" tone="textTertiary">
								{stat.suffix}
							</PoText>
						</PoText>
					</View>
				</Animated.View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: { gap: 10 },
	card: {
		alignItems: "center",
		gap: 4,
		paddingVertical: 18,
		borderRadius: 28,
		borderWidth: 1,
		overflow: "hidden",
	},
	dimmed: { opacity: 0.45 },
});
