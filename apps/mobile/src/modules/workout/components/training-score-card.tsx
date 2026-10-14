import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import type { WeekBar } from "../lib/score";
import { WidgetHead } from "./widget-head";

const TRACK = 80;
const MIN_FILL = 8;

export type TrainingScoreCardProps = {
	bars: readonly WeekBar[];
	score: number;
	onOpen: () => void;
};

/** Kit v2 "Widget / Forecast" as Training score: this week's minutes vs the daily target. */
export function TrainingScoreCard({ bars, score, onOpen }: TrainingScoreCardProps) {
	const { colors } = usePoTheme();
	return (
		<Card style={styles.card}>
			<WidgetHead
				icon="Lightning"
				label="Training score"
				accessibilityLabel={`Training score ${score}%. Open this week`}
				onPress={onOpen}
				right={<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />}
			/>
			<View style={styles.body}>
				<PoText variant="hero40">{`${score}%`}</PoText>
				<View style={styles.capsules}>
					{bars.map((bar) => (
						<View
							key={bar.key}
							style={styles.day}
							accessible
							accessibilityLabel={`${bar.key}: ${bar.minutes} minutes`}
						>
							<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
								{bar.minutes > 0 ? (
									<View
										style={[
											styles.fill,
											{
												height: Math.max(MIN_FILL, bar.ratio * TRACK),
												backgroundColor: colors.statusCaution,
											},
										]}
									/>
								) : null}
							</View>
							<PoText variant="eyebrow11" tone={bar.isToday ? "textPrimary" : "textTertiary"}>
								{bar.letter}
							</PoText>
						</View>
					))}
				</View>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	body: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
	capsules: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
	day: { alignItems: "center", gap: 8 },
	track: {
		width: 16,
		height: TRACK,
		borderRadius: 8,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	fill: { width: 16, borderRadius: 8 },
});
