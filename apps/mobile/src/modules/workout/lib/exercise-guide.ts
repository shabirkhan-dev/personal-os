/**
 * The exercise catalog: every exercise Training can plan, with its movement pattern, difficulty,
 * the equipment it needs, a demo (start and end photos) where one fits, and three short cues.
 * Demo photos are from free-exercise-db (github.com/yuhonas/free-exercise-db, public domain); only
 * exercises whose photos show the same movement have one. Names are stored on logged sets, so an
 * exercise is never renamed.
 */

export const DEMO_IDS = [
	"arm-circles",
	"australian-rows",
	"back-squat",
	"band-pull-ups",
	"barbell-row",
	"bench-dips",
	"bench-press",
	"bodyweight-squats",
	"cat-cow",
	"childs-pose",
	"chin-ups",
	"dead-bug",
	"deadlift",
	"decline-push-ups",
	"diamond-push-ups",
	"dips",
	"glute-bridges",
	"hamstring-stretch",
	"hanging-knee-raises",
	"inchworms",
	"incline-push-ups",
	"jump-rope",
	"jump-squats",
	"lat-pulldown",
	"low-lunge",
	"mountain-climbers",
	"muscle-up",
	"nordic-curls",
	"overhead-press",
	"plank",
	"plyo-push-ups",
	"pull-ups",
	"push-ups",
	"reverse-lunges",
	"russian-twists",
	"scapular-pull-ups",
	"side-plank",
	"single-leg-glute-bridges",
	"split-squats",
	"star-jumps",
	"superman",
	"walking-lunges",
	"wall-handstand",
	"wide-push-ups",
	"worlds-greatest-stretch",
] as const;
export type DemoId = (typeof DEMO_IDS)[number];

export const PATTERNS = [
	"push",
	"vertical-push",
	"dip",
	"pull",
	"row",
	"lever",
	"squat",
	"hinge",
	"lunge",
	"core",
	"handstand",
	"conditioning",
	"mobility",
	"run",
	"boxing",
	"sport",
	"gym",
] as const;
export type Pattern = (typeof PATTERNS)[number];

export const PATTERN_LABELS: Record<Pattern, string> = {
	push: "Push",
	"vertical-push": "Overhead push",
	dip: "Dips",
	pull: "Pull-ups",
	row: "Rows",
	lever: "Levers",
	squat: "Squats",
	hinge: "Hips and hamstrings",
	lunge: "Lunges",
	core: "Core",
	handstand: "Handstand",
	conditioning: "Conditioning",
	mobility: "Mobility",
	run: "Running",
	boxing: "Boxing",
	sport: "Team sport",
	gym: "Gym lifts",
};

export const EQUIPMENT = [
	"pull-up-bar",
	"dip-bars",
	"rings",
	"band",
	"jump-rope",
	"heavy-bag",
	"gym",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
	"pull-up-bar": "Pull-up bar",
	"dip-bars": "Dip bars",
	rings: "Rings",
	band: "Resistance band",
	"jump-rope": "Jump rope",
	"heavy-bag": "Heavy bag",
	gym: "Gym",
};

export type ExerciseUnit = "reps" | "s" | "min";

/** Media someone added: photos and animations on R2, a video as a Google Drive link. */
export type ExerciseMedia = {
	image?: string;
	/** An animated GIF or WebP. */
	animation?: string;
	/** A Google Drive share link, played in Drive's own player. */
	video?: string;
};

export type CatalogExercise = {
	id: string;
	/** Shown and stored on logged sets; never renamed. */
	name: string;
	pattern: Pattern;
	/** 1 (anyone) to 10 (years of practice). */
	level: number;
	/** Everything it needs; empty for bodyweight anywhere. */
	equipment: readonly Equipment[];
	unit: ExerciseUnit;
	/** Done on each side. */
	each?: boolean;
	/** Loaded with weight (gym lifts): sets also log kilograms. */
	weighted?: boolean;
	demo: DemoId | null;
	/** Training photo used when there is no demo. */
	photo: string;
	cues: readonly [string, string, string];
	media?: ExerciseMedia;
	/** Made by the person rather than built in. */
	custom?: boolean;
};

export type ExerciseGuide = { demo: DemoId | null; cues: readonly string[]; media?: ExerciseMedia };

export const DEMO_CREDIT = "Demo photos: free-exercise-db, public domain";

type Spec = Omit<CatalogExercise, "equipment" | "demo"> & {
	equipment?: readonly Equipment[];
	demo?: DemoId;
};

const ex = (spec: Spec): CatalogExercise => ({
	...spec,
	equipment: spec.equipment ?? [],
	demo: spec.demo ?? null,
});

