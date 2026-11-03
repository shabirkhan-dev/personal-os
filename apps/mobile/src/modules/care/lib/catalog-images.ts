import type { ImageSourcePropType } from "react-native";

/** The shelf photos (from the Figma "Care · Photo assets" frame), bundled with the app. */
export const CATALOG_IMAGES: Record<string, ImageSourcePropType> = {
	cleanser: require("../../../../assets/care/cleanser.webp"),
	serum: require("../../../../assets/care/serum.webp"),
	moisturizer: require("../../../../assets/care/moisturizer.webp"),
	sunscreen: require("../../../../assets/care/sunscreen.webp"),
	shampoo: require("../../../../assets/care/shampoo.webp"),
	"hair-oil": require("../../../../assets/care/hair-oil.webp"),
	"comb-and-brush": require("../../../../assets/care/comb-and-brush.webp"),
	"body-lotion": require("../../../../assets/care/body-lotion.webp"),
	"nail-kit": require("../../../../assets/care/nail-kit.webp"),
	"teeth-and-lips": require("../../../../assets/care/teeth-and-lips.webp"),
};
