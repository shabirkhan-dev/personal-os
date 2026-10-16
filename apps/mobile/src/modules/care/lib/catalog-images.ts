import type { ImageSourcePropType } from "react-native";

/** The shelf photos (from the Figma "Care · Photo assets" frame), bundled with the app. */
export const CATALOG_IMAGES: Record<string, ImageSourcePropType> = {
	cleanser: require("../../../../assets/care/cleanser.jpg"),
	serum: require("../../../../assets/care/serum.jpg"),
	moisturizer: require("../../../../assets/care/moisturizer.jpg"),
	sunscreen: require("../../../../assets/care/sunscreen.jpg"),
	shampoo: require("../../../../assets/care/shampoo.jpg"),
	"hair-oil": require("../../../../assets/care/hair-oil.jpg"),
	"comb-and-brush": require("../../../../assets/care/comb-and-brush.jpg"),
	"body-lotion": require("../../../../assets/care/body-lotion.jpg"),
	"nail-kit": require("../../../../assets/care/nail-kit.jpg"),
	"teeth-and-lips": require("../../../../assets/care/teeth-and-lips.jpg"),
};
