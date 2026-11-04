import type { ImageSourcePropType } from "react-native";
import { appPhoto } from "@/lib/photos/app-photo";

/** The starter photos (from the Figma "Fashion · Photo assets" frame), served from R2 through the API (`appPhoto`). */
export const CATALOG_IMAGES: Record<string, ImageSourcePropType> = {
	"white-tee": appPhoto("fashion/white-tee.webp"),
	"grey-tee": appPhoto("fashion/grey-tee.webp"),
	"black-tee": appPhoto("fashion/black-tee.webp"),
	"navy-polo": appPhoto("fashion/navy-polo.webp"),
	"white-oxford": appPhoto("fashion/white-oxford.webp"),
	"olive-overshirt": appPhoto("fashion/olive-overshirt.webp"),
	"beige-overshirt": appPhoto("fashion/beige-overshirt.webp"),
	"navy-blazer": appPhoto("fashion/navy-blazer.webp"),
	"charcoal-chinos": appPhoto("fashion/charcoal-chinos.webp"),
	"navy-chinos": appPhoto("fashion/navy-chinos.webp"),
	"khaki-chinos": appPhoto("fashion/khaki-chinos.webp"),
	"indigo-jeans": appPhoto("fashion/indigo-jeans.webp"),
	"white-sneakers": appPhoto("fashion/white-sneakers.webp"),
	"chelsea-boots": appPhoto("fashion/chelsea-boots.webp"),
	"navy-trainers": appPhoto("fashion/navy-trainers.webp"),
	"field-watch": appPhoto("fashion/field-watch.webp"),
	"dress-watch": appPhoto("fashion/dress-watch.webp"),
	"dive-watch": appPhoto("fashion/dive-watch.webp"),
	"blue-fresh": appPhoto("fashion/blue-fresh.webp"),
	"amber-oud": appPhoto("fashion/amber-oud.webp"),
	"smoked-woods": appPhoto("fashion/smoked-woods.webp"),
	sunglasses: appPhoto("fashion/sunglasses.webp"),
	"leather-belt": appPhoto("fashion/leather-belt.webp"),
};
