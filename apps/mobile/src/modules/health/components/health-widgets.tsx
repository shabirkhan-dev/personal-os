import type { ColorTokens } from "@personal-os/tokens";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { photoSource } from "@/lib/photos/local-photo";
import { usePoTheme } from "@/theme";

type Tone = keyof ColorTokens;

/** A thin bar filled to `value` (0–1); a plain line, no rings. */
export function ProgressBar({ value, tone = "accentDefault" }: { value: number; tone?: Tone }) {
	const { colors } = usePoTheme();
	const width = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
	return (
		<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
			<View style={[styles.fill, { width, backgroundColor: colors[tone] }]} />
		</View>
	);
}

/** Seven small bars, one per day, oldest first; a day without a value is a short stub. */
export function TrendBars({
	values,
	tone = "accentDefault",
	height = 24,
}: {
	values: readonly (number | null)[];
	tone?: Tone;
	height?: number;
}) {
	const { colors } = usePoTheme();
	const known = values.filter((value): value is number => value !== null);
	if (known.length < 2) return null;
	const low = Math.min(...known);
	const high = Math.max(...known);
	const span = high - low || 1;
	return (
		<View style={[styles.bars, { height }]} accessibilityElementsHidden>
			{values.map((value, index) => (
				<View
					// oxlint-disable-next-line react/no-array-index-key -- a fixed run of days
					key={index}
					style={[
						styles.bar,
						{
							height: value === null ? 3 : 6 + ((value - low) / span) * (height - 6),
							backgroundColor: value === null ? colors.bgSubtle : colors[tone],
							opacity: value === null || index === values.length - 1 ? 1 : 0.4,
						},
					]}
				/>
			))}
		</View>
	);
}

export type TodayStat = {
	label: string;
	icon: IconName;
	value: string | null;
	detail: string;
	/** Share of the goal, when there is one. */
	progress: number | null;
	onPress: () => void;
};

/** Today in three numbers: last night's sleep, steps so far, heart rate. */
export function TodayStrip({ stats }: { stats: readonly TodayStat[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.strip, { backgroundColor: colors.bgSurface }]}>
			{stats.map((stat, index) => (
				<Pressable
					key={stat.label}
					accessibilityRole="button"
					accessibilityLabel={`${stat.label}, ${stat.value ?? "none yet"}`}
					onPress={() => {
						haptics.tap();
						stat.onPress();
					}}
					style={({ pressed }) => [
						styles.stat,
						index > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.borderDefault } : null,
						pressed ? { opacity: 0.7 } : null,
					]}
				>
					<View style={styles.statHead}>
						<Icon name={stat.icon} size={14} color={colors.textTertiary} />
						<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
							{stat.label}
						</PoText>
					</View>
					<PoText
						variant="title18"
						numberOfLines={1}
						tone={stat.value ? "textPrimary" : "textTertiary"}
					>
						{stat.value ?? "–"}
					</PoText>
					{stat.progress !== null ? (
						<ProgressBar
							value={stat.progress}
							tone={stat.progress >= 1 ? "statusSuccess" : "accentDefault"}
						/>
					) : null}
					<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
						{stat.detail}
					</PoText>
				</Pressable>
			))}
		</View>
	);
}

export type Shortcut = { label: string; detail: string; icon: IconName; onPress: () => void };

/** Health's sections as a grid of small widgets, each with its own one-line status. */
export function ShortcutGrid({ items }: { items: readonly Shortcut[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.grid}>
			{items.map((item) => (
				<Pressable
					key={item.label}
					accessibilityRole="button"
					accessibilityLabel={`${item.label}, ${item.detail}`}
					onPress={() => {
						haptics.tap();
						item.onPress();
					}}
					style={({ pressed }) => [
						styles.shortcut,
						{ backgroundColor: pressed ? colors.bgHover : colors.bgSurface },
					]}
				>
					<View style={[styles.badge, { backgroundColor: colors.bgSubtle }]}>
						<Icon name={item.icon} size={16} color={colors.textSecondary} />
					</View>
					<PoText variant="text14Medium" numberOfLines={1}>
						{item.label}
					</PoText>
					<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
						{item.detail}
					</PoText>
				</Pressable>
			))}
		</View>
	);
}

/** A Health photo, or a plain glyph when there's none. */
export function PhotoThumb({
	uri,
	size,
	icon,
	tall = false,
}: {
	uri: string | null;
	size: number;
	icon: IconName;
	/** A paper's shape (3:4) instead of a square. */
	tall?: boolean;
}) {
	const { colors } = usePoTheme();
	const box = {
		width: size,
		height: tall ? Math.round((size * 4) / 3) : size,
		borderRadius: size >= 64 ? 16 : 12,
		backgroundColor: colors.bgSubtle,
	};
	if (!uri) {
		return (
			<View style={[styles.empty, box]}>
				<Icon name={icon} size={Math.min(24, size / 2)} color={colors.textTertiary} />
			</View>
		);
	}
	return (
		<Image
			source={{ uri: photoSource(uri) }}
			resizeMode="cover"
			style={box}
			accessibilityIgnoresInvertColors
		/>
	);
}

const styles = StyleSheet.create({
	empty: { alignItems: "center", justifyContent: "center" },
	track: { height: 4, borderRadius: 2, overflow: "hidden" },
	fill: { height: 4, borderRadius: 2 },
	bars: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
	bar: { flex: 1, borderRadius: 2 },
	strip: { flexDirection: "row", borderRadius: 20, paddingVertical: 12 },
	stat: { flex: 1, gap: 6, paddingHorizontal: 12 },
	statHead: { flexDirection: "row", alignItems: "center", gap: 6 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	shortcut: { flexBasis: "31%", flexGrow: 1, gap: 4, padding: 12, borderRadius: 16 },
	badge: {
		width: 32,
		height: 32,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
});
