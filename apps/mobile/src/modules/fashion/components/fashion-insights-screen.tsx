import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip, SectionLabel } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays, dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { saveWish, savePlan } from "../data/fashion-actions";
import { useFashion } from "../hooks/use-fashion";
import { capital, colourStory, type Insight, insights, recap } from "../lib/fashion-math";
import { looksFor, lookPieceIds } from "../lib/outfits";
import { fashionRoutes } from "../navigation";
import { FashionScreen } from "./fashion-screen";

type Range = "week" | "last" | "month";

const RANGES: readonly { id: Range; label: string }[] = [
	{ id: "week", label: "This week" },
	{ id: "last", label: "Last week" },
	{ id: "month", label: "Month" },
];

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

function monday(date: Date): Date {
	const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
	return out;
}

function rangeOf(range: Range, now: Date): { from: Date; days: number } {
	if (range === "week") return { from: monday(now), days: 7 };
	if (range === "last") return { from: addDays(monday(now), -7), days: 7 };
	const first = new Date(now.getFullYear(), now.getMonth(), 1);
	return { from: first, days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() };
}

function delta(value: number, before: number): string {
	return value === before ? "same" : `${value > before ? "▲" : "▼"} ${Math.abs(value - before)}`;
}

/** Fashion Insights: what was worn, how many outfits, what was spent, and what to do about it. */
export function FashionInsightsScreen() {
	const { colors } = usePoTheme();
	const data = useFashion();
	const now = useNow();
	const [range, setRange] = useState<Range>("month");
	const [hidden, setHidden] = useState<string[]>([]);
	const [notice, setNotice] = useState<string | null>(null);

	const view = useMemo(() => {
		const { from, days } = rangeOf(range, now);
		const current = recap(data.pieces, data.wears, from, days);
		const before = recap(data.pieces, data.wears, addDays(from, -days), days);
		const story = colourStory(data.pieces);
		return {
			current,
			before,
			lead: `${range === "month" ? "Monthly" : "Weekly"} recap · ${range === "month" ? MONTHS[now.getMonth()] : `${dayKey(from).slice(5)} to ${dayKey(addDays(from, days - 1)).slice(5)}`}`,
			story,
			found: insights(data.pieces, data.wears, data.wishes, now),
		};
	}, [range, now, data.pieces, data.wears, data.wishes]);

	const act = async (insight: Insight) => {
		const target = insight.action.target;
		if (insight.action.kind === "plan-piece" && target) {
			const piece = data.pieces.find((item) => item.id === target);
			const tomorrow = addDays(now, 1);
			const pool = data.pieces.filter(
				(item) => item.category !== piece?.category || item.id === target,
			);
			const look = looksFor(
				pool,
				data.wears,
				{ day: dayKey(tomorrow), weather: null, wet: false, evening: false },
				1,
			)[0];
			if (!look) return;
			const week = dayKey(monday(tomorrow));
			const plan = data.plans.find((item) => item.id === week);
			const day = dayKey(tomorrow);
			await savePlan(week, [
				...(plan?.days.filter((item) => item.day !== day) ?? []),
				{ day, look: look.name, pieceIds: lookPieceIds(look) },
			]);
			setNotice(`${piece?.name ?? "It"} is planned for tomorrow.`);
		} else if (insight.action.kind === "keep-wish" && target) {
			const wish = data.wishes.find((item) => item.id === target);
			if (wish) await saveWish({ ...wish, tag: "first" });
			setNotice("Moved to the top of your wishlist.");
		} else if (insight.action.kind === "scent-low" && target) {
			fashionRoutes.piece(target);
			return;
		} else {
			fashionRoutes.add();
			return;
		}
		haptics.success();
		setHidden((current) => [...current, insight.id]);
	};

	const { current, before } = view;
	const top = view.story.slice(0, 2).map((item) => item.colour);

	return (
		<FashionScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "Outfit plan", onPress: fashionRoutes.plan }}
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.ranges}
			>
				{RANGES.map((item) => (
					<FilterChip
						key={item.id}
						label={item.label}
						selected={range === item.id}
						onPress={() => setRange(item.id)}
					/>
				))}
			</ScrollView>

			<View style={styles.recap}>
				<View style={styles.eyebrow}>
					<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
					<PoText variant="eyebrow11" tone="textTertiary">
						{view.lead}
					</PoText>
				</View>
				<PoText variant="title18" tone="textSecondary">
					You wore{" "}
					<PoText variant="title18">
						{current.wornPieces} of {current.total} pieces
					</PoText>
					{range === "month" ? " this month." : " this week."}
					{top[0] && top[1]
						? ` ${capital(top[0])} and ${top[1]} did most of the work, and you spent `
						: " You spent "}
					<PoText variant="title18" tone={current.spent === 0 ? "textSuccess" : "textPrimary"}>
						{current.spent === 0 ? "nothing" : formatMoney(current.spent)}
					</PoText>
					{" on new clothes."}
				</PoText>
			</View>

			<View style={styles.stats}>
				<Stat
					label="Worn"
					value={`${current.wornPieces}/${current.total}`}
					change={delta(current.wornPieces, before.wornPieces)}
					up={current.wornPieces >= before.wornPieces}
				/>
				<Stat
					label="Outfits"
					value={String(current.outfits)}
					change={delta(current.outfits, before.outfits)}
					up={current.outfits >= before.outfits}
				/>
				<Stat
					label="Spent"
					value={formatMoney(current.spent)}
					change={data.settings.buyingPaused ? "on hold" : delta(current.spent, before.spent)}
					up={current.spent <= before.spent}
				/>
			</View>

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}

			<SectionLabel>What I noticed</SectionLabel>
			{view.found
				.filter((insight) => !hidden.includes(insight.id))
				.map((insight) => (
					<View
						key={insight.id}
						style={[
							styles.card,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{insight.label}
							</PoText>
						</View>
						<PoText variant="body15" tone="textSecondary">
							{insight.body}
						</PoText>
						<View style={styles.actions}>
							<PillButton
								label={insight.action.label}
								onPress={() =>
									void act(insight).catch((error: unknown) => {
										console.error("[fashion] insight action failed", error);
										setNotice("That didn't work. Try again.");
									})
								}
								style={styles.flex}
							/>
							<PillButton
								label="Later"
								variant="secondary"
								onPress={() => setHidden((list) => [...list, insight.id])}
							/>
						</View>
					</View>
				))}
		</FashionScreen>
	);
}

function Stat({
	label,
	value,
	change,
	up,
}: {
	label: string;
	value: string;
	change: string;
	up: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.stat,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<PoText variant="title18" numberOfLines={1} adjustsFontSizeToFit>
				{value}
			</PoText>
			<PoText
				variant="mono13"
				tone={change === "same" ? "textTertiary" : up ? "textSuccess" : "textDanger"}
			>
				{change}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pad: { paddingHorizontal: 6 },
	ranges: { gap: 8 },
	recap: { gap: 10, paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 20, borderWidth: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	actions: { flexDirection: "row", gap: 8 },
});
