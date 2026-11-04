import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
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
			? { backgroundColor: colors.accentSubtle, borderColor: colors.accentSubtle }
			: tone === "success"
				? { backgroundColor: colors.statusSuccessSubtle, borderColor: colors.statusSuccessSubtle }
				: { backgroundColor: colors.bgSurface, borderColor: colors.bgSurface };
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

export type MinimumRing = { id: MinimumId; label: string; module: PlanModule; state: MinimumState };

/** The minimum day as compact chips: Pray 2/3, Apply 1/2, Protein 96g, Train 18:30, Skin ✓. */
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
	const { colors } = usePoTheme();
	return (
		<Card>
			<Pressable accessibilityRole="button" onPress={onPress}>
				<CardHead
					title="Minimum day"
					right={streak > 0 ? `⚡ ${streak}-day streak` : "start today"}
					rightTone="textWarning"
				/>
			</Pressable>
			<View style={styles.chips}>
				{rings.map((ring) => {
					const tone =
						MODULE_TONES[ring.module] === "textPrimary"
							? "accentDefault"
							: MODULE_TONES[ring.module];
					const share = ring.state.done ? 1 : Math.min(1, Math.max(0, ring.state.share));
					return (
						<Pressable
							key={ring.id}
							accessibilityRole="button"
							accessibilityLabel={`${ring.label}, ${ring.state.done ? "done" : ring.state.value}`}
							onPress={() => {
								haptics.tap();
								onRing(ring);
							}}
							style={({ pressed }) => [
								styles.chip,
								{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
							]}
						>
							{ring.state.done ? (
								<Icon name="Line/Check" size={14} color={colors.statusSuccess} />
							) : (
								<View style={[styles.dot, { backgroundColor: colors[tone] }]} />
							)}
							<PoText
								variant="text14Medium"
								tone={ring.state.done ? "textSecondary" : "textPrimary"}
								numberOfLines={1}
								style={styles.flex}
							>
								{ring.label}
							</PoText>
							<PoText variant="mono13" tone={ring.state.done ? "textSuccess" : "textTertiary"}>
								{ring.state.done ? "done" : ring.state.value}
							</PoText>
							<View
								style={[
									styles.chipBar,
									{ width: `${share * 100}%`, backgroundColor: colors[tone] },
								]}
							/>
						</Pressable>
					);
				})}
			</View>
		</Card>
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
	card: { gap: 12, padding: 16, borderRadius: 20, borderWidth: 1.5 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: {
		flexBasis: "48%",
		flexGrow: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 14,
		overflow: "hidden",
	},
	chipBar: { position: "absolute", left: 0, bottom: 0, height: 2 },
	smallDot: { width: 6, height: 6, borderRadius: 3 },
	row: { flexDirection: "row", gap: 10, alignItems: "center" },
	agenda: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	time: { width: 52 },
	now: { flexDirection: "row", alignItems: "center", gap: 0, paddingVertical: 4 },
	nowDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 10 },
	nowRule: { flex: 1, height: 1.5 },
	bar: { width: 3, height: 32, borderRadius: 2 },
	check: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
});
