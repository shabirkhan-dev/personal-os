import { useCallback } from "react";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { savePrep, startSkillPlan } from "../data/career-actions";
import type { Application, Story } from "../lib/career-model";
import { useCareerAi } from "../services/career-ai";

/** Career's long AI work, run as background jobs (see `lib/ai-jobs`). */

export const SKILL_PATH_JOB = "career:skill-path";
export const prepJobKey = (appId: string) => `career:prep:${appId}`;

export const SKILL_PATH_STEPS = [
	"Reading your applications",
	"Choosing what to learn first",
	"Planning six weeks",
	"Writing each 30-minute day",
	"Lining it up with your interviews",
	"Almost there",
] as const;

export const PREP_STEPS = [
	"Reading the role and your notes",
	"Picking topics to revise",
	"Writing questions to ask",
	"Making flashcards",
	"Almost there",
] as const;

/** Starts planning a skill path; the plan appears on its own when it's ready. */
export function useStartSkillPath() {
	const ai = useCareerAi();
	const start = useAiJobs((state) => state.start);
	return useCallback(
		(topic: string, apps: readonly Application[]) => {
			const roles = apps
				.filter((app) => app.stage === "applied" || app.stage === "interview")
				.slice(0, 5)
				.map((app) => `${app.role} at ${app.company}`)
				.join("; ");
			start(SKILL_PATH_JOB, `Your ${topic} path`, async () => {
				const path = await ai.skillPath(topic, roles ? `Applying for: ${roles}` : "");
				await startSkillPlan(path.title || topic, path.weeks);
			});
		},
		[ai, start],
	);
}

/** Starts building interview prep for one application. */
export function useStartPrep() {
	const ai = useCareerAi();
	const start = useAiJobs((state) => state.start);
	return useCallback(
		(app: Application, stories: readonly Story[]) => {
			start(prepJobKey(app.id), `Prep for ${app.company}`, async () => {
				const generated = await ai.interviewPrep({
					company: app.company,
					role: app.role,
					round: app.interview?.round ?? "",
					notes: app.notes,
					stories,
				});
				await savePrep(app.id, generated);
			});
		},
		[ai, start],
	);
}
