import type { ImageSourcePropType } from "react-native";
import type { PhotoKey } from "./wishlist-model";

/**
 * The Figma "Wishlist · Photo assets" (394:410), bundled with the app as `assets/wishlist/<key>.jpg`.
 * A key without a file shows the category tile instead, so a dream never shows a broken image.
 */
export const WISHLIST_PHOTOS: Partial<Record<PhotoKey, ImageSourcePropType>> = {};
