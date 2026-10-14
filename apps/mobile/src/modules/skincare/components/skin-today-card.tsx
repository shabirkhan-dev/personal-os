import type { ColorTokens } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { breakoutsLabel } from "../lib/skin";
import type { CheckIn, Hydration, Redness } from "../lib/skincare-types";
import { CardHead } from "./card-head";

export type SkinTodayCardProps = {
	latest: CheckIn | null;
	/** "Checked 3 days ago" */
	checkedLabel: string;
	busy: boolean;
	onTakePhoto: () => void;
	onLog: () => void;
};

type Tone = keyof ColorTokens;

const hydrationTone: Record<Hydration, Tone> = {
	good: "textSuccess",
	ok: "textPrimary",
	low: "textWarning",
};
const rednessTone: Record<Redness, Tone> = {
	low: "textSuccess",
	medium: "textWarning",
	high: "textDanger",
};

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** "Skin today": the last check-in's hydration, redness and breakouts, and the photo button. */
export function SkinTodayCard({
	latest,
	checkedLabel,
	busy,
	onTakePhoto,
	onLog,
}: SkinTodayCardProps) {
	const { colors } = usePoTheme();
	return (
		<Card style={styles.card}>
			<CardHead title="Skin today" meta={checkedLabel} />
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={latest ? "Log how your skin feels" : "Log your first skin check"}
				onPress={() => {
					haptics.tap();
					onLog();
				}}
				style={styles.metrics}
			>
				<Metric
					label="Hydration"
					value={latest ? capitalise(latest.hydration) : "Not set"}
					tone={latest ? hydrationTone[latest.hydration] : "textTertiary"}
				/>
				<Metric
					label="Redness"
					value={latest ? capitalise(latest.redness) : "Not set"}
					tone={latest ? rednessTone[latest.redness] : "textTertiary"}
				/>
				<Metric
					label="Breakouts"
					value={latest ? breakoutsLabel(latest.breakouts) : "Not set"}
					tone={latest ? (latest.breakouts > 0 ? "textWarning" : "textSuccess") : "textTertiary"}
				/>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Take today's photo"
				accessibilityState={{ disabled: busy }}
				disabled={busy}
				onPress={() => {
					haptics.tap();
					onTakePhoto();
				}}
				style={[styles.photo, { backgroundColor: colors.bgInverse, opacity: busy ? 0.6 : 1 }]}
			>
				<Icon name="Filled/Camera" size={16} color={colors.textInverse} />
				<PoText variant="row15" tone="textInverse">
					Take today&apos;s photo
				</PoText>
			</Pressable>
		</Card>
	);
}

function Metric({ label, value, tone }: { label: string; value: string; tone: Tone }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.metric, { backgroundColor: colors.bgSubtle }]}>
			<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
				{label}
			</PoText>
			<PoText variant="row15" tone={tone} numberOfLines={1}>
				{value}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 14, paddingVertical: 16, paddingHorizontal: 18 },
	metrics: { flexDirection: "row", gap: 8 },
	metric: {
		flex: 1,
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 18,
	},
	photo: {
		height: 48,
		borderRadius: 24,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
});
