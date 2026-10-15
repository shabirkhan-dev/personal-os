import { defineCollection } from "@/lib/db/collection";
import { parsePiece, parsePlan, parseSettings, parseWear, parseWish } from "../lib/fashion-model";

/** Fashion's slices of the record store. Names are part of the sync contract: never rename one. */
export const pieces = defineCollection("fashion-pieces", parsePiece);
export const wears = defineCollection("fashion-wears", parseWear);
export const plans = defineCollection("fashion-plans", parsePlan);
export const wishes = defineCollection("fashion-wishes", parseWish);
export const fashionSettings = defineCollection("fashion-settings", parseSettings);