export const CATALOG: readonly CatalogExercise[] = [
	// --- push -------------------------------------------------------------------------------------
	ex({
		id: "incline-push-up",
		name: "Incline push-ups",
		pattern: "push",
		level: 1,
		unit: "reps",
		demo: "incline-push-ups",
		photo: "push-ups",
		cues: [
			"Hands on a bench, table or wall, body in one straight line.",
			"Lower the chest to the edge, elbows about 45°.",
			"The lower the surface, the harder it gets.",
		],
	}),
	ex({
		id: "push-up",
		name: "Push-ups",
		pattern: "push",
		level: 2,
		unit: "reps",
		demo: "push-ups",
		photo: "push-ups",
		cues: [
			"Hands under the shoulders, body straight from head to heels.",
			"Lower until the chest nearly touches the floor, elbows about 45°.",
			"Breathe out and press back up.",
		],
	}),
	ex({
		id: "wide-push-up",
		name: "Wide push-ups",
		pattern: "push",
		level: 2,
		unit: "reps",
		demo: "wide-push-ups",
		photo: "push-ups",
		cues: [
			"Hands a little wider than the shoulders, fingers forward.",
			"Lower the chest between the hands with the body straight.",
			"Press up without letting the hips sag.",
		],
	}),
	ex({
		id: "diamond-push-up",
		name: "Diamond push-ups",
		pattern: "push",
		level: 3,
		unit: "reps",
		demo: "diamond-push-ups",
		photo: "push-ups",
		cues: [
			"Thumbs and index fingers touch under the chest.",
			"Elbows stay close to the ribs on the way down.",
			"Press up through the palms; triceps do the work.",
		],
	}),
	ex({
		id: "decline-push-up",
		name: "Decline push-ups",
		pattern: "push",
		level: 4,
		unit: "reps",
		demo: "decline-push-ups",
		photo: "push-ups",
		cues: [
			"Feet on a box or bench, hands on the floor.",
			"Lower the head and chest between the hands, core tight.",
			"Higher feet move the work towards the shoulders.",
		],
	}),
	ex({
		id: "archer-push-up",
		name: "Archer push-ups",
		pattern: "push",
		level: 5,
		unit: "reps",
		each: true,
		photo: "push-ups",
		cues: [
			"Hands very wide, fingers turned out.",
			"Lower towards one hand while the other arm stays straight.",
			"Press back to the middle and switch sides.",
		],
	}),
	ex({
		id: "plyo-push-up",
		name: "Clap push-ups",
		pattern: "push",
		level: 5,
		unit: "reps",
		demo: "plyo-push-ups",
		photo: "push-ups",
		cues: [
			"Lower under control, then push up hard enough to leave the floor.",
			"Clap or just lift the hands, then land with soft elbows.",
			"Stop the set when the push stops being explosive.",
		],
	}),
	ex({
		id: "pseudo-planche-push-up",
		name: "Pseudo planche push-ups",
		pattern: "push",
		level: 6,
		unit: "reps",
		photo: "push-ups",
		cues: [
			"Hands by the hips, fingers turned out, shoulders leaning past the hands.",
			"Keep the lean as you lower; the body stays straight.",
			"Press up without losing the lean.",
		],
	}),
	ex({
		id: "one-arm-push-up",
		name: "One-arm push-ups",
		pattern: "push",
		level: 8,
		unit: "reps",
		each: true,
		photo: "push-ups",
		cues: [
			"Feet wide, one hand under the chest, the other behind the back.",
			"Lower with the hips square to the floor.",
			"Press up without twisting. Practise on an incline first.",
		],
	}),
	// --- overhead push ----------------------------------------------------------------------------
	ex({
		id: "pike-push-up",
		name: "Pike push-ups",
		pattern: "vertical-push",
		level: 3,
		unit: "reps",
		photo: "handstand",
		cues: [
			"Hips high in an upside-down V, hands shoulder width.",
			"Lower the top of your head towards the floor between your hands.",
			"Press back up until the arms are straight.",
		],
	}),
	ex({
		id: "elevated-pike-push-up",
		name: "Elevated pike push-ups",
		pattern: "vertical-push",
		level: 4,
		unit: "reps",
		photo: "handstand",
		cues: [
			"Feet on a box so the hips stack over the shoulders.",
			"Lower the head in front of the hands, making a tripod.",
			"Press up and keep the hips high.",
		],
	}),
	ex({
		id: "wall-hspu-negative",
		name: "Wall handstand push-up negatives",
		pattern: "vertical-push",
		level: 6,
		unit: "reps",
		photo: "handstand",
		cues: [
			"Kick up to a wall handstand, hands a hand's length from the wall.",
			"Lower to the floor over 4–5 seconds.",
			"Come down, kick up again; no pressing yet.",
		],
	}),
	ex({
		id: "wall-hspu",
		name: "Wall handstand push-ups",
		pattern: "vertical-push",
		level: 7,
		unit: "reps",
		photo: "handstand",
		cues: [
			"Wall handstand, fingers spread, body tight.",
			"Lower until the head lightly touches the floor.",
			"Press back to straight arms without arching.",
		],
	}),
	// --- dips -------------------------------------------------------------------------------------
	ex({
		id: "bench-dip",
		name: "Bench dips",
		pattern: "dip",
		level: 1,
		unit: "reps",
		demo: "bench-dips",
		photo: "dips",
		cues: [
			"Hands on a bench behind you, fingers forward, legs out.",
			"Lower until the elbows reach 90°, shoulders down.",
			"Press up; bend the knees to make it easier.",
		],
	}),
	ex({
		id: "dips",
		name: "Dips",
		pattern: "dip",
		level: 3,
		equipment: ["dip-bars"],
		unit: "reps",
		demo: "dips",
		photo: "dips",
		cues: [
			"Start locked out on the bars, shoulders down away from the ears.",
			"Lower until the elbows reach 90°, elbows tucked back.",
			"Press up to straight arms without swinging.",
		],
	}),
	ex({
		id: "straight-bar-dip",
		name: "Straight-bar dips",
		pattern: "dip",
		level: 5,
		equipment: ["pull-up-bar"],
		unit: "reps",
		photo: "dips",
		cues: [
			"Support on top of a straight bar, leaning slightly forward.",
			"Lower the chest to the bar, elbows going back.",
			"Press to straight arms. This is the top half of a muscle-up.",
		],
	}),
	ex({
		id: "ring-dip",
		name: "Ring dips",
		pattern: "dip",
		level: 6,
		equipment: ["rings"],
		unit: "reps",
		photo: "dips",
		cues: [
			"Support on the rings, arms straight, rings close to the body.",
			"Lower to 90° while keeping the rings steady.",
			"Press up and turn the rings out at the top.",
		],
	}),
	// --- pull -------------------------------------------------------------------------------------
	ex({
		id: "scapular-pull-up",
		name: "Scapular pull-ups",
		pattern: "pull",
		level: 1,
		equipment: ["pull-up-bar"],
		unit: "reps",
		demo: "scapular-pull-ups",
		photo: "pull-ups",
		cues: [
			"Hang with straight arms.",
			"Pull the shoulder blades down and back to lift a few centimetres.",
			"Lower slowly. The arms never bend.",
		],
	}),
	ex({
		id: "negative-pull-up",
		name: "Negative pull-ups",
		pattern: "pull",
		level: 2,
		equipment: ["pull-up-bar"],
		unit: "reps",
		photo: "pull-ups",
		cues: [
			"Jump or step up so the chin is over the bar.",
			"Lower yourself over 4–5 seconds to a full hang.",
			"Step up again; quality over number.",
		],
	}),
	ex({
		id: "band-pull-up",
		name: "Band-assisted pull-ups",
		pattern: "pull",
		level: 2,
		equipment: ["pull-up-bar", "band"],
		unit: "reps",
		demo: "band-pull-ups",
		photo: "pull-ups",
		cues: [
			"Loop a band over the bar and put a knee or foot in it.",
			"Pull until the chin clears the bar.",
			"Use a lighter band as the reps get easy.",
		],
	}),
	ex({
		id: "chin-up",
		name: "Chin-ups",
		pattern: "pull",
		level: 3,
		equipment: ["pull-up-bar"],
		unit: "reps",
		demo: "chin-ups",
		photo: "pull-ups",
		cues: [
			"Palms facing you, hands shoulder width.",
			"Pull the chest towards the bar until the chin clears it.",
			"Lower all the way to straight arms.",
		],
	}),
	ex({
		id: "pull-up",
		name: "Pull-ups",
		pattern: "pull",
		level: 4,
		equipment: ["pull-up-bar"],
		unit: "reps",
		demo: "pull-ups",
		photo: "pull-ups",
		cues: [
			"Hang with straight arms, hands a little wider than the shoulders.",
			"Pull the elbows down and back until the chin clears the bar.",
			"Lower all the way under control.",
		],
	}),
	ex({
		id: "chest-to-bar",
		name: "Chest-to-bar pull-ups",
		pattern: "pull",
		level: 5,
		equipment: ["pull-up-bar"],
		unit: "reps",
		photo: "pull-ups",
		cues: [
			"Pull explosively, leaning back slightly at the top.",
			"Touch the bar with the upper chest.",
			"Lower with control. This builds the pull for muscle-ups.",
		],
	}),
	ex({
		id: "archer-pull-up",
		name: "Archer pull-ups",
		pattern: "pull",
		level: 6,
		equipment: ["pull-up-bar"],
		unit: "reps",
		each: true,
		photo: "pull-ups",
		cues: [
			"Very wide grip.",
			"Pull towards one hand while the other arm straightens along the bar.",
			"Lower to the middle and switch sides.",
		],
	}),
	ex({
		id: "muscle-up",
		name: "Muscle-ups",
		pattern: "pull",
		level: 8,
		equipment: ["pull-up-bar"],
		unit: "reps",
		demo: "muscle-up",
		photo: "pull-ups",
		cues: [
			"Pull explosively to the lower chest with a false grip or slight swing.",
			"Turn the wrists over the bar and lean the chest forward.",
			"Press out of the dip to straight arms.",
		],
	}),
	// --- rows and levers --------------------------------------------------------------------------
	ex({
		id: "australian-row",
		name: "Australian rows",
		pattern: "row",
		level: 2,
		unit: "reps",
		demo: "australian-rows",
		photo: "pull-ups",
		cues: [
			"Under a waist-high bar or sturdy table, heels down, body straight.",
			"Pull the chest to the bar, squeezing the shoulder blades together.",
			"Lower to straight arms. Walk the feet in to make it easier.",
		],
	}),
	ex({
		id: "feet-up-row",
		name: "Feet-up Australian rows",
		pattern: "row",
		level: 3,
		unit: "reps",
		photo: "pull-ups",
		cues: [
			"Same row with the feet on a chair, body level.",
			"Pull the chest to the bar and pause for a second.",
			"Lower slowly; keep the hips up.",
		],
	}),
	ex({
		id: "archer-row",
		name: "Archer rows",
		pattern: "row",
		level: 5,
		unit: "reps",
		each: true,
		photo: "pull-ups",
		cues: [
			"Wide grip under the bar.",
			"Row towards one hand while the other arm straightens.",
			"Lower and switch sides.",
		],
	}),
	ex({
		id: "tuck-front-lever",
		name: "Tuck front lever",
		pattern: "lever",
		level: 5,
		equipment: ["pull-up-bar"],
		unit: "s",
		photo: "pull-ups",
		cues: [
			"Hang, then pull the bar down towards your hips with straight arms.",
			"Tuck the knees to the chest and lift until your back is level.",
			"Hold it flat; stop when the hips drop.",
		],
	}),
	ex({
		id: "advanced-tuck-lever",
		name: "Advanced tuck front lever",
		pattern: "lever",
		level: 6,
		equipment: ["pull-up-bar"],
		unit: "s",
		photo: "pull-ups",
		cues: [
			"From the tuck, open the hips so the thighs are at 90° to the body.",
			"Back flat and level with the floor.",
			"Straight arms, shoulders pulled down hard.",
		],
	}),
	ex({
		id: "straddle-front-lever",
		name: "Straddle front lever",
		pattern: "lever",
		level: 8,
		equipment: ["pull-up-bar"],
		unit: "s",
		photo: "pull-ups",
		cues: [
			"Legs straight and wide apart, body level.",
			"Squeeze the glutes and point the toes.",
			"Hold short and clean rather than long and sagging.",
		],
	}),
	// --- squats, hips and lunges ------------------------------------------------------------------
	ex({
		id: "bodyweight-squat",
		name: "Bodyweight squats",
		pattern: "squat",
		level: 1,
		unit: "reps",
		demo: "bodyweight-squats",
		photo: "pistol-squat",
		cues: [
			"Feet shoulder width, toes slightly out.",
			"Sit down and back until the thighs are level with the floor.",
			"Stand up through the whole foot, chest tall.",
		],
	}),
	ex({
		id: "split-squat",
		name: "Split squats",
		pattern: "squat",
		level: 2,
		unit: "reps",
		each: true,
		demo: "split-squats",
		photo: "pistol-squat",
		cues: [
			"Long stride, back heel up.",
			"Drop straight down until the back knee nearly touches the floor.",
			"Push through the front foot. Finish one side, then switch.",
		],
	}),
	ex({
		id: "bulgarian-split-squat",
		name: "Bulgarian split squats",
		pattern: "squat",
		level: 3,
		unit: "reps",
		each: true,
		photo: "pistol-squat",
		cues: [
			"Back foot on a bench, front foot a stride ahead.",
			"Lower until the front thigh is level with the floor.",
			"Drive up through the front heel.",
		],
	}),
	ex({
		id: "jump-squat",
		name: "Jump squats",
		pattern: "squat",
		level: 3,
		unit: "reps",
		demo: "jump-squats",
		photo: "pistol-squat",
		cues: [
			"Feet shoulder width, chest up.",
			"Squat until the thighs are level with the floor.",
			"Jump straight up and land softly into the next squat.",
		],
	}),
	ex({
		id: "shrimp-squat",
		name: "Shrimp squats",
		pattern: "squat",
		level: 5,
		unit: "reps",
		each: true,
		photo: "pistol-squat",
		cues: [
			"Stand on one leg and hold the other foot behind you.",
			"Lower until the back knee touches the floor.",
			"Stand up without letting go of the foot.",
		],
	}),
	ex({
		id: "pistol-squat",
		name: "Pistol squat",
		pattern: "squat",
		level: 6,
		unit: "reps",
		each: true,
		photo: "pistol-squat",
		cues: [
			"Stand on one leg, the other straight out in front.",
			"Sit back and down, heel flat, arms forward for balance.",
			"Drive up through the whole foot. Use a box under you until it's solid.",
		],
	}),
	ex({
		id: "glute-bridge",
		name: "Glute bridges",
		pattern: "hinge",
		level: 1,
		unit: "reps",
		demo: "glute-bridges",
		photo: "yoga",
		cues: [
			"On your back, knees bent, feet flat near the hips.",
			"Push through the heels and lift the hips until the body is straight.",
			"Squeeze the glutes at the top, then lower slowly.",
		],
	}),
	ex({
		id: "single-leg-glute-bridge",
		name: "Single-leg glute bridges",
		pattern: "hinge",
		level: 2,
		unit: "reps",
		each: true,
		demo: "single-leg-glute-bridges",
		photo: "yoga",
		cues: [
			"One foot flat, the other leg straight up or out.",
			"Lift the hips level; don't let one side drop.",
			"Pause at the top and lower slowly.",
		],
	}),
	ex({
		id: "single-leg-rdl",
		name: "Single-leg Romanian deadlifts",
		pattern: "hinge",
		level: 3,
		unit: "reps",
		each: true,
		photo: "pistol-squat",
		cues: [
			"Stand on one leg with a soft knee.",
			"Hinge forward, the free leg reaching back, back flat.",
			"Stand tall by squeezing the glute of the standing leg.",
		],
	}),
	ex({
		id: "nordic-curl",
		name: "Nordic curl negatives",
		pattern: "hinge",
		level: 6,
		unit: "reps",
		demo: "nordic-curls",
		photo: "pistol-squat",
		cues: [
			"Kneel with the heels hooked under a sofa or held by a partner.",
			"Lower the body forward as slowly as you can, hips straight.",
			"Catch yourself with the hands and push back up.",
		],
	}),
	ex({
		id: "walking-lunge",
		name: "Walking lunges",
		pattern: "lunge",
		level: 2,
		unit: "reps",
		demo: "walking-lunges",
		photo: "pistol-squat",
		cues: [
			"Step forward and drop until the back knee nearly touches the floor.",
			"Front knee over the front foot, chest tall.",
			"Push through the front heel and step into the next lunge.",
		],
	}),
	ex({
		id: "reverse-lunge",
		name: "Reverse lunges",
		pattern: "lunge",
		level: 2,
		unit: "reps",
		each: true,
		demo: "reverse-lunges",
		photo: "pistol-squat",
		cues: [
			"Step one foot back and lower the back knee towards the floor.",
			"Most of the weight stays on the front leg.",
			"Push through the front foot to stand.",
		],
	}),
	// --- core -------------------------------------------------------------------------------------
	ex({
		id: "dead-bug",
		name: "Dead bugs",
		pattern: "core",
		level: 1,
		unit: "reps",
		each: true,
		demo: "dead-bug",
		photo: "yoga",
		cues: [
			"On your back, arms up, knees bent over the hips.",
			"Lower the opposite arm and leg while the lower back stays down.",
			"Return and switch sides; breathe out as you reach.",
		],
	}),
	ex({
		id: "plank",
		name: "Plank",
		pattern: "core",
		level: 1,
		unit: "s",
		demo: "plank",
		photo: "push-ups",
		cues: [
			"Forearms under the shoulders, body in one straight line.",
			"Brace the stomach and squeeze the glutes.",
			"Keep breathing; stop when the hips sag.",
		],
	}),
	ex({
		id: "side-plank",
		name: "Side plank",
		pattern: "core",
		level: 2,
		unit: "s",
		each: true,
		demo: "side-plank",
		photo: "yoga",
		cues: [
			"Forearm under the shoulder, feet stacked.",
			"Lift the hips so the body is a straight line.",
			"Hold, then switch sides.",
		],
	}),
	ex({
		id: "russian-twist",
		name: "Russian twists",
		pattern: "core",
		level: 2,
		unit: "reps",
		demo: "russian-twists",
		photo: "yoga",
		cues: [
			"Sit leaning back, knees bent, feet light or lifted.",
			"Turn the shoulders side to side, touching the floor each side.",
			"Hold a weight once it gets easy.",
		],
	}),
	ex({
		id: "superman",
		name: "Superman hold",
		pattern: "core",
		level: 1,
		unit: "s",
		demo: "superman",
		photo: "yoga",
		cues: [
			"Lie face down, arms reaching forward.",
			"Lift the arms, chest and legs a few centimetres.",
			"Hold with the neck long, looking at the floor.",
		],
	}),
	ex({
		id: "hollow-hold",
		name: "Hollow hold",
		pattern: "core",
		level: 3,
		unit: "s",
		photo: "yoga",
		cues: [
			"Lie on your back and press the lower back into the floor.",
			"Lift shoulders and legs, arms reaching past your head.",
			"Bend the knees to make it easier; never let the back arch.",
		],
	}),
	ex({
		id: "hanging-knee-raise",
		name: "Hanging knee raises",
		pattern: "core",
		level: 3,
		equipment: ["pull-up-bar"],
		unit: "reps",
		demo: "hanging-knee-raises",
		photo: "pull-ups",
		cues: [
			"Hang from the bar, shoulders engaged, no swinging.",
			"Bring the knees up to hip height or higher, breathing out.",
			"Lower slowly to a full hang.",
		],
	}),
	ex({
		id: "hanging-leg-raise",
		name: "Hanging leg raises",
		pattern: "core",
		level: 5,
		equipment: ["pull-up-bar"],
		unit: "reps",
		photo: "pull-ups",
		cues: [
			"Hang with straight legs.",
			"Lift the legs to hip height or higher without swinging.",
			"Lower over two seconds.",
		],
	}),
	ex({
		id: "l-sit",
		name: "L-sit",
		pattern: "core",
		level: 6,
		unit: "s",
		photo: "dips",
		cues: [
			"Hands on the floor or parallettes beside the hips.",
			"Press down, lift the hips and hold the legs straight out.",
			"Tuck the knees until the straight-leg hold comes.",
		],
	}),
	ex({
		id: "toes-to-bar",
		name: "Toes-to-bar",
		pattern: "core",
		level: 7,
		equipment: ["pull-up-bar"],
		unit: "reps",
		photo: "pull-ups",
		cues: [
			"Hang, push the bar slightly down with straight arms.",
			"Lift straight legs until the toes touch the bar.",
			"Lower under control; don't kip.",
		],
	}),
	// --- handstand --------------------------------------------------------------------------------
	ex({
		id: "wall-walk",
		name: "Wall walks",
		pattern: "handstand",
		level: 3,
		unit: "reps",
		photo: "handstand",
		cues: [
			"Start in a push-up with the feet against a wall.",
			"Walk the feet up and the hands in until the chest is near the wall.",
			"Walk back down slowly.",
		],
	}),
	ex({
		id: "wall-handstand",
		name: "Wall handstand hold",
		pattern: "handstand",
		level: 4,
		unit: "s",
		demo: "wall-handstand",
		photo: "handstand",
		cues: [
			"Hands shoulder width, a hand's length from the wall, fingers spread.",
			"Kick up, push the floor away and stack hips over shoulders.",
			"Squeeze glutes and legs; come down the way you went up.",
		],
	}),
	ex({
		id: "chest-to-wall-handstand",
		name: "Chest-to-wall handstand",
		pattern: "handstand",
		level: 5,
		unit: "s",
		photo: "handstand",
		cues: [
			"Walk up facing the wall until the nose nearly touches it.",
			"Push tall through the shoulders, ribs in, toes pointed.",
			"Try lifting the toes off the wall for a second at a time.",
		],
	}),
	ex({
		id: "freestanding-handstand",
		name: "Freestanding handstand",
		pattern: "handstand",
		level: 7,
		unit: "s",
		photo: "handstand",
		cues: [
			"Kick up away from the wall with a straight line.",
			"Balance with the fingers: press them to stop falling over.",
			"Practise the cartwheel bail before you start.",
		],
	}),
	// --- conditioning -----------------------------------------------------------------------------
	ex({
		id: "star-jump",
		name: "Star jumps",
		pattern: "conditioning",
		level: 1,
		unit: "reps",
		demo: "star-jumps",
		photo: "mountain-run",
		cues: [
			"Start in a quarter squat, arms down.",
			"Jump up spreading arms and legs into a star.",
			"Land softly back in the squat and go again.",
		],
	}),
	ex({
		id: "mountain-climber",
		name: "Mountain climbers",
		pattern: "conditioning",
		level: 2,
		unit: "reps",
		demo: "mountain-climbers",
		photo: "push-ups",
		cues: [
			"High plank, hands under the shoulders.",
			"Drive one knee to the chest, then switch fast.",
			"Keep the hips level with the shoulders.",
		],
	}),
	ex({
		id: "inchworm",
		name: "Inchworms",
		pattern: "conditioning",
		level: 2,
		unit: "reps",
		demo: "inchworms",
		photo: "yoga",
		cues: [
			"Stand, fold forward and put the hands on the floor.",
			"Walk the hands out to a plank, keeping the legs straight.",
			"Walk the feet up to the hands and stand.",
		],
	}),
	ex({
		id: "burpee",
		name: "Burpees",
		pattern: "conditioning",
		level: 3,
		unit: "reps",
		photo: "push-ups",
		cues: [
			"Squat, put the hands down and jump the feet back to a plank.",
			"Chest to the floor, push up and jump the feet in.",
			"Jump up with the arms overhead.",
		],
	}),
	ex({
		id: "jump-rope",
		name: "Jump rope",
		pattern: "conditioning",
		level: 2,
		equipment: ["jump-rope"],
		unit: "min",
		demo: "jump-rope",
		photo: "shadow-boxing",
		cues: [
			"Elbows by the sides; the wrists turn the rope.",
			"Small, light jumps on the balls of the feet.",
			"Switch feet like a boxer once the basic bounce is easy.",
		],
	}),
	// --- mobility ---------------------------------------------------------------------------------
	ex({
		id: "shoulder-warm-up",
		name: "Wrist and shoulder warm-up",
		pattern: "mobility",
		level: 1,
		unit: "min",
		demo: "arm-circles",
		photo: "yoga",
		cues: [
			"Arms out to the sides, small circles forwards then backwards.",
			"Roll the wrists both ways, then rock gently on all fours with palms flat.",
			"Easy pace: warm, not tired.",
		],
	}),
	ex({
		id: "wrist-prep",
		name: "Wrist circles and prep",
		pattern: "mobility",
		level: 1,
		unit: "min",
		photo: "yoga",
		cues: [
			"Circle the wrists both ways with fingers laced.",
			"On all fours, rock forward and back with palms flat, then fingers turned back.",
			"Finish with a few gentle wrist push-ups.",
		],
	}),
	ex({
		id: "cat-cow",
		name: "Cat-cow and spine waves",
		pattern: "mobility",
		level: 1,
		unit: "min",
		demo: "cat-cow",
		photo: "yoga",
		cues: [
			"On hands and knees, hands under the shoulders.",
			"Round the back and drop the head, then arch and look forward.",
			"Move slowly with the breath.",
		],
	}),
	ex({
		id: "low-lunge",
		name: "Low lunge",
		pattern: "mobility",
		level: 1,
		unit: "s",
		each: true,
		demo: "low-lunge",
		photo: "yoga",
		cues: [
			"Back knee on the floor, front foot flat ahead.",
			"Shift the hips forward until the front of the back hip stretches.",
			"Tall chest; breathe into the stretch, then switch sides.",
		],
	}),
	ex({
		id: "downward-dog",
		name: "Downward dog",
		pattern: "mobility",
		level: 1,
		unit: "s",
		photo: "yoga",
		cues: [
			"From hands and knees, lift the hips up and back.",
			"Press the chest towards the legs, heels reaching down.",
			"Bend the knees if the back rounds.",
		],
	}),
	ex({
		id: "pigeon-stretch",
		name: "Pigeon stretch",
		pattern: "mobility",
		level: 1,
		unit: "s",
		each: true,
		photo: "yoga",
		cues: [
			"Front shin across the mat, back leg long behind you.",
			"Keep the hips square and lower the chest over the front leg.",
			"Breathe slowly, then switch sides.",
		],
	}),
	ex({
		id: "childs-pose",
		name: "Child's pose",
		pattern: "mobility",
		level: 1,
		unit: "s",
		demo: "childs-pose",
		photo: "yoga",
		cues: [
			"Kneel, big toes together, knees apart.",
			"Sit back on the heels and reach the arms forward.",
			"Let the forehead rest and breathe into the back.",
		],
	}),
	ex({
		id: "hamstring-stretch",
		name: "Hamstring stretch",
		pattern: "mobility",
		level: 1,
		unit: "s",
		each: true,
		demo: "hamstring-stretch",
		photo: "yoga",
		cues: [
			"On your back, lift one straight leg with a band or towel round the foot.",
			"Pull gently until you feel the back of the thigh.",
			"Keep the other leg flat on the floor; switch sides.",
		],
	}),
	ex({
		id: "worlds-greatest-stretch",
		name: "World's greatest stretch",
		pattern: "mobility",
		level: 2,
		unit: "reps",
		each: true,
		demo: "worlds-greatest-stretch",
		photo: "yoga",
		cues: [
			"Step into a deep lunge, both hands inside the front foot.",
			"Drop the inside elbow towards the floor, then rotate that arm to the sky.",
			"Return the hand and switch legs.",
		],
	}),
	ex({
		id: "deep-squat-hold",
		name: "Deep squat hold",
		pattern: "mobility",
		level: 1,
		unit: "s",
		photo: "pistol-squat",
		cues: [
			"Sink into the bottom of a squat, heels down.",
			"Push the knees out with the elbows, chest up.",
			"Hold something in front of you for balance if needed.",
		],
	}),
	// --- running ----------------------------------------------------------------------------------
	ex({
		id: "easy-run",
		name: "Easy run",
		pattern: "run",
		level: 1,
		unit: "min",
		photo: "mountain-run",
		cues: [
			"Talk-easy pace: you could chat in full sentences.",
			"Short, quick steps landing under the hips.",
			"Walk breaks are fine; time on your feet is what counts.",
		],
	}),
	ex({
		id: "long-run",
		name: "Long run",
		pattern: "run",
		level: 2,
		unit: "min",
		photo: "mountain-run",
		cues: [
			"Start slower than feels right.",
			"Drink and keep the effort steady; the last part can be a bit faster.",
			"This builds the engine for every other run.",
		],
	}),
	ex({
		id: "tempo-run",
		name: "Tempo run",
		pattern: "run",
		level: 3,
		unit: "min",
		photo: "mountain-run",
		cues: [
			"10 minutes easy to warm up first.",
			"Comfortably hard: a few words at a time, not sentences.",
			"Even pace from start to finish, then jog to cool down.",
		],
	}),
	ex({
		id: "run-intervals",
		name: "Run intervals",
		pattern: "run",
		level: 4,
		unit: "min",
		photo: "mountain-run",
		cues: [
			"Warm up 10 minutes easy.",
			"Run each repeat hard but controlled, the same speed each time.",
			"Walk or jog the rest between repeats.",
		],
	}),
	ex({
		id: "hill-sprints",
		name: "Hill sprints",
		pattern: "run",
		level: 4,
		unit: "s",
		photo: "mountain-run",
		cues: [
			"Find a steady hill; warm up first.",
			"Sprint up with high knees and strong arms.",
			"Walk down slowly as the rest.",
		],
	}),
	// --- boxing and team sport --------------------------------------------------------------------
	ex({
		id: "shadow-boxing",
		name: "Shadow boxing",
		pattern: "boxing",
		level: 2,
		unit: "min",
		photo: "shadow-boxing",
		cues: [
			"Guard up, chin down, light on the balls of the feet.",
			"Throw clean combos and move your head after each one.",
			"Breathe out on every punch.",
		],
	}),
	ex({
		id: "heavy-bag",
		name: "Heavy bag rounds",
		pattern: "boxing",
		level: 3,
		equipment: ["heavy-bag"],
		unit: "min",
		photo: "shadow-boxing",
		cues: [
			"Wrap your hands and wear gloves.",
			"Punch through the bag, then snap back to guard.",
			"Circle the bag; don't stand square in front of it.",
		],
	}),
	ex({
		id: "team-match",
		name: "Match or training",
		pattern: "sport",
		level: 1,
		unit: "min",
		photo: "football",
		cues: [
			"Warm up with the team, including short sprints.",
			"Drink between halves or sets.",
			"Easy mobility the next day helps recovery.",
		],
	}),
	// --- gym --------------------------------------------------------------------------------------
	ex({
		id: "bench-press",
		name: "Bench press",
		pattern: "gym",
		level: 3,
		equipment: ["gym"],
		unit: "reps",
		weighted: true,
		demo: "bench-press",
		photo: "push-ups",
		cues: [
			"Eyes under the bar, shoulder blades pulled together, feet planted.",
			"Lower the bar to the lower chest, elbows about 45°.",
			"Press up and slightly back. Use a spotter or safety bars.",
		],
	}),
	ex({
		id: "overhead-press",
		name: "Overhead press",
		pattern: "gym",
		level: 3,
		equipment: ["gym"],
		unit: "reps",
		weighted: true,
		demo: "overhead-press",
		photo: "handstand",
		cues: [
			"Bar on the front of the shoulders, grip just outside them.",
			"Squeeze the glutes and press the bar straight up past the face.",
			"Lock out overhead with the bar over the middle of the feet.",
		],
	}),
	ex({
		id: "back-squat",
		name: "Back squat",
		pattern: "gym",
		level: 3,
		equipment: ["gym"],
		unit: "reps",
		weighted: true,
		demo: "back-squat",
		photo: "pistol-squat",
		cues: [
			"Bar on the upper back, feet shoulder width.",
			"Brace, then sit down until the hips are below the knees.",
			"Drive up with the chest leading. Set the safety bars.",
		],
	}),
	ex({
		id: "deadlift",
		name: "Deadlift",
		pattern: "gym",
		level: 3,
		equipment: ["gym"],
		unit: "reps",
		weighted: true,
		demo: "deadlift",
		photo: "pistol-squat",
		cues: [
			"Bar over the middle of the feet, shins close, back flat.",
			"Push the floor away and stand tall, bar close to the legs.",
			"Lower by pushing the hips back first.",
		],
	}),
	ex({
		id: "barbell-row",
		name: "Barbell row",
		pattern: "gym",
		level: 3,
		equipment: ["gym"],
		unit: "reps",
		weighted: true,
		demo: "barbell-row",
		photo: "pull-ups",
		cues: [
			"Hinge forward with a flat back, bar hanging below the shoulders.",
			"Pull the bar to the lower ribs.",
			"Lower under control without standing up.",
		],
	}),
	ex({
		id: "lat-pulldown",
		name: "Lat pulldown",
		pattern: "gym",
		level: 2,
		equipment: ["gym"],
		unit: "reps",
		weighted: true,
		demo: "lat-pulldown",
		photo: "pull-ups",
		cues: [
			"Grip a little wider than the shoulders, thighs under the pads.",
			"Pull the bar to the upper chest, elbows down.",
			"Let it rise slowly to straight arms.",
		],
	}),
];

