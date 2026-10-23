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
	"cat-cow": [
		require("../../../../assets/training/demos/cat-cow-0.jpg"),
		require("../../../../assets/training/demos/cat-cow-1.jpg"),
	],
	dips: [
		require("../../../../assets/training/demos/dips-0.jpg"),
		require("../../../../assets/training/demos/dips-1.jpg"),
	],
	"hanging-knee-raises": [
		require("../../../../assets/training/demos/hanging-knee-raises-0.jpg"),
		require("../../../../assets/training/demos/hanging-knee-raises-1.jpg"),
	],
	"jump-squats": [
		require("../../../../assets/training/demos/jump-squats-0.jpg"),
		require("../../../../assets/training/demos/jump-squats-1.jpg"),
	],
	"low-lunge": [require("../../../../assets/training/demos/low-lunge-0.jpg")],
	plank: [require("../../../../assets/training/demos/plank-1.jpg")],
	"pull-ups": [
		require("../../../../assets/training/demos/pull-ups-0.jpg"),
		require("../../../../assets/training/demos/pull-ups-1.jpg"),
	],
	"push-ups": [
		require("../../../../assets/training/demos/push-ups-0.jpg"),
		require("../../../../assets/training/demos/push-ups-1.jpg"),
	],
	"walking-lunges": [
		require("../../../../assets/training/demos/walking-lunges-0.jpg"),
		require("../../../../assets/training/demos/walking-lunges-1.jpg"),
	],
	"wall-handstand": [require("../../../../assets/training/demos/wall-handstand-0.jpg")],
};
