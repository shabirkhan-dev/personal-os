import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { textStyles } from "@personal-os/tokens";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip, HeadLink, IconTile, ListRow } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { formatMoney } from "@/lib/money";
import { toTextStyle, usePoTheme } from "@/theme";
import { MONTHS, rupees, shortK } from "../lib/finance-math";
import {
	CATEGORIES,
	type Category,
	CATEGORY_ICONS,
	CATEGORY_SHORT,
	CATEGORY_TILES,
	CATEGORY_TONES,
} from "../lib/finance-model";

type Tone = keyof ColorTokens;

const inputStyle = toTextStyle(textStyles.row15);

/** Surface card, radius 28, 18 padding. */
export function Card({
	children,
	accent = false,
	tone,
}: {
	children: ReactNode;
	accent?: boolean;
	/** A tinted card (Zakat green, interest yellow). */
	tone?: { bg: Tone; border: Tone };
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: tone ? colors[tone.bg] : colors.bgSurface,
					borderColor: tone
						? colors[tone.border]
						: accent
							? colors.accentDefault
							: colors.borderDefault,
				},
			]}
		>
			{children}
		</View>
	);
}

export function CardHead({
	title,
	right,
	mono,
	onRight,
}: {
	title: string;
	right?: string;
	/** Mono note on the right ("burn Rs 55k / mo"). */
	mono?: boolean;
	onRight?: () => void;
}) {
	return (
		<View style={styles.head}>
			<PoText variant="title18" style={styles.flex}>
				{title}
			</PoText>
			{right && onRight ? <HeadLink label={right} onPress={onRight} /> : null}
			{right && !onRight ? (
				<PoText variant={mono ? "mono13" : "meta13"} tone="textTertiary">
					{right}
				</PoText>
			) : null}
		</View>
	);
}

export function Eyebrow({ children, tone = "textTertiary" }: { children: string; tone?: Tone }) {
	return (
		<PoText variant="eyebrow11" tone={tone}>
			{children}
		</PoText>
	);
}

/** "Runway" on Home: four month bars, coloured by how many months they cover. */
export function RunwayCard({
	bars,
	burn,
	line,
	onPress,
}: {
	bars: readonly { label: string; balance: number; tone: Tone }[];
	burn: number;
	line: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const max = Math.max(1, ...bars.map((bar) => bar.balance));
	return (
		<Pressable accessibilityRole="button" accessibilityLabel="Runway" onPress={onPress}>
			<Card>
				<CardHead title="Runway" right={`burn Rs ${shortK(burn)} / mo`} mono />
				<View style={styles.bars}>
					{bars.map((bar, index) => (
						<View key={bar.label} style={styles.barColumn}>
							<View style={styles.barTrack}>
								<View
									style={[
										styles.bar,
										{
											height: bar.balance > 0 ? Math.max(6, (bar.balance / max) * 80) : 4,
											backgroundColor: colors[bar.balance > 0 ? bar.tone : "statusDanger"],
										},
									]}
								/>
							</View>
							<PoText
								variant="mono13"
								tone={index === 0 || bar.balance <= 0 ? "textPrimary" : "textTertiary"}
							>
								{bar.label}
							</PoText>
						</View>
					))}
				</View>
				<View style={styles.lineRow}>
					<View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
					<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
						{line}
					</PoText>
				</View>
			</Card>
		</Pressable>
	);
}

/** One horizontal bar with a label and value, for the runway what-ifs. */
export function BalanceRow({
	label,
	value,
	share,
	tone,
	danger = false,
}: {
	label: string;
	value: string;
	share: number;
	tone: Tone;
	danger?: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.balanceRow}>
			<PoText variant="mono13" tone={danger ? "textDanger" : "textSecondary"} style={styles.when}>
				{label}
			</PoText>
			<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
				<View
					style={[
						styles.fill,
						{
							width: `${Math.max(danger ? 2 : 3, Math.round(Math.min(1, share) * 100))}%`,
							backgroundColor: colors[tone],
						},
					]}
				/>
			</View>
			<PoText variant="row15" tone={danger ? "textDanger" : "textPrimary"} style={styles.amount}>
				{value}
			</PoText>
		</View>
	);
}

