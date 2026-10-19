import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { type AiJob, useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { useFinanceSummary } from "@/modules/finance";
import { AskBar } from "@/modules/home/components/ask-bar";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import {
	addApplication,
	confirmHalal,
	deleteApplication,
	setStage,
	updateApplication,
} from "../data/career-actions";
import { useCareerUi } from "../hooks/career-ui-store";
import { useCareer, useNow } from "../hooks/use-career";
import { prepJobKey, SKILL_PATH_JOB } from "../hooks/use-career-jobs";
import {
	activity,
	appliedThisWeek,
	careerTip,
	followUps,
	nextInterview,
	pipelineCounts,
	prepProgress,
	planWeek,
	shortDate,
	skillStreak,
	todayLine,
	weekDone,
	weekdayIndex,
	weekdayShort,
} from "../lib/career-math";
import { type Application, type Halal, STAGE_LABELS } from "../lib/career-model";
import { looksLikeLink, parseCareerLine } from "../lib/parse-career-line";
import { careerRoutes } from "../navigation";
import { type ParsedLineAi, useCareerAi } from "../services/career-ai";
import { AddApplicationSheet } from "./add-application-sheet";
import { AiTip, EmptyCard, ProgressCard, ResultCard } from "@/components/module-ui";
import {
	ActivityCard,
	FollowUpsCard,
	interviewTitle,
	PipelineCard,
	QuickActions,
} from "./home-cards";
import { NudgeSheet } from "./nudge-sheet";
import { RunwaySheet } from "./runway-sheet";

/** The subtitle for a card whose AI work is running in the background, or null. */
function jobLine(job: AiJob | undefined, running: string): string | null {
	if (!job) return null;
	return job.status === "running" ? running : "AI couldn't finish · tap to retry";
}

/** What the ask bar just did, so it can be undone. */
type Logged = {
	quote: string;
	appId: string;
	/** The application before the change; null when the line created it. */
	previous: Application | null;
	offline: boolean;
};

/** Career Home: ask bar, pipeline, follow-ups, activity, next interview and the skill block. */
export function CareerHomeView({ actionRequest }: HomeModuleViewProps) {
	const data = useCareer();
	const { apps, settings, plan, sessions, stories, senderName } = data;
	const finance = useFinanceSummary();
	const ai = useCareerAi();
	const now = useNow();
	const runwayOpen = useCareerUi((state) => state.runwayOpen);
	const closeRunway = useCareerUi((state) => state.closeRunway);
	const [adding, setAdding] = useState<{ key: number; link: string } | null>(null);
	const [nudgeId, setNudgeId] = useState<string | null>(null);
	const [logged, setLogged] = useState<Logged | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [working, setWorking] = useState(false);
	const jobs = useAiJobs((state) => state.jobs);

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		careerRoutes.applications();
	}, [actionRequest]);

	const view = useMemo(() => {
		const due = followUps(apps, now);
		const interview = nextInterview(apps, now);
		const week = plan ? planWeek(plan, now) : 0;
		const today = weekdayIndex(now);
		return {
			counts: pipelineCounts(apps),
			sent: appliedThisWeek(apps, now),
			due,
			dueCount: due.filter((item) => item.due).length,
			recent: activity(apps, 3),
			interview,
			prep: interview ? (data.preps.find((prep) => prep.id === interview.id) ?? null) : null,
			week,
			todayTitle: plan && today !== null ? plan.weeks[week]?.days[today]?.title : undefined,
			weekDone: weekDone(sessions, week),
			streak: skillStreak(sessions, now),
			tip: careerTip(apps, now, settings),
		};
	}, [apps, data.preps, now, plan, sessions, settings]);

	const openAdd = (link = "") => setAdding({ key: Date.now(), link });

	const logLine = async (text: string) => {
		if (looksLikeLink(text)) return openAdd(text);
		setWorking(true);
		setNotice(null);
		let parsed: ParsedLineAi | null = null;
		let offline = !ai.available;
		if (ai.available) {
			try {
				parsed = await ai.parseLine(text);
			} catch (error) {
				console.warn("[career] AI parse failed, reading it on the phone", error);
				offline = true;
			}
		}
		const local = parseCareerLine(text);
		const application =
			parsed?.application ??
			(local.application
				? { ...local.application, halal: { status: "unsure" as const, note: "" } }
				: null);
		if (!application) {
			setWorking(false);
			setNotice("That doesn't read as a job update. Try “applied to Acme, frontend, remote”.");
			return;
		}
		const halal: Halal = { ...application.halal, confirmed: false };
		try {
			const existing = apps.find(
				(app) =>
					app.company.toLowerCase() === application.company.toLowerCase() && app.stage !== "closed",
			);
			if (existing) {
				await setStage(existing, application.stage);
				setLogged({ quote: text, appId: existing.id, previous: existing, offline });
			} else {
				const created = await addApplication({
					company: application.company,
					role: application.role,
					pay: application.pay,
					where: application.where,
					cv: "",
					link: "",
					stage: application.stage === "saved" ? "saved" : "applied",
					halal,
					followUpInDays: parsed ? parsed.followUpInDays : local.followUpInDays,
				});
				if (application.stage !== "saved" && application.stage !== "applied") {
					await setStage(created, application.stage);
				}
				setLogged({ quote: text, appId: created.id, previous: null, offline });
			}
		} catch (error) {
			console.error("[career] could not log the line", error);
			setNotice("Couldn't save on this phone. Try again.");
		} finally {
			setWorking(false);
		}
	};

	const undo = async () => {
		if (!logged) return;
		const current = apps.find((app) => app.id === logged.appId);
		try {
			if (logged.previous) await updateApplication(logged.previous);
			else if (current)
				await deleteApplication(
					current,
					data.cards.filter((card) => card.deckId === current.id),
				);
		} catch (error) {
			console.error("[career] undo failed", error);
		}
		setLogged(null);
	};

	// A line said on Talk to OS lands here once the applications have loaded.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "career") return;
		const line = useAskInbox.getState().take("career");
		if (line) void logLine(line.text);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const loggedApp = logged ? (apps.find((app) => app.id === logged.appId) ?? null) : null;
	const nudgeApp = nudgeId ? (apps.find((app) => app.id === nudgeId) ?? null) : null;
	const prep = prepProgress(view.prep);
	const pathJob: AiJob | undefined = jobs[SKILL_PATH_JOB];
	const prepJob = view.interview ? jobs[prepJobKey(view.interview.id)] : undefined;
	const empty = !data.loading && apps.length === 0;

	return (
		<>
			<View>
				<AskBar
					suggestions={[]}
					placeholder={working ? "Logging…" : "Paste a job link or log anything…"}
					onSubmit={(text) => void logLine(text)}
				/>
				<QuickActions
					onAdd={() => openAdd()}
					onFollowUp={() => {
						const first = view.due[0];
						if (first) setNudgeId(first.app.id);
						else careerRoutes.applications();
					}}
					onPrep={() => careerRoutes.prep(view.interview?.id)}
				/>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{logged && loggedApp ? (
				<ResultCard
					quote={logged.quote}
					offline={logged.offline}
					onUndo={() => void undo()}
					onDone={() => setLogged(null)}
					rows={[
						{
							title: loggedApp.company,
							subtitle:
								[loggedApp.role, loggedApp.pay, loggedApp.where].filter(Boolean).join(" · ") ||
								"Add the details",
							value: STAGE_LABELS[loggedApp.stage],
							onPress: () => careerRoutes.application(loggedApp.id),
						},
						...(loggedApp.followUpAt
							? [
									{
										title: "Follow-up",
										subtitle: `Reminder on ${weekdayShort(new Date(loggedApp.followUpAt))} ${shortDate(new Date(loggedApp.followUpAt))}`,
										value: "Set",
									},
								]
							: []),
						{
							title: "Halal check",
							subtitle: loggedApp.halal.note || "Check what the company earns from.",
							value: loggedApp.halal.confirmed ? "Confirmed" : "Confirm",
							onPress: loggedApp.halal.confirmed
								? undefined
								: () =>
										void confirmHalal(loggedApp).catch((error: unknown) => {
											console.error("[career] could not confirm the halal check", error);
											setNotice("Couldn't save on this phone. Try again.");
										}),
						},
					]}
				/>
			) : null}
			<PipelineCard
				counts={view.counts}
				appliedThisWeek={view.sent}
				weeklyTarget={settings.weeklyTarget}
				todayLine={todayLine(settings, view.dueCount, plan !== null)}
				onPress={careerRoutes.applications}
			/>
			{empty ? (
				<EmptyCard
					icon="Briefcase"
					title="Start your pipeline"
					body="Paste a job link and I'll fill in the company, role and pay. Aim for 2 today."
				>
					<PillButton label="Paste a job link" onPress={() => openAdd()} />
					<PillButton label="Add manually" variant="ghost" onPress={() => openAdd()} />
				</EmptyCard>
			) : null}
			{view.due.length > 0 ? (
				<FollowUpsCard
					items={view.due}
					now={now}
					onNudge={setNudgeId}
					onOpen={careerRoutes.application}
					onAll={careerRoutes.applications}
				/>
			) : null}
			{view.recent.length > 0 ? (
				<ActivityCard
					items={view.recent}
					onOpen={careerRoutes.application}
					onAll={careerRoutes.applications}
				/>
			) : null}
			{view.interview?.interview ? (
				<ProgressCard
					icon={{ name: "Filled/Calendar", tone: "accentDefault", tile: "accentSubtle" }}
					title={interviewTitle(view.interview.company, view.interview.interview.at)}
					subtitle={
						jobLine(prepJob, "Prep · building in the background…") ??
						(prep.total > 0
							? `Prep · ${prep.done} of ${prep.total} topics done`
							: "Prep · not built yet")
					}
					value={prep.total > 0 ? `${Math.round((prep.done / prep.total) * 100)}%` : "0%"}
					share={prep.total > 0 ? prep.done / prep.total : 0}
					barTone="accentDefault"
					onPress={() => careerRoutes.prep(view.interview?.id)}
				/>
			) : null}
			<ProgressCard
				icon={{ name: "Lightning", tone: "statusCaution", tile: "statusCautionSubtle" }}
				title={
					plan
						? `Skill block · ${view.todayTitle ?? plan.weeks[view.week]?.title ?? plan.title}`
						: "Skill block"
				}
				subtitle={
					jobLine(pathJob, "Planning your path in the background…") ??
					(plan ? `30 min today · ${view.streak}-day streak` : "Pick a skill, 30 minutes a day")
				}
				value={plan ? `${view.weekDone}/${plan.weeks[view.week]?.days.length ?? 5}` : "—"}
				share={plan ? view.weekDone / Math.max(1, plan.weeks[view.week]?.days.length ?? 5) : 0}
				barTone="statusCaution"
				onPress={careerRoutes.skill}
			/>
			<AiTip>{view.tip}</AiTip>

			{adding ? (
				<AddApplicationSheet
					key={adding.key}
					visible
					initialLink={adding.link}
					onClose={() => setAdding(null)}
					onSaved={(company) => {
						setAdding(null);
						setNotice(`${company} added to your pipeline.`);
					}}
				/>
			) : null}
			{nudgeApp ? (
				<NudgeSheet
					key={nudgeApp.id}
					visible
					app={nudgeApp}
					stories={stories}
					senderName={senderName}
					onClose={() => setNudgeId(null)}
					onSent={() => setNudgeId(null)}
				/>
			) : null}
			{runwayOpen ? (
				<RunwaySheet
					visible
					settings={settings}
					spentThisMonth={finance.spentThisMonth}
					onClose={closeRunway}
				/>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	notice: { paddingHorizontal: 6 },
});
