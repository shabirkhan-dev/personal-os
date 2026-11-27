import { defineCollection } from "@/lib/db/collection";
import { parseActivity } from "../lib/activities";
import { parseSavedExercise } from "../lib/exercise-guide";
import { parseProgram, parseProgress } from "../lib/programs/program-model";
import { parsePlan, parseSession, parseSettings, parseSkill } from "../lib/training-model";

/** Training's slices of the record store. Names are part of the sync contract: never rename one. */
export const trainingSettings = defineCollection("training-settings", parseSettings);
export const trainingSessions = defineCollection("training-sessions", parseSession);
export const trainingPlans = defineCollection("training-plans", parsePlan);
export const trainingSkills = defineCollection("training-skills", parseSkill);
/** Programs people design, by hand or with AI. */
export const trainingPrograms = defineCollection("training-programs", parseProgram);
/** Each chain's or exercise's level, moved on by every program session. */
export const trainingProgress = defineCollection("training-progress", parseProgress);
/** Activities people define: football, swimming, a climbing night. */
export const trainingActivities = defineCollection("training-activities", parseActivity);
/** Their exercises: added by hand, made with AI or imported. */
export const trainingExercises = defineCollection("training-exercises", parseSavedExercise);
