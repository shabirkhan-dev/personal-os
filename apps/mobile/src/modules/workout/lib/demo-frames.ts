import type { ImageSourcePropType } from "react-native";
import { appPhoto } from "@/lib/photos/app-photo";
import type { DemoId } from "./exercise-guide";

/** Start and end positions for each demo, fetched once after install so they work offline at the gym. */
export const DEMO_FRAMES: Record<DemoId, readonly ImageSourcePropType[]> = {
	"arm-circles": [
		appPhoto("training/demos/arm-circles-0.webp"),
		appPhoto("training/demos/arm-circles-1.webp"),
	],
	"australian-rows": [
		appPhoto("training/demos/australian-rows-0.webp"),
		appPhoto("training/demos/australian-rows-1.webp"),
	],
	"back-squat": [
		appPhoto("training/demos/back-squat-0.webp"),
		appPhoto("training/demos/back-squat-1.webp"),
	],
	"band-pull-ups": [
		appPhoto("training/demos/band-pull-ups-0.webp"),
		appPhoto("training/demos/band-pull-ups-1.webp"),
	],
	"barbell-row": [
		appPhoto("training/demos/barbell-row-0.webp"),
		appPhoto("training/demos/barbell-row-1.webp"),
	],
	"bench-dips": [
		appPhoto("training/demos/bench-dips-0.webp"),
		appPhoto("training/demos/bench-dips-1.webp"),
	],
	"bench-press": [
		appPhoto("training/demos/bench-press-0.webp"),
		appPhoto("training/demos/bench-press-1.webp"),
	],
	"bodyweight-squats": [
		appPhoto("training/demos/bodyweight-squats-0.webp"),
		appPhoto("training/demos/bodyweight-squats-1.webp"),
	],
	"cat-cow": [appPhoto("training/demos/cat-cow-0.webp"), appPhoto("training/demos/cat-cow-1.webp")],
	"childs-pose": [
		appPhoto("training/demos/childs-pose-0.webp"),
		appPhoto("training/demos/childs-pose-1.webp"),
	],
	"chin-ups": [
		appPhoto("training/demos/chin-ups-0.webp"),
		appPhoto("training/demos/chin-ups-1.webp"),
	],
	"dead-bug": [
		appPhoto("training/demos/dead-bug-0.webp"),
		appPhoto("training/demos/dead-bug-1.webp"),
	],
	deadlift: [
		appPhoto("training/demos/deadlift-0.webp"),
		appPhoto("training/demos/deadlift-1.webp"),
	],
	"decline-push-ups": [
		appPhoto("training/demos/decline-push-ups-0.webp"),
		appPhoto("training/demos/decline-push-ups-1.webp"),
	],
	"diamond-push-ups": [
		appPhoto("training/demos/diamond-push-ups-0.webp"),
		appPhoto("training/demos/diamond-push-ups-1.webp"),
	],
	dips: [appPhoto("training/demos/dips-0.webp"), appPhoto("training/demos/dips-1.webp")],
	"glute-bridges": [
		appPhoto("training/demos/glute-bridges-0.webp"),
		appPhoto("training/demos/glute-bridges-1.webp"),
	],
	"hamstring-stretch": [
		appPhoto("training/demos/hamstring-stretch-0.webp"),
		appPhoto("training/demos/hamstring-stretch-1.webp"),
	],
	"hanging-knee-raises": [
		appPhoto("training/demos/hanging-knee-raises-0.webp"),
		appPhoto("training/demos/hanging-knee-raises-1.webp"),
	],
	inchworms: [
		appPhoto("training/demos/inchworms-0.webp"),
		appPhoto("training/demos/inchworms-1.webp"),
	],
	"incline-push-ups": [
		appPhoto("training/demos/incline-push-ups-0.webp"),
		appPhoto("training/demos/incline-push-ups-1.webp"),
	],
	"jump-rope": [
		appPhoto("training/demos/jump-rope-0.webp"),
		appPhoto("training/demos/jump-rope-1.webp"),
	],
	"jump-squats": [
		appPhoto("training/demos/jump-squats-0.webp"),
		appPhoto("training/demos/jump-squats-1.webp"),
	],
	"lat-pulldown": [
		appPhoto("training/demos/lat-pulldown-0.webp"),
		appPhoto("training/demos/lat-pulldown-1.webp"),
	],
	"low-lunge": [appPhoto("training/demos/low-lunge-0.webp")],
	"mountain-climbers": [
		appPhoto("training/demos/mountain-climbers-0.webp"),
		appPhoto("training/demos/mountain-climbers-1.webp"),
	],
	"muscle-up": [
		appPhoto("training/demos/muscle-up-0.webp"),
		appPhoto("training/demos/muscle-up-1.webp"),
	],
	"nordic-curls": [
		appPhoto("training/demos/nordic-curls-0.webp"),
		appPhoto("training/demos/nordic-curls-1.webp"),
	],
	"overhead-press": [
		appPhoto("training/demos/overhead-press-0.webp"),
		appPhoto("training/demos/overhead-press-1.webp"),
	],
	plank: [appPhoto("training/demos/plank-1.webp")],
	"plyo-push-ups": [
		appPhoto("training/demos/plyo-push-ups-0.webp"),
		appPhoto("training/demos/plyo-push-ups-1.webp"),
	],
	"pull-ups": [
		appPhoto("training/demos/pull-ups-0.webp"),
		appPhoto("training/demos/pull-ups-1.webp"),
	],
	"push-ups": [
		appPhoto("training/demos/push-ups-0.webp"),
		appPhoto("training/demos/push-ups-1.webp"),
	],
	"reverse-lunges": [
		appPhoto("training/demos/reverse-lunges-0.webp"),
		appPhoto("training/demos/reverse-lunges-1.webp"),
	],
	"russian-twists": [
		appPhoto("training/demos/russian-twists-0.webp"),
		appPhoto("training/demos/russian-twists-1.webp"),
	],
	"scapular-pull-ups": [
		appPhoto("training/demos/scapular-pull-ups-0.webp"),
		appPhoto("training/demos/scapular-pull-ups-1.webp"),
	],
	"side-plank": [
		appPhoto("training/demos/side-plank-0.webp"),
		appPhoto("training/demos/side-plank-1.webp"),
	],
	"single-leg-glute-bridges": [
		appPhoto("training/demos/single-leg-glute-bridges-0.webp"),
		appPhoto("training/demos/single-leg-glute-bridges-1.webp"),
	],
	"split-squats": [
		appPhoto("training/demos/split-squats-0.webp"),
		appPhoto("training/demos/split-squats-1.webp"),
	],
	"star-jumps": [
		appPhoto("training/demos/star-jumps-0.webp"),
		appPhoto("training/demos/star-jumps-1.webp"),
	],
	superman: [
		appPhoto("training/demos/superman-0.webp"),
		appPhoto("training/demos/superman-1.webp"),
	],
	"walking-lunges": [
		appPhoto("training/demos/walking-lunges-0.webp"),
		appPhoto("training/demos/walking-lunges-1.webp"),
	],
	"wall-handstand": [appPhoto("training/demos/wall-handstand-0.webp")],
	"wide-push-ups": [
		appPhoto("training/demos/wide-push-ups-0.webp"),
		appPhoto("training/demos/wide-push-ups-1.webp"),
	],
	"worlds-greatest-stretch": [
		appPhoto("training/demos/worlds-greatest-stretch-0.webp"),
		appPhoto("training/demos/worlds-greatest-stretch-1.webp"),
	],
};
