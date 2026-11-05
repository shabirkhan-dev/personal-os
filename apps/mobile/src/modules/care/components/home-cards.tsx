import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { FilterChip, ProgressBar, Segments } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { Supply, WeekCell } from "../lib/care-math";
import type { Product, Step } from "../lib/care-model";
import { ProductImage } from "./product-image";

type Tone = keyof ColorTokens;

export function Card({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: accent ? colors.accentSubtle : colors.bgSurface,
				},
			]}
		>
			{children}
		</View>
	);
}

export function CardHead({ title, right }: { title: string; right?: string }) {
	return (
		<View style={styles.head}>
			<PoText variant="title18" style={styles.flex}>
				{title}
			</PoText>
			{right ? (
				<PoText variant="mono13" tone="textSecondary">
					{right}
				</PoText>
			) : null}
		</View>
	);
}

/** A tinted one-line banner: the UV warning, the sensitive-skin rule, "Reorder this week". */
export function Banner({
	tone,
	eyebrow,
	icon,
	children,
}: {
	tone: "caution" | "accent";
	eyebrow?: string;
	icon?: "Sun";
	children: ReactNode;
}) {
	const { colors } = usePoTheme();
	const bg = tone === "caution" ? colors.statusCautionSubtle : colors.accentSubtle;
	const fg: Tone = tone === "caution" ? "textWarning" : "accentDefault";
	return (
		<View style={[styles.banner, { backgroundColor: bg }]}>
			{icon ? <Icon name={icon} size={18} color={colors[fg]} /> : null}
			<View style={styles.flex}>
				{eyebrow ? (
					<PoText variant="eyebrow11" tone={fg}>
						{eyebrow}
					</PoText>
				) : null}
				<PoText variant={eyebrow ? "row15" : "meta13"}>{children}</PoText>
			</View>
		</View>
	);
}

/** One step with its tick: name, detail, and the time it was done or NEXT. */
export function StepRow({
	step,
	doneAt,
	next,
	product,
	onPress,
	onLongPress,
	onInfo,
	last = false,
}: {
	step: Step;
	doneAt: string | null;
	next: boolean;
	product?: Product | null;
	onPress: () => void;
	onLongPress?: () => void;
	/** Shows the step's photos and how to apply it. */
	onInfo?: () => void;
	last?: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="checkbox"
			accessibilityState={{ checked: doneAt !== null }}
			accessibilityHint={onLongPress ? "Long press to edit" : undefined}
			onPress={() => {
				haptics.select();
				onPress();
			}}
			onLongPress={onLongPress}
			style={({ pressed }) => [
				styles.step,
				!last && { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
				pressed ? { opacity: 0.7 } : null,
			]}
		>
			<Checkbox checked={doneAt !== null} />
			{product !== undefined || step.photos[0] ? (
				<ProductImage photo={step.photos[0] ?? product?.photo ?? null} size={44} radius={12} />
			) : null}
			<View style={styles.flex}>
				<PoText variant="row15" tone={doneAt ? "textSecondary" : "textPrimary"}>
					{step.name}
				</PoText>
				{step.detail ? (
					<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
						{step.detail}
					</PoText>
				) : null}
			</View>
			{doneAt ? (
				<PoText variant="mono13" tone="textTertiary">
					{clock(new Date(doneAt))}
				</PoText>
			) : next ? (
				<View style={[styles.next, { backgroundColor: colors.bgSubtle }]}>
					<PoText variant="eyebrow11" tone="textSecondary">
						Next
					</PoText>
				</View>
			) : step.minutes > 0 ? (
				<PoText variant="mono13" tone="textTertiary">
					{`${step.minutes} min`}
				</PoText>
			) : null}
			{onInfo ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`How to apply ${step.name}`}
					hitSlop={8}
					onPress={() => {
						haptics.tap();
						onInfo();
					}}
					style={[
						styles.info,
						{
							backgroundColor:
								step.howTo || step.photos.length ? colors.accentSubtle : colors.bgSubtle,
						},
					]}
				>
					<Icon
						name="Help"
						size={14}
						color={step.howTo || step.photos.length ? colors.accentDefault : colors.textTertiary}
					/>
				</Pressable>
			) : null}
		</Pressable>
	);
}

