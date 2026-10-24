import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { ActionPills, ListCard, ListRow, ReadError, ResultCard } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { deleteSession, logSession, setUp } from "../data/training-actions";
import { startSession } from "../hooks/live-actions";
import { TRAINING_ASK_JOB, useTrainingUi } from "../hooks/training-ui-store";
import { useStepHistory } from "../hooks/use-step-history";
import { useTrainingToday } from "../hooks/use-training";
import { templateById } from "../lib/library";
import { parseTrainingLine } from "../lib/parse-training-line";
import {
	personalBests,
	sessionLine,
	sessionsOnDay,
	sessionsOnDays,
	slotState,
	weekdayShort,
} from "../lib/training-math";
import type { Activity } from "../lib/activities";
import type { Session, Sport } from "../lib/training-model";
import { trainingRoutes } from "../navigation";
import { trainingAiMessage, useTrainingAi } from "../services/training-ai";
import {
	type ActivityRow,
	ActivityCard,
	BestsRow,
	RecentCard,
	SetupCard,
	SPORT_TONES,
	TodayCard,
	TrainingAnswerCard,
	WeekDotsCard,
} from "./home-cards";
import { ActivitiesCard } from "./activities-card";
import { ActivityEditorSheet } from "./activity-editor-sheet";
import { LogSheet } from "./log-sheet";
import { ActiveProgramCard, ProgramPromptCard } from "./program-cards";

const ASK_STEPS = ["Reading your week", "Checking recent sessions", "Writing an answer"] as const;
const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

const dayLabel = (iso: string) => {
	const short = weekdayShort(dayKey(new Date(iso)));
	return short.charAt(0) + short.slice(1).toLowerCase();
};

const toggle = <T,>(list: readonly T[], value: T): T[] =>
	list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

/**
 * Training Home: today's session, the program, your activities, the week, movement, recent sessions,
 * bests and the tools.
 */
