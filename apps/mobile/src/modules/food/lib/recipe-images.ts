import type { ImageSourcePropType } from "react-native";

/** The recipe photos (from the Figma "Food" frames), bundled with the app. */
export const RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
	"chicken-karahi": require("../../../../assets/food/chicken-karahi.webp"),
	"chicken-pulao": require("../../../../assets/food/chicken-pulao.webp"),
	"chana-masala": require("../../../../assets/food/chana-masala.webp"),
	"daal-chawal": require("../../../../assets/food/daal-chawal.webp"),
	"home-chicken-curry": require("../../../../assets/food/home-chicken-curry.webp"),
	"chicken-tikka-plate": require("../../../../assets/food/chicken-tikka-plate.webp"),
	"desi-omelette": require("../../../../assets/food/desi-omelette.webp"),
	"egg-paratha-chai": require("../../../../assets/food/egg-paratha-chai.webp"),
	"milk-oats": require("../../../../assets/food/milk-oats.webp"),
	"egg-toast": require("../../../../assets/food/egg-toast.webp"),
	"lassi-boiled-eggs": require("../../../../assets/food/lassi-boiled-eggs.webp"),
	"banana-pb-shake": require("../../../../assets/food/banana-pb-shake.webp"),
	"yogurt-fruit-bowl": require("../../../../assets/food/yogurt-fruit-bowl.webp"),
	"fruit-platter": require("../../../../assets/food/fruit-platter.webp"),
	"apricots-walnuts": require("../../../../assets/food/apricots-walnuts.webp"),
};

/** Wider crops for a recipe's header. */
export const RECIPE_HEROES: Record<string, ImageSourcePropType> = {
	"chicken-karahi": require("../../../../assets/food/chicken-karahi-hero.webp"),
	"egg-paratha-chai": require("../../../../assets/food/egg-paratha-chai-hero.webp"),
};
