import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Icon } from "@/components/icons";
import { ProgressBar } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import {
	type AgendaItem,
	MODULE_LABELS,
	type MinimumState,
	type RightNow,
} from "../lib/daily-math";
import type { MinimumId, PlanModule } from "../lib/daily-model";

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
			? { backgroundColor: colors.bgSurface, borderColor: colors.accentDefault }
			: tone === "success"
				? { backgroundColor: colors.statusSuccessSubtle, borderColor: colors.statusSuccessSubtle }
				: { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault };
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

/** "NOW · 15:00 · CAREER": the block happening now, with Start focus and Later. */
export function RightNowCard({
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
	const tone = MODULE_TONES[now.item.module];
	return (
		<Card tone="accent">
			<View style={styles.eyebrow}>
				<View style={[styles.dot, { backgroundColor: colors[tone] }]} />
				<PoText variant="eyebrow11" tone="accentDefault">
					{`${now.state === "now" ? "Now" : "Next"} · ${clockOf(now.item.minutes)} · ${MODULE_LABELS[now.item.module]}`}
				</PoText>
			</View>
			<PoText variant="title30">{now.item.title}</PoText>
			<PoText variant="meta13" tone="textSecondary">
				{detail}
			</PoText>
			<View style={styles.row}>
				<PillButton
					label={now.state === "now" ? "Start focus" : "Open"}
					variant="secondary"
					style={styles.flex}
					onPress={onStart}
				/>
				<PillButton label="Later" variant="ghost" onPress={onLater} />
			</View>
			{now.next ? (
				<View style={styles.eyebrow}>
					<View
						style={[styles.smallDot, { backgroundColor: colors[MODULE_TONES[now.next.module]] }]}
					/>
					<PoText variant="meta13" tone="textSecondary">
						{`Next · ${now.next.title} at ${clockOf(now.next.minutes)}`}
					</PoText>
				</View>
			) : null}
		</Card>
	);
}

function Ring({ share, tone, children }: { share: number; tone: Tone; children: ReactNode }) {
	const { colors } = usePoTheme();
	const size = 44;
	const width = 3;
	const radius = (size - width) / 2;
	const length = 2 * Math.PI * radius;
	const filled = Math.min(1, Math.max(0, share));
	return (
		<View style={styles.ring}>
			<Svg width={size} height={size} style={StyleSheet.absoluteFill}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={colors.borderDefault}
					strokeWidth={width}
					fill="none"
				/>
				{filled > 0 ? (
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke={colors[tone]}
						strokeWidth={width}
						strokeLinecap="round"
						fill="none"
						strokeDasharray={`${length * filled} ${length}`}
						transform={`rotate(-90 ${size / 2} ${size / 2})`}
					/>
				) : null}
			</Svg>
			{children}
		</View>
	);
}

export type MinimumRing = { id: MinimumId; label: string; module: PlanModule; state: MinimumState };

/** The minimum day as rings: Pray 2/3, Apply 1/2, Protein 96g, Train 18:30, Skin AM ✓. */
export function MinimumCard({
	rings,
	streak,
	onPress,
	onRing,
}: {
	rings: readonly MinimumRing[];
	streak: number;
	onPress: () => void;
	onRing: (ring: MinimumRing) => void;
}) {
	return (
		<Card>
			<Pressable accessibilityRole="button" onPress={onPress}>
				<CardHead
					title="Minimum day"
					right={streak > 0 ? `⚡ ${streak}-day streak` : "start today"}
					rightTone="textWarning"
				/>
			</Pressable>
			<View style={styles.rings}>
				{rings.map((ring) => (
					<Pressable
						key={ring.id}
						accessibilityRole="button"
						accessibilityLabel={`${ring.label}, ${ring.state.done ? "done" : ring.state.value}`}
						onPress={() => {
							haptics.tap();
							onRing(ring);
						}}
						style={styles.ringItem}
					>
						<Ring
							share={ring.state.done ? 1 : ring.state.share}
							tone={
								MODULE_TONES[ring.module] === "textPrimary"
									? "accentDefault"
									: MODULE_TONES[ring.module]
							}
						>
							<PoText
								variant="mono13"
								tone={ring.state.done ? "textSuccess" : "textPrimary"}
								style={styles.ringText}
							>
								{ring.state.value}
							</PoText>
						</Ring>
						<PoText variant="meta13" tone="textSecondary">
							{ring.label}
						</PoText>
					</Pressable>
				))}
			</View>
		</Card>
	);
}

export type ModuleTile = {
	id: string;
	label: string;
	status: string;
	share: number;
	tone: Tone;
	onPress: () => void;
};

/** "Your modules today": two columns of tiles with a line and a bar each. */
export function ModuleTiles({ tiles }: { tiles: readonly ModuleTile[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.section}>
			<View style={styles.sectionHead}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Your modules today
				</PoText>
				<PoText variant="mono13" tone="textTertiary">
					{String(tiles.length)}
				</PoText>
			</View>
			<View style={styles.tiles}>
				{tiles.map((tile) => (
					<Pressable
						key={tile.id}
						accessibilityRole="button"
						accessibilityLabel={`${tile.label}, ${tile.status}`}
						onPress={() => {
							haptics.tap();
							tile.onPress();
						}}
						style={({ pressed }) => [
							styles.tile,
							{
								backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
								borderColor: colors.borderDefault,
							},
						]}
					>
						<View style={styles.tileHead}>
							<View style={[styles.dot, { backgroundColor: colors[tile.tone] }]} />
							<PoText variant="row15" style={styles.flex} numberOfLines={1}>
								{tile.label}
							</PoText>
							<Icon name="Line/Chevron right" size={14} color={colors.textTertiary} />
						</View>
						<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
							{tile.status}
						</PoText>
						<View style={styles.tileBar}>
							<ProgressBar share={tile.share} tone={tile.tone} />
						</View>
					</Pressable>
				))}
			</View>
		</View>
	);
}

/** One timeline row: time, a coloured bar, title and module. */
export function AgendaRow({
	item,
	past = false,
	onPress,
}: {
	item: AgendaItem;
	past?: boolean;
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
				{clockOf(item.minutes)}
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
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1.5 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	smallDot: { width: 6, height: 6, borderRadius: 3 },
	row: { flexDirection: "row", gap: 10, alignItems: "center" },
	rings: { flexDirection: "row", justifyContent: "space-between" },
	ringItem: { alignItems: "center", gap: 6, minWidth: 56 },
	ring: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
	ringText: { fontSize: 11 },
	section: { gap: 10 },
	sectionHead: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 },
	tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tile: { width: "48.8%", gap: 8, padding: 14, borderRadius: 22, borderWidth: 1 },
	tileHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	tileBar: { width: "55%" },
	agenda: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	time: { width: 44 },
	bar: { width: 3, height: 32, borderRadius: 2 },
	check: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
});
