import type { ImageSourcePropType } from "react-native";
import { appPhoto } from "@/lib/photos/app-photo";

/** The shelf photos (from the Figma "Care · Photo assets" frame), served from R2 through the API (`appPhoto`). */
export const CATALOG_IMAGES: Record<string, ImageSourcePropType> = {
	cleanser: appPhoto("care/cleanser.webp"),
	serum: appPhoto("care/serum.webp"),
	moisturizer: appPhoto("care/moisturizer.webp"),
	sunscreen: appPhoto("care/sunscreen.webp"),
	shampoo: appPhoto("care/shampoo.webp"),
	"hair-oil": appPhoto("care/hair-oil.webp"),
	"comb-and-brush": appPhoto("care/comb-and-brush.webp"),
	"body-lotion": appPhoto("care/body-lotion.webp"),
	"nail-kit": appPhoto("care/nail-kit.webp"),
	"teeth-and-lips": appPhoto("care/teeth-and-lips.webp"),
};
