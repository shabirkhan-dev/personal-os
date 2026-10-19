import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { ActionPills, ReadError, ResultCard } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { clock, monthShort } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import {
	currentPlace,
	LOCATE_FAILURE_MESSAGE,
	LOCATE_STAGE_LABEL,
} from "@/lib/location/current-place";
import { voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { finish, restock, saveDay, saveSettings, setUp, tick } from "../data/care-actions";
import { CARE_ASK_JOB, useCareUi } from "../hooks/care-ui-store";
import { useCareToday } from "../hooks/use-care";
import { useUv } from "../hooks/use-uv";
import {
	bodyTiles,
	emptyDay,
	runningLow,
	stepsOn,
	weekdayName,
	weekDays,
	weekStrip,
} from "../lib/care-math";
import type { CareDay, Concern, Routine, SkinType, Step } from "../lib/care-model";
import { parseCareLine } from "../lib/parse-care-line";
import { uvLine } from "../lib/uv";
import { careRoutes } from "../navigation";
import { careAiMessage, useCareAi } from "../services/care-ai";
import {
	Banner,
	BodyTodayCard,
	CareAnswerCard,
	RoutineCard,
	RunningLowCard,
	SetupCard,
	WeekCard,
} from "./home-cards";

const ASK_STEPS = [
	"Reading your routine",
	"Checking your last check-in",
	"Writing an answer",
] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Logged = {
	quote: string;
	title: string;
	subtitle: string;
	previous: CareDay | null;
	day: string;
};

const minutesText = (minutes: number) =>
	clock(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60));

