/**
 * How to do each exercise: a demo (start and end photos) and three short cues. Demo photos are from
 * free-exercise-db (github.com/yuhonas/free-exercise-db, public domain); only exercises whose photos
 * show the same movement have one. The cues are written for the bodyweight versions Training plans.
 */

export const DEMO_IDS = [
	"arm-circles",
	"australian-rows",
	"cat-cow",
	"dips",
	"hanging-knee-raises",
	"jump-squats",
	"low-lunge",
	"plank",
	"pull-ups",
	"push-ups",
	"walking-lunges",
	"wall-handstand",
] as const;
export type DemoId = (typeof DEMO_IDS)[number];

export type ExerciseGuide = { demo: DemoId | null; cues: readonly string[] };

export const DEMO_CREDIT = "Demo photos: free-exercise-db, public domain";

const GUIDES: Record<string, ExerciseGuide> = {
	"Wrist and shoulder warm-up": {
		demo: "arm-circles",
		cues: [
			"Arms out to the sides, small circles forwards then backwards.",
			"Roll the wrists both ways, then rock gently on all fours with palms flat.",
			"Easy pace: warm, not tired.",
		],
	},
	"Wall handstand hold": {
		demo: "wall-handstand",
		cues: [
			"Hands shoulder width, a hand's length from the wall, fingers spread.",
			"Kick up, push the floor away and stack hips over shoulders.",
			"Squeeze glutes and legs; come down the way you went up.",
		],
	},
	"Pike push-ups": {
		demo: null,
		cues: [
			"Hips high in an upside-down V, hands shoulder width.",
			"Lower the top of your head towards the floor between your hands.",
			"Press back up until the arms are straight.",
		],
	},
	Dips: {
		demo: "dips",
		cues: [
			"Start locked out on the bars, shoulders down away from the ears.",
			"Lower until the elbows reach 90°, elbows tucked back.",
			"Press up to straight arms without swinging.",
		],
	},
	"Push-ups": {
		demo: "push-ups",
		cues: [
			"Hands under the shoulders, body straight from head to heels.",
			"Lower until the chest nearly touches the floor, elbows about 45°.",
			"Breathe out and press back up.",
		],
	},
	"Pistol squat": {
		demo: null,
		cues: [
			"Stand on one leg, the other straight out in front.",
			"Sit back and down, heel flat, arms forward for balance.",
			"Drive up through the whole foot. Use a box under you until it's solid.",
		],
	},
	"Hollow hold": {
		demo: null,
		cues: [
			"Lie on your back and press the lower back into the floor.",
			"Lift shoulders and legs, arms reaching past your head.",
			"Bend the knees to make it easier; never let the back arch.",
		],
	},
	"Pull-ups": {
		demo: "pull-ups",
		cues: [
			"Hang with straight arms, hands a little wider than the shoulders.",
			"Pull the elbows down and back until the chin clears the bar.",
			"Lower all the way under control.",
		],
	},
	"Australian rows": {
		demo: "australian-rows",
		cues: [
			"Under a waist-high bar or sturdy table, heels down, body straight.",
			"Pull the chest to the bar, squeezing the shoulder blades together.",
			"Lower to straight arms. Walk the feet in to make it easier.",
		],
	},
	"Tuck front lever": {
		demo: null,
		cues: [
			"Hang, then pull the bar down towards your hips with straight arms.",
			"Tuck the knees to the chest and lift until your back is level.",
			"Hold it flat; stop when the hips drop.",
		],
	},
	"Hanging knee raises": {
		demo: "hanging-knee-raises",
		cues: [
			"Hang from the bar, shoulders engaged, no swinging.",
			"Bring the knees up to hip height or higher, breathing out.",
			"Lower slowly to a full hang.",
		],
	},
	Plank: {
		demo: "plank",
		cues: [
			"Forearms under the shoulders, body in one straight line.",
			"Brace the stomach and squeeze the glutes.",
			"Keep breathing; stop when the hips sag.",
		],
	},
	"Jump squats": {
		demo: "jump-squats",
		cues: [
			"Feet shoulder width, chest up.",
			"Squat until the thighs are level with the floor.",
			"Jump straight up and land softly into the next squat.",
		],
	},
	"Walking lunges": {
		demo: "walking-lunges",
		cues: [
			"Step forward and drop until the back knee nearly touches the floor.",
			"Front knee over the front foot, chest tall.",
			"Push through the front heel and step into the next lunge.",
		],
	},
	"Cat-cow and spine waves": {
		demo: "cat-cow",
		cues: [
			"On hands and knees, hands under the shoulders.",
			"Round the back and drop the head, then arch and look forward.",
			"Move slowly with the breath.",
		],
	},
	"Low lunge": {
		demo: "low-lunge",
		cues: [
			"Back knee on the floor, front foot flat ahead.",
			"Shift the hips forward until the front of the back hip stretches.",
			"Tall chest; breathe into the stretch, then switch sides.",
		],
	},
	"Downward dog": {
		demo: null,
		cues: [
			"From hands and knees, lift the hips up and back.",
			"Press the chest towards the legs, heels reaching down.",
			"Bend the knees if the back rounds.",
		],
	},
	"Pigeon stretch": {
		demo: null,
		cues: [
			"Front shin across the mat, back leg long behind you.",
			"Keep the hips square and lower the chest over the front leg.",
			"Breathe slowly, then switch sides.",
		],
	},
	"Wrist circles and prep": {
		demo: null,
		cues: [
			"Circle the wrists both ways with fingers laced.",
			"On all fours, rock forward and back with palms flat, then fingers turned back.",
			"Finish with a few gentle wrist push-ups.",
		],
	},
};

/** The guide for an exercise by its name, or null when there is none (runs, matches). */
export function guideFor(name: string): ExerciseGuide | null {
	return GUIDES[name] ?? null;
}