let merged: readonly CatalogExercise[] = CATALOG;
let byId = new Map(CATALOG.map((exercise) => [exercise.id, exercise]));
let byName = new Map(CATALOG.map((exercise) => [exercise.name, exercise]));

/**
 * Adds the person's own exercises and their changes to built-in ones (a doc with a built-in id keeps
 * the built-in name and adds media and cues). Called by the data layer whenever they change.
 */
export function setCustomExercises(saved: readonly CatalogExercise[]): void {
	const overrides = new Map(saved.filter((item) => !item.custom).map((item) => [item.id, item]));
	const builtIn = CATALOG.map((exercise) => {
		const change = overrides.get(exercise.id);
		if (!change) return exercise;
		return {
			...exercise,
			cues: change.cues,
			...(change.media ? { media: change.media } : {}),
		};
	});
	const builtInNames = new Set(CATALOG.map((exercise) => exercise.name));
	const own = saved.filter((item) => item.custom && !builtInNames.has(item.name));
	merged = [...builtIn, ...own];
	byId = new Map(merged.map((exercise) => [exercise.id, exercise]));
	byName = new Map(merged.map((exercise) => [exercise.name, exercise]));
}

/** Built-in exercises (with the person's changes) and their own. */
export function allExercises(): readonly CatalogExercise[] {
	return merged;
}