function toggle<T extends string>(list: readonly T[], value: T): T[] {
	return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Care Home: UV, the morning or night routine, body today, the week and what's running low. */
export function CareHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, now, today, record, routine: timeRoutine } = useCareToday();
	const { settings, steps, products, days } = data;
	const ui = useCareUi();
	const ai = useCareAi();
	const { uv, hasPlace } = useUv();
	const askJob = useAiJobs((state) => state.jobs[CARE_ASK_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [notice, setNotice] = useState<string | null>(null);
	const [logged, setLogged] = useState<Logged | null>(null);
	const [concerns, setConcerns] = useState<Concern[]>(["dark-spots", "dryness", "dandruff"]);
	const [skin, setSkin] = useState<SkinType[]>(["normal-combination"]);
	const [building, setBuilding] = useState(false);
	const [locating, setLocating] = useState<string | null>(null);

	const routine: Routine = ui.routine ?? timeRoutine;
	const routineSteps = useMemo(() => stepsOn(steps, routine, today), [steps, routine, today]);

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		careRoutes.checkIn();
	}, [actionRequest]);

	const failed = (what: string) => (error: unknown) => {
		console.error(`[care] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const view = useMemo(() => {
		const week = weekDays(now);
		const cells = weekStrip(steps, days, week, today);
		const tonight = stepsOn(steps, "night", today).filter((step) => step.days.length > 0);
		const tomorrowKey = week[(week.indexOf(today) + 1) % 7] ?? today;
		const tomorrow = stepsOn(steps, "morning", tomorrowKey).filter((step) => step.days.length > 0);
		const noteParts = [
			tonight[0] ? `Tonight · ${tonight.map((step) => step.name.toLowerCase()).join(", ")}` : null,
			tomorrow[0]
				? `tomorrow · ${tomorrow.map((step) => step.name.toLowerCase()).join(", ")}`
				: null,
		].filter(Boolean);
		return {
			cells,
			note: noteParts.length ? noteParts.join(", ") : null,
			tiles: bodyTiles(data.checkIns.at(-1) ?? null, steps, days, now),
			low: runningLow(products, now).slice(0, 3),
		};
	}, [steps, days, products, data.checkIns, now, today]);

	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};

	const onTick = (step: Step) => {
		tick(record, today, step, routineSteps)
			.then((next) => {
				if (next.finished.includes(routine) && !record?.finished.includes(routine)) {
					haptics.success();
					setNotice(`${routine === "morning" ? "Morning" : "Night"} routine done. Nice.`);
				}
			})
			.catch(failed("tick the step"));
	};

	const ask = (question: string, spoken: boolean) => {
		if (!ai.available) {
			say(
				"Questions need a connection and sign-in. You can still tick steps and log care offline.",
				spoken,
			);
			return;
		}
		setNotice(null);
		ui.setAnswer(null);
		const latest = data.checkIns.at(-1);
		startJob(CARE_ASK_JOB, "Thinking about your care", async () => {
			try {
				const answer = await ai.ask({
					question,
					concerns: settings.concerns,
					skin: settings.skin,
					routine: steps.map((step) => ({ routine: step.routine, name: step.name })),
					ratings: (latest?.ratings ?? {}) as Record<string, number>,
					uv: uv?.max ?? null,
				});
				useCareUi.getState().setAnswer({ ...answer, question });
				if (spoken) voiceOut.speak(answer.answer);
			} catch (error) {
				throw new Error(careAiMessage(error), { cause: error });
			}
		});
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseCareLine(text, { steps, habits: data.habits, products, routine });
		if (!intent) return;
		if (intent.kind === "open") {
			if (intent.screen === "routine") careRoutes.routine(routine);
			else if (intent.screen === "check-in") careRoutes.checkIn();
			else careRoutes[intent.screen]();
			return;
		}
		if (intent.kind === "question") {
			ask(intent.text, spoken);
			return;
		}
		if (intent.kind === "restock") {
			const product = products.find((item) => item.id === intent.productId);
			if (!product) return;
			restock(product)
				.then(() => {
					haptics.success();
					say(`${product.name}: new one opened today.`, spoken);
				})
				.catch(failed("restock"));
			return;
		}
		const previous = record;
		const base = record ?? emptyDay(today);
		let title = "";
		if (intent.kind === "routine") {
			const list = stepsOn(steps, intent.routine, today);
			title = `${intent.routine === "morning" ? "Morning" : "Night"} routine · ${list.length} steps`;
			void finish(base, today, list)
				.then(() => haptics.success())
				.catch(failed("log the routine"));
		} else {
			const ticked = { ...base.steps };
			for (const id of intent.stepIds) ticked[id] ??= new Date().toISOString();
			const next: CareDay = {
				...base,
				steps: ticked,
				habits: [...new Set([...base.habits, ...intent.habitIds])],
			};
			const names = [
				...steps.filter((step) => intent.stepIds.includes(step.id)).map((step) => step.name),
				...data.habits
					.filter((habit) => intent.habitIds.includes(habit.id))
					.map((habit) => habit.name),
			];
			title = names.join(" · ");
			const routineDone = routineSteps.length > 0 && routineSteps.every((step) => ticked[step.id]);
			if (routineDone) next.finished = [...new Set([...next.finished, routine])];
			void saveDay(next)
				.then(() => haptics.success())
				.catch(failed("log care"));
		}
		setLogged({ quote: text, title, subtitle: "Today", previous, day: today });
		if (spoken) voiceOut.speak(`Logged ${title}.`);
	};

	// A line said on Talk to OS lands here once Care has loaded.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "skincare") return;
		const line = useAskInbox.getState().take("skincare");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const build = () => {
		setBuilding(true);
		setUp(settings, concerns, skin, { steps, products, habits: data.habits })
			.then(() => haptics.success())
			.catch(failed("build the routine"))
			.finally(() => setBuilding(false));
	};

	const locate = async () => {
		const result = await currentPlace((stage) => setLocating(LOCATE_STAGE_LABEL[stage]));
		setLocating(null);
		if (!result.ok) {
			setNotice(LOCATE_FAILURE_MESSAGE[result.reason]);
			return;
		}
		saveSettings({ ...settings, place: result.place }).catch(failed("save the place"));
	};

	const askBar = (
		<View style={styles.ask}>
			<AskBar suggestions={[]} placeholder="Log care or ask about skin, hair…" onSubmit={onLine} />
			<ActionPills
				actions={[
					{ label: "Log it", icon: "Line/Plus", onPress: () => careRoutes.routine(routine) },
					{ label: "Routines", icon: "List", onPress: () => careRoutes.routine(routine) },
					{ label: "Shelf", icon: "Layers", onPress: careRoutes.shelf },
				]}
			/>
		</View>
	);

	const answers = (
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
					rows={[{ title: logged.title, subtitle: logged.subtitle, value: "Done" }]}
					onUndo={() => {
						void saveDay(logged.previous ?? emptyDay(logged.day)).catch(failed("undo"));
						setLogged(null);
					}}
					onDone={() => setLogged(null)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={ASK_STEPS}
					onRetry={() => retryJob(CARE_ASK_JOB)}
					onDismiss={() => dismissJob(CARE_ASK_JOB)}
				/>
			) : ui.answer ? (
				<CareAnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					followUps={ui.answer.followUps}
					onFollowUp={(question) => ask(question, false)}
					onDone={() => ui.setAnswer(null)}
				/>
			) : null}
		</>
	);

	if (data.error) return <ReadError name="Care" />;

	if (!data.loading && !settings.setUp) {
		return (
			<>
				<SetupCard
					concerns={concerns}
					skin={skin}
					busy={building}
					onConcern={(concern) => setConcerns((list) => toggle(list, concern))}
					onSkin={(type) => setSkin((list) => toggle(list, type))}
					onBuild={build}
				/>
				{askBar}
				{answers}
			</>
		);
	}

	const uvText = uvLine(uv, minutesText(settings.reapplyAt));
	const done = record?.steps ?? {};

	return (
		<>
			{askBar}
			{answers}
			{uvText ? (
				<Banner tone="caution" icon="Sun">
					{uvText}
				</Banner>
			) : !hasPlace ? (
				<View style={styles.locate}>
					<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
						{locating ?? "Sunscreen reminders follow today's UV once I know where you are."}
					</PoText>
					<PillButton
						label={locating ? "Finding…" : "Use my location"}
						variant="secondary"
						disabled={locating !== null}
						onPress={() => void locate()}
					/>
				</View>
			) : null}
			<SegmentedControl
				options={[
					{ value: "morning", label: "Morning" },
					{ value: "night", label: "Night" },
				]}
				value={routine}
				onChange={(value) => ui.setRoutine(value)}
				accessibilityLabel="Routine"
			/>
			{routineSteps.length > 0 ? (
				<RoutineCard
					title={routine === "morning" ? "Morning routine" : "Night routine"}
					steps={routineSteps}
					done={done}
					onTick={onTick}
					onOpen={() => careRoutes.routine(routine)}
				/>
			) : (
				<PillButton
					label={`Add ${routine} steps`}
					variant="secondary"
					onPress={() => careRoutes.routine(routine)}
				/>
			)}
			<BodyTodayCard
				tiles={view.tiles}
				checkInDay={weekdayName(settings.checkInDay)}
				onCheckIn={careRoutes.checkIn}
				onTile={(tile) =>
					tile.label === "Scalp"
						? careRoutes.hair()
						: tile.label === "Face"
							? careRoutes.checkIn()
							: careRoutes.body()
				}
			/>
			{view.cells.some((cell) => cell.label) ? (
				<WeekCard
					cells={view.cells}
					date={`${WEEKDAYS[now.getDay()]} ${now.getDate()} ${monthShort(now)}`}
					note={view.note}
				/>
			) : null}
			{view.low.length > 0 ? (
				<RunningLowCard
					items={view.low}
					count={products.length}
					onOpen={careRoutes.shelf}
					onReorder={(product) =>
						restock(product)
							.then(() => {
								haptics.success();
								setNotice(`${product.name}: marked as a new one from today.`);
							})
							.catch(failed("restock"))
					}
				/>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
	locate: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 6 },
});
