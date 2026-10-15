import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useAiJob, useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { usePoTheme } from "@/theme";
import { toggleTopic } from "../data/career-actions";
import { type CareerData, findApp, findPrep, useCareer } from "../hooks/use-career";
import { PREP_STEPS, prepJobKey, useStartPrep } from "../hooks/use-career-jobs";
import { dayAndTime, weekdayShort } from "../lib/career-math";
import type { Story } from "../lib/career-model";
import { dueBefore } from "@/lib/flashcards/schedule";
import { careerRoutes } from "../navigation";
import { useCareerAi } from "../services/career-ai";
import { CareerScreen } from "./career-screen";
import {
	AiTip,
	EmptyCard,
	Footer,
	IconTile,
	ListCard,
	ListRow,
	MetaChip,
	ScreenTitle,
	Segments,
	SectionLabel,
} from "@/components/module-ui";
import { StorySheet } from "./story-sheet";

/** The person's stories, with add and edit. */
function Stories({ data, onOpen }: { data: CareerData; onOpen: (story: Story | null) => void }) {
	return (
		<>
			<SectionLabel>Your stories</SectionLabel>
			<ListCard>
				{data.stories.map((story) => (
					<ListRow
						key={story.id}
						title={story.title}
						subtitle={story.summary || undefined}
						value={`${story.minutes} min`}
						chevron
						onPress={() => onOpen(story)}
					/>
				))}
				<ListRow
					title="Add a story"
					subtitle="A project you can tell in two minutes"
					value="Add"
					chevron
					onPress={() => onOpen(null)}
					last
				/>
			</ListCard>
		</>
	);
}

