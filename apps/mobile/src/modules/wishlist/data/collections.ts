import { defineCollection } from "@/lib/db/collection";
import { parseDream, parseOwned, parseWishlistSettings } from "../lib/wishlist-model";

/** Wishlist's slices of the record store. Names are part of the sync contract: never rename one. */
export const wishlistSettings = defineCollection("wishlist-settings", parseWishlistSettings);
export const wishlistDreams = defineCollection("wishlist-dreams", parseDream);
export const wishlistOwned = defineCollection("wishlist-owned", parseOwned);