/** "Morning routine · 2 of 4 done" with segments and the steps. */
export function RoutineCard({
	title,
	steps,
	done,
	onTick,
	onOpen,
}: {
	title: string;
	steps: readonly Step[];
	done: Record<string, string>;
	onTick: (step: Step) => void;
	onOpen: () => void;
}) {
	const count = steps.filter((step) => done[step.id]).length;
	const next = steps.find((step) => !done[step.id]);
	return (
		<Card>
			<Pressable accessibilityRole="button" onPress={onOpen} style={styles.routineHead}>
				<CardHead title={title} right={`${count} of ${steps.length} done`} />
				<Segments total={steps.length} done={count} />
			</Pressable>
			<View>
				{steps.map((step, index) => (
					<StepRow
						key={step.id}
						step={step}
						doneAt={done[step.id] ?? null}
						next={step.id === next?.id}
						onPress={() => onTick(step)}
						last={index === steps.length - 1}
					/>
				))}
			</View>
		</Card>
	);
}

export type BodyTile = { label: string; text: string; tone: Tone };

/** Face, scalp, body and nails at a glance, from the last check-in, with the check-in button. */
export function BodyTodayCard({
	tiles,
	checkInDay,
	onCheckIn,
	onTile,
}: {
	tiles: readonly BodyTile[];
	checkInDay: string;
	onCheckIn: () => void;
	onTile: (tile: BodyTile) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Card>
			<CardHead title="Body today" right={`Check-in ${checkInDay}`} />
			<View style={styles.tiles}>
				{tiles.map((tile) => (
					<Pressable
						key={tile.label}
						accessibilityRole="button"
						onPress={() => onTile(tile)}
						style={[styles.tile, { backgroundColor: colors.bgSubtle }]}
					>
						<PoText variant="meta13" tone="textSecondary">
							{tile.label}
						</PoText>
						<PoText variant="row15" tone={tile.tone} numberOfLines={1}>
							{tile.text}
						</PoText>
					</Pressable>
				))}
			</View>
			<PillButton
				label="Weekly check-in · no photos"
				onPress={onCheckIn}
				accessory={<Icon name="Filled/Edit" size={16} color={colors.textInverse} />}
			/>
		</Card>
	);
}

/** The week's weekly steps: Wash, Scrub, Oil, Nails, with ticks. */
export function WeekCard({
	cells,
	date,
	note,
}: {
	cells: readonly WeekCell[];
	date: string;
	note: string | null;
}) {
	const { colors } = usePoTheme();
	return (
		<Card>
			<CardHead title="This week" right={date} />
			<View style={styles.week}>
				{cells.map((cell) => {
					const today = cell.state === "today";
					const done = cell.state === "done";
					return (
						<View key={cell.day} style={styles.weekDay}>
							<PoText variant="mono13" tone={today ? "accentDefault" : "textTertiary"}>
								{cell.letter}
							</PoText>
							<View
								style={[
									styles.weekDot,
									done
										? { backgroundColor: colors.statusSuccessSubtle }
										: today
											? {
													backgroundColor: colors.accentSubtle,
												}
											: null,
								]}
							>
								{done ? (
									<Icon name="Line/Check" size={14} color={colors.statusSuccess} />
								) : (
									<View
										style={[
											styles.dot,
											{
												backgroundColor:
													cell.state === "missed" ? colors.statusCaution : colors.textTertiary,
											},
										]}
									/>
								)}
							</View>
							<PoText
								variant="meta13"
								tone={today ? "accentDefault" : "textTertiary"}
								numberOfLines={1}
							>
								{cell.label}
							</PoText>
						</View>
					);
				})}
			</View>
			{note ? (
				<PoText variant="meta13" tone="textSecondary">
					{note}
				</PoText>
			) : null}
		</Card>
	);
}

