import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { CURRENCY } from "@/lib/money";
import { type DailyRange, rangePosition, wholeAmount } from "../lib/finance-math";

export type RangeBarCardProps = {
	range: DailyRange | null;
	/** "2 min ago", or null with no entries. */
	lastEntry: string | null;
};

/** Figma "Widget / Range Bar": daily average this month with today between the low and peak. */
export function RangeBarCard({ range, lastEntry }: RangeBarCardProps) {
	return (
		<Card style={styles.card}>
			<View style={styles.top}>
				<View style={styles.left}>
					<PoText variant="meta13" tone="textSecondary">
						Daily average
					</PoText>
					<View style={styles.value}>
						<PoText variant="title30" tone={range ? "textPrimary" : "textTertiary"}>
							{range ? wholeAmount(range.average) : "—"}
						</PoText>
						<PoText variant="title18" tone="textWarning">
							{CURRENCY.code}
						</PoText>
					</View>
				</View>
				<View style={styles.right}>
					<PoText variant="meta13" tone="textSecondary">
						Last entry
					</PoText>
					<PoText variant="row15" tone={lastEntry ? "textPrimary" : "textTertiary"}>
						{lastEntry ?? "No expenses yet"}
					</PoText>
				</View>
			</View>
			<RangeTrack range={range} />
			<View style={styles.bounds}>
				<View style={styles.bound}>
					<PoText variant="meta13" tone="textSecondary">
						Lowest
					</PoText>
					<PoText variant="row15">{range ? `${wholeAmount(range.low)} ↓` : "—"}</PoText>
				</View>
				<View style={styles.bound}>
					<PoText variant="meta13" tone="textSecondary">
						Peak
					</PoText>
					<PoText variant="row15">{range ? `${wholeAmount(range.peak)} ↑` : "—"}</PoText>
				</View>
			</View>
		</Card>
	);
}

function RangeTrack({ range }: { range: DailyRange | null }) {
	const { colors } = usePoTheme();
	const [width, setWidth] = useState(0);
	const [pillWidth, setPillWidth] = useState(0);

	const onTrack = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
	const onPill = (event: LayoutChangeEvent) => setPillWidth(event.nativeEvent.layout.width);

	const tone = range ? colors.statusCaution : colors.borderDefault;
	const averageAt = range ? rangePosition(range.average, range.low, range.peak) * width : 0;
	const todayAt = range ? rangePosition(range.today, range.low, range.peak) * width : 0;
	const pillLeft = Math.min(Math.max(0, todayAt - pillWidth / 2), Math.max(0, width - pillWidth));

	return (
		<View
			style={styles.track}
			onLayout={onTrack}
			accessible
			accessibilityLabel={
				range
					? `Today ${wholeAmount(range.today)}, average ${wholeAmount(range.average)}`
					: "No spending logged this month"
			}
		>
			<View style={[styles.line, { backgroundColor: tone }]} />
			<View
				style={[styles.end, styles.start, { borderColor: tone, backgroundColor: colors.bgSurface }]}
			/>
			<View
				style={[
					styles.end,
					styles.finish,
					{ borderColor: tone, backgroundColor: colors.bgSurface },
				]}
			/>
			{range && width > 0 ? (
				<>
					<View
						style={[styles.average, { left: averageAt, backgroundColor: colors.textTertiary }]}
					/>
					<View
						onLayout={onPill}
						style={[
							styles.pill,
							{ left: pillLeft, backgroundColor: colors.statusCaution, opacity: pillWidth ? 1 : 0 },
						]}
					>
						<PoText variant="row15" tone="textOnAccent">
							{`Today ${wholeAmount(range.today)}`}
						</PoText>
					</View>
				</>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
	left: { gap: 4 },
	value: { flexDirection: "row", alignItems: "baseline", gap: 6 },
	right: { gap: 4, alignItems: "flex-end", flexShrink: 1 },
	track: { height: 48 },
	line: { position: "absolute", left: 0, right: 0, top: 21, height: 6, borderRadius: 3 },
	end: {
		position: "absolute",
		top: 20,
		width: 8,
		height: 8,
		borderRadius: 4,
		borderWidth: 1.5,
	},
	start: { left: 0 },
	finish: { right: 0 },
	average: { position: "absolute", top: 2, width: 1, height: 44 },
	pill: {
		position: "absolute",
		top: 5,
		paddingLeft: 14,
		paddingRight: 16,
		paddingVertical: 9,
		borderRadius: 20,
	},
	bounds: { flexDirection: "row", justifyContent: "space-between" },
	bound: { flexDirection: "row", alignItems: "baseline", gap: 6 },
});
