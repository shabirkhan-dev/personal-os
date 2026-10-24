import type { ChainId, ProgramDef, ProgramItem, ProgramSession, Range } from "./program-model";

/** Programs that come with the app. Ids are stored on people's settings: never rename one. */

const chain = (
	id: ChainId,
	sets: number,
	range: Range,
	restS: number,
	hold: Range = [20, 40],
): ProgramItem => ({ kind: "chain", chain: id, sets, range, hold, restS });

const exercise = (
	id: string,
	sets: number,
	range: Range,
	restS: number,
	grow?: number,
): ProgramItem => ({
	kind: "exercise",
	exercise: id,
	sets,
	range,
	restS,
	...(grow ? { grow } : {}),
});

const WARM_UP = exercise("shoulder-warm-up", 1, [5, 5], 0);
const WRISTS = exercise("wrist-prep", 1, [3, 3], 0);
const HIPS = exercise("worlds-greatest-stretch", 1, [5, 5], 0);

const session = (spec: ProgramSession): ProgramSession => spec;

// --- shared sessions ------------------------------------------------------------------------------

const EASY_RUN = (range: Range = [25, 45]) =>
	session({
		key: "easy-run",
		title: "Easy run",
		sport: "running",
		focus: "run",
		minutes: range[0],
		effort: 4,
		items: [exercise("easy-run", 1, range, 0, 0.08)],
	});

const TEMPO_RUN = (range: Range = [15, 30]) =>
	session({
		key: "tempo-run",
		title: "Tempo run",
		sport: "running",
		focus: "run",
		minutes: range[0] + 20,
		effort: 7,
		items: [exercise("tempo-run", 1, range, 0, 0.1)],
	});

const INTERVALS = (sets = 6) =>
	session({
		key: "intervals",
		title: "Run intervals",
		sport: "running",
		focus: "run",
		minutes: 40,
		effort: 8,
		items: [exercise("run-intervals", sets, [2, 3], 90, 0.06)],
	});

const LONG_RUN = (range: Range = [40, 70]) =>
	session({
		key: "long-run",
		title: "Long run",
		sport: "running",
		focus: "run",
		minutes: range[0],
		effort: 6,
		items: [exercise("long-run", 1, range, 0, 0.07)],
	});

const BOXING = (start = 5, max = 8) =>
	session({
		key: "boxing",
		title: "Shadow boxing",
		sport: "boxing",
		focus: "boxing",
		minutes: start * 4,
		effort: 7,
		items: [exercise("shadow-boxing", start, [3, 3], 60)],
		rounds: { start, max, roundMin: 3, restMin: 1 },
	});

const MOBILITY = session({
	key: "mobility",
	title: "Mobility flow",
	sport: "yoga",
	focus: "mobility",
	minutes: 25,
	effort: 2,
	items: [
		exercise("cat-cow", 1, [3, 3], 0),
		exercise("worlds-greatest-stretch", 2, [5, 5], 0),
		exercise("low-lunge", 2, [45, 45], 0),
		exercise("pigeon-stretch", 2, [60, 60], 0),
		exercise("childs-pose", 1, [60, 60], 0),
	],
});

// --- programs -------------------------------------------------------------------------------------

