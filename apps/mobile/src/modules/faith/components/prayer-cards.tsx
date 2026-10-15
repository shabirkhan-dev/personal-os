import type { ColorTokens } from "@personal-os/tokens";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { IconTile } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { GridRow, PrayerRow, RowState } from "../lib/faith-math";
import { hhmm, PRAYER_LABELS } from "../lib/prayer-times";

type Tone = keyof ColorTokens;

const PILLS: Record<RowState, { bg?: Tone; fg: Tone; icon?: IconName }> = {
	prayed: { bg: "statusSuccessSubtle", fg: "textSuccess", icon: "Line/Check" },
	late: { bg: "statusCautionSubtle", fg: "statusCaution" },
	missed: { fg: "textTertiary" },
	due: { bg: "bgInverse", fg: "textInverse" },
	next: { bg: "accentSubtle", fg: "accentDefault" },
	later: { fg: "textTertiary" },
};

/** "Today's prayers": the timeline with a status pill per prayer. Tap a row to log it. */
export function TodayPrayersCard({
	rows,
	prayed,
	onLog,
}: {
	rows: readonly PrayerRow[];
	prayed: number;
	onLog: (row: PrayerRow) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.head}>
				<PoText variant="title18" style={styles.flex}>
					Today's prayers
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{prayed} of {rows.length}
				</PoText>
			</View>
			<View>
				{rows.map((row, index) => (
					<PrayerTimelineRow
						key={row.prayer}
						row={row}
						last={index === rows.length - 1}
						onPress={() => onLog(row)}
					/>
				))}
			</View>
		</View>
	);
}

