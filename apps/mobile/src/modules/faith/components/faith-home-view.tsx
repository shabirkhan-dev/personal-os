import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import {
	ActionPills,
	ProgressCard,
	ReadError,
	ResultCard,
	SectionLabel,
} from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useSpeaker, voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { addRecitation, logPrayer, restoreLog, saveSettings } from "../data/faith-actions";
import { FAITH_ASK_JOB, useFaithUi } from "../hooks/faith-ui-store";
import { locateLabel, useLocate } from "../hooks/locate-store";
import { elapsedMinutes, useRecitationTimer } from "../hooks/recitation-timer";
import { useFaithToday } from "../hooks/use-faith-today";
import {
	ayahOfTheDay,
	challengeDay,
	challengeShare,
	consistencyGrid,
	currentPrayer,
	momentAt,
	type PrayerRow,
	recitationStreak,
	recitedOn,
} from "../lib/faith-math";
import type { FaithSettings, PrayerLog, PrayerStatus } from "../lib/faith-model";
import { parseFaithLine } from "../lib/parse-faith-line";
import { hhmm, PRAYER_LABELS, type PrayerId, untilLabel } from "../lib/prayer-times";
import { faithRoutes } from "../navigation";
import { faithAiMessage, useFaithAi } from "../services/faith-ai";
import {
	requestReminderPermission,
	scheduleOnce,
	schedulePrayerReminders,
} from "../services/prayer-reminders";
import { AnswerCard, AyahCard } from "./ayah-card";
import { LogPrayerSheet, PrayerSetupSheet, RemindersSheet } from "./faith-sheets";
import {
	ConsistencyCard,
	NeverMissCard,
	SetupCard,
	Shortcuts,
	TodayPrayersCard,
} from "./prayer-cards";

const ASK_STEPS = [
	"Reading your question",
	"Thinking it through",
	"Checking the references",
	"Writing it plainly",
] as const;

const STATUS_WORDS: Record<PrayerStatus, string> = {
	prayed: "on time",
	late: "a little late",
	missed: "missed",
};

type Logged = { quote: string; log: PrayerLog; previous: PrayerLog | null };

