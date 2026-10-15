import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

/** Small building blocks the Career screens share, matched to the Figma Career frames. */

type Tone = keyof ColorTokens;

/** Mono uppercase label above a section: "INTERVIEW · 2". */
export function SectionLabel({ children }: { children: string }) {
	return (
		<View style={styles.sectionLabel}>
			<PoText variant="eyebrow11" tone="textTertiary">
				{children}
			</PoText>
		</View>
	);
}

/** Surface card holding list rows (radius 28, 16 side padding). */
export function ListCard({
	children,
	title,
	right,
}: {
	children: ReactNode;
	title?: string;
	right?: ReactNode;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.listCard,
				title ? styles.listCardTitled : null,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			{title ? (
				<View style={styles.cardHead}>
					<PoText variant="title18" style={styles.flex}>
						{title}
					</PoText>
					{right}
				</View>
			) : null}
			{children}
		</View>
	);
}

/** "3 due ›" / "All ›" on a card head. */
export function HeadLink({ label, onPress }: { label: string; onPress?: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			disabled={!onPress}
			hitSlop={10}
			onPress={onPress}
			style={styles.headLink}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			{onPress ? <Icon name="Line/Chevron right" size={14} color={colors.textSecondary} /> : null}
		</Pressable>
	);
}

export type ListRowProps = {
	title: string;
	subtitle?: string;
	/** Short value on the right: "Applied", "Thu", "Nudge". */
	value?: string;
	valueTone?: Tone;
	/** A round tinted icon on the left. */
	icon?: { name: IconName; tone: Tone; tile: Tone };
	/** A white pill button on the right instead of `value`. */
	action?: { label: string; onPress: () => void };
	chevron?: boolean;
	last?: boolean;
	dimmed?: boolean;
	onPress?: () => void;
	leading?: ReactNode;
};

/** Kit v2 "List Row": 12–14px padding, hairline between rows, no box of its own. */
export function ListRow({
	title,
	subtitle,
	value,
	valueTone = "textTertiary",
	icon,
	action,
	chevron = false,
	last = false,
	dimmed = false,
	onPress,
	leading,
}: ListRowProps) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			disabled={!onPress}
			onPress={
				onPress
					? () => {
							haptics.tap();
							onPress();
						}
					: undefined
			}
			style={({ pressed }) => [
				styles.row,
				icon ? styles.rowWithIcon : null,
				!last && { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
				pressed && onPress ? { opacity: 0.7 } : null,
			]}
		>
			{leading}
			{icon ? <IconTile name={icon.name} tone={icon.tone} tile={icon.tile} /> : null}
			<View style={styles.rowText}>
				<PoText variant="row15" tone={dimmed ? "textSecondary" : "textPrimary"} numberOfLines={1}>
					{title}
				</PoText>
				{subtitle ? (
					<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
						{subtitle}
					</PoText>
				) : null}
			</View>
			{action ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => {
						haptics.tap();
						action.onPress();
					}}
					style={[styles.rowAction, { backgroundColor: colors.bgInverse }]}
				>
					<PoText variant="meta13" tone="textInverse">
						{action.label}
					</PoText>
				</Pressable>
			) : value ? (
				<PoText
					variant={icon ? "row15" : "meta13"}
					tone={icon && valueTone === "textTertiary" ? "textPrimary" : valueTone}
				>
					{value}
				</PoText>
			) : null}
			{chevron ? <Icon name="Line/Chevron right" size={16} color={colors.textTertiary} /> : null}
		</Pressable>
	);
}

/** 40px round tile with a 20px glyph. */
export function IconTile({
	name,
	tone,
	tile,
	size = 40,
}: {
	name: IconName;
	tone: Tone;
	tile: Tone;
	size?: number;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.tile,
				{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[tile] },
			]}
		>
			<Icon name={name} size={size >= 56 ? 24 : 20} color={colors[tone]} />
		</View>
	);
}

/** Rounded chip under a title: "Rs 450–550k", "Applied 8 Oct". */
export function MetaChip({
	icon,
	label,
	iconTone = "textSecondary",
	onPress,
}: {
	icon: IconName;
	label: string;
	iconTone?: Tone;
	onPress?: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			disabled={!onPress}
			onPress={onPress}
			style={[styles.chip, { backgroundColor: colors.bgSurface }]}
		>
			<Icon name={icon} size={14} color={colors[iconTone]} />
			<PoText variant="meta13">{label}</PoText>
		</Pressable>
	);
}

export type TimelineState = "done" | "next" | "later";

/** Kit v2 "Timeline Row": date column, rail with a dot, title and note. */
export function TimelineRow({
	when,
	title,
	note,
	state,
	last = false,
	onPress,
}: {
	when: string;
	title: string;
	note: string;
	state: TimelineState;
	last?: boolean;
	onPress?: () => void;
}) {
	const { colors } = usePoTheme();
	const dot =
		state === "done"
			? { backgroundColor: colors.statusSuccess }
			: state === "next"
				? { borderWidth: 2, borderColor: colors.textPrimary }
				: { backgroundColor: colors.borderDefault };
	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			disabled={!onPress}
			onPress={onPress}
			style={styles.timelineRow}
		>
			<PoText
				variant="mono13"
				tone={state === "later" ? "textTertiary" : "textSecondary"}
				style={styles.when}
			>
				{when}
			</PoText>
			<View style={styles.rail}>
				<View style={[styles.dot, dot]} />
				{last ? null : (
					<View
						style={[
							styles.line,
							{ backgroundColor: state === "done" ? colors.statusSuccess : colors.borderDefault },
						]}
					/>
				)}
			</View>
			<View style={styles.timelineText}>
				<PoText variant="row15" tone={state === "later" ? "textSecondary" : "textPrimary"}>
					{title}
				</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{note}
				</PoText>
			</View>
		</Pressable>
	);
}