function PrayerTimelineRow({
	row,
	last,
	onPress,
}: {
	row: PrayerRow;
	last: boolean;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const done = row.state === "prayed" || row.state === "late";
	const next = row.state === "next";
	const dot = done
		? { backgroundColor: colors.statusSuccess }
		: next
			? { borderWidth: 2, borderColor: colors.accentDefault }
			: row.state === "missed" || row.state === "due"
				? { borderWidth: 1.5, borderColor: colors.textTertiary }
				: { backgroundColor: colors.borderDefault };
	const pill = PILLS[row.state];

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${row.label} at ${hhmm(row.at)}, ${row.pill}. ${row.note}`}
			accessibilityHint="Log this prayer"
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [styles.row, pressed ? { opacity: 0.7 } : null]}
		>
			<PoText
				variant="mono13"
				tone={next ? "accentDefault" : row.state === "later" ? "textTertiary" : "textSecondary"}
				style={styles.when}
			>
				{hhmm(row.at)}
			</PoText>
			<View style={styles.rail}>
				<View style={[styles.dot, dot]} />
				{last ? null : (
					<View
						style={[
							styles.line,
							{ backgroundColor: done ? colors.statusSuccess : colors.borderDefault },
						]}
					/>
				)}
			</View>
			<View style={[styles.rowText, last ? null : styles.rowGap]}>
				<PoText variant="row15" tone={row.state === "later" ? "textSecondary" : "textPrimary"}>
					{row.label}
				</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{row.note}
				</PoText>
			</View>
			<View style={[styles.pill, pill.bg ? { backgroundColor: colors[pill.bg] } : null]}>
				{pill.icon ? <Icon name={pill.icon} size={12} color={colors[pill.fg]} /> : null}
				<PoText variant="meta13" tone={pill.fg}>
					{row.pill}
				</PoText>
			</View>
		</Pressable>
	);
}

/** "Set up your prayers": location or typed times. */
export function SetupCard({
	busy,
	error,
	onLocation,
	onManual,
}: {
	/** "Finding where you are…" while locating. */
	busy: string | null;
	error: string | null;
	onLocation: () => void;
	onManual: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.setup,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<IconTile name="Moon" tone="statusSuccess" tile="statusSuccessSubtle" size={56} />
			<PoText variant="title18">Set up your prayers</PoText>
			<PoText variant="body15" tone="textSecondary" style={styles.center}>
				Takes ten seconds. I'll find the Fajr, Maghrib and Isha times for where you are and remind
				you gently before each one.
			</PoText>
			{error ? (
				<PoText variant="meta13" tone="textDanger" style={styles.center}>
					{error}
				</PoText>
			) : null}
			<PillButton
				label={busy ?? "Use my location"}
				disabled={busy !== null}
				accessory={busy ? <ActivityIndicator size="small" color={colors.textInverse} /> : undefined}
				onPress={onLocation}
				style={styles.full}
			/>
			<PillButton label="Set times myself" variant="ghost" onPress={onManual} style={styles.full} />
		</View>
	);
}

/** The violet "Never miss twice" card after a missed prayer. */
export function NeverMissCard({
	body,
	primary,
	secondary,
}: {
	body: string;
	primary: { label: string; onPress: () => void };
	secondary: { label: string; onPress: () => void };
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.eyebrow}>
				<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
				<PoText variant="eyebrow11" tone="textTertiary">
					Never miss twice
				</PoText>
			</View>
			<PoText variant="body15">{body}</PoText>
			<View style={styles.actions}>
				<PillButton label={primary.label} onPress={primary.onPress} style={styles.flex} />
				<PillButton label={secondary.label} variant="secondary" onPress={secondary.onPress} />
			</View>
		</View>
	);
}

export type Shortcut = { label: string; icon: IconName; tone: Tone; onPress: () => void };

/** Tasbih · Qibla · Zakat · Grow, as round buttons. */
export function Shortcuts({ items }: { items: readonly Shortcut[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.shortcuts}>
			{items.map((item) => (
				<Pressable
					key={item.label}
					accessibilityRole="button"
					accessibilityLabel={item.label}
					onPress={() => {
						haptics.tap();
						item.onPress();
					}}
					style={styles.shortcut}
				>
					{({ pressed }) => (
						<>
							<View
								style={[
									styles.shortcutCircle,
									{
										backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
										borderColor: colors.borderDefault,
									},
								]}
							>
								<Icon name={item.icon} color={colors[item.tone]} />
							</View>
							<PoText variant="meta13" tone="textSecondary">
								{item.label}
							</PoText>
						</>
					)}
				</Pressable>
			))}
		</View>
	);
}

/** "Prayer consistency": one row per prayer, one cell per day. */
export function ConsistencyCard({ grid }: { grid: readonly GridRow[] }) {
	const { colors } = usePoTheme();
	const cell = (state: GridRow["cells"][number]["state"]) =>
		state === "prayed"
			? { backgroundColor: colors.statusSuccess }
			: state === "late"
				? { borderWidth: 1, borderStyle: "dashed" as const, borderColor: colors.statusCaution }
				: { backgroundColor: colors.bgSubtle };
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
			accessibilityLabel={grid
				.map(
					(row) =>
						`${PRAYER_LABELS[row.prayer]}: ${row.cells.filter((c) => c.state === "prayed").length} on time`,
				)
				.join(", ")}
		>
			<View style={styles.consistencyHead}>
				<IconTile name="Moon" tone="textPrimary" tile="bgSubtle" />
				<PoText variant="row15" tone="textSecondary" style={styles.flex}>
					Prayer consistency
				</PoText>
				<View style={[styles.chip, { backgroundColor: colors.bgSubtle }]}>
					<PoText variant="meta13" tone="textSecondary">
						Last 10 days
					</PoText>
				</View>
			</View>
			<View style={styles.grid}>
				{grid.map((row) => (
					<View key={row.prayer} style={styles.gridRow}>
						{row.cells.map((item) => (
							<View key={item.day} style={[styles.cell, cell(item.state)]} />
						))}
					</View>
				))}
			</View>
			<View style={styles.legend}>
				<Legend label="Prayed" style={{ backgroundColor: colors.statusSuccess }} />
				<Legend label="Late" style={cell("late")} />
				<Legend label="Missed" style={{ backgroundColor: colors.bgSubtle }} />
			</View>
		</View>
	);
}

function Legend({ label, style }: { label: string; style: object }) {
	return (
		<View style={styles.legendItem}>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<View style={[styles.legendCell, style]} />
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	full: { alignSelf: "stretch" },
	center: { textAlign: "center" },
	card: { gap: 14, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center" },
	row: { flexDirection: "row", gap: 12 },
	when: { width: 44, paddingTop: 1 },
	rail: { width: 12, alignItems: "center", gap: 4, paddingTop: 5 },
	dot: { width: 10, height: 10, borderRadius: 5 },
	line: { flex: 1, width: 2, borderRadius: 1 },
	rowText: { flex: 1, gap: 2 },
	rowGap: { paddingBottom: 20 },
	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		height: 26,
		paddingHorizontal: 10,
		borderRadius: 8,
	},
	setup: { alignItems: "center", gap: 14, padding: 20, borderRadius: 28, borderWidth: 1 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	actions: { flexDirection: "row", gap: 8 },
	shortcuts: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
	shortcut: { alignItems: "center", gap: 8, width: 72 },
	shortcutCircle: {
		width: 60,
		height: 60,
		borderRadius: 30,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	consistencyHead: { flexDirection: "row", alignItems: "center", gap: 12 },
	chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
	grid: { gap: 8 },
	gridRow: { flexDirection: "row", gap: 6 },
	cell: { flex: 1, height: 18, borderRadius: 9 },
	legend: { flexDirection: "row", gap: 18 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	legendCell: { width: 26, height: 14, borderRadius: 7 },
});
