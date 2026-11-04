import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SkeletonList } from "@/components/ui/skeleton";
import { usePoTheme } from "@/theme";
import { useCareer, useNow } from "../hooks/use-career";
import {
	type CareerNote,
	type CareerRange,
	careerNotes,
	careerRecap,
} from "../lib/career-insights";
import { dayAndTime } from "../lib/career-math";
import { careerRoutes } from "../navigation";
import { CareerScreen } from "./career-screen";

const RANGES: { id: CareerRange; label: string }[] = [
	{ id: "week", label: "This week" },
	{ id: "last", label: "Last week" },
	{ id: "month", label: "Month" },
];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Career Insights: the range in a sentence, three numbers and what's worth doing next. */
export function CareerInsightsScreen() {
	const { colors } = usePoTheme();
	const data = useCareer();
	const now = useNow();
	const [range, setRange] = useState<CareerRange>("week");
	const [hidden, setHidden] = useState<CareerNote["kind"][]>([]);
	const recap = careerRecap(data.apps, data.sessions, data.settings, range, now);
	const notes = careerNotes({
		apps: data.apps,
		preps: data.preps,
		settings: data.settings,
		now,
	}).filter((note) => !hidden.includes(note.kind));
	const hide = (note: CareerNote) => setHidden((list) => [...list, note.kind]);
	const quiet = recap.applied === 0 && recap.replies === 0 && recap.skillMinutes === 0;

	return (
		<CareerScreen
			insightsActive
			about={{ screen: "career insights" }}
			action={{ icon: "List", label: "Applications", onPress: careerRoutes.applications }}
		>
			<View style={styles.ranges}>
				{RANGES.map((item) => (
					<FilterChip
						key={item.id}
						label={item.label}
						selected={range === item.id}
						onPress={() => setRange(item.id)}
					/>
				))}
			</View>

			{data.loading ? (
				<SkeletonList count={2} label="your insights" />
			) : data.apps.length === 0 ? (
				<EmptyCard
					icon="Filled/Chart"
					title="Nothing to look back on yet"
					body="Add the jobs you apply to and this fills in: how many went out, who wrote back and the time on your skill."
				>
					<PillButton label="Add a job" onPress={careerRoutes.applications} />
				</EmptyCard>
			) : (
				<>
					<View style={styles.recap}>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{range === "month" ? "Monthly recap" : "Weekly recap"}
							</PoText>
						</View>
						<PoText variant="title18" tone="textSecondary">
							{quiet ? (
								"A quiet stretch: nothing sent, no replies and no skill time."
							) : (
								<>
									{"You sent "}
									<PoText variant="title18">{plural(recap.applied, "application")}</PoText>
									{recap.replies > 0 ? ", " : " and no one has written back yet"}
									{recap.replies > 0 ? (
										<PoText variant="title18">{`${recap.replies} wrote back`}</PoText>
									) : null}
									{recap.skillMinutes > 0 ? ", and practised for " : "."}
									{recap.skillMinutes > 0 ? (
										<PoText variant="title18">{`${recap.skillMinutes} min`}</PoText>
									) : null}
									{recap.skillMinutes > 0 ? "." : ""}
								</>
							)}
						</PoText>
					</View>
					<View style={styles.stats}>
						<Stat
							label="Applied"
							value={String(recap.applied)}
							foot={`of ${recap.target}`}
							tone={recap.applied >= recap.target ? "textSuccess" : "textTertiary"}
						/>
						<Stat
							label="Replies"
							value={String(recap.replies)}
							foot={
								recap.applied > 0 ? `${Math.round((recap.replies / recap.applied) * 100)}%` : "–"
							}
							tone={recap.replies > 0 ? "textSuccess" : "textTertiary"}
						/>
						<Stat
							label="Skill"
							value={`${recap.skillMinutes} min`}
							foot={recap.interviews > 0 ? plural(recap.interviews, "interview") : "–"}
							tone={recap.skillMinutes > 0 ? "textSuccess" : "textTertiary"}
						/>
					</View>
				</>
			)}

			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note);
				return (
					<View key={note.kind} style={[styles.card, { backgroundColor: colors.bgSurface }]}>
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
									hide(note);
									text.act();
								}}
							/>
							<PillButton label="Got it" variant="secondary" onPress={() => hide(note)} />
						</View>
					</View>
				);
			})}
		</CareerScreen>
	);
}

function noteText(note: CareerNote): {
	title: string;
	body: string;
	primary: string;
	act: () => void;
} {
	switch (note.kind) {
		case "prep":
			return {
				title: `Interview ${note.days === 0 ? "today" : note.days === 1 ? "tomorrow" : `in ${note.days} days`}`,
				body:
					note.total === 0
						? `${note.app.company} is on ${dayAndTime(new Date(note.app.interview?.at ?? ""))} and there's no prep yet. Build it now and the flashcards come with it.`
						: `${note.app.company}: ${note.done} of ${note.total} prep topics done. An hour today covers the rest.`,
				primary: "Open prep",
				act: () => careerRoutes.prep(note.app.id),
			};
		case "follow-ups":
			return {
				title: `${plural(note.count, "follow-up")} due`,
				body: "A short, polite nudge a week after applying is the cheapest way to get a reply.",
				primary: "See them",
				act: careerRoutes.applications,
			};
		case "behind":
			return {
				title: "Behind on this week",
				body: `${note.applied} of ${note.target} sent${note.daysLeft > 0 ? ` with ${plural(note.daysLeft, "workday")} left` : ""}. Two a day gets you back on pace.`,
				primary: "Add a job",
				act: careerRoutes.applications,
			};
		case "no-replies":
			return {
				title: "No replies yet",
				body: `${note.applied} applications in a month and no one has written back. The CV is the likely gap: tailor the top third to each role.`,
				primary: "See applications",
				act: careerRoutes.applications,
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
	tone: "textSuccess" | "textTertiary";
}) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.stat, { backgroundColor: colors.bgSurface }]}>
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
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 20 },
	pad: { paddingHorizontal: 6 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	actions: { flexDirection: "row", gap: 8 },
});