export function exerciseById(id: string): CatalogExercise | null {
	return byId.get(id) ?? null;
}

export function exerciseByName(name: string): CatalogExercise | null {
	return byName.get(name) ?? null;
}

/** The guide for an exercise by its name, or null when there is none. */
export function guideFor(name: string): ExerciseGuide | null {
	const exercise = byName.get(name);
	if (!exercise || exercise.pattern === "sport") return null;
	return {
		demo: exercise.demo,
		cues: exercise.cues,
		...(exercise.media ? { media: exercise.media } : {}),
	};
}

/**
 * The Google Drive file id in a share link ("…/file/d/<id>/view", "open?id=<id>", "uc?id=<id>"),
 * or null when the link isn't a Drive file.
 */
export function driveFileId(link: string): string | null {
	let url: URL;
	try {
		url = new URL(link.trim());
	} catch {
		return null;
	}
	if (!/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(url.hostname)) return null;
	const path = /\/file\/d\/([\w-]{10,})/.exec(url.pathname);
	const id = path?.[1] ?? url.searchParams.get("id");
	return id && /^[\w-]{10,}$/.test(id) ? id : null;
}

/** Drive's embedded player for a file, which streams the video at the right quality. */
export function drivePreviewUrl(link: string): string | null {
	const id = driveFileId(link);
	return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

// --- saved exercises ----------------------------------------------------------------------------

const httpsUrl = (value: unknown): string | undefined => {
	if (typeof value !== "string" || value.length > 600) return undefined;
	try {
		return new URL(value).protocol === "https:" ? value : undefined;
	} catch {
		return undefined;
	}
};

function parseMedia(raw: unknown): ExerciseMedia | undefined {
	if (typeof raw !== "object" || raw === null) return undefined;
	const record = raw as Record<string, unknown>;
	const image = httpsUrl(record.image);
	const animation = httpsUrl(record.animation);
	const video =
		typeof record.video === "string" && driveFileId(record.video) ? record.video : undefined;
	if (!image && !animation && !video) return undefined;
	return {
		...(image ? { image } : {}),
		...(animation ? { animation } : {}),
		...(video ? { video } : {}),
	};
}

const text = (value: unknown, max: number) =>
	typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * A saved exercise (`training-exercises`): one of the person's own, or changes to a built-in one
 * (same id). Anything malformed falls back or is dropped.
 */
export function parseSavedExercise(raw: unknown): CatalogExercise | null {
	if (typeof raw !== "object" || raw === null) return null;
	const record = raw as Record<string, unknown>;
	const id = text(record.id, 60);
	if (!id) return null;
	const cuesRaw = Array.isArray(record.cues) ? record.cues : [];
	const cues = [0, 1, 2].map((index) => text(cuesRaw[index], 100)) as [string, string, string];
	const builtIn = CATALOG.find((exercise) => exercise.id === id);
	const media = parseMedia(record.media);
	if (builtIn) {
		return {
			...builtIn,
			cues: cues.some(Boolean) ? cues : builtIn.cues,
			...(media ? { media } : {}),
		};
	}
	const name = text(record.name, 60);
	if (!name) return null;
	const pattern = (PATTERNS as readonly string[]).includes(String(record.pattern))
		? (record.pattern as Pattern)
		: "conditioning";
	const unit = record.unit === "s" || record.unit === "min" ? record.unit : "reps";
	const level =
		typeof record.level === "number" ? Math.min(10, Math.max(1, Math.round(record.level))) : 3;
	const equipment = Array.isArray(record.equipment)
		? record.equipment.filter((item): item is Equipment =>
				(EQUIPMENT as readonly string[]).includes(String(item)),
			)
		: [];
	return {
		id,
		name,
		pattern,
		level,
		equipment,
		unit,
		...(record.each === true ? { each: true } : {}),
		...(record.weighted === true ? { weighted: true } : {}),
		demo: null,
		photo: text(record.photo, 40) || "handstand",
		cues,
		...(media ? { media } : {}),
		custom: true,
	};
}

/** Whether the equipment someone has covers what an exercise needs. */
export function canDo(exercise: CatalogExercise, equipment: readonly Equipment[]): boolean {
	return exercise.equipment.every((item) => equipment.includes(item));
}

/** A YouTube search for the exercise, for a real video when the photos aren't enough. */
export function videoSearchUrl(name: string): string {
	return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise tutorial`)}`;
}
