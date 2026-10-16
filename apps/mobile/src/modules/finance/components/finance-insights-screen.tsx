import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { monthKey } from "@/lib/day";
import { useHomeView } from "@/modules/home/store/home-view";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { useFinanceUi } from "../hooks/finance-ui-store";
import { useFinanceToday } from "../hooks/use-finance";
import {
	type FinanceNote,
	financeNotes,
	longDate,
	MONTHS,
	recap,
	rupees,
	shortK,
} from "../lib/finance-math";
import { CATEGORY_SHORT } from "../lib/finance-model";
import { financeRoutes } from "../navigation";
import { Card } from "./finance-cards";
import { FinanceScreen } from "./finance-screen";

type Range = "month" | "last" | "year";

/** Finance Insights: the period in a sentence, three numbers and what's worth acting on. */
export function FinanceInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, now, days } = useFinanceToday();
	const { settings, entries, bills } = data;
	const modules = useOnboardingStore((state) => state.modules);
	const updateView = useHomeView((state) => state.update);
	const hidden = useFinanceUi((state) => state.hidden);
	const hide = useFinanceUi((state) => state.hide);
	const [range, setRange] = useState<Range>("month");
	const summary = recap(entries, settings, now, range);
	const period =
		range === "year"
			? `Year · ${now.getFullYear()}`
			: `Monthly recap · ${MONTHS[new Date(now.getFullYear(), now.getMonth() + (range === "last" ? -1 : 0), 1).getMonth()]}`;
	const key = (note: FinanceNote) => `${note.kind}-${monthKey(now)}`;
	const notes = financeNotes({ settings, entries, bills, now }).filter(
		(note) => !hidden.includes(key(note)),
	);

	const openModule = (module: "career" | "food") => {
		updateView((doc) => ({ ...doc, view: module }));
		financeRoutes.today();
	};

	const act = (note: FinanceNote) => {
		hide(key(note));
		if (note.kind === "interest") financeRoutes.income();
		else if (note.kind === "job-search") openModule("career");
		else if (note.kind === "food" && modules.includes("food")) router.push("/food/plan");
		else financeRoutes.budget();
	};

	const paceWord =
		summary.pace === "over"
			? "over budget"
			: summary.pace === "ahead"
				? "ahead of pace"
				: "on pace";

	return (
		<FinanceScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "History", onPress: financeRoutes.history }}
		>
			<View style={styles.ranges}>
				<FilterChip
					label="This month"
					selected={range === "month"}
					onPress={() => setRange("month")}
				/>
				<FilterChip
					label="Last month"
					selected={range === "last"}
					onPress={() => setRange("last")}
				/>
				<FilterChip label="Year" selected={range === "year"} onPress={() => setRange("year")} />
			</View>
			<View style={styles.recap}>
				<View style={styles.eyebrow}>
					<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
					<PoText variant="eyebrow11" tone="textTertiary">
						{period}
					</PoText>
				</View>
				<PoText variant="title18" tone="textSecondary">
					{summary.spent === 0 && summary.income === 0 ? (
						"Nothing logged here yet. Spending typed on Finance's Home shows up here."
					) : (
						<>
							{"Spending is "}
							{summary.pace ? `${paceWord} at ` : "at "}
							<PoText variant="title18">{rupees(summary.spent)}</PoText>
							{summary.income > 0 ? ", and income added " : "."}
							{summary.income > 0 ? (
								<PoText variant="title18">
									{summary.daysAdded > 0
										? `${summary.daysAdded} days of runway`
										: rupees(summary.income)}
								</PoText>
							) : null}
							{summary.income > 0 ? "." : ""}
							{summary.interest > 0 ? " " : " No interest paid or earned."}
							{summary.interest > 0 ? (
								<PoText variant="title18">{`${rupees(summary.interest)} of interest`}</PoText>
							) : null}
							{summary.interest > 0 ? " came in to give away." : ""}
						</>
					)}
				</PoText>
			</View>
			<View style={styles.stats}>
				<Stat
					label="Runway"
					value={days === null ? "Covered" : `${days} days`}
					foot={summary.daysAdded > 0 ? `▲ ${summary.daysAdded}` : "–"}
					tone={summary.daysAdded > 0 ? "textSuccess" : "textTertiary"}
				/>
				<Stat
					label="Spent"
					value={`Rs ${shortK(summary.spent)}`}
					foot={summary.pace === "over" ? "over" : summary.pace === "ahead" ? "ahead" : "on pace"}
					tone={
						summary.pace === "over"
							? "textDanger"
							: summary.pace === "ahead"
								? "textWarning"
								: "textSuccess"
					}
				/>
				<Stat
					label="Riba"
					value={rupees(summary.interest)}
					foot={summary.interest > 0 ? "to give" : "none"}
					tone={summary.interest > 0 ? "textWarning" : "textSuccess"}
				/>
			</View>
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note, modules.includes("career"));
				return (
					<Card key={note.kind}>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{text.title}
							</PoText>
						</View>
						<PoText variant="body15" tone="textSecondary">
							{text.body}
						</PoText>
						<View style={styles.actions}>
							{text.primary ? (
								<PillButton label={text.primary} style={styles.flex} onPress={() => act(note)} />
							) : null}
							<PillButton
								label={text.secondary}
								variant="secondary"
								style={text.primary ? undefined : styles.flex}
								onPress={() => hide(key(note))}
							/>
						</View>
					</Card>
				);
			})}
		</FinanceScreen>
	);
}

function noteText(
	note: FinanceNote,
	career: boolean,
): { title: string; body: string; primary: string | null; secondary: string } {
	switch (note.kind) {
		case "ahead":
			return {
				title: `${CATEGORY_SHORT[note.category]} is running ahead`,
				body: `${rupees(note.spent)} of ${rupees(note.limit)} with ${note.daysLeft} days left. Move money from another line now, or slow down for a week.`,
				primary: "Change limits",
				secondary: "Got it",
			};
		case "big-bill":
			return {
				title: "One big bill ahead",
				body: `${note.name} is due on ${longDate(note.due)}, about ${rupees(note.amount)}. Set it aside now so it doesn't feel like a shock.`,
				primary: "Set aside",
				secondary: "Later",
			};
		case "food":
			return {
				title: "Food is the biggest line",
				body: `${Math.round(note.share * 100)}% of this month went on food. Cooking from a weekly plan is the easiest place to save.`,
				primary: "Plan meals",
				secondary: "Got it",
			};
		case "job-search":
			return {
				title: "Applications are the best investment",
				body: `Each week of job search costs about ${rupees(note.weekly)}. Two applications a day is what shortens it.`,
				primary: career ? "Open Career" : null,
				secondary: "Got it",
			};
		case "interest":
			return {
				title: "Clean up the old account",
				body: `It paid ${rupees(note.amount)} of interest. Give it away, then moving to a profit-sharing account keeps everything halal.`,
				primary: "Show steps",
				secondary: "Later",
			};
	}
}

function Stat({
	label,
	value,
	foot,
	tone,
}: {
	label: string;
	value: string;
	foot: string;
	tone: "textSuccess" | "textWarning" | "textDanger" | "textTertiary";
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
			<PoText variant="mono13" tone={tone}>
				{foot}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ranges: { flexDirection: "row", gap: 8 },
	recap: { gap: 8, paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 24, borderWidth: 1 },
	pad: { paddingHorizontal: 6 },
	actions: { flexDirection: "row", gap: 8 },
});
