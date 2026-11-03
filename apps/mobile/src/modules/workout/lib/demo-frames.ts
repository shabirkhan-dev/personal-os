import type { ImageSourcePropType } from "react-native";
import type { DemoId } from "./exercise-guide";

/** Start and end positions for each demo, bundled so they work offline at the gym. */
export const DEMO_FRAMES: Record<DemoId, readonly ImageSourcePropType[]> = {
	"arm-circles": [
		require("../../../../assets/training/demos/arm-circles-0.webp"),
		require("../../../../assets/training/demos/arm-circles-1.webp"),
	],
	"australian-rows": [
		require("../../../../assets/training/demos/australian-rows-0.webp"),
		require("../../../../assets/training/demos/australian-rows-1.webp"),
	],
	"back-squat": [
		require("../../../../assets/training/demos/back-squat-0.webp"),
		require("../../../../assets/training/demos/back-squat-1.webp"),
	],
	"band-pull-ups": [
		require("../../../../assets/training/demos/band-pull-ups-0.webp"),
		require("../../../../assets/training/demos/band-pull-ups-1.webp"),
	],
	"barbell-row": [
		require("../../../../assets/training/demos/barbell-row-0.webp"),
		require("../../../../assets/training/demos/barbell-row-1.webp"),
	],
	"bench-dips": [
		require("../../../../assets/training/demos/bench-dips-0.webp"),
		require("../../../../assets/training/demos/bench-dips-1.webp"),
	],
	"bench-press": [
		require("../../../../assets/training/demos/bench-press-0.webp"),
		require("../../../../assets/training/demos/bench-press-1.webp"),
	],
	"bodyweight-squats": [
		require("../../../../assets/training/demos/bodyweight-squats-0.webp"),
		require("../../../../assets/training/demos/bodyweight-squats-1.webp"),
	],
	"cat-cow": [
		require("../../../../assets/training/demos/cat-cow-0.webp"),
		require("../../../../assets/training/demos/cat-cow-1.webp"),
	],
	"childs-pose": [
		require("../../../../assets/training/demos/childs-pose-0.webp"),
		require("../../../../assets/training/demos/childs-pose-1.webp"),
	],
	"chin-ups": [
		require("../../../../assets/training/demos/chin-ups-0.webp"),
		require("../../../../assets/training/demos/chin-ups-1.webp"),
	],
	"dead-bug": [
		require("../../../../assets/training/demos/dead-bug-0.webp"),
		require("../../../../assets/training/demos/dead-bug-1.webp"),
	],
	deadlift: [
		require("../../../../assets/training/demos/deadlift-0.webp"),
		require("../../../../assets/training/demos/deadlift-1.webp"),
	],
	"decline-push-ups": [
		require("../../../../assets/training/demos/decline-push-ups-0.webp"),
		require("../../../../assets/training/demos/decline-push-ups-1.webp"),
	],
	"diamond-push-ups": [
		require("../../../../assets/training/demos/diamond-push-ups-0.webp"),
		require("../../../../assets/training/demos/diamond-push-ups-1.webp"),
	],
	dips: [
		require("../../../../assets/training/demos/dips-0.webp"),
		require("../../../../assets/training/demos/dips-1.webp"),
	],
	"glute-bridges": [
		require("../../../../assets/training/demos/glute-bridges-0.webp"),
		require("../../../../assets/training/demos/glute-bridges-1.webp"),
	],
	"hamstring-stretch": [
		require("../../../../assets/training/demos/hamstring-stretch-0.webp"),
		require("../../../../assets/training/demos/hamstring-stretch-1.webp"),
	],
	"hanging-knee-raises": [
		require("../../../../assets/training/demos/hanging-knee-raises-0.webp"),
		require("../../../../assets/training/demos/hanging-knee-raises-1.webp"),
	],
	inchworms: [
		require("../../../../assets/training/demos/inchworms-0.webp"),
		require("../../../../assets/training/demos/inchworms-1.webp"),
	],
	"incline-push-ups": [
		require("../../../../assets/training/demos/incline-push-ups-0.webp"),
		require("../../../../assets/training/demos/incline-push-ups-1.webp"),
	],
	"jump-rope": [
		require("../../../../assets/training/demos/jump-rope-0.webp"),
		require("../../../../assets/training/demos/jump-rope-1.webp"),
	],
	"jump-squats": [
		require("../../../../assets/training/demos/jump-squats-0.webp"),
		require("../../../../assets/training/demos/jump-squats-1.webp"),
	],
	"lat-pulldown": [
		require("../../../../assets/training/demos/lat-pulldown-0.webp"),
		require("../../../../assets/training/demos/lat-pulldown-1.webp"),
	],
	"low-lunge": [require("../../../../assets/training/demos/low-lunge-0.webp")],
	"mountain-climbers": [
		require("../../../../assets/training/demos/mountain-climbers-0.webp"),
		require("../../../../assets/training/demos/mountain-climbers-1.webp"),
	],
	"muscle-up": [
		require("../../../../assets/training/demos/muscle-up-0.webp"),
		require("../../../../assets/training/demos/muscle-up-1.webp"),
	],
	"nordic-curls": [
		require("../../../../assets/training/demos/nordic-curls-0.webp"),
		require("../../../../assets/training/demos/nordic-curls-1.webp"),
	],
	"overhead-press": [
		require("../../../../assets/training/demos/overhead-press-0.webp"),
		require("../../../../assets/training/demos/overhead-press-1.webp"),
	],
	plank: [require("../../../../assets/training/demos/plank-1.webp")],
	"plyo-push-ups": [
		require("../../../../assets/training/demos/plyo-push-ups-0.webp"),
		require("../../../../assets/training/demos/plyo-push-ups-1.webp"),
	],
	"pull-ups": [
		require("../../../../assets/training/demos/pull-ups-0.webp"),
		require("../../../../assets/training/demos/pull-ups-1.webp"),
	],
	"push-ups": [
		require("../../../../assets/training/demos/push-ups-0.webp"),
		require("../../../../assets/training/demos/push-ups-1.webp"),
	],
	"reverse-lunges": [
		require("../../../../assets/training/demos/reverse-lunges-0.webp"),
		require("../../../../assets/training/demos/reverse-lunges-1.webp"),
	],
	"russian-twists": [
		require("../../../../assets/training/demos/russian-twists-0.webp"),
		require("../../../../assets/training/demos/russian-twists-1.webp"),
	],
	"scapular-pull-ups": [
		require("../../../../assets/training/demos/scapular-pull-ups-0.webp"),
		require("../../../../assets/training/demos/scapular-pull-ups-1.webp"),
	],
	"side-plank": [
		require("../../../../assets/training/demos/side-plank-0.webp"),
		require("../../../../assets/training/demos/side-plank-1.webp"),
	],
	"single-leg-glute-bridges": [
		require("../../../../assets/training/demos/single-leg-glute-bridges-0.webp"),
		require("../../../../assets/training/demos/single-leg-glute-bridges-1.webp"),
	],
	"split-squats": [
		require("../../../../assets/training/demos/split-squats-0.webp"),
		require("../../../../assets/training/demos/split-squats-1.webp"),
	],
	"star-jumps": [
		require("../../../../assets/training/demos/star-jumps-0.webp"),
		require("../../../../assets/training/demos/star-jumps-1.webp"),
	],
	superman: [
		require("../../../../assets/training/demos/superman-0.webp"),
		require("../../../../assets/training/demos/superman-1.webp"),
	],
	"walking-lunges": [
		require("../../../../assets/training/demos/walking-lunges-0.webp"),
		require("../../../../assets/training/demos/walking-lunges-1.webp"),
	],
	"wall-handstand": [require("../../../../assets/training/demos/wall-handstand-0.webp")],
	"wide-push-ups": [
		require("../../../../assets/training/demos/wide-push-ups-0.webp"),
		require("../../../../assets/training/demos/wide-push-ups-1.webp"),
	],
	"worlds-greatest-stretch": [
		require("../../../../assets/training/demos/worlds-greatest-stretch-0.webp"),
		require("../../../../assets/training/demos/worlds-greatest-stretch-1.webp"),
	],
};
