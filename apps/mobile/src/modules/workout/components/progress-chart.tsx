import { useState } from "react";
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

export type ChartBar = { key: string; value: number; label: string; detail: string };

const HEIGHT = 120;
const GAP = 2;
const MAX_BAR = 28;

/**
 * One series as thin bars on a shared baseline (single hue, no legend: the card title names it).
 * The latest and the best values are labelled; tapping a bar shows its value and date.
 */
export function BarChart({ bars, unit }: { bars: readonly ChartBar[]; unit: string }) {
	const { colors } = usePoTheme();
	const [width, setWidth] = useState(0);
	const [picked, setPicked] = useState<string | null>(null);
	const max = Math.max(1, ...bars.map((bar) => bar.value));
	const step = bars.length > 0 ? width / bars.length : 0;
	const barWidth = Math.max(4, Math.min(MAX_BAR, step - GAP * 2));
	const best = bars.reduce<ChartBar | null>(
		(top, bar) => (!top || bar.value > top.value ? bar : top),
		null,
	);
	const last = bars.at(-1);
	const shown = bars.find((bar) => bar.key === picked) ?? last;

	const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

	return (
		<View style={styles.root}>
			<View style={styles.readout}>
				<PoText variant="title30">
					{shown ? String(shown.value) : "–"}
					<PoText variant="row15" tone="textSecondary">{` ${unit}`}</PoText>
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{shown ? `${shown.detail}${best && shown.key === best.key ? " · best" : ""}` : ""}
				</PoText>
			</View>
			<View
				style={styles.plot}
				onLayout={onLayout}
				accessibilityRole="image"
				accessibilityLabel={`${bars.length} sessions, best ${best?.value ?? 0} ${unit}`}
			>
				{width > 0 ? (
					<Svg width={width} height={HEIGHT}>
						<Line
							x1={0}
							x2={width}
							y1={HEIGHT - 0.5}
							y2={HEIGHT - 0.5}
							stroke={colors.borderDefault}
							strokeWidth={1}
						/>
						{bars.map((bar, index) => {
							const height = Math.max(3, (bar.value / max) * (HEIGHT - 8));
							const x = index * step + (step - barWidth) / 2;
							const active = bar.key === (picked ?? last?.key);
							return (
								<Rect
									key={bar.key}
									x={x}
									y={HEIGHT - height}
									width={barWidth}
									height={height}
									rx={Math.min(4, barWidth / 2)}
									fill={active ? colors.accentDefault : colors.accentSubtle}
								/>
							);
						})}
					</Svg>
				) : null}
				<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
					<View style={styles.hits}>
						{bars.map((bar) => (
							<Pressable
								key={bar.key}
								accessibilityRole="button"
								accessibilityLabel={`${bar.value} ${unit}, ${bar.detail}`}
								onPress={() => {
									haptics.select();
									setPicked(bar.key === picked ? null : bar.key);
								}}
								style={styles.hit}
							/>
						))}
					</View>
				</View>
			</View>
			<View style={styles.axis}>
				<PoText variant="eyebrow11" tone="textTertiary">
					{bars[0]?.label ?? ""}
				</PoText>
				<PoText variant="eyebrow11" tone="textTertiary">
					{last?.label ?? ""}
				</PoText>
			</View>
		</View>
	);
}

/** Labelled horizontal bars (sets per pattern, minutes per activity), one hue, values in text ink. */
export function RowBars({
	rows,
}: {
	rows: readonly { label: string; value: number; text: string }[];
}) {
	const { colors } = usePoTheme();
	const max = Math.max(1, ...rows.map((row) => row.value));
	return (
		<View style={styles.rows}>
			{rows.map((row) => (
				<View
					key={row.label}
					style={styles.row}
					accessible
					accessibilityLabel={`${row.label}: ${row.text}`}
				>
					<PoText variant="meta13" style={styles.rowLabel} numberOfLines={1}>
						{row.label}
					</PoText>
					<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
						<View
							style={[
								styles.fill,
								{
									width: `${Math.max(4, (row.value / max) * 100)}%`,
									backgroundColor: colors.accentDefault,
								},
							]}
						/>
					</View>
					<PoText variant="mono13" tone="textSecondary" style={styles.rowValue}>
						{row.text}
					</PoText>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { gap: 8 },
	readout: { gap: 2 },
	plot: { height: HEIGHT, width: "100%" },
	hits: { flex: 1, flexDirection: "row" },
	hit: { flex: 1, height: "100%" },
	axis: { flexDirection: "row", justifyContent: "space-between" },
	rows: { gap: 10 },
	row: { flexDirection: "row", alignItems: "center", gap: 10 },
	rowLabel: { width: 96 },
	track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
	fill: { height: 8, borderRadius: 4 },
	rowValue: { minWidth: 52, textAlign: "right" },
});
