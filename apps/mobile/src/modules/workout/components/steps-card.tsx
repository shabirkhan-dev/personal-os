import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import type { StepDay, StepHistory } from "../hooks/use-step-history";
import { formatThousands } from "../lib/kcal";
import { barHeights, stepsToKm } from "../lib/steps";

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const BAR_MAX = 100;
const BAR_MIN = 24;
const PLACEHOLDER_DAYS = 7;

export type StepsCardProps = {
	history: StepHistory;
	heightCm: number;
	onRetry: () => void;
};

const notice: Record<Exclude<StepHistory["status"], "ready">, string> = {
	loading: "Reading steps…",
	android: "Soon on Android (needs Health Connect)",
	denied: "Allow Motion & Fitness to count your steps",
	unavailable: "Step counting isn't available on this device",
	error: "Couldn't read your steps",
};

/** Kit v2 "Widget / Daily Bars" as Steps: the last seven days from the phone's motion data. */
export function StepsCard({ history, heightCm, onRetry }: StepsCardProps) {
	const { colors } = usePoTheme();
	const days = history.status === "ready" ? history.days : [];
	const [selected, setSelected] = useState(days.length - 1);
	useEffect(() => setSelected(days.length - 1), [days.length]);

	const day = days[selected] ?? days[days.length - 1];
	const monthName = day ? (MONTHS[day.date.getMonth()] ?? "") : "";

	return (
		<Card style={styles.card}>
			<View style={styles.head}>
				<View style={styles.left}>
					<Icon name="Footsteps" color={colors.statusSuccess} />
					<PoText variant="title18">Steps</PoText>
				</View>
				<PoText variant="body15">{monthName}</PoText>
			</View>
			<View style={styles.numbers}>
				<Figure value={day ? formatThousands(day.steps) : "—"} label="steps" />
				<Figure value={day ? stepsToKm(day.steps, heightCm).toFixed(2) : "—"} label="km" />
			</View>
			{history.status === "ready" ? (
				<Bars days={history.days} selected={selected} onSelect={setSelected} />
			) : (
				<EmptyBars status={history.status} onRetry={onRetry} />
			)}
		</Card>
	);
}

function Figure({ value, label }: { value: string; label: string }) {
	return (
		<View>
			<PoText variant="title30">{value}</PoText>
			<PoText variant="body15" tone="textSecondary">
				{label}
			</PoText>
		</View>
	);
}

type BarsProps = { days: readonly StepDay[]; selected: number; onSelect: (index: number) => void };

function Bars({ days, selected, onSelect }: BarsProps) {
	const { colors } = usePoTheme();
	const heights = barHeights(
		days.map((item) => item.steps),
		BAR_MAX,
		BAR_MIN,
	);
	return (
		<View style={styles.bars}>
			{days.map((item, index) => {
				const active = index === selected;
				return (
					<Pressable
						key={item.date.toISOString()}
						accessibilityRole="button"
						accessibilityState={{ selected: active }}
						accessibilityLabel={`${item.date.getDate()} ${MONTHS[item.date.getMonth()]}: ${item.steps} steps`}
						onPress={() => {
							haptics.select();
							onSelect(index);
						}}
						style={styles.column}
					>
						{active ? (
							<View style={[styles.tooltip, { backgroundColor: colors.bgInverse }]}>
								<PoText variant="meta13" tone="textInverse">
									{formatThousands(item.steps)}
								</PoText>
							</View>
						) : null}
						<View
							style={[
								styles.bar,
								{
									height: heights[index],
									backgroundColor: active ? colors.statusSuccess : colors.statusSuccessSubtle,
								},
							]}
						>
							{active ? (
								<View style={[styles.dot, { backgroundColor: colors.textOnAccent }]} />
							) : null}
						</View>
						<PoText variant="meta13">{String(item.date.getDate())}</PoText>
					</Pressable>
				);
			})}
		</View>
	);
}

type EmptyBarsProps = { status: Exclude<StepHistory["status"], "ready">; onRetry: () => void };

/** Same footprint as the bars, with an honest note instead of numbers. */
function EmptyBars({ status, onRetry }: EmptyBarsProps) {
	const { colors } = usePoTheme();
	const action =
		status === "denied"
			? {
					label: "Open Settings",
					run: () =>
						Linking.openSettings().catch((error: unknown) =>
							console.error("Could not open Settings", error),
						),
				}
			: status === "error"
				? { label: "Try again", run: onRetry }
				: null;
	return (
		<View style={styles.empty}>
			<View style={styles.stubs}>
				{Array.from({ length: PLACEHOLDER_DAYS }, (_, index) => (
					<View
						key={index}
						style={[styles.bar, { height: BAR_MIN, backgroundColor: colors.bgSubtle }]}
					/>
				))}
			</View>
			<View style={styles.note}>
				<PoText variant="meta13" tone="textSecondary" style={styles.noteText}>
					{notice[status]}
				</PoText>
				{action ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={action.label}
						hitSlop={10}
						onPress={() => {
							haptics.tap();
							action.run();
						}}
					>
						<PoText variant="meta13" tone="textLink">
							{action.label}
						</PoText>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	left: { flexDirection: "row", alignItems: "center", gap: 10 },
	numbers: { flexDirection: "row", gap: 32 },
	bars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
	column: { alignItems: "center", gap: 10, minWidth: 30 },
	tooltip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
	bar: { width: 30, borderRadius: 15, alignItems: "center", paddingTop: 4 },
	dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
	empty: { gap: 12 },
	stubs: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
	note: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
	noteText: { flex: 1 },
});
