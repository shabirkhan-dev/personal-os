import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { type AgendaItem, MODULE_LABELS, type RightNow } from "../lib/daily-math";
import type { PlanModule } from "../lib/daily-model";

type Tone = keyof ColorTokens;

/** Each module's colour on Daily's timelines and tiles. */
export const MODULE_TONES: Record<PlanModule, Tone> = {
	faith: "statusSuccess",
	career: "accentDefault",
	food: "textWarning",
	workout: "statusDanger",
	skincare: "statusViolet",
	finance: "textSuccess",
	fashion: "textTertiary",
	"daily-life": "textPrimary",
};

export function Card({ children, tone }: { children: ReactNode; tone?: "accent" | "success" }) {
	const { colors } = usePoTheme();
	const style =
		tone === "accent"
			? { backgroundColor: colors.accentSubtle }
			: tone === "success"
				? { backgroundColor: colors.statusSuccessSubtle }
				: { backgroundColor: colors.bgSurface };
	return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHead({
	title,
	right,
	rightTone = "textSecondary",
}: {
	title: string;
	right?: string;
	rightTone?: Tone;
}) {
	return (
		<View style={styles.head}>
			<PoText variant="title18" style={styles.flex}>
				{title}
			</PoText>
			{right ? (
				<PoText variant="mono13" tone={rightTone}>
					{right}
				</PoText>
			) : null}
		</View>
	);
}

/** What's on now, or next: one compact row with the time, the block and Start or Later. */
export function UpNextCard({
	now,
	detail,
	onStart,
	onLater,
}: {
	now: RightNow;
	detail: string;
	onStart: () => void;
	onLater: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Card tone="accent">
			<View style={styles.upNext}>
				<View style={styles.upTime}>
					<PoText variant="meta13" tone="accentDefault">
						{now.state === "now" ? "Now" : "Next"}
					</PoText>
					<PoText variant="title18">{clockOf(now.item.minutes)}</PoText>
				</View>
				<View style={[styles.bar, { backgroundColor: colors[MODULE_TONES[now.item.module]] }]} />
				<View style={styles.flex}>
					<PoText variant="row15" numberOfLines={1}>
						{now.item.title}
					</PoText>
					<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
						{detail || MODULE_LABELS[now.item.module]}
					</PoText>
				</View>
			</View>
			<View style={styles.row}>
				<SmallButton label={now.state === "now" ? "Start" : "Open"} primary onPress={onStart} />
				<SmallButton label="Later" onPress={onLater} />
				{now.next ? (
					<PoText variant="meta13" tone="textTertiary" numberOfLines={1} style={styles.flex}>
						{`Then ${now.next.title} at ${clockOf(now.next.minutes)}`}
					</PoText>
				) : null}
			</View>
		</Card>
	);
}

function SmallButton({
	label,
	primary = false,
	onPress,
}: {
	label: string;
	primary?: boolean;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [
				styles.small,
				{
					backgroundColor: primary ? colors.bgInverse : colors.bgSurface,
					opacity: pressed ? 0.8 : 1,
				},
			]}
		>
			<PoText variant="text14Medium" tone={primary ? "textInverse" : "textPrimary"}>
				{label}
			</PoText>
		</Pressable>
	);
}

export type StatTile = { label: string; value: string; tone?: Tone; onPress?: () => void };

/** A row of small numbers: minimum day, streak, money left. */
export function StatTiles({ tiles }: { tiles: readonly StatTile[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.stats}>
			{tiles.map((tile) => (
				<Pressable
					key={tile.label}
					accessibilityRole={tile.onPress ? "button" : undefined}
					accessibilityLabel={`${tile.label}, ${tile.value}`}
					disabled={!tile.onPress}
					onPress={() => {
						haptics.tap();
						tile.onPress?.();
					}}
					style={({ pressed }) => [
						styles.stat,
						{ backgroundColor: pressed ? colors.bgHover : colors.bgSurface },
					]}
				>
					<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
						{tile.label}
					</PoText>
					<PoText
						variant="title18"
						tone={tile.tone ?? "textPrimary"}
						numberOfLines={1}
						adjustsFontSizeToFit
					>
						{tile.value}
					</PoText>
				</Pressable>
			))}
		</View>
	);
}

/** One timeline row: time, a coloured bar, title and module. */
export function AgendaRow({
	item,
	past = false,
	time,
	onPress,
}: {
	item: AgendaItem;
	past?: boolean;
	/** In place of the clock time ("All day"). */
	time?: string;
	onPress?: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			disabled={!onPress}
			onPress={onPress}
			style={({ pressed }) => [styles.agenda, pressed && onPress ? { opacity: 0.7 } : null]}
		>
			<PoText variant="mono13" tone="textTertiary" style={styles.time}>
				{time ?? clockOf(item.minutes)}
			</PoText>
			<View
				style={[
					styles.bar,
					{
						backgroundColor: colors[MODULE_TONES[item.module]],
						opacity: past || item.done ? 0.4 : 1,
					},
				]}
			/>
			<View style={styles.flex}>
				<PoText variant="row15" tone={item.done ? "textSecondary" : "textPrimary"}>
					{item.title}
				</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{item.detail || MODULE_LABELS[item.module]}
				</PoText>
			</View>
			{item.done ? <Icon name="Line/Check" size={16} color={colors.statusSuccess} /> : null}
		</Pressable>
	);
}

/** The "Now 14:20" line between what is over and what is ahead on the Today timeline. */
export function NowLine({ minutes }: { minutes: number }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={styles.now}
			accessibilityRole="text"
			accessibilityLabel={`Now, ${clockOf(minutes)}`}
		>
			<PoText variant="mono13" tone="accentDefault" style={styles.time}>
				{clockOf(minutes)}
			</PoText>
			<View style={[styles.nowDot, { backgroundColor: colors.accentDefault }]} />
			<View style={[styles.nowRule, { backgroundColor: colors.accentDefault }]} />
		</View>
	);
}

/** A tickable row with a coloured dot and a value: the close-the-day list. */
export function CheckRow({
	label,
	value,
	done,
	tone,
	valueTone,
	onPress,
}: {
	label: string;
	value: string;
	done: boolean;
	tone: Tone;
	valueTone?: Tone;
	onPress?: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="checkbox"
			accessibilityState={{ checked: done, disabled: !onPress }}
			disabled={!onPress}
			onPress={() => {
				haptics.select();
				onPress?.();
			}}
			style={styles.check}
		>
			<Checkbox checked={done} />
			<View style={[styles.dot, { backgroundColor: colors[tone] }]} />
			<PoText variant="row15" style={styles.flex}>
				{label}
			</PoText>
			<PoText variant="mono13" tone={valueTone ?? (done ? "textSecondary" : "textWarning")}>
				{value}
			</PoText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	upNext: { flexDirection: "row", alignItems: "center", gap: 12 },
	upTime: { width: 52 },
	small: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: "center" },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 12, borderRadius: 16 },
	chip: {
		flexBasis: "48%",
		flexGrow: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderRadius: 14,
		overflow: "hidden",
	},
	chipBar: { position: "absolute", left: 0, bottom: 0, height: 2 },
	smallDot: { width: 6, height: 6, borderRadius: 3 },
	row: { flexDirection: "row", gap: 12, alignItems: "center" },
	agenda: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	time: { width: 52 },
	now: { flexDirection: "row", alignItems: "center", gap: 0, paddingVertical: 4 },
	nowDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 12 },
	nowRule: { flex: 1, height: 1.5 },
	bar: { width: 3, height: 32, borderRadius: 2 },
	check: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});
