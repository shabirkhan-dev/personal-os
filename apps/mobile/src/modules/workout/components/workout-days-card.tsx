import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { type DayState, type GridCell, gridRows } from "../lib/grid";
import { WidgetHead } from "./widget-head";

export type MonthRange = "last" | "this";

export type WorkoutDaysCardProps = {
	cells: readonly GridCell[];
	range: MonthRange;
	onToggleRange: () => void;
};

const stateLabel: Record<DayState, string> = {
	done: "done",
	partial: "partial",
	missed: "missed",
	rest: "rest day",
	upcoming: "not yet",
};

/** Kit v2 "Widget / Activity Grid": one pill per day of the month. */
export function WorkoutDaysCard({ cells, range, onToggleRange }: WorkoutDaysCardProps) {
	const { colors } = usePoTheme();
	const rangeLabel = range === "last" ? "Last month" : "This month";
	const rows = gridRows(cells);
	const width = rows[0]?.length ?? 0;

	return (
		<Card style={styles.card}>
			<WidgetHead
				icon="Star"
				label="Workout days"
				right={
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={`${rangeLabel}. Switch month`}
						onPress={() => {
							haptics.select();
							onToggleRange();
						}}
						style={[styles.range, { backgroundColor: colors.bgSubtle }]}
					>
						<PoText variant="meta13" tone="textSecondary">
							{rangeLabel}
						</PoText>
						<Icon name="Filled/Chevron down" size={14} color={colors.textSecondary} />
					</Pressable>
				}
			/>
			<View style={styles.grid}>
				{rows.map((row) => (
					<View key={row[0]?.key} style={styles.row}>
						{row.map((cell) => (
							<DayPill key={cell.key} cell={cell} />
						))}
						{Array.from({ length: width - row.length }, (_, index) => (
							<View key={`gap-${index}`} style={styles.pill} />
						))}
					</View>
				))}
			</View>
			<View style={styles.legend}>
				<LegendItem label="Done" state="done" />
				<LegendItem label="Partial" state="partial" />
				<LegendItem label="Missed" state="missed" />
			</View>
		</Card>
	);
}

function usePillStyle(state: DayState) {
	const { colors } = usePoTheme();
	switch (state) {
		case "done":
			return { backgroundColor: colors.textPrimary };
		case "partial":
			return {
				backgroundColor: colors.bgSubtle,
				borderColor: colors.textTertiary,
				borderWidth: 1,
				borderStyle: "dashed" as const,
			};
		case "missed":
			return { backgroundColor: colors.bgSubtle };
		default:
			return { backgroundColor: colors.bgSubtle, opacity: 0.4 };
	}
}

function DayPill({ cell }: { cell: GridCell }) {
	const style = usePillStyle(cell.state);
	return (
		<View
			accessible
			accessibilityLabel={`${cell.day}: ${stateLabel[cell.state]}`}
			style={[styles.pill, style]}
		/>
	);
}

function LegendItem({ label, state }: { label: string; state: DayState }) {
	const style = usePillStyle(state);
	return (
		<View style={styles.legendItem}>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<View style={[styles.swatch, style]} />
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	range: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingLeft: 14,
		paddingRight: 12,
		paddingVertical: 8,
		borderRadius: 18,
	},
	grid: { gap: 6 },
	row: { flexDirection: "row", gap: 5 },
	pill: { flex: 1, height: 18, borderRadius: 9 },
	legend: { flexDirection: "row", alignItems: "center", gap: 16 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
	swatch: { width: 26, height: 14, borderRadius: 7 },
});
