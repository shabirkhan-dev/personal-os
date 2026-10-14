import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { haptics } from "@/lib/haptics";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { useNow } from "../hooks/use-now";
import { useStepHistory } from "../hooks/use-step-history";
import { energyDay } from "../lib/energy";
import { monthCells } from "../lib/grid";
import { estimateKcal } from "../lib/kcal";
import { parseWorkoutText } from "../lib/parse-log";
import { trainingScore, weekBars } from "../lib/score";
import { addEnergy, addSession, useWorkoutStore } from "../store/workout-store";
import { EnergyCard } from "./energy-card";
import { EnergySheet } from "./energy-sheet";
import { type LogDraft, LogSheet } from "./log-sheet";
import { SessionSheet } from "./session-sheet";
import { StepsCard } from "./steps-card";
import { TrainingScoreCard } from "./training-score-card";
import { type MonthRange, WorkoutDaysCard } from "./workout-days-card";
import { WeekSheet } from "./week-sheet";

type OpenSheet = "session" | "log" | "energy" | "week" | null;

const RUN_DRAFT: LogDraft = { type: "run" };
const DEFAULT_ENERGY = 60;

/** Workout Home: ask bar, Training score, Steps, Workout days and Energy. */
export function WorkoutHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, hydrate } = useWorkoutStore();
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const heightCm = useOnboardingStore((state) => state.heightCm);
	const workdays = useOnboardingStore((state) => state.workdays);
	const { history, reload } = useStepHistory();

	const [sheet, setSheet] = useState<OpenSheet>(null);
	const [draft, setDraft] = useState<LogDraft>(RUN_DRAFT);
	const [range, setRange] = useState<MonthRange>("last");

	useEffect(() => {
		hydrate();
	}, [hydrate]);

	useEffect(() => {
		if (actionRequest > 0) setSheet("session");
	}, [actionRequest]);

	const today = useNow();
	const bars = weekBars(data.sessions, today);
	const month = new Date(today.getFullYear(), today.getMonth() - (range === "last" ? 1 : 0), 1);
	const derived = {
		bars,
		score: trainingScore(bars),
		cells: monthCells(data.sessions, month, workdays, today),
		energy: energyDay(data.energy, today),
	};

	const openLog = (next: LogDraft) => {
		setDraft(next);
		setSheet("log");
	};

	const onSubmit = (text: string) => {
		const parsed = parseWorkoutText(text);
		if (parsed?.kind === "energy") {
			addEnergy(parsed.level);
			haptics.success();
			return;
		}
		if (parsed?.kind === "session" && parsed.durationMin) {
			addSession({
				type: parsed.type,
				title: parsed.title,
				startedAt: new Date(Date.now() - parsed.durationMin * 60000).toISOString(),
				durationMin: parsed.durationMin,
				...(parsed.distanceKm ? { distanceKm: parsed.distanceKm } : {}),
				kcal: estimateKcal(parsed.type, parsed.durationMin, weightKg, parsed.distanceKm),
				feel: null,
			});
			haptics.success();
			return;
		}
		if (parsed?.kind === "session") {
			openLog({ type: parsed.type, distanceKm: parsed.distanceKm, durationMin: null });
			return;
		}
		openLog(RUN_DRAFT);
	};

	return (
		<View style={styles.column}>
			<AskBar
				placeholder="Log a workout or energy…"
				suggestions={[
					{
						label: data.active ? "Workout running" : "Start workout",
						onPress: () => setSheet("session"),
					},
					{ label: "Log a run", onPress: () => openLog(RUN_DRAFT) },
					{ label: "Log energy", onPress: () => setSheet("energy") },
				]}
				onSubmit={onSubmit}
			/>
			<TrainingScoreCard
				bars={derived.bars}
				score={derived.score}
				onOpen={() => setSheet("week")}
			/>
			<StepsCard history={history} heightCm={heightCm} onRetry={reload} />
			<WorkoutDaysCard
				cells={derived.cells}
				range={range}
				onToggleRange={() => setRange((value) => (value === "last" ? "this" : "last"))}
			/>
			<EnergyCard day={derived.energy} onLog={() => setSheet("energy")} />

			<SessionSheet visible={sheet === "session"} onClose={() => setSheet(null)} />
			<LogSheet visible={sheet === "log"} draft={draft} onClose={() => setSheet(null)} />
			<EnergySheet
				visible={sheet === "energy"}
				initial={derived.energy.latest?.level ?? DEFAULT_ENERGY}
				onClose={() => setSheet(null)}
			/>
			<WeekSheet
				visible={sheet === "week"}
				bars={derived.bars}
				sessions={data.sessions}
				onClose={() => setSheet(null)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	column: { gap: 16 },
});