/** The violet sparkle card with one line of guidance. */
export function AiTip({ children }: { children: ReactNode }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[styles.tip, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}
		>
			<View style={[styles.tipIcon, { backgroundColor: colors.statusVioletSubtle }]}>
				<Icon name="Filled/Sparkle" size={16} color={colors.statusViolet} />
			</View>
			<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
				{children}
			</PoText>
		</View>
	);
}

/** Equal segments for "3 of 5" progress. */
export function Segments({
	total,
	done,
	current,
	doneTone = "accentDefault",
}: {
	total: number;
	done: number;
	current?: number;
	doneTone?: Tone;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.segments}>
			{Array.from({ length: total }, (_, index) => (
				<View
					// Segments have no identity beyond their position.
					// oxlint-disable-next-line react/no-array-index-key
					key={index}
					style={[
						styles.segment,
						{
							backgroundColor:
								index < done
									? colors[doneTone]
									: index === current
										? colors.accentDefault
										: colors.borderDefault,
						},
					]}
				/>
			))}
		</View>
	);
}

/** A thin progress bar with a filled share. */
export function ProgressBar({ share, tone }: { share: number; tone: Tone }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.bar, { backgroundColor: colors.bgSubtle }]}>
			<View
				style={[
					styles.barFill,
					{
						width: `${Math.round(Math.min(1, Math.max(0, share)) * 100)}%`,
						backgroundColor: colors[tone],
					},
				]}
			/>
		</View>
	);
}

/** Centered icon, title and body for empty states. */
export function EmptyCard({
	icon,
	title,
	body,
	children,
}: {
	icon: IconName;
	title: string;
	body: string;
	children?: ReactNode;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.empty,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<IconTile name={icon} tone="accentDefault" tile="accentSubtle" size={56} />
			<PoText variant="title18">{title}</PoText>
			<PoText variant="body15" tone="textSecondary" style={styles.center}>
				{body}
			</PoText>
			{children ? <View style={styles.emptyActions}>{children}</View> : null}
		</View>
	);
}

/** Selectable chip used for stage filters and tones. */
export function FilterChip({
	label,
	selected,
	onPress,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="radio"
			accessibilityState={{ selected }}
			onPress={() => {
				haptics.select();
				onPress();
			}}
			style={[
				styles.filter,
				selected
					? { backgroundColor: colors.accentDefault, borderColor: colors.accentDefault }
					: { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="meta13" tone={selected ? "textOnAccent" : "textSecondary"}>
				{label}
			</PoText>
		</Pressable>
	);
}

/** Inner screen title block: eyebrow, 30px title, optional chips. */
export function ScreenTitle({
	eyebrow,
	title,
	children,
}: {
	eyebrow: string;
	title: string;
	children?: ReactNode;
}) {
	return (
		<View style={styles.title}>
			<PoText variant="eyebrow11" tone="textTertiary">
				{eyebrow}
			</PoText>
			<PoText variant="title30" accessibilityRole="header">
				{title}
			</PoText>
			{children ? <View style={styles.chips}>{children}</View> : null}
		</View>
	);
}

/** Two pill buttons side by side at the bottom of a screen or sheet. */
export function Footer({ children }: { children: ReactNode }) {
	return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	center: { textAlign: "center" },
	sectionLabel: { paddingLeft: 6, paddingTop: 6 },
	listCard: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 2 },
	listCardTitled: { paddingTop: 16, paddingBottom: 4, gap: 4 },
	cardHead: { flexDirection: "row", alignItems: "center" },
	headLink: { flexDirection: "row", alignItems: "center", gap: 2 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
	rowWithIcon: { paddingVertical: 12 },
	rowText: { flex: 1, gap: 2 },
	rowAction: { height: 36, borderRadius: 18, paddingHorizontal: 14, justifyContent: "center" },
	tile: { alignItems: "center", justifyContent: "center" },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingLeft: 10,
		paddingRight: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	timelineRow: { flexDirection: "row", gap: 12 },
	when: { width: 44, height: 22 },
	rail: { width: 12, alignItems: "center", gap: 4, paddingTop: 6 },
	dot: { width: 10, height: 10, borderRadius: 5 },
	line: { flex: 1, width: 2, borderRadius: 1 },
	timelineText: { flex: 1, gap: 2, paddingBottom: 20 },
	tip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 8,
		paddingRight: 16,
		paddingVertical: 8,
		borderRadius: 28,
		borderWidth: 1,
	},
	tipIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	segments: { flexDirection: "row", gap: 4 },
	segment: { flex: 1, height: 4, borderRadius: 2 },
	bar: { height: 6, borderRadius: 3, overflow: "hidden" },
	barFill: { height: 6, borderRadius: 3 },
	empty: {
		alignItems: "center",
		gap: 12,
		paddingTop: 28,
		paddingBottom: 20,
		paddingHorizontal: 20,
		borderRadius: 28,
		borderWidth: 1,
	},
	emptyActions: { alignSelf: "stretch", gap: 8, paddingTop: 6 },
	filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
	title: { gap: 10, paddingHorizontal: 4 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	footer: { flexDirection: "row", gap: 10 },
});