const HYBRID: ProgramDef = {
	id: "hybrid-athlete",
	title: "Hybrid Athlete",
	goal: "Strong, fast and fit for any sport",
	summary:
		"Calisthenics strength three times a week, two runs and a boxing session, built around your team days. Every exercise moves up a variation when you own the rep range.",
	kind: "hybrid",
	weeks: 8,
	level: "intermediate",
	sports: ["calisthenics", "running", "boxing"],
	equipment: ["pull-up-bar"],
	photo: "handstand",
	sessions: [
		session({
			key: "push",
			title: "Push + handstand",
			sport: "calisthenics",
			focus: "upper",
			minutes: 45,
			effort: 7,
			items: [
				WARM_UP,
				chain("handstand", 3, [4, 8], 60, [20, 45]),
				chain("vertical-push", 3, [6, 10], 90),
				chain("push", 4, [8, 15], 90),
				chain("dip", 3, [6, 12], 90),
				chain("core", 3, [10, 15], 45, [20, 45]),
			],
		}),
		session({
			key: "pull",
			title: "Pull + core",
			sport: "calisthenics",
			focus: "upper",
			minutes: 45,
			effort: 7,
			items: [
				WARM_UP,
				chain("pull", 4, [4, 8], 120),
				chain("row", 3, [8, 12], 90),
				chain("lever", 3, [6, 10], 90, [8, 15]),
				chain("core", 3, [8, 12], 60, [20, 45]),
			],
		}),
		session({
			key: "legs",
			title: "Legs + power",
			sport: "calisthenics",
			focus: "lower",
			minutes: 40,
			effort: 7,
			items: [
				HIPS,
				chain("squat", 4, [6, 12], 90),
				chain("hinge", 3, [8, 12], 60),
				exercise("jump-squat", 3, [8, 10], 60),
				exercise("walking-lunge", 2, [16, 20], 60),
			],
		}),
		EASY_RUN(),
		TEMPO_RUN(),
		BOXING(5, 8),
	],
	schedule: {
		2: ["pull", "push"],
		3: ["pull", "easy-run", "push"],
		4: ["pull", "easy-run", "push", "legs"],
		5: ["pull", "easy-run", "push", "boxing", "legs"],
		6: ["pull", "easy-run", "push", "boxing", "legs", "tempo-run"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "built-in",
	createdAt: null,
};

const FOUNDATIONS: ProgramDef = {
	id: "calisthenics-foundations",
	title: "Calisthenics Foundations",
	goal: "Your first pull-ups, solid push-ups and pistols",
	summary:
		"Three full-body sessions a week that cover every pattern. Starts wherever you are, from incline push-ups and negative pull-ups up.",
	kind: "strength",
	weeks: 8,
	level: "beginner",
	sports: ["calisthenics"],
	equipment: ["pull-up-bar"],
	photo: "pull-ups",
	sessions: [
		session({
			key: "full-a",
			title: "Full body A",
			sport: "calisthenics",
			focus: "full",
			minutes: 40,
			effort: 6,
			items: [
				WARM_UP,
				chain("push", 3, [6, 12], 90),
				chain("pull", 3, [3, 8], 120),
				chain("squat", 3, [8, 15], 90),
				chain("core", 3, [8, 12], 45, [20, 40]),
			],
		}),
		session({
			key: "full-b",
			title: "Full body B",
			sport: "calisthenics",
			focus: "full",
			minutes: 40,
			effort: 6,
			items: [
				WARM_UP,
				chain("dip", 3, [5, 10], 90),
				chain("row", 3, [6, 12], 90),
				chain("hinge", 3, [8, 15], 60),
				chain("vertical-push", 3, [5, 10], 90),
			],
		}),
		session({
			key: "full-c",
			title: "Full body C",
			sport: "calisthenics",
			focus: "full",
			minutes: 40,
			effort: 6,
			items: [
				WARM_UP,
				chain("push", 3, [8, 15], 90),
				chain("pull", 3, [3, 8], 120),
				exercise("walking-lunge", 3, [12, 20], 60),
				exercise("side-plank", 2, [20, 40], 30),
			],
		}),
		MOBILITY,
	],
	schedule: {
		2: ["full-a", "full-b"],
		3: ["full-a", "full-b", "full-c"],
		4: ["full-a", "full-b", "full-c", "mobility"],
		5: ["full-a", "mobility", "full-b", "full-c", "mobility"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "built-in",
	createdAt: null,
};

const HANDSTAND: ProgramDef = {
	id: "handstand-6",
	title: "Handstand in 6 Weeks",
	goal: "A 30-second wall hold and your first free seconds",
	summary:
		"Short, frequent practice: wrists, balance work up the handstand ladder and the shoulder strength to hold it. Best with 4 or 5 short sessions a week.",
	kind: "skill",
	weeks: 6,
	level: "beginner",
	sports: ["calisthenics"],
	equipment: [],
	photo: "handstand-hero",
	sessions: [
		session({
			key: "practice",
			title: "Handstand practice",
			sport: "calisthenics",
			focus: "skill",
			minutes: 30,
			effort: 6,
			items: [
				WRISTS,
				chain("handstand", 5, [3, 6], 60, [20, 45]),
				chain("vertical-push", 3, [5, 10], 90),
				exercise("hollow-hold", 3, [20, 40], 45),
			],
		}),
		session({
			key: "balance",
			title: "Balance + line",
			sport: "calisthenics",
			focus: "skill",
			minutes: 25,
			effort: 4,
			items: [
				WRISTS,
				chain("handstand", 4, [3, 6], 60, [15, 40]),
				exercise("superman", 3, [20, 30], 30),
				exercise("downward-dog", 2, [45, 45], 0),
			],
		}),
	],
	schedule: {
		2: ["practice", "balance"],
		3: ["practice", "balance", "practice"],
		4: ["practice", "balance", "practice", "balance"],
		5: ["practice", "balance", "practice", "balance", "practice"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "built-in",
	createdAt: null,
};

const MUSCLE_UP: ProgramDef = {
	id: "muscle-up-8",
	title: "First Muscle-up",
	goal: "Explosive pull, strong dips, then the transition",
	summary:
		"For people with about 8 clean pull-ups. Builds the high pull and straight-bar dips, then puts them together.",
	kind: "skill",
	weeks: 8,
	level: "intermediate",
	sports: ["calisthenics"],
	equipment: ["pull-up-bar", "dip-bars"],
	photo: "pull-ups",
	sessions: [
		session({
			key: "pull",
			title: "Pull strength",
			sport: "calisthenics",
			focus: "upper",
			minutes: 45,
			effort: 8,
			items: [
				WARM_UP,
				exercise("scapular-pull-up", 2, [8, 10], 60),
				chain("pull", 5, [3, 6], 150),
				chain("row", 3, [8, 12], 90),
				exercise("hanging-knee-raise", 3, [10, 15], 60),
			],
		}),
		session({
			key: "push",
			title: "Dip strength",
			sport: "calisthenics",
			focus: "upper",
			minutes: 40,
			effort: 7,
			items: [
				WARM_UP,
				chain("dip", 4, [5, 10], 120),
				chain("push", 3, [8, 15], 90),
				exercise("hollow-hold", 3, [20, 40], 45),
			],
		}),
		session({
			key: "power",
			title: "Muscle-up power",
			sport: "calisthenics",
			focus: "upper",
			minutes: 40,
			effort: 8,
			items: [
				WARM_UP,
				exercise("chest-to-bar", 4, [2, 5], 150),
				exercise("straight-bar-dip", 4, [3, 8], 120),
				exercise("plyo-push-up", 3, [5, 8], 90),
			],
		}),
		MOBILITY,
	],
	schedule: {
		3: ["pull", "push", "power"],
		4: ["pull", "push", "power", "mobility"],
		5: ["pull", "push", "mobility", "power", "pull"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "built-in",
	createdAt: null,
};

const FRONT_LEVER: ProgramDef = {
	id: "front-lever-8",
	title: "Front Lever",
	goal: "From tuck to advanced tuck and beyond",
	summary: "Lever holds that move up the ladder, with the pulling and core strength behind them.",
	kind: "skill",
	weeks: 8,
	level: "intermediate",
	sports: ["calisthenics"],
	equipment: ["pull-up-bar"],
	photo: "pull-ups",
	sessions: [
		session({
			key: "lever",
			title: "Lever + pull",
			sport: "calisthenics",
			focus: "upper",
			minutes: 40,
			effort: 8,
			items: [
				WARM_UP,
				chain("lever", 5, [6, 12], 120, [6, 12]),
				chain("pull", 4, [4, 8], 120),
				exercise("hanging-leg-raise", 3, [6, 10], 60),
			],
		}),
		session({
			key: "support",
			title: "Rows + core",
			sport: "calisthenics",
			focus: "upper",
			minutes: 35,
			effort: 6,
			items: [
				WARM_UP,
				chain("row", 4, [8, 12], 90),
				exercise("hollow-hold", 4, [20, 40], 45),
				exercise("scapular-pull-up", 3, [10, 12], 60),
				chain("lever", 3, [6, 10], 90, [6, 10]),
			],
		}),
		MOBILITY,
	],
	schedule: {
		2: ["lever", "support"],
		3: ["lever", "support", "lever"],
		4: ["lever", "support", "lever", "mobility"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "built-in",
	createdAt: null,
};

const PISTOL: ProgramDef = {
	id: "legs-pistol-6",
	title: "Legs + Pistol Squat",
	goal: "Strong single legs and a clean pistol",
	summary:
		"Squats up the ladder to the pistol, hamstrings and glutes, and the ankle and hip mobility a pistol needs.",
	kind: "strength",
	weeks: 6,
	level: "beginner",
	sports: ["calisthenics"],
	equipment: [],
	photo: "pistol-squat",
	sessions: [
		session({
			key: "legs-a",
			title: "Squat strength",
			sport: "calisthenics",
			focus: "lower",
			minutes: 35,
			effort: 7,
			items: [
				HIPS,
				chain("squat", 4, [5, 10], 90),
				chain("hinge", 3, [8, 12], 60),
				exercise("deep-squat-hold", 3, [30, 60], 30),
			],
		}),
		session({
			key: "legs-b",
			title: "Single-leg power",
			sport: "calisthenics",
			focus: "lower",
			minutes: 35,
			effort: 7,
			items: [
				HIPS,
				exercise("reverse-lunge", 3, [8, 12], 60),
				exercise("jump-squat", 3, [8, 10], 60),
				chain("hinge", 3, [8, 12], 60),
				exercise("side-plank", 2, [20, 40], 30),
			],
		}),
		MOBILITY,
	],
	schedule: {
		2: ["legs-a", "legs-b"],
		3: ["legs-a", "mobility", "legs-b"],
		4: ["legs-a", "mobility", "legs-b", "mobility"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "built-in",
	createdAt: null,
};

const FIVE_K: ProgramDef = {
	id: "5k-under-25",
	title: "5 km Under 25",
	goal: "Run 5 km in under 25 minutes",
	summary:
		"Intervals for speed, an easy run for the engine and a long run that grows each week, with a lighter week every fourth. Leg strength keeps you injury-free.",
	kind: "running",
	weeks: 8,
	level: "beginner",
	sports: ["running"],
	equipment: [],
	photo: "mountain-run-hero",
	sessions: [
		INTERVALS(6),
		EASY_RUN([25, 40]),
		TEMPO_RUN([15, 25]),
		LONG_RUN([35, 55]),
		session({
			key: "strength",
			title: "Runner's strength",
			sport: "calisthenics",
			focus: "lower",
			minutes: 30,
			effort: 5,
			items: [
				HIPS,
				chain("squat", 3, [8, 12], 60),
				chain("hinge", 3, [8, 12], 60),
				exercise("side-plank", 2, [20, 40], 30),
			],
		}),
	],
	schedule: {
		2: ["intervals", "long-run"],
		3: ["intervals", "easy-run", "long-run"],
		4: ["intervals", "easy-run", "tempo-run", "long-run"],
		5: ["intervals", "strength", "easy-run", "tempo-run", "long-run"],
	},
	deloadEvery: 4,
	testWeeks: false,
	source: "built-in",
	createdAt: null,
};

const TEN_K: ProgramDef = {
	id: "10k-build",
	title: "10 km Build",
	goal: "Run 10 km strong",
	summary:
		"Ten weeks of growing long runs, tempo and intervals. For people who can already run 5 km.",
	kind: "running",
	weeks: 10,
	level: "intermediate",
	sports: ["running"],
	equipment: [],
	photo: "mountain-run-hero",
	sessions: [INTERVALS(8), EASY_RUN([35, 50]), TEMPO_RUN([20, 35]), LONG_RUN([50, 85])],
	schedule: {
		3: ["intervals", "easy-run", "long-run"],
		4: ["intervals", "easy-run", "tempo-run", "long-run"],
		5: ["intervals", "easy-run", "tempo-run", "easy-run", "long-run"],
	},
	deloadEvery: 4,
	testWeeks: false,
	source: "built-in",
	createdAt: null,
};

const BOXING_FIT: ProgramDef = {
	id: "boxing-conditioning",
	title: "Boxing Conditioning",
	goal: "Last every round and hit harder",
	summary:
		"Shadow boxing rounds that grow from 5 to 10, rope and conditioning circuits, and push-up strength.",
	kind: "boxing",
	weeks: 6,
	level: "beginner",
	sports: ["boxing"],
	equipment: [],
	photo: "shadow-boxing",
	sessions: [
		BOXING(5, 10),
		session({
			key: "conditioning",
			title: "Fight conditioning",
			sport: "boxing",
			focus: "conditioning",
			minutes: 30,
			effort: 8,
			items: [
				exercise("jump-rope", 3, [3, 3], 60),
				exercise("burpee", 4, [8, 12], 60),
				exercise("mountain-climber", 3, [20, 30], 45),
				exercise("russian-twist", 3, [20, 30], 45),
				chain("push", 3, [8, 15], 60),
			],
		}),
		EASY_RUN([20, 35]),
	],
	schedule: {
		2: ["boxing", "conditioning"],
		3: ["boxing", "conditioning", "boxing"],
		4: ["boxing", "conditioning", "boxing", "easy-run"],
		5: ["boxing", "conditioning", "easy-run", "boxing", "conditioning"],
	},
	deloadEvery: 4,
	testWeeks: false,
	source: "built-in",
	createdAt: null,
};

const LEAN: ProgramDef = {
	id: "lean-fit",
	title: "Lean + Fit",
	goal: "Burn fat and build an engine",
	summary: "Two bodyweight circuits and easy runs a week with short rests. No equipment needed.",
	kind: "conditioning",
	weeks: 6,
	level: "beginner",
	sports: ["calisthenics", "running"],
	equipment: [],
	photo: "mountain-run",
	sessions: [
		session({
			key: "circuit-a",
			title: "Circuit A",
			sport: "calisthenics",
			focus: "conditioning",
			minutes: 30,
			effort: 7,
			items: [
				exercise("star-jump", 3, [20, 30], 30),
				chain("squat", 3, [12, 20], 45),
				chain("push", 3, [8, 15], 45),
				exercise("mountain-climber", 3, [20, 30], 30),
				exercise("plank", 3, [30, 45], 30),
			],
		}),
		session({
			key: "circuit-b",
			title: "Circuit B",
			sport: "calisthenics",
			focus: "conditioning",
			minutes: 30,
			effort: 7,
			items: [
				exercise("inchworm", 3, [6, 8], 30),
				exercise("reverse-lunge", 3, [10, 12], 45),
				chain("row", 3, [8, 12], 45),
				exercise("burpee", 3, [8, 12], 45),
				exercise("russian-twist", 3, [20, 30], 30),
			],
		}),
		EASY_RUN([20, 40]),
		MOBILITY,
	],
	schedule: {
		2: ["circuit-a", "circuit-b"],
		3: ["circuit-a", "easy-run", "circuit-b"],
		4: ["circuit-a", "easy-run", "circuit-b", "easy-run"],
		5: ["circuit-a", "easy-run", "circuit-b", "mobility", "easy-run"],
	},
	deloadEvery: null,
	testWeeks: false,
	source: "built-in",
	createdAt: null,
};

const RECOVERY: ProgramDef = {
	id: "mobility-recovery",
	title: "Mobility + Recovery",
	goal: "Move better and recover between hard weeks",
	summary:
		"Short daily flows for the hips, spine and shoulders. Good after a hard block or alongside team sport.",
	kind: "recovery",
	weeks: 4,
	level: "beginner",
	sports: ["yoga"],
	equipment: [],
	photo: "yoga",
	sessions: [
		session({
			key: "hips",
			title: "Hips + spine",
			sport: "yoga",
			focus: "mobility",
			minutes: 20,
			effort: 2,
			items: [
				exercise("cat-cow", 1, [3, 3], 0),
				exercise("worlds-greatest-stretch", 2, [5, 5], 0),
				exercise("low-lunge", 2, [45, 60], 0),
				exercise("pigeon-stretch", 2, [60, 90], 0),
				exercise("deep-squat-hold", 2, [45, 60], 0),
			],
		}),
		session({
			key: "shoulders",
			title: "Shoulders + back",
			sport: "yoga",
			focus: "mobility",
			minutes: 20,
			effort: 2,
			items: [
				exercise("shoulder-warm-up", 1, [3, 3], 0),
				exercise("downward-dog", 3, [45, 60], 0),
				exercise("hamstring-stretch", 2, [45, 60], 0),
				exercise("superman", 2, [20, 30], 30),
				exercise("childs-pose", 1, [60, 90], 0),
			],
		}),
	],
	schedule: {
		2: ["hips", "shoulders"],
		3: ["hips", "shoulders", "hips"],
		4: ["hips", "shoulders", "hips", "shoulders"],
		5: ["hips", "shoulders", "hips", "shoulders", "hips"],
		6: ["hips", "shoulders", "hips", "shoulders", "hips", "shoulders"],
	},
	deloadEvery: null,
	testWeeks: false,
	source: "built-in",
	createdAt: null,
};

const GYM: ProgramDef = {
	id: "gym-strength",
	title: "Gym Strength",
	goal: "Bigger lifts on the main barbell moves",
	summary:
		"Two alternating full-body gym days. Hit the top of the rep range on every set and the weight goes up next time.",
	kind: "gym",
	weeks: 8,
	level: "intermediate",
	sports: ["gym"],
	equipment: ["gym"],
	photo: "dips-hero",
	sessions: [
		session({
			key: "gym-a",
			title: "Squat + bench",
			sport: "gym",
			focus: "full",
			minutes: 55,
			effort: 8,
			items: [
				WARM_UP,
				exercise("back-squat", 3, [5, 8], 150),
				exercise("bench-press", 3, [5, 8], 150),
				exercise("barbell-row", 3, [6, 10], 120),
				exercise("plank", 3, [30, 60], 45),
			],
		}),
		session({
			key: "gym-b",
			title: "Deadlift + press",
			sport: "gym",
			focus: "full",
			minutes: 55,
			effort: 8,
			items: [
				WARM_UP,
				exercise("deadlift", 3, [3, 6], 180),
				exercise("overhead-press", 3, [5, 8], 150),
				exercise("lat-pulldown", 3, [8, 12], 90),
				exercise("side-plank", 2, [30, 45], 30),
			],
		}),
	],
	schedule: {
		2: ["gym-a", "gym-b"],
		3: ["gym-a", "gym-b", "gym-a"],
		4: ["gym-a", "gym-b", "gym-a", "gym-b"],
	},
	deloadEvery: 4,
	testWeeks: false,
	source: "built-in",
	createdAt: null,
};

export const BUILT_IN_PROGRAMS: readonly ProgramDef[] = [
	HYBRID,
	FOUNDATIONS,
	HANDSTAND,
	MUSCLE_UP,
	FRONT_LEVER,
	PISTOL,
	FIVE_K,
	TEN_K,
	BOXING_FIT,
	LEAN,
	RECOVERY,
	GYM,
];
