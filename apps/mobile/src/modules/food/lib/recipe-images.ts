import type { ImageSourcePropType } from "react-native";
import { appPhoto } from "@/lib/photos/app-photo";

/** The recipe photos (from the Figma "Food" frames), served from R2 through the API (`appPhoto`). */
export const RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
	"chicken-karahi": appPhoto("food/chicken-karahi.webp"),
	"chicken-pulao": appPhoto("food/chicken-pulao.webp"),
	"chana-masala": appPhoto("food/chana-masala.webp"),
	"daal-chawal": appPhoto("food/daal-chawal.webp"),
	"home-chicken-curry": appPhoto("food/home-chicken-curry.webp"),
	"chicken-tikka-plate": appPhoto("food/chicken-tikka-plate.webp"),
	"desi-omelette": appPhoto("food/desi-omelette.webp"),
	"egg-paratha-chai": appPhoto("food/egg-paratha-chai.webp"),
	"milk-oats": appPhoto("food/milk-oats.webp"),
	"egg-toast": appPhoto("food/egg-toast.webp"),
	"lassi-boiled-eggs": appPhoto("food/lassi-boiled-eggs.webp"),
	"banana-pb-shake": appPhoto("food/banana-pb-shake.webp"),
	"yogurt-fruit-bowl": appPhoto("food/yogurt-fruit-bowl.webp"),
	"fruit-platter": appPhoto("food/fruit-platter.webp"),
	"apricots-walnuts": appPhoto("food/apricots-walnuts.webp"),
};

/** Wider crops for a recipe's header. */
export const RECIPE_HEROES: Record<string, ImageSourcePropType> = {
	"chicken-karahi": appPhoto("food/chicken-karahi-hero.webp"),
	"egg-paratha-chai": appPhoto("food/egg-paratha-chai-hero.webp"),
};
