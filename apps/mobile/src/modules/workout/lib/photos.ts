import type { ImageSourcePropType } from "react-native";

/** Training photos (from the Figma "Training · Photo assets" frame), bundled with the app. */
export const TRAINING_PHOTOS: Record<string, ImageSourcePropType> = {
	"pull-ups": require("../../../../assets/training/pull-ups.webp"),
	"push-ups": require("../../../../assets/training/push-ups.webp"),
	handstand: require("../../../../assets/training/handstand.webp"),
	"handstand-hero": require("../../../../assets/training/handstand-hero.webp"),
	"pistol-squat": require("../../../../assets/training/pistol-squat.webp"),
	"shadow-boxing": require("../../../../assets/training/shadow-boxing.webp"),
	"mountain-run": require("../../../../assets/training/mountain-run.webp"),
	"mountain-run-hero": require("../../../../assets/training/mountain-run-hero.webp"),
	football: require("../../../../assets/training/football.webp"),
	yoga: require("../../../../assets/training/yoga.webp"),
	dips: require("../../../../assets/training/dips.webp"),
	"dips-hero": require("../../../../assets/training/dips-hero.webp"),
	volleyball: require("../../../../assets/training/volleyball.webp"),
};

/** The wide crop for a photo when there is one. */
export function heroOf(photo: string): string {
	return TRAINING_PHOTOS[`${photo}-hero`] ? `${photo}-hero` : photo;
}