export function TrainingHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, now, today, week, plan, template, count, active } = useTrainingToday();
	const { settings, sessions } = data;
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const { history } = useStepHistory();
	const ui = useTrainingUi();
	const ai = useTrainingAi();
	const askJob = useAiJobs((state) => state.jobs[TRAINING_ASK_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [notice, setNotice] = useState<string | null>(null);
	const [logged, setLogged] = useState<{ quote: string; session: Session } | null>(null);
	const [logging, setLogging] = useState(false);
	/** The activity the log sheet opens on. */
	const [logActivity, setLogActivity] = useState<string | null>(null);
	const [editingActivity, setEditingActivity] = useState<Activity | "new" | null>(null);
	const [sports, setSports] = useState<Sport[]>(["calisthenics", "running", "boxing"]);
	const [days, setDays] = useState(5);
	const [building, setBuilding] = useState(false);

	/** Activities (a match, a class) are logged; workouts run live. */
	const openLog = (activityId: string | null) => {
		setLogActivity(activityId);
		setLogging(true);
	};
	const start = () => {
		if (template?.id.startsWith("a:")) openLog(template.id.slice(2));
		else if (template) startSession(template.id);
		else trainingRoutes.plan();
	};

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		start();
		// oxlint-disable-next-line react/exhaustive-deps -- runs when the header button is pressed
	}, [actionRequest]);

	const failed = (what: string) => (error: unknown) => {
		console.error(`[training] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const ask = (question: string, spoken: boolean) => {
		if (!ai.available) {
			const text = template
				? `Today is ${template.title}: ${template.short}. ${count.done} of ${count.goal} done this week.`
				: "Rest day today. A walk or mobility counts.";
			setNotice(text);
			if (spoken) voiceOut.speak(text);
			return;
		}
		ui.setAnswer(null);
		setNotice(null);
		startJob(TRAINING_ASK_JOB, "Thinking about your training", async () => {
			try {
				const answer = await ai.ask({
					question,
					sports: settings.sports,
					phase: settings.phase,
					week: (plan?.slots ?? []).map((slot) => ({
						day: slot.day,
						title: templateById(slot.template)?.title ?? "Rest",
						status: slotState(slot, sessions, today),
					})),
					recent: sessions.slice(0, 8).map((session) => ({
						day: dayKey(new Date(session.startedAt)),
						title: session.title,
						line: sessionLine(session),
					})),
				});
				useTrainingUi.getState().setAnswer({ ...answer, question });
				if (spoken) voiceOut.speak(answer.answer);
			} catch (error) {
				throw new Error(trainingAiMessage(error), { cause: error });
			}
		});
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseTrainingLine(text);
		if (!intent) return;
		if (intent.kind === "question") {
			ask(intent.text, spoken);
			return;
		}
		if (intent.kind === "start") {
			start();
			return;
		}
		if (intent.kind === "open") {
			if (intent.screen === "timer") trainingRoutes.boxing();
			else trainingRoutes[intent.screen]();
			return;
		}
		const line = intent.session;
		logSession(
			{
				template: line.template,
				sport: line.sport,
				title: line.title,
				startedAt: new Date(Date.now() - line.durationMin * 60_000).toISOString(),
				durationMin: line.durationMin,
				distanceKm: line.distanceKm,
				rounds: line.rounds,
				sets: line.sets,
			},
			weightKg,
		)
			.then((session) => {
				haptics.success();
				setLogged({ quote: text, session });
				if (spoken) voiceOut.speak(`Logged ${session.title}.`);
			})
			.catch(failed("log the session"));
	};

	// A line said on Talk to OS lands here.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "workout") return;
		const line = useAskInbox.getState().take("workout");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const askBar = (
		<View style={styles.ask}>
			<AskBar
				suggestions={[]}
				placeholder="Log a session or ask what to train…"
				onSubmit={onLine}
			/>
			<ActionPills
				actions={[
					{ label: "Start", icon: "Filled/Play", onPress: start },
					{ label: "Programs", icon: "List", onPress: trainingRoutes.programs },
					{ label: "Log it", icon: "Line/Plus", onPress: () => openLog(null) },
					{ label: "Calendar", icon: "Filled/Calendar", onPress: trainingRoutes.calendar },
				]}
			/>
		</View>
	);

	const extras = (
		<>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{logged ? (
				<ResultCard
					quote={logged.quote}
					offline={!ai.available}
					rows={[
						{
							title: logged.session.title,
							subtitle: sessionLine(logged.session),
							value: "Logged",
							onPress: () => trainingRoutes.session(logged.session.id),
						},
					]}
					onUndo={() => {
						void deleteSession(logged.session).catch(failed("undo"));
						setLogged(null);
					}}
					onDone={() => setLogged(null)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={ASK_STEPS}
					onRetry={() => retryJob(TRAINING_ASK_JOB)}
					onDismiss={() => dismissJob(TRAINING_ASK_JOB)}
				/>
			) : ui.answer ? (
				<TrainingAnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					followUps={ui.answer.followUps}
					onFollowUp={(question) => ask(question, false)}
					onDone={() => ui.setAnswer(null)}
				/>
			) : null}
			<LogSheet
				visible={logging}
				weightKg={weightKg}
				activities={data.activities}
				initialActivity={logActivity}
				onClose={() => setLogging(false)}
				onLogged={(session) => setLogged({ quote: "Logged by hand", session })}
			/>
			<ActivityEditorSheet
				visible={editingActivity !== null}
				activity={editingActivity === "new" ? null : editingActivity}
				existing={data.activities}
				onClose={() => setEditingActivity(null)}
			/>
		</>
	);

	if (data.error) return <ReadError name="Training" />;

	if (!data.loading && !settings.setUp) {
		return (
			<>
				<SetupCard
					sports={sports}
					days={days}
					busy={building}
					onPrograms={trainingRoutes.programs}
					onActivity={() => setEditingActivity("new")}
					onSport={(sport) => setSports((list) => toggle(list, sport))}
					onDays={setDays}
					onBuild={() => {
						setBuilding(true);
						setUp(settings, sports, days)
							.then(() => haptics.success())
							.catch(failed("build the week"))
							.finally(() => setBuilding(false));
					}}
				/>
				{askBar}
				{extras}
			</>
		);
	}

	const doneToday = sessionsOnDay(sessions, today).length > 0;
	const cells = week.map((day) => {
		const slot = plan?.slots.find((item) => item.day === day);
		return {
			day,
			letter: LETTERS[new Date(`${day}T12:00:00`).getDay()] ?? "",
			state: slot
				? slotState(slot, sessions, today)
				: day === today
					? ("today" as const)
					: ("rest" as const),
		};
	});
	const todaySessions = sessionsOnDay(sessions, today);
	const steps = history.status === "ready" ? (history.days.at(-1)?.steps ?? 0) : null;
	const activity: ActivityRow[] = [
		...(steps !== null
			? [
					{
						icon: "Footsteps" as const,
						tone: "statusSuccess" as const,
						tile: "statusSuccessSubtle" as const,
						label: "Steps",
						value: steps,
						goal: settings.stepsGoal,
						unit: "",
					},
				]
			: []),
		{
			icon: "Lightning",
			tone: "statusCaution",
			tile: "statusCautionSubtle",
			label: "Active",
			value: todaySessions.reduce((sum, session) => sum + session.kcal, 0),
			goal: settings.activeGoal,
			unit: " kcal",
		},
		{
			icon: "Clock",
			tone: "statusDanger",
			tile: "statusDangerSubtle",
			label: "Move",
			value: todaySessions.reduce((sum, session) => sum + session.durationMin, 0),
			goal: settings.moveGoal,
			unit: " min",
		},
	];
	const thisWeek = sessionsOnDays(sessions, week);
	const recent = sessions.slice(0, 3).map((session) => ({
		id: session.id,
		day: dayLabel(session.startedAt),
		title: session.title,
		line: sessionLine(session),
		tone: SPORT_TONES[session.sport],
	}));
	const bests = personalBests(sessions, now);

	return (
		<>
			{askBar}
			{extras}
			{template ? (
				<TodayCard
					template={template}
					at={settings.trainAt}
					done={doneToday}
					onOpen={() => trainingRoutes.plan(template.id)}
					onStart={() => (doneToday ? trainingRoutes.session(todaySessions[0]?.id ?? "") : start())}
				/>
			) : (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					Rest day today. A walk or a few minutes of mobility still counts.
				</PoText>
			)}
			{active ? (
				<ActiveProgramCard
					program={active.program}
					week={active.week}
					finished={active.finished}
					onPress={() => trainingRoutes.program(active.program.id)}
				/>
			) : (
				<ProgramPromptCard onPress={trainingRoutes.programs} />
			)}
			<ActivitiesCard
				activities={data.activities}
				onLog={(item) => openLog(item.id)}
				onEdit={(item) => setEditingActivity(item)}
				onAdd={() => setEditingActivity("new")}
			/>
			<WeekDotsCard cells={cells} goal={count.goal} onPress={trainingRoutes.week} />
			<ActivityCard
				rows={activity}
				source={
					steps !== null
						? "From your phone"
						: Platform.OS === "android"
							? "Steps need Health Connect"
							: "From your sessions"
				}
			/>
			{recent.length > 0 ? (
				<RecentCard rows={recent} count={thisWeek.length} onRow={trainingRoutes.session} />
			) : null}
			{bests.length > 0 ? <BestsRow bests={bests} /> : null}
			<ListCard>
				<ListRow
					title="Exercise library"
					subtitle="Demos, cues and videos; add your own"
					icon={{ name: "Dumbbell", tone: "accentDefault", tile: "accentSubtle" }}
					chevron
					onPress={trainingRoutes.exercises}
				/>
				<ListRow
					title="Rounds timer"
					subtitle="Boxing and interval rounds"
					icon={{ name: "Clock", tone: "statusDanger", tile: "statusDangerSubtle" }}
					chevron
					onPress={trainingRoutes.boxing}
				/>
				<ListRow
					title="Progress and insights"
					subtitle="Bests, volume, consistency"
					icon={{ name: "Filled/Chart", tone: "statusSuccess", tile: "statusSuccessSubtle" }}
					chevron
					last
					onPress={trainingRoutes.insights}
				/>
			</ListCard>
		</>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
});
