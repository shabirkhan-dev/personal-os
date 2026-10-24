import type { ImageSourcePropType } from "react-native";
import type { DemoId } from "./exercise-guide";

/** Start and end positions for each demo, bundled so they work offline at the gym. */
export const DEMO_FRAMES: Record<DemoId, readonly ImageSourcePropType[]> = {
	"arm-circles": [
		require("../../../../assets/training/demos/arm-circles-0.jpg"),
		require("../../../../assets/training/demos/arm-circles-1.jpg"),
	],
	"australian-rows": [
		require("../../../../assets/training/demos/australian-rows-0.jpg"),
		require("../../../../assets/training/demos/australian-rows-1.jpg"),
	],
	"back-squat": [
		require("../../../../assets/training/demos/back-squat-0.jpg"),
		require("../../../../assets/training/demos/back-squat-1.jpg"),
	],
	"band-pull-ups": [
		require("../../../../assets/training/demos/band-pull-ups-0.jpg"),
		require("../../../../assets/training/demos/band-pull-ups-1.jpg"),
	],
	"barbell-row": [
		require("../../../../assets/training/demos/barbell-row-0.jpg"),
		require("../../../../assets/training/demos/barbell-row-1.jpg"),
	],
	"bench-dips": [
		require("../../../../assets/training/demos/bench-dips-0.jpg"),
		require("../../../../assets/training/demos/bench-dips-1.jpg"),
	],
	"bench-press": [
		require("../../../../assets/training/demos/bench-press-0.jpg"),
		require("../../../../assets/training/demos/bench-press-1.jpg"),
	],
	"bodyweight-squats": [
		require("../../../../assets/training/demos/bodyweight-squats-0.jpg"),
		require("../../../../assets/training/demos/bodyweight-squats-1.jpg"),
	],
	"cat-cow": [
		require("../../../../assets/training/demos/cat-cow-0.jpg"),
		require("../../../../assets/training/demos/cat-cow-1.jpg"),
	],
	"childs-pose": [
		require("../../../../assets/training/demos/childs-pose-0.jpg"),
		require("../../../../assets/training/demos/childs-pose-1.jpg"),
	],
	"chin-ups": [
		require("../../../../assets/training/demos/chin-ups-0.jpg"),
		require("../../../../assets/training/demos/chin-ups-1.jpg"),
	],
	"dead-bug": [
		require("../../../../assets/training/demos/dead-bug-0.jpg"),
		require("../../../../assets/training/demos/dead-bug-1.jpg"),
	],
	deadlift: [
		require("../../../../assets/training/demos/deadlift-0.jpg"),
		require("../../../../assets/training/demos/deadlift-1.jpg"),
	],
	"decline-push-ups": [
		require("../../../../assets/training/demos/decline-push-ups-0.jpg"),
		require("../../../../assets/training/demos/decline-push-ups-1.jpg"),
	],
	"diamond-push-ups": [
		require("../../../../assets/training/demos/diamond-push-ups-0.jpg"),
		require("../../../../assets/training/demos/diamond-push-ups-1.jpg"),
	],
	dips: [
		require("../../../../assets/training/demos/dips-0.jpg"),
		require("../../../../assets/training/demos/dips-1.jpg"),
	],
	"glute-bridges": [
		require("../../../../assets/training/demos/glute-bridges-0.jpg"),
		require("../../../../assets/training/demos/glute-bridges-1.jpg"),
	],
	"hamstring-stretch": [
		require("../../../../assets/training/demos/hamstring-stretch-0.jpg"),
		require("../../../../assets/training/demos/hamstring-stretch-1.jpg"),
	],
	"hanging-knee-raises": [
		require("../../../../assets/training/demos/hanging-knee-raises-0.jpg"),
		require("../../../../assets/training/demos/hanging-knee-raises-1.jpg"),
	],
	inchworms: [
		require("../../../../assets/training/demos/inchworms-0.jpg"),
		require("../../../../assets/training/demos/inchworms-1.jpg"),
	],
	"incline-push-ups": [
		require("../../../../assets/training/demos/incline-push-ups-0.jpg"),
		require("../../../../assets/training/demos/incline-push-ups-1.jpg"),
	],
	"jump-rope": [
		require("../../../../assets/training/demos/jump-rope-0.jpg"),
		require("../../../../assets/training/demos/jump-rope-1.jpg"),
	],
	"jump-squats": [
		require("../../../../assets/training/demos/jump-squats-0.jpg"),
		require("../../../../assets/training/demos/jump-squats-1.jpg"),
	],
	"lat-pulldown": [
		require("../../../../assets/training/demos/lat-pulldown-0.jpg"),
		require("../../../../assets/training/demos/lat-pulldown-1.jpg"),
	],
	"low-lunge": [require("../../../../assets/training/demos/low-lunge-0.jpg")],
	"mountain-climbers": [
		require("../../../../assets/training/demos/mountain-climbers-0.jpg"),
		require("../../../../assets/training/demos/mountain-climbers-1.jpg"),
	],
	"muscle-up": [
		require("../../../../assets/training/demos/muscle-up-0.jpg"),
		require("../../../../assets/training/demos/muscle-up-1.jpg"),
	],
	"nordic-curls": [
		require("../../../../assets/training/demos/nordic-curls-0.jpg"),
		require("../../../../assets/training/demos/nordic-curls-1.jpg"),
	],
	"overhead-press": [
		require("../../../../assets/training/demos/overhead-press-0.jpg"),
		require("../../../../assets/training/demos/overhead-press-1.jpg"),
	],
	plank: [require("../../../../assets/training/demos/plank-1.jpg")],
	"plyo-push-ups": [
		require("../../../../assets/training/demos/plyo-push-ups-0.jpg"),
		require("../../../../assets/training/demos/plyo-push-ups-1.jpg"),
	],
	"pull-ups": [
		require("../../../../assets/training/demos/pull-ups-0.jpg"),
		require("../../../../assets/training/demos/pull-ups-1.jpg"),
	],
	"push-ups": [
		require("../../../../assets/training/demos/push-ups-0.jpg"),
		require("../../../../assets/training/demos/push-ups-1.jpg"),
	],
	"reverse-lunges": [
		require("../../../../assets/training/demos/reverse-lunges-0.jpg"),
		require("../../../../assets/training/demos/reverse-lunges-1.jpg"),
	],
	"russian-twists": [
		require("../../../../assets/training/demos/russian-twists-0.jpg"),
		require("../../../../assets/training/demos/russian-twists-1.jpg"),
	],
	"scapular-pull-ups": [
		require("../../../../assets/training/demos/scapular-pull-ups-0.jpg"),
		require("../../../../assets/training/demos/scapular-pull-ups-1.jpg"),
	],
	"side-plank": [
		require("../../../../assets/training/demos/side-plank-0.jpg"),
		require("../../../../assets/training/demos/side-plank-1.jpg"),
	],
	"single-leg-glute-bridges": [
		require("../../../../assets/training/demos/single-leg-glute-bridges-0.jpg"),
		require("../../../../assets/training/demos/single-leg-glute-bridges-1.jpg"),
	],
	"split-squats": [
		require("../../../../assets/training/demos/split-squats-0.jpg"),
		require("../../../../assets/training/demos/split-squats-1.jpg"),
	],
	"star-jumps": [
		require("../../../../assets/training/demos/star-jumps-0.jpg"),
		require("../../../../assets/training/demos/star-jumps-1.jpg"),
	],
	superman: [
		require("../../../../assets/training/demos/superman-0.jpg"),
		require("../../../../assets/training/demos/superman-1.jpg"),
	],
	"walking-lunges": [
		require("../../../../assets/training/demos/walking-lunges-0.jpg"),
		require("../../../../assets/training/demos/walking-lunges-1.jpg"),
	],
	"wall-handstand": [require("../../../../assets/training/demos/wall-handstand-0.jpg")],
	"wide-push-ups": [
		require("../../../../assets/training/demos/wide-push-ups-0.jpg"),
		require("../../../../assets/training/demos/wide-push-ups-1.jpg"),
	],
	"worlds-greatest-stretch": [
		require("../../../../assets/training/demos/worlds-greatest-stretch-0.jpg"),
		require("../../../../assets/training/demos/worlds-greatest-stretch-1.jpg"),
	],
};