/** Interview prep for one application, or the practise-any-time view when none is booked. */
export function InterviewPrepScreen({ id }: { id?: string }) {
	const { colors } = usePoTheme();
	const data = useCareer();
	const ai = useCareerAi();
	const [story, setStory] = useState<{ key: number; story: Story | null } | null>(null);
	const startPrep = useStartPrep();
	const [error, setError] = useState<string | null>(null);

	const app = id ? findApp(data, id) : null;
	const job = useAiJob(prepJobKey(app?.id ?? ""));
	const retry = useAiJobs((state) => state.retry);
	const dismiss = useAiJobs((state) => state.dismiss);
	const prep = app ? findPrep(data, app.id) : null;
	const deck = app ? data.cards.filter((card) => card.deckId === app.id) : [];
	const openStory = (value: Story | null) => setStory({ key: Date.now(), story: value });
	const storySheet = story ? (
		<StorySheet key={story.key} visible story={story.story} onClose={() => setStory(null)} />
	) : null;

	if (!app) {
		return (
			<CareerScreen>
				<ScreenTitle eyebrow="Practise any time" title="Interview prep" />
				<EmptyCard
					icon="Briefcase"
					title="No interview booked yet"
					body="Your stories are ready to practise. When an interview is booked, I'll build a plan for that company."
				/>
				<Stories data={data} onOpen={openStory} />
				<AiTip>Fifteen minutes out loud each day keeps you sharp between interviews.</AiTip>
				<PillButton
					label={data.stories.length > 0 ? "Practise a story" : "Add a story"}
					onPress={() => openStory(data.stories[0] ?? null)}
				/>
				{storySheet}
			</CareerScreen>
		);
	}

	/** Builds in the background; the topics replace the working card when they're ready. */
	const build = () => {
		if (!ai.available) return setError("Sign in to build prep with AI.");
		setError(null);
		startPrep(app, data.stories);
	};

	const done = prep ? prep.topics.filter((topic) => topic.done).length : 0;
	const nextTopic = prep?.topics.find((topic) => !topic.done);
	const interviewAt = app.interview ? new Date(app.interview.at) : null;
	const dueSoon = interviewAt ? dueBefore(deck, interviewAt) : deck.length;

	return (
		<CareerScreen
			action={{
				icon: "Filled/Edit",
				label: "Application",
				onPress: () => careerRoutes.application(app.id),
			}}
		>
			<ScreenTitle
				eyebrow={[
					app.interview?.round || "Interview",
					app.interview ? `${app.interview.minutes} min` : "",
				]
					.filter(Boolean)
					.join(" · ")}
				title={app.company}
			>
				{interviewAt ? (
					<MetaChip
						icon="Filled/Calendar"
						iconTone="statusCaution"
						label={dayAndTime(interviewAt)}
					/>
				) : null}
				{app.interview ? <MetaChip icon="Clock" label={`${app.interview.minutes} min`} /> : null}
				{app.interview ? (
					<MetaChip
						icon="Users"
						label={`${app.interview.interviewers} interviewer${app.interview.interviewers === 1 ? "" : "s"}`}
					/>
				) : null}
				{app.role ? <MetaChip icon="Briefcase" label={app.role} /> : null}
			</ScreenTitle>

			{job ? (
				<AiWorkingCard
					job={job}
					steps={PREP_STEPS}
					onRetry={() => retry(job.key)}
					onDismiss={() => dismiss(job.key)}
				/>
			) : prep ? (
				<View
					style={[
						styles.topics,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							Topics
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{done} of {prep.topics.length} ready
						</PoText>
					</View>
					<View style={styles.segments}>
						<Segments total={prep.topics.length} done={done} />
					</View>
					{prep.topics.map((topic, index) => (
						<ListRow
							key={topic.id}
							title={topic.title}
							subtitle={topic.detail}
							dimmed={topic.done}
							value={topic.id === nextTopic?.id ? "Next" : undefined}
							valueTone="accentDefault"
							leading={<Checkbox checked={topic.done} />}
							onPress={() => void toggleTopic(prep, topic.id)}
							last={index === prep.topics.length - 1}
						/>
					))}
				</View>
			) : (
				<EmptyCard
					icon="Layers"
					title="Build your prep"
					body={`Topics to revise, questions to ask and flashcards for ${app.company}, from the role and your notes.`}
				>
					<PillButton label="Build my prep" onPress={build} />
					{error ? (
						<PoText variant="meta13" tone="textDanger" style={styles.center}>
							{error}
						</PoText>
					) : null}
				</EmptyCard>
			)}

			{deck.length > 0 ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Flashcards, ${deck.length} cards`}
					onPress={() => careerRoutes.flashcards(app.id)}
					style={[
						styles.entry,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<IconTile name="Layers" tone="accentDefault" tile="accentSubtle" />
					<View style={styles.flex}>
						<PoText variant="row15" numberOfLines={1}>
							Flashcards from these topics
						</PoText>
						<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
							{deck.length} cards · {dueSoon} due
							{interviewAt ? ` before ${weekdayShort(interviewAt)}` : ""}
						</PoText>
					</View>
					<View style={[styles.badge, { backgroundColor: colors.accentSubtle }]}>
						<PoText variant="meta13" tone="accentDefault">
							Review
						</PoText>
					</View>
				</Pressable>
			) : null}

			<Stories data={data} onOpen={openStory} />

			{prep && prep.questions.length > 0 ? (
				<>
					<SectionLabel>Questions to ask</SectionLabel>
					<View
						style={[
							styles.questions,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						{prep.questions.map((question) => (
							<PoText key={question} variant="body15" tone="textSecondary">
								{question}
							</PoText>
						))}
					</View>
				</>
			) : null}

			<AiTip>
				{nextTopic
					? `Next: ${nextTopic.title}. Then say one story out loud — about two minutes.`
					: prep
						? "Every topic is ready. Run the flashcards once more before the call."
						: "Add notes about the stack and the people first; the prep follows them."}
			</AiTip>

			<Footer>
				<PillButton
					label="Company notes"
					variant="secondary"
					style={styles.flex}
					onPress={() => careerRoutes.application(app.id)}
				/>
				<PillButton
					label="Review flashcards"
					style={styles.flex}
					disabled={deck.length === 0}
					onPress={() => careerRoutes.flashcards(app.id)}
				/>
			</Footer>
			{storySheet}
		</CareerScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	center: { textAlign: "center" },
	topics: {
		paddingTop: 16,
		paddingBottom: 4,
		paddingHorizontal: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	head: { flexDirection: "row", alignItems: "center" },
	segments: { paddingTop: 10, paddingBottom: 6 },
	entry: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 12,
		paddingRight: 14,
		paddingVertical: 12,
		borderRadius: 24,
		borderWidth: 1,
	},
	badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
	questions: { gap: 4, padding: 16, borderRadius: 28, borderWidth: 1 },
});
