import type * as z from "zod";

import type { AiConfig } from "./config";
import { askCareSchema, designRoutineSchema } from "./care.schema";
import { askCare, designRoutine } from "./care.tasks";
import {
	interviewPrepSchema,
	nudgeSchema,
	parseLineSchema,
	readJobSchema,
	skillPathSchema,
} from "./career.schema";
import { buildInterviewPrep, draftNudge, parseLine, planSkillPath, readJob } from "./career.tasks";
import { designDaySchema } from "./daily.schema";
import { designDay } from "./daily.tasks";
import { askFaithSchema } from "./faith.schema";
import { askFaith } from "./faith.tasks";
import { askFashionSchema, readPieceSchema } from "./fashion.schema";
import { askFashion, readPiece } from "./fashion.tasks";
import { askFinanceSchema, designBudgetSchema, readSpendSchema } from "./finance.schema";
import { askFinance, designBudget, readSpend } from "./finance.tasks";
import { askFoodSchema, draftRecipeSchema, planWeekSchema, readMealSchema } from "./food.schema";
import { askFood, draftRecipe, planWeek, readMeal } from "./food.tasks";
import { askTrainingSchema, designProgramSchema, skillStepsSchema } from "./training.schema";
import { askTraining, buildSkill, designProgram } from "./training.tasks";
import { makeTemplateSchema } from "./templates.schema";
import { makeTemplate } from "./templates.tasks";
import { findDreamSchema } from "./wishlist.schema";
import { findDream } from "./wishlist.tasks";

/**
 * Every module AI task by its path (`food/plan-week`), with the input it accepts. The API serves
 * each one at `POST /ai/<path>`; the app runs the same ones on the phone with the person's own key.
 */
export type AiTask = {
	input: z.ZodType;
	run: (deps: { config: AiConfig }, input: never) => Promise<unknown>;
};

const task = <Schema extends z.ZodType>(
	input: Schema,
	run: (deps: { config: AiConfig }, input: z.infer<Schema>) => Promise<unknown>,
): AiTask => ({ input, run: run as AiTask["run"] });

export const AI_TASKS = {
	"career/read-job": task(readJobSchema, readJob),
	"career/parse-line": task(parseLineSchema, parseLine),
	"career/nudge": task(nudgeSchema, draftNudge),
	"career/interview-prep": task(interviewPrepSchema, buildInterviewPrep),
	"career/skill-path": task(skillPathSchema, planSkillPath),
	"faith/ask": task(askFaithSchema, askFaith),
	"fashion/read-piece": task(readPieceSchema, readPiece),
	"fashion/ask": task(askFashionSchema, askFashion),
	"food/read-meal": task(readMealSchema, readMeal),
	"food/ask": task(askFoodSchema, askFood),
	"food/draft-recipe": task(draftRecipeSchema, draftRecipe),
	"food/plan-week": task(planWeekSchema, planWeek),
	"care/ask": task(askCareSchema, askCare),
	"care/design-routine": task(designRoutineSchema, designRoutine),
	"finance/design-budget": task(designBudgetSchema, designBudget),
	"finance/read": task(readSpendSchema, readSpend),
	"finance/ask": task(askFinanceSchema, askFinance),
	"daily/design-day": task(designDaySchema, designDay),
	"training/ask": task(askTrainingSchema, askTraining),
	"training/skill": task(skillStepsSchema, buildSkill),
	"training/program": task(designProgramSchema, designProgram),
	"wishlist/find": task(findDreamSchema, findDream),
	"templates/make": task(makeTemplateSchema, makeTemplate),
} as const satisfies Record<string, AiTask>;

export type AiTaskPath = keyof typeof AI_TASKS;

export const isAiTaskPath = (path: string): path is AiTaskPath => Object.hasOwn(AI_TASKS, path);

/** Validates `body` against the task's input, then runs it. Bad input throws a TypeError (a bug in the caller). */
export async function runAiTask(
	config: AiConfig,
	path: AiTaskPath,
	body: unknown,
): Promise<unknown> {
	const entry: AiTask = AI_TASKS[path];
	const parsed = entry.input.safeParse(body);
	if (!parsed.success) {
		throw new TypeError(`Invalid input for ${path}: ${parsed.error.issues[0]?.message ?? ""}`);
	}
	return entry.run({ config }, parsed.data as never);
}
