import type { ImageSourcePropType } from "react-native";

/** Training photos (from the Figma "Training · Photo assets" frame), bundled with the app. */
export const TRAINING_PHOTOS: Record<string, ImageSourcePropType> = {
	"pull-ups": require("../../../../assets/training/pull-ups.jpg"),
	"push-ups": require("../../../../assets/training/push-ups.jpg"),
	handstand: require("../../../../assets/training/handstand.jpg"),
	"handstand-hero": require("../../../../assets/training/handstand-hero.jpg"),
	"pistol-squat": require("../../../../assets/training/pistol-squat.jpg"),
	"shadow-boxing": require("../../../../assets/training/shadow-boxing.jpg"),
	"mountain-run": require("../../../../assets/training/mountain-run.jpg"),
	"mountain-run-hero": require("../../../../assets/training/mountain-run-hero.jpg"),
	football: require("../../../../assets/training/football.jpg"),
	yoga: require("../../../../assets/training/yoga.jpg"),
	dips: require("../../../../assets/training/dips.jpg"),
	"dips-hero": require("../../../../assets/training/dips-hero.jpg"),
	volleyball: require("../../../../assets/training/volleyball.jpg"),
};

/** The wide crop for a photo when there is one. */
export function heroOf(photo: string): string {
	return TRAINING_PHOTOS[`${photo}-hero`] ? `${photo}-hero` : photo;
}
