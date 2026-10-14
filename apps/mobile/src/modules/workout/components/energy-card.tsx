import { Pressable, StyleSheet, View } from "react-native";
import type { ColorTokens } from "@personal-os/tokens";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import type { EnergyCandle, EnergyDay } from "../lib/energy";

const HOURS = 24;
const GUIDE = 104;
const SPAN = 96;
const MIN_CANDLE = 8;
const AXIS = ["00:00", "06:00", "12:00", "18:00"];

export type EnergyCardProps = { day: EnergyDay; onLog: () => void };

/** Kit v2 "Widget / Day Range" as Energy: today's check-ins by hour. */
export function EnergyCard({ day, onLog }: EnergyCardProps) {
	const { colors } = usePoTheme();
	const latest = day.latest;

	return (
		<Card style={styles.card}>
			<View style={styles.top}>
				<View style={styles.left}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{latest ? `Today ${clock(new Date(latest.at))}` : "Today"}
					</PoText>
					{latest ? (
						<View style={styles.value}>
							<PoText variant="hero40">{String(latest.level)}</PoText>
							<PoText variant="title18" tone="textTertiary">
								energy
							</PoText>
						</View>
					) : (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="How's your energy? Log it"
							onPress={() => {
								haptics.tap();
								onLog();
							}}
							style={styles.emptyValue}
						>
							<PoText variant="title18">{"How's your energy?"}</PoText>
							<PoText variant="title18" tone="textLink">
								Log it
							</PoText>
						</Pressable>
					)}
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Log energy"
					hitSlop={12}
					onPress={() => {
						haptics.tap();
						onLog();
					}}
				>
					<Icon name="Heart" color={colors.textSecondary} />
				</Pressable>
			</View>
			<View style={styles.minMax}>
				<Stat label="Low" tone="statusViolet" value={day.low} />
				<Stat label="Peak" tone="statusCaution" value={day.peak} />
			</View>
			<View style={styles.candles}>
				{Array.from({ length: HOURS }, (_, hour) => (
					<View key={hour} style={styles.column}>
						<View style={[styles.guide, { backgroundColor: colors.borderDefault }]} />
						<Candle day={day} hour={hour} />
					</View>
				))}
			</View>
			<View style={styles.axis}>
				{AXIS.map((label) => (
					<PoText key={label} variant="eyebrow11" tone="textTertiary" style={styles.tick}>
						{label}
					</PoText>
				))}
			</View>
		</Card>
	);
}

function Stat({
	label,
	tone,
	value,
}: {
	label: string;
	tone: keyof ColorTokens;
	value: number | null;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.stat}>
			<View style={styles.statLabel}>
				<View style={[styles.dot, { backgroundColor: colors[tone] }]} />
				<PoText variant="eyebrow11" tone="textTertiary">
					{label}
				</PoText>
			</View>
			<PoText variant="mono13" style={styles.statValue}>
				{value === null ? "—" : String(value)}
			</PoText>
		</View>
	);
}

function candleTone(day: EnergyDay, hour: number): keyof ColorTokens {
	if (day.latest && new Date(day.latest.at).getHours() === hour) return "statusSuccess";
	if (day.peakHour === hour) return "statusCaution";
	if (day.lowHour === hour) return "statusViolet";
	return "textTertiary";
}

function Candle({ day, hour }: { day: EnergyDay; hour: number }) {
	const { colors } = usePoTheme();
	const candle: EnergyCandle | undefined = day.candles.find((item) => item.hour === hour);
	if (!candle) return null;
	const top = (1 - candle.high / 100) * SPAN;
	const height = Math.max(MIN_CANDLE, ((candle.high - candle.low) / 100) * SPAN);
	return (
		<View
			accessible
			accessibilityLabel={`${String(hour).padStart(2, "0")}:00 energy ${candle.low === candle.high ? candle.high : `${candle.low} to ${candle.high}`}`}
			style={[
				styles.candle,
				{
					top: Math.min(top, GUIDE - height),
					height,
					backgroundColor: colors[candleTone(day, hour)],
				},
			]}
		/>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
	left: { gap: 6, flex: 1 },
	value: { flexDirection: "row", alignItems: "baseline", gap: 6 },
	emptyValue: { paddingVertical: 9 },
	minMax: { flexDirection: "row", gap: 40 },
	stat: { gap: 4 },
	statLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	statValue: { paddingLeft: 16 },
	candles: { height: 120, flexDirection: "row" },
	column: { flex: 1, alignItems: "center" },
	guide: { position: "absolute", top: 0, width: 1, height: GUIDE },
	candle: { position: "absolute", width: 6, borderRadius: 3 },
	axis: { flexDirection: "row" },
	tick: { flex: 1 },
});
