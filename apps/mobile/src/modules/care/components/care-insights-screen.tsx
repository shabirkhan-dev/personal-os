import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays, dayKey } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { usePoTheme } from "@/theme";
import { useCareToday } from "../hooks/use-care";
import { type CareNote, careNotes, monthDays, monthlyCost, spfDays, trend } from "../lib/care-math";
import type { CareDay } from "../lib/care-model";
import { careRoutes } from "../navigation";
import { CareScreen } from "./care-screen";
import { Card } from "./home-cards";

type Range = "month" | "last" | "year";

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
];

function rangeDays(range: Range, now: Date): string[] {
	if (range === "month") return monthDays(now, now);
	if (range === "last") return monthDays(new Date(now.getFullYear(), now.getMonth() - 1, 15));
	return Array.from({ length: 365 }, (_, step) => dayKey(addDays(now, step - 364)));
}

/** Longest run of finished days inside `range`. */
function bestRun(days: readonly CareDay[], range: readonly string[]): number {
	const finished = new Set(days.filter((day) => day.finished.length > 0).map((day) => day.id));
	let best = 0;
	let run = 0;
	for (const day of range) {
		run = finished.has(day) ? run + 1 : 0;
		best = Math.max(best, run);
	}
	return best;
}

const money = (amount: number) =>
	amount >= 1000
		? `Rs ${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`
		: formatMoney(amount).replace(/\.00$/, "");

/** Care Insights: the month in a sentence, three numbers, and what's worth changing. */
export function CareInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, now, streak } = useCareToday();
	const [range, setRange] = useState<Range>("month");
	const [hidden, setHidden] = useState<string[]>([]);
	const { steps, days, checkIns, products, settings } = data;
	const span = rangeDays(range, now);
	const logged = span.filter((day) => days.some((item) => item.id === day)).length;
	const spf = spfDays(steps, days, span);
	const flakes = trend(
		checkIns.filter((item) => span.includes(item.id)),
		"dandruff",
		12,
	);
	const spots = trend(
		checkIns.filter((item) => span.includes(item.id)),
		"dark-spots",
		12,
	);
	const notes = careNotes({ settings, steps, days, checkIns, range: span, now }).filter(
		(note) => !hidden.includes(note.kind),
	);
	const label =
		range === "year"
			? "Last 12 months"
			: MONTHS[range === "month" ? now.getMonth() : (now.getMonth() + 11) % 12];

	const sentence: { text: string; strong?: boolean }[] = [];
	if (logged === 0) {
		sentence.push({ text: "Nothing logged yet. Tick a routine step and this fills in." });
	} else {
		sentence.push(
			{ text: "Sunscreen on " },
			{ text: `${spf} of ${span.length} days`, strong: true },
			{ text: "." },
		);
		const lastFlake = flakes.at(-1);
		if (flakes[0] && lastFlake && flakes.length > 1) {
			sentence.push(
				{ text: " Dandruff is " },
				{
					text: `${lastFlake.value < flakes[0].value ? "down" : lastFlake.value > flakes[0].value ? "up" : "steady"} at a ${lastFlake.value}`,
					strong: true,
				},
				{ text: "." },
			);
		}
		const lastSpot = spots.at(-1);
		if (spots[0] && lastSpot && spots.length > 1 && lastSpot.value < spots[0].value) {
			sentence.push(
				{ text: " Dark spots look " },
				{ text: "a little lighter", strong: true },
				{ text: " by your own rating." },
			);
		}
	}

	const hide = (note: CareNote) => setHidden((list) => [...list, note.kind]);

	return (
		<CareScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "Weekly check-in", onPress: careRoutes.checkIn }}
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
						{`${range === "year" ? "Yearly" : "Monthly"} recap · ${label}`}
					</PoText>
				</View>
				<PoText variant="title18" tone="textSecondary">
					{sentence.map((part, index) => (
						// The sentence parts have no identity beyond their order.
						// oxlint-disable-next-line react/no-array-index-key
						<PoText
							key={index}
							variant="title18"
							tone={part.strong ? "textPrimary" : "textSecondary"}
						>
							{part.text}
						</PoText>
					))}
				</PoText>
			</View>
			<View style={styles.stats}>
				<Stat
					label="Streak"
					value={`${streak} day${streak === 1 ? "" : "s"}`}
					foot={`best ${bestRun(days, span)}`}
				/>
				<Stat
					label="SPF days"
					value={`${spf}/${span.length}`}
					foot={logged ? `${Math.round((spf / Math.max(1, logged)) * 100)}% of logged` : "none yet"}
				/>
				<Stat label="Spent" value={money(monthlyCost(products))} foot="a month" />
			</View>
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note);
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
							<PillButton
								label={text.primary}
								style={styles.flex}
								onPress={() => {
									if (note.kind === "winter") careRoutes.routine("night");
									else if (note.kind === "dandruff") careRoutes.hair();
									else if (note.kind === "check-in") careRoutes.checkIn();
									hide(note);
								}}
							/>
							<PillButton label={text.secondary} variant="secondary" onPress={() => hide(note)} />
						</View>
					</Card>
				);
			})}
		</CareScreen>
	);
}

function noteText(note: CareNote) {
	switch (note.kind) {
		case "spf":
			return {
				title: "Spots need sunscreen",
				body: `You skipped SPF on ${note.missed} logged day${note.missed === 1 ? "" : "s"}. Dark spots fade only when the sun stops darkening them, so keep the midday reapply.`,
				primary: "Keep reminder",
				secondary: "Got it",
			};
		case "winter":
			return {
				title: "Dry season is coming",
				body: "Colder, drier air dries skin faster. Use the thicker cream at night and lotion on damp skin after every shower.",
				primary: "Update routine",
				secondary: "Later",
			};
		case "dandruff":
			return {
				title: "Dandruff is responding",
				body: `Your flakes rating went from ${note.from} to ${note.to}. Don't stop when it clears: drop the wash to once a week instead.`,
				primary: "Plan it",
				secondary: "Got it",
			};
		case "check-in":
			return {
				title: "Time for a check-in",
				body: "Two minutes in the mirror, no photos. The ratings are what show whether a routine is working.",
				primary: "Check in",
				secondary: "Later",
			};
	}
}

function Stat({ label, value, foot }: { label: string; value: string; foot: string }) {
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
			<PoText variant="title18">{value}</PoText>
			<PoText variant="mono13" tone="textTertiary">
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