/** The three emptiest products, with Reorder on the one that's nearly out. */
export function RunningLowCard({
	items,
	count,
	onReorder,
	onOpen,
}: {
	items: readonly (Product & { left: Supply })[];
	count: number;
	onReorder: (product: Product) => void;
	onOpen: () => void;
}) {
	return (
		<Card>
			<Pressable accessibilityRole="button" onPress={onOpen}>
				<CardHead title="Running low" right={`${count} on the shelf`} />
			</Pressable>
			{items.map((product) => (
				<View key={product.id} style={styles.low}>
					<ProductImage photo={product.photo} size={44} radius={12} />
					<View style={styles.lowText}>
						<View style={styles.lowHead}>
							<PoText variant="row15" style={styles.flex} numberOfLines={1}>
								{product.name}
							</PoText>
							{product.left.daysLeft > 14 ? (
								<PoText variant="mono13" tone="textSecondary">
									{`${Math.round(product.left.share * 100)}%`}
								</PoText>
							) : null}
						</View>
						<ProgressBar share={product.left.share} tone={product.left.tone} />
						<PoText
							variant="meta13"
							tone={product.left.daysLeft <= 14 ? "textWarning" : "textSecondary"}
						>
							{`About ${product.left.label} left`}
						</PoText>
					</View>
					{product.left.daysLeft <= 14 ? (
						<PillButton label="Reorder" variant="secondary" onPress={() => onReorder(product)} />
					) : null}
				</View>
			))}
		</Card>
	);
}

/** The empty Home: what to work on and the skin type, then Build my routine. */
/** Care starts empty: write your own steps, design a routine with AI, or start from a template. */
export function StartCard({
	aiAvailable,
	onOwn,
	onAi,
	onTemplates,
}: {
	aiAvailable: boolean;
	onOwn: () => void;
	onAi: () => void;
	onTemplates: () => void;
}) {
	const { colors } = usePoTheme();
	const options: { icon: IconName; title: string; body: string; onPress: () => void }[] = [
		{
			icon: "Filled/Edit",
			title: "Add my own steps",
			body: "Write each step your way, with photos and how you apply it.",
			onPress: onOwn,
		},
		{
			icon: "Filled/Sparkle",
			title: "Design it with AI",
			body: aiAvailable
				? "Say what you want to work on; review the draft before anything is saved."
				: "Sign in to have AI draft a routine you review first.",
			onPress: onAi,
		},
		{
			icon: "List",
			title: "Start from a template",
			body: "Ready-made routines for dark spots, dry skin, dandruff and more. Only if you pick one.",
			onPress: onTemplates,
		},
	];
	return (
		<View style={[styles.start, { backgroundColor: colors.bgSurface }]}>
			<PoText variant="eyebrow11" tone="textTertiary">
				Care · empty until you add something
			</PoText>
			<PoText variant="title30">Your routine, your way</PoText>
			{options.map((option) => (
				<Pressable
					key={option.title}
					accessibilityRole="button"
					onPress={() => {
						haptics.tap();
						option.onPress();
					}}
					style={({ pressed }) => [
						styles.option,
						{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
					]}
				>
					<View style={[styles.optionIcon, { backgroundColor: colors.accentSubtle }]}>
						<Icon name={option.icon} size={16} color={colors.accentDefault} />
					</View>
					<View style={styles.flex}>
						<PoText variant="row15">{option.title}</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{option.body}
						</PoText>
					</View>
					<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
				</Pressable>
			))}
		</View>
	);
}

/** The Care AI's answer. */
export function CareAnswerCard({
	question,
	answer,
	followUps,
	onFollowUp,
	onDone,
}: {
	question: string;
	answer: string;
	followUps: readonly string[];
	onFollowUp: (question: string) => void;
	onDone: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Card accent>
			<View style={styles.answerHead}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<PoText variant="eyebrow11" tone="textTertiary">
					Answer
				</PoText>
			</View>
			<PoText variant="mono13" tone="textSecondary">
				“{question}”
			</PoText>
			<PoText variant="body15">{answer}</PoText>
			{followUps.length > 0 ? (
				<View style={styles.chips}>
					{followUps.map((item) => (
						<FilterChip key={item} label={item} selected={false} onPress={() => onFollowUp(item)} />
					))}
				</View>
			) : null}
			<PillButton label="Done" variant="secondary" onPress={onDone} />
		</Card>
	);
}

const styles = StyleSheet.create({
	start: { gap: 12, padding: 16, borderRadius: 24 },
	option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16 },
	optionIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	info: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
	flex: { flex: 1 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	banner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
	step: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	next: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
	routineHead: { gap: 12 },
	tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tile: { width: "48.5%", gap: 4, padding: 12, borderRadius: 18 },
	week: { flexDirection: "row", justifyContent: "space-between" },
	weekDay: { alignItems: "center", gap: 8, width: 44 },
	weekDot: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	dot: { width: 4, height: 4, borderRadius: 2 },
	low: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	lowText: { flex: 1, gap: 8 },
	lowHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	answerHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
