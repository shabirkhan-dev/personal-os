import type { ImageSourcePropType } from "react-native";
import { appPhoto } from "@/lib/photos/app-photo";

/** Training photos (from the Figma "Training · Photo assets" frame), served from R2 through the API (`appPhoto`). */
export const TRAINING_PHOTOS: Record<string, ImageSourcePropType> = {
	"pull-ups": appPhoto("training/pull-ups.webp"),
	"push-ups": appPhoto("training/push-ups.webp"),
	handstand: appPhoto("training/handstand.webp"),
	"handstand-hero": appPhoto("training/handstand-hero.webp"),
	"pistol-squat": appPhoto("training/pistol-squat.webp"),
	"shadow-boxing": appPhoto("training/shadow-boxing.webp"),
	"mountain-run": appPhoto("training/mountain-run.webp"),
	"mountain-run-hero": appPhoto("training/mountain-run-hero.webp"),
	football: appPhoto("training/football.webp"),
	yoga: appPhoto("training/yoga.webp"),
	dips: appPhoto("training/dips.webp"),
	"dips-hero": appPhoto("training/dips-hero.webp"),
	volleyball: appPhoto("training/volleyball.webp"),
};

/** The wide crop for a photo when there is one. */
export function heroOf(photo: string): string {
	return TRAINING_PHOTOS[`${photo}-hero`] ? `${photo}-hero` : photo;
}
