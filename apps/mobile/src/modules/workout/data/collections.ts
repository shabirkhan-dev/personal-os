import { defineCollection } from "@/lib/db/collection";
import { parsePlan, parseSession, parseSettings, parseSkill } from "../lib/training-model";

/** Training's slices of the record store. Names are part of the sync contract: never rename one. */
export const trainingSettings = defineCollection("training-settings", parseSettings);
export const trainingSessions = defineCollection("training-sessions", parseSession);
export const trainingPlans = defineCollection("training-plans", parsePlan);
export const trainingSkills = defineCollection("training-skills", parseSkill);
