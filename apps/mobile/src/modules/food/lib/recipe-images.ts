import type { ImageSourcePropType } from "react-native";

/** The recipe photos (from the Figma "Food" frames), bundled with the app. */
export const RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
	"chicken-karahi": require("../../../../assets/food/chicken-karahi.jpg"),
	"chicken-pulao": require("../../../../assets/food/chicken-pulao.jpg"),
	"chana-masala": require("../../../../assets/food/chana-masala.jpg"),
	"daal-chawal": require("../../../../assets/food/daal-chawal.jpg"),
	"home-chicken-curry": require("../../../../assets/food/home-chicken-curry.jpg"),
	"chicken-tikka-plate": require("../../../../assets/food/chicken-tikka-plate.jpg"),
	"desi-omelette": require("../../../../assets/food/desi-omelette.jpg"),
	"egg-paratha-chai": require("../../../../assets/food/egg-paratha-chai.jpg"),
	"milk-oats": require("../../../../assets/food/milk-oats.jpg"),
	"egg-toast": require("../../../../assets/food/egg-toast.jpg"),
	"lassi-boiled-eggs": require("../../../../assets/food/lassi-boiled-eggs.jpg"),
	"banana-pb-shake": require("../../../../assets/food/banana-pb-shake.jpg"),
	"yogurt-fruit-bowl": require("../../../../assets/food/yogurt-fruit-bowl.jpg"),
	"fruit-platter": require("../../../../assets/food/fruit-platter.jpg"),
	"apricots-walnuts": require("../../../../assets/food/apricots-walnuts.jpg"),
};

/** Wider crops for a recipe's header. */
export const RECIPE_HEROES: Record<string, ImageSourcePropType> = {
	"chicken-karahi": require("../../../../assets/food/chicken-karahi-hero.jpg"),
	"egg-paratha-chai": require("../../../../assets/food/egg-paratha-chai-hero.jpg"),
};