/** "October spend": the month's spending as one stacked bar against the budget. */
export function MonthSpendCard({
	month,
	spent,
	budget,
	sums,
	daysLeft,
	perDay,
	onPress,
}: {
	month: number;
	spent: number;
	budget: number;
	sums: Record<Category, number>;
	daysLeft: number;
	perDay: number;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const scale = Math.max(budget, spent, 1);
	const used = CATEGORIES.filter((category) => sums[category] > 0).sort(
		(a, b) => sums[b] - sums[a],
	);
	return (
		<Pressable accessibilityRole="button" accessibilityLabel="Budget" onPress={onPress}>
			<Card>
				<View style={styles.head}>
					<PoText variant="title18" style={styles.flex}>
						{`${MONTHS[month]} spend`}
					</PoText>
					<PoText variant="row15">{rupees(spent)}</PoText>
					<PoText variant="meta13" tone="textTertiary">
						{` / ${Math.round(budget).toLocaleString("en-US")}`}
					</PoText>
				</View>
				<View style={[styles.stack, { backgroundColor: colors.bgSubtle }]}>
					{used.map((category) => (
						<View
							key={category}
							style={{
								width: `${(sums[category] / scale) * 100}%`,
								backgroundColor: colors[CATEGORY_TONES[category]],
							}}
						/>
					))}
				</View>
				{used.length > 0 ? (
					<View style={styles.legend}>
						{used.slice(0, 4).map((category) => (
							<View key={category} style={styles.legendItem}>
								<View style={[styles.dot, { backgroundColor: colors[CATEGORY_TONES[category]] }]} />
								<PoText variant="meta13" tone="textSecondary">
									{CATEGORY_SHORT[category]}
								</PoText>
							</View>
						))}
					</View>
				) : null}
				<PoText variant="meta13" tone="textTertiary">
					{spent > budget
						? `${rupees(spent - budget)} over · ${daysLeft} days left`
						: `${daysLeft} days left · about ${rupees(perDay)} a day`}
				</PoText>
			</Card>
		</Pressable>
	);
}

export type BillRow = {
	id: string;
	name: string;
	line: string;
	amount: number;
	overdue: boolean;
};

/** "Upcoming bills": the next one gets a Pay button. */
export function BillsCard({
	rows,
	count,
	onPay,
	onOpen,
	onAdd,
}: {
	rows: readonly BillRow[];
	count: number;
	onPay: (id: string) => void;
	onOpen: (id: string) => void;
	onAdd: () => void;
}) {
	return (
		<Card>
			<CardHead
				title="Upcoming bills"
				right={rows.length === 0 ? "Add" : `${count} this month`}
				onRight={rows.length === 0 ? onAdd : undefined}
			/>
			{rows.length === 0 ? (
				<PoText variant="meta13" tone="textSecondary">
					Add electricity, internet and phone once; they show here before they're due.
				</PoText>
			) : (
				<View>
					{rows.map((row, index) => (
						<ListRow
							key={row.id}
							title={row.name}
							subtitle={row.line}
							icon={{
								name: billIcon(row.name),
								tone: row.overdue ? "statusDanger" : billTone(row.name),
								tile: row.overdue ? "statusDangerSubtle" : billTile(row.name),
							}}
							action={
								index === 0
									? { label: `Pay ${formatMoney(row.amount)}`, onPress: () => onPay(row.id) }
									: undefined
							}
							value={index === 0 ? undefined : formatMoney(row.amount)}
							onPress={() => onOpen(row.id)}
						/>
					))}
					<ListRow
						title="Add a bill"
						icon={{ name: "Line/Plus", tone: "textSecondary", tile: "bgSubtle" }}
						onPress={onAdd}
						last
					/>
				</View>
			)}
		</Card>
	);
}

const billIcon = (name: string) =>
	/electric|power|gas/i.test(name)
		? ("Lightning" as const)
		: /phone|mobile|data/i.test(name)
			? ("Wallet" as const)
			: /rent|home/i.test(name)
				? ("Building" as const)
				: ("Filled/Calendar" as const);
const billTone = (name: string): Tone =>
	/electric|power|gas/i.test(name) ? "statusCaution" : "accentDefault";
const billTile = (name: string): Tone =>
	/electric|power|gas/i.test(name) ? "statusCautionSubtle" : "accentSubtle";

export type EntryRow = {
	id: string;
	title: string;
	line: string;
	amount: string;
	income: boolean;
	category: Category;
};

/** "Recent": the last few entries, money in in green. */
export function RecentCard({
	rows,
	onRow,
	onAll,
}: {
	rows: readonly EntryRow[];
	onRow: (id: string) => void;
	onAll: () => void;
}) {
	return (
		<Card>
			<CardHead title="Recent" right="History" onRight={onAll} />
			<View>
				{rows.map((row, index) => (
					<ListRow
						key={row.id}
						title={row.title}
						subtitle={row.line}
						icon={
							row.income
								? { name: "Line/Arrow up", tone: "statusSuccess", tile: "statusSuccessSubtle" }
								: {
										name: CATEGORY_ICONS[row.category],
										tone: CATEGORY_TONES[row.category],
										tile: CATEGORY_TILES[row.category],
									}
						}
						value={row.amount}
						valueTone={row.income ? "textSuccess" : "textTertiary"}
						onPress={() => onRow(row.id)}
						last={index === rows.length - 1}
					/>
				))}
			</View>
		</Card>
	);
}

/** "After the job: 6 months saved". */
export function SavingsCard({
	months,
	saved,
	target,
	onPress,
}: {
	months: number;
	saved: number;
	target: number;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const share = target > 0 ? Math.min(1, saved / target) : 0;
	return (
		<Pressable accessibilityRole="button" accessibilityLabel="Savings goal" onPress={onPress}>
			<Card>
				<View style={styles.head}>
					<IconTile name="Star" tone="statusSuccess" tile="statusSuccessSubtle" />
					<View style={styles.flex}>
						<PoText variant="row15">{`After the job: ${months} months saved`}</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{`${rupees(saved)} of ${rupees(target)}${saved > 0 ? "" : " · starts with salary"}`}
						</PoText>
					</View>
					<PoText variant="mono13">{`${Math.round(share * 100)}%`}</PoText>
				</View>
				<View style={[styles.goalTrack, { backgroundColor: colors.bgSubtle }]}>
					<View
						style={[
							styles.fill,
							{ width: `${Math.max(1, share * 100)}%`, backgroundColor: colors.statusSuccess },
						]}
					/>
				</View>
			</Card>
		</Pressable>
	);
}

/** The violet-sparkle answer from the Finance AI. */
export function AnswerCard({
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
			<View style={styles.lineRow}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<Eyebrow>Answer</Eyebrow>
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

/** A label over a filled input, for the empty state's three numbers. */
export function NumberField({
	label,
	value,
	placeholder,
	onChangeText,
}: {
	label: string;
	value: string;
	placeholder: string;
	onChangeText: (value: string) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.numberField}>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<TextInput
				accessibilityLabel={label}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.textTertiary}
				keyboardType="number-pad"
				style={[
					inputStyle,
					styles.numberBox,
					{ backgroundColor: colors.bgSubtle, color: colors.textPrimary },
				]}
			/>
		</View>
	);
}

/** A white primary pill and a dark secondary one, side by side. */
export function ButtonPair({
	secondary,
	primary,
}: {
	secondary: { label: string; onPress: () => void };
	primary: { label: string; onPress: () => void; disabled?: boolean };
}) {
	return (
		<View style={styles.pair}>
			<PillButton
				label={secondary.label}
				variant="secondary"
				style={styles.flex}
				onPress={secondary.onPress}
			/>
			<PillButton
				label={primary.label}
				style={styles.flex}
				disabled={primary.disabled}
				onPress={primary.onPress}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 10 },
	bars: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
	barColumn: { flex: 1, alignItems: "center", gap: 8 },
	barTrack: { height: 80, alignSelf: "stretch", justifyContent: "flex-end" },
	bar: { borderRadius: 8, alignSelf: "stretch" },
	lineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	balanceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	when: { width: 52 },
	amount: { minWidth: 84, textAlign: "right" },
	track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
	fill: { height: 8, borderRadius: 4 },
	goalTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
	stack: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 },
	legend: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	numberField: { gap: 8 },
	numberBox: { height: 52, borderRadius: 16, paddingHorizontal: 14 },
	pair: { flexDirection: "row", gap: 10 },
});
