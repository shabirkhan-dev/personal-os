import { create } from "zustand";
import type { Birthday } from "../lib/insights";
import {
	type ConnectionId,
	type Gender,
	type GoalId,
	goalModule,
	type HeightUnit,
	MAX_GOALS,
	type ModuleId,
	type ReminderId,
	type StartPath,
	type WeightUnit,
	type WorkStyle,
} from "../lib/options";
import { transcriptAnswers } from "../lib/transcript";

export type OnboardingAnswers = {
	path: StartPath;
	name: string;
	gender: Gender | null;
	birthday: Birthday;
	heightCm: number;
	weightKg: number;
	heightUnit: HeightUnit;
	weightUnit: WeightUnit;
	wakeMinutes: number;
	bedMinutes: number;
	workStartMinutes: number;
	workEndMinutes: number;
	/** Monday-first, 7 entries. */
	workdays: boolean[];
	workStyle: WorkStyle;
	/** Ordered by priority, at most three. */
	goals: GoalId[];
	modules: ModuleId[];
	connections: Record<ConnectionId, boolean>;
	appleHealth: boolean;
	heyOs: boolean;
	reminders: Record<ReminderId, boolean>;
	completed: boolean;
};

type OnboardingActions = {
	set: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
	/** Adds a goal at the next rank or removes it and closes the gap. */
	toggleGoal: (goal: GoalId) => void;
	toggleModule: (moduleId: ModuleId) => void;
	toggleWorkday: (index: number) => void;
	toggleConnection: (connection: ConnectionId) => void;
	toggleReminder: (reminder: ReminderId) => void;
	/** Applies the facts understood from the "Just talk" transcript. */
	applyTranscript: (today?: Date) => void;
	/** Recommended modules from the ranked goals (daily life is always on). */
	syncModulesWithGoals: () => void;
	complete: () => void;
	reset: () => void;
};

export const initialAnswers: OnboardingAnswers = {
	path: "talk",
	name: "",
	gender: null,
	birthday: { day: 12, month: 3, year: 1998 },
	heightCm: 175,
	weightKg: 72,
	heightUnit: "cm",
	weightUnit: "kg",
	wakeMinutes: 6 * 60 + 30,
	bedMinutes: 23 * 60,
	workStartMinutes: 9 * 60,
	workEndMinutes: 18 * 60,
	workdays: [true, true, true, true, true, false, false],
	workStyle: "hybrid",
	goals: [],
	modules: ["daily-life"],
	connections: { calendar: true, smartwatch: false, "bank-sms": false, microphone: false },
	appleHealth: true,
	heyOs: true,
	reminders: {
		"morning-plan": true,
		"evening-check-in": true,
		"workout-nudge": true,
		"bill-reminders": true,
	},
	completed: false,
};

export function modulesForGoals(goals: readonly GoalId[]): ModuleId[] {
	const modules: ModuleId[] = ["daily-life"];
	for (const goal of goals) {
		const moduleId = goalModule[goal];
		if (moduleId && !modules.includes(moduleId)) modules.push(moduleId);
	}
	return modules;
}

export const useOnboardingStore = create<OnboardingAnswers & OnboardingActions>()((set, get) => ({
	...initialAnswers,
	set: (key, value) => set({ [key]: value } as Pick<OnboardingAnswers, typeof key>),
	toggleGoal: (goal) => {
		const goals = get().goals;
		if (goals.includes(goal)) {
			set({ goals: goals.filter((item) => item !== goal) });
		} else if (goals.length < MAX_GOALS) {
			set({ goals: [...goals, goal] });
		}
	},
	toggleModule: (moduleId) => {
		const modules = get().modules;
		set({
			modules: modules.includes(moduleId)
				? modules.filter((item) => item !== moduleId)
				: [...modules, moduleId],
		});
	},
	toggleWorkday: (index) => {
		set({ workdays: get().workdays.map((on, day) => (day === index ? !on : on)) });
	},
	toggleConnection: (connection) => {
		const connections = get().connections;
		set({ connections: { ...connections, [connection]: !connections[connection] } });
	},
	toggleReminder: (reminder) => {
		const reminders = get().reminders;
		set({ reminders: { ...reminders, [reminder]: !reminders[reminder] } });
	},
	applyTranscript: (today = new Date()) => {
		const answers = transcriptAnswers(today);
		set({ ...answers, path: "talk", modules: modulesForGoals(answers.goals) });
	},
	syncModulesWithGoals: () => set({ modules: modulesForGoals(get().goals) }),
	complete: () => set({ completed: true }),
	reset: () => set(initialAnswers),
}));
