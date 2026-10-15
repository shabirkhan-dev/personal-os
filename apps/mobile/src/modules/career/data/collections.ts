import { defineCollection } from "@/lib/db/collection";
import {
	parseApplication,
	parseFlashcard,
	parsePrep,
	parseSettings,
	parseSkillPlan,
	parseSkillSession,
	parseStory,
} from "../lib/career-model";

/** Career's slices of the record store. Names are part of the sync contract: never rename one. */
export const applications = defineCollection("career-applications", parseApplication);
export const preps = defineCollection("career-preps", parsePrep);
export const stories = defineCollection("career-stories", parseStory);
export const flashcards = defineCollection("career-flashcards", parseFlashcard);
export const skillPlans = defineCollection("career-skill-plans", parseSkillPlan);
export const skillSessions = defineCollection("career-skill-sessions", parseSkillSession);
export const careerSettings = defineCollection("career-settings", parseSettings);
