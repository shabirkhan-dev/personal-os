import { Pressable, StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { formatKcal, type Meal, slotLabel, type SlotSummary } from "../lib/meals";
import { SlotIcon } from "./slot-icon";

export type MealsCardProps = {
	slots: SlotSummary[];
	/** Opens the Log meal sheet for a slot, or for a planned meal to confirm it. */
	onLog: (summary: SlotSummary, planned: Meal | null) => void;
};

function LogButton({ label, onPress }: { label: string; onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={6}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [
				styles.log,
				{ backgroundColor: colors.bgInverse, opacity: pressed ? 0.8 : 1 },
			]}
		>
			<PoText variant="meta13" tone="textInverse">
				Log
			</PoText>
		</Pressable>
	);
}

function MealRow({
	summary,
	last,
	onLog,
}: {
	summary: SlotSummary;
	last: boolean;
	onLog: MealsCardProps["onLog"];
}) {
	const { colors } = usePoTheme();
	const label = slotLabel(summary.slot);
	const first = summary.eaten[0];
	const time = first ? clock(new Date(first.at)) : "";
	const detail = first
		? summary.eaten.map((meal) => meal.name).join(", ")
		: summary.planned
			? `Planned · ${summary.planned.name}`
			: "Not logged yet";

	const content = (
		<>
			<SlotIcon slot={summary.slot} />
			<View style={styles.text}>
				<View style={styles.top}>
					<PoText variant="row15">{label}</PoText>
					{time ? (
						<PoText variant="mono13" tone="textTertiary">
							{time}
						</PoText>
					) : null}
				</View>
				<PoText variant="meta13" tone={first ? "textSecondary" : "textTertiary"} numberOfLines={1}>
					{detail}
				</PoText>
			</View>
		</>
	);

	const border = last ? null : { borderBottomWidth: 1, borderColor: colors.borderDefault };

	if (first) {
		return (
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label}, ${detail}, ${formatKcal(summary.kcal)} kcal`}
				accessibilityHint="Opens this meal to add more or remove an entry"
				onPress={() => onLog(summary, null)}
				style={[styles.row, border]}
			>
				{content}
				<View style={styles.kcal}>
					<PoText variant="row15">{formatKcal(summary.kcal)}</PoText>
					<PoText variant="meta13" tone="textTertiary">
						kcal
					</PoText>
				</View>
			</Pressable>
		);
	}

	return (
		<View style={[styles.row, border]}>
			{content}
			<LogButton
				label={`Log ${label.toLowerCase()}`}
				onPress={() => onLog(summary, summary.planned)}
			/>
		</View>
	);
}

/** Figma "Today's meals": the four slots, eaten ones with time, names and kcal. */
export function MealsCard({ slots, onLog }: MealsCardProps) {
	const { colors } = usePoTheme();
	const logged = slots.filter((summary) => summary.eaten.length > 0).length;

	return (
		<View style={styles.section}>
			<View style={styles.head}>
				<PoText variant="eyebrow11" tone="textTertiary" accessibilityRole="header">
					Today's meals
				</PoText>
				<PoText variant="eyebrow11" tone="textTertiary">
					{logged} of {slots.length} logged
				</PoText>
			</View>
			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{slots.map((summary, index) => (
					<MealRow
						key={summary.slot}
						summary={summary}
						last={index === slots.length - 1}
						onLog={onLog}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	section: { gap: 12 },
	head: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingTop: 8,
		paddingHorizontal: 6,
	},
	card: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 28, borderWidth: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	text: { flex: 1, gap: 2 },
	top: { flexDirection: "row", alignItems: "center", gap: 8 },
	kcal: { flexDirection: "row", alignItems: "baseline", gap: 3 },
	log: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: "center" },
});