/** Faith Home: ask bar, today's prayers, shortcuts, the Moment card, consistency and recitation. */
export function FaithHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, now, rows, prayed, missed, next } = useFaithToday();
	const { settings, logs, sessions, challenge } = data;
	const ui = useFaithUi();
	const ai = useFaithAi();
	const speaker = useSpeaker();
	const askJob = useAiJobs((state) => state.jobs[FAITH_ASK_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [logFor, setLogFor] = useState<{ key: number; prayer: PrayerId | null } | null>(null);
	const [logged, setLogged] = useState<Logged | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const locating = useLocate((state) => state.stage);
	const locateError = useLocate((state) => state.error);
	const timer = useRecitationTimer();

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		faithRoutes.qibla();
	}, [actionRequest]);

	// Times move a little every day, so reminders are rescheduled whenever Home opens or settings change.
	const settingsKey = JSON.stringify(settings);
	useEffect(() => {
		if (data.loading) return;
		schedulePrayerReminders(settings).catch((error: unknown) =>
			console.warn("[faith] could not schedule reminders", error),
		);
		// oxlint-disable-next-line react/exhaustive-deps -- keyed on the settings' content
	}, [settingsKey, data.loading]);

	const view = useMemo(
		() => ({
			grid: consistencyGrid(logs, settings.prayers, now),
			streak: recitationStreak(sessions, now),
			recitedToday: recitedOn(sessions, dayKey(now)),
			moment: momentAt(now, ui.momentsDone),
			ayah: ayahOfTheDay(now, ui.ayahOffset),
		}),
		[logs, settings.prayers, sessions, now, ui.momentsDone, ui.ayahOffset],
	);

	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};

	const save = async (
		prayer: PrayerId,
		status: PrayerStatus | undefined,
		quote: string,
		spoken: boolean,
	) => {
		const row = rows.find((item) => item.prayer === prayer);
		const previous = logs.find((log) => log.id === `${dayKey(now)}:${prayer}`) ?? null;
		try {
			const log = await logPrayer(prayer, { status, prayerAt: row?.at ?? null });
			haptics.success();
			setLogged({ quote, log, previous });
			setNotice(null);
			if (spoken) voiceOut.speak(`Logged ${PRAYER_LABELS[prayer]}, ${STATUS_WORDS[log.status]}.`);
		} catch (error) {
			console.error("[faith] could not log the prayer", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	const ask = (question: string, spoken: boolean) => {
		if (!ai.available) {
			say("Questions need you signed in and online. Logging prayers works offline.", spoken);
			return;
		}
		setNotice(null);
		ui.setAnswer(null);
		startJob(FAITH_ASK_JOB, "Answering your question", async () => {
			try {
				const answer = await ai.ask({
					question,
					tradition: settings.tradition,
					prayers: settings.prayers,
					prayedToday: rows
						.filter((row) => row.log && row.log.status !== "missed")
						.map((row) => row.prayer),
				});
				useFaithUi.getState().setAnswer({ ...answer, question });
				if (spoken) voiceOut.speak(answer.answer);
			} catch (error) {
				throw new Error(faithAiMessage(error), { cause: error });
			}
		});
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseFaithLine(text);
		if (!intent) return;
		if (intent.kind === "prayer") {
			if (!settings.setUp) {
				say("Set up your prayers first, then I can log them.", spoken);
				return;
			}
			const prayer = intent.prayer ?? currentPrayer(rows)?.prayer ?? null;
			if (!prayer || !rows.some((row) => row.prayer === prayer)) {
				say(
					intent.prayer
						? `${PRAYER_LABELS[intent.prayer]} isn't one of your prayers. Add it in Reminders.`
						: "Which prayer? Try “prayed fajr”.",
					spoken,
				);
				return;
			}
			void save(prayer, intent.status, text, spoken);
			return;
		}
		if (intent.kind === "recite") {
			void addRecitation(intent.minutes)
				.then(() => say(`Added ${intent.minutes} minutes of recitation.`, spoken))
				.catch((error: unknown) => {
					console.error("[faith] could not save recitation", error);
					setNotice("Couldn't save on this phone. Try again.");
				});
			return;
		}
		if (intent.kind === "when") {
			const target = intent.prayer
				? rows.find((row) => row.prayer === intent.prayer)
				: next
					? { prayer: next.prayer, at: next.at }
					: null;
			if (!target) {
				say(
					settings.setUp ? "That prayer isn't in your list yet." : "Set up your prayers first.",
					spoken,
				);
				return;
			}
			const ms = target.at.getTime() - now.getTime();
			say(
				`${PRAYER_LABELS[target.prayer]} is at ${hhmm(target.at)}${ms > 0 ? `, in ${untilLabel(ms)}` : ""}.`,
				spoken,
			);
			return;
		}
		if (intent.kind === "open") {
			if (intent.screen === "reminders") ui.openSheet(settings.setUp ? "reminders" : "setup");
			else faithRoutes[intent.screen]();
			return;
		}
		ask(intent.text, spoken);
	};

	const update = (changed: FaithSettings) => {
		saveSettings(changed).catch((error: unknown) => {
			console.error("[faith] could not save settings", error);
			setNotice("Couldn't save on this phone. Try again.");
		});
	};

	const locate = async () => {
		if (await useLocate.getState().locate(settings)) haptics.success();
	};

	const remind = async (at: Date, title: string, body: string, done: string) => {
		const ok = await scheduleOnce(at, title, body).catch((error: unknown) => {
			console.warn("[faith] could not schedule", error);
			return false;
		});
		setNotice(ok ? done : "Turn on notifications for Personal OS to get this reminder.");
	};

	// A line said on Talk to OS lands here once Faith's data has loaded.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "faith") return;
		const line = useAskInbox.getState().take("faith");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const fajr = rows.find((row) => row.prayer === "fajr");
	const tomorrowFajr = fajr ? new Date(fajr.at.getTime() + 24 * 60 * 60_000 - 13 * 60_000) : null;
	const bedtime = new Date(now);
	bedtime.setHours(22, 30, 0, 0);
	const challengeDayNumber = challenge ? challengeDay(challenge, now) : 0;
	const openLog = (row?: PrayerRow) => setLogFor({ key: Date.now(), prayer: row?.prayer ?? null });

	if (data.error) return <ReadError name="Faith" />;

	return (
		<>
			<View style={styles.ask}>
				<AskBar suggestions={[]} placeholder="Log a prayer or ask anything…" onSubmit={onLine} />
				<ActionPills
					actions={[
						{
							label: "Log prayer",
							icon: "Line/Check",
							onPress: () => (settings.setUp ? openLog() : ui.openSheet("setup")),
						},
						{ label: "Recite", icon: "Mic", onPress: faithRoutes.recitation },
						{
							label: "Reminders",
							icon: "Clock",
							onPress: () => ui.openSheet(settings.setUp ? "reminders" : "setup"),
						},
					]}
				/>
			</View>
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
							title: PRAYER_LABELS[logged.log.prayer],
							subtitle: `${hhmm(new Date(logged.log.at))} · ${STATUS_WORDS[logged.log.status]}`,
							value: logged.log.status === "missed" ? "Missed" : "Prayed",
						},
					]}
					onUndo={() => {
						void restoreLog(logged.previous, logged.log).catch((error: unknown) =>
							console.error("[faith] undo failed", error),
						);
						setLogged(null);
					}}
					onDone={() => setLogged(null)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={ASK_STEPS}
					onRetry={() => retryJob(FAITH_ASK_JOB)}
					onDismiss={() => dismissJob(FAITH_ASK_JOB)}
				/>
			) : ui.answer ? (
				<AnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					followUps={ui.answer.followUps}
					speaking={speaker.speaking === "answer"}
					canSpeak={speaker.available}
					onListen={() =>
						speaker.speaking === "answer"
							? speaker.stop()
							: speaker.speak("answer", [{ text: ui.answer?.answer ?? "" }])
					}
					onFollowUp={(question) => ask(question, false)}
					onDone={() => {
						speaker.stop();
						ui.setAnswer(null);
					}}
				/>
			) : null}

			{settings.setUp ? (
				<>
					{missed ? (
						<NeverMissCard
							body={`${missed.label} slipped today.${next ? ` ${PRAYER_LABELS[next.prayer]} is at ${hhmm(next.at)} and I'll remind you ${settings.reminderLead} minutes before.` : ""} An earlier night makes tomorrow's Fajr easier.`}
							primary={
								tomorrowFajr
									? {
											label: `Fajr alarm ${hhmm(tomorrowFajr)}`,
											onPress: () =>
												void remind(
													tomorrowFajr,
													"Fajr is soon",
													"Time to wake up for Fajr.",
													`Fajr alarm set for ${hhmm(tomorrowFajr)}.`,
												),
										}
									: { label: "Reminders", onPress: () => ui.openSheet("reminders") }
							}
							secondary={{
								label: "Sleep by 11",
								onPress: () =>
									void remind(
										bedtime,
										"Wind down for Fajr",
										"Lights out by 11 makes Fajr easier.",
										"I'll nudge you at 22:30 tonight.",
									),
							}}
						/>
					) : null}
					<TodayPrayersCard rows={rows} prayed={prayed} onLog={openLog} />
				</>
			) : (
				<SetupCard
					busy={locateLabel(locating)}
					error={locateError}
					onLocation={() => void locate()}
					onManual={() => ui.openSheet("setup")}
				/>
			)}

			<Shortcuts
				items={[
					{
						label: "Tasbih",
						icon: "Filled/Check all",
						tone: "statusSuccess",
						onPress: faithRoutes.tasbih,
					},
					{
						label: "Qibla",
						icon: "Line/Arrow up",
						tone: "statusCaution",
						onPress: faithRoutes.qibla,
					},
					{ label: "Zakat", icon: "Wallet", tone: "accentDefault", onPress: faithRoutes.zakat },
					{ label: "Grow", icon: "Star", tone: "textPrimary", onPress: faithRoutes.grow },
				]}
			/>

			{view.moment ? (
				<AyahCard
					eyebrow={view.moment.label}
					arabic={view.moment.arabic}
					translation={view.moment.translation}
					speaking={speaker.speaking === view.moment.id}
					canSpeak={speaker.available}
					onRecite={() => {
						const moment = view.moment;
						if (!moment) return;
						if (speaker.speaking === moment.id) speaker.stop();
						else
							speaker.speak(moment.id, [
								{ text: moment.arabic, lang: "ar" },
								{ text: moment.translation },
							]);
					}}
					secondary={{
						label: view.moment.id === "wake" ? "Later" : "Done",
						onPress: () => ui.finishMoment(`${dayKey(now)}:${view.moment?.id ?? ""}`),
					}}
				/>
			) : (
				<AyahCard
					eyebrow={`Ayah of the day · ${view.ayah.surah} ${view.ayah.id}`}
					arabic={view.ayah.arabic}
					translation={view.ayah.translation}
					speaking={speaker.speaking === view.ayah.id}
					canSpeak={speaker.available}
					onRecite={() =>
						speaker.speaking === view.ayah.id
							? speaker.stop()
							: speaker.speak(view.ayah.id, [
									{ text: view.ayah.arabic, lang: "ar", rate: 0.85 },
									{ text: view.ayah.translation },
								])
					}
					secondary={{
						label: "Another",
						onPress: () => {
							speaker.stop();
							ui.nextAyah();
						},
					}}
				/>
			)}

			{settings.setUp ? <ConsistencyCard grid={view.grid} /> : null}

			<ProgressCard
				icon={{ name: "Moon", tone: "statusViolet", tile: "statusVioletSubtle" }}
				title={`Quran recitation · ${settings.recitationMinutes} min`}
				subtitle={
					timer.active
						? `Reciting now · ${Math.max(0, Math.ceil(timer.targetMinutes - elapsedMinutes(timer, now.getTime())))} min left`
						: `After Fajr · ${view.streak}-day streak`
				}
				value={`${Math.round(view.recitedToday)}/${settings.recitationMinutes}`}
				share={view.recitedToday / settings.recitationMinutes}
				barTone="statusViolet"
				onPress={faithRoutes.recitation}
			/>

			<SectionLabel>Grow</SectionLabel>
			<ProgressCard
				icon={{ name: "Star", tone: "statusSuccess", tile: "statusSuccessSubtle" }}
				title={challenge ? challenge.title : "Pick a challenge"}
				subtitle={
					challenge
						? `Day ${challengeDayNumber} of ${challenge.days} · ${challenge.detail.toLowerCase()}`
						: "Quran in 30 days, Fajr on time, and more"
				}
				value={challenge ? `${Math.round(challengeShare(challenge) * 100)}%` : "—"}
				share={challenge ? challengeShare(challenge) : 0}
				barTone="statusSuccess"
				onPress={faithRoutes.grow}
			/>

			{logFor ? (
				<LogPrayerSheet
					key={logFor.key}
					visible
					rows={rows}
					now={now}
					initial={logFor.prayer}
					onClose={() => setLogFor(null)}
					onSave={(prayer, status) => {
						setLogFor(null);
						void save(prayer, status, `${PRAYER_LABELS[prayer]} · ${STATUS_WORDS[status]}`, false);
					}}
				/>
			) : null}
			<RemindersSheet
				visible={ui.sheet === "reminders"}
				settings={settings}
				rows={rows}
				onClose={ui.closeSheet}
				onChange={update}
				locating={locateLabel(locating)}
				locateError={locateError}
				onChangeLocation={() => void locate()}
				onEditTimes={() => ui.openSheet("setup")}
			/>
			{ui.sheet === "setup" ? (
				<PrayerSetupSheet
					visible
					settings={settings}
					locating={locateLabel(locating)}
					locateError={locateError}
					onClose={ui.closeSheet}
					onLocate={() => void locate()}
					onSave={(saved) => {
						update(saved);
						ui.closeSheet();
						requestReminderPermission().catch((error: unknown) =>
							console.warn("[faith] could not ask for notifications", error),
						);
					}}
				/>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
});
