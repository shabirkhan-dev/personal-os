import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import type { HalalStatus, Stage, Story } from "../lib/career-model";
import type { GeneratedPrep } from "../data/career-actions";

/**
 * The Career AI tasks, through `POST /ai/career/:task`. They need a connection and a signed-in
 * account; every failure comes back as a `CareerAiError` with a sentence the screen can show.
 */

/** A six-week skill path is a long answer; the API itself allows the model 60 s. */
const AI_TIMEOUT_MS = 75_000;

export type CareerAiErrorKind = "offline" | "signed-out" | "unreadable" | "failed";

export class CareerAiError extends Error {
	constructor(
		readonly kind: CareerAiErrorKind,
		message: string,
	) {
		super(message);
		this.name = "CareerAiError";
	}
}

export type JobDetails = {
	company: string;
	role: string;
	pay: string;
	where: string;
	summary: string;
	halal: { status: HalalStatus; note: string };
};

export type ParsedLineAi = {
	application: {
		company: string;
		role: string;
		pay: string;
		where: string;
		stage: Stage;
		halal: { status: HalalStatus; note: string };
	} | null;
	followUpInDays: number | null;
};

export type Tone = "as-is" | "shorter" | "warmer" | "formal";

export type NudgeInput = {
	senderName: string;
	company: string;
	role: string;
	contactName: string;
	daysSinceApplied: number;
	notes: string;
	stories: readonly Story[];
	tone: Tone;
	currentDraft?: string;
};

export type SkillPathResult = {
	title: string;
	weeks: { title: string; goal: string; days: { title: string; detail: string }[] }[];
};

function toCareerAiError(error: unknown): CareerAiError {
	if (error instanceof CareerAiError) return error;
	if (error instanceof ApiError) {
		if (error.statusCode === 0) {
			return new CareerAiError("offline", "You're offline. This needs a connection.");
		}
		if (error.statusCode === 408) {
			return new CareerAiError("failed", "AI took too long to answer. Try again.");
		}
		if (error.statusCode === 401) {
			return new CareerAiError("signed-out", "Sign in again to use AI.");
		}
		if (error.code === "JOB_LINK_UNREADABLE") {
			return new CareerAiError(
				"unreadable",
				"The page needs a sign-in or blocks reading. Paste the job text, or fill it in yourself.",
			);
		}
	}
	return new CareerAiError("failed", "AI couldn't do that just now. Try again in a moment.");
}

const storyPayload = (stories: readonly Story[]) =>
	stories.slice(0, 6).map((story) => ({ title: story.title, summary: story.summary }));

export function useCareerAi() {
	const { token, status } = useAuth();

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (status !== "signed-in" || !token) {
				throw new CareerAiError("signed-out", "Sign in to use AI.");
			}
			try {
				return await apiClient.post<T>(`/ai/career/${task}`, body, {
					accessToken: token,
					timeoutMs: AI_TIMEOUT_MS,
				});
			} catch (error) {
				throw toCareerAiError(error);
			}
		},
		[status, token],
	);

	return useMemo(
		() => ({
			available: status === "signed-in" && token !== null,

			readJob: (source: { url: string } | { text: string }) => call<JobDetails>("read-job", source),

			parseLine: (text: string, now = new Date()) =>
				call<ParsedLineAi>("parse-line", { text, today: dayKey(now) }),

			draftNudge: (input: NudgeInput) =>
				call<{ subject: string; body: string }>("nudge", {
					...input,
					daysSinceApplied: Math.max(0, Math.min(365, input.daysSinceApplied)),
					stories: storyPayload(input.stories),
				}),

			interviewPrep: (input: {
				company: string;
				role: string;
				round: string;
				notes: string;
				stories: readonly Story[];
			}) =>
				call<GeneratedPrep>("interview-prep", {
					company: input.company,
					role: input.role,
					round: input.round,
					notes: input.notes,
					stories: storyPayload(input.stories),
				}),

			skillPath: (focus: string, context: string) =>
				call<SkillPathResult>("skill-path", { focus, weeks: 6, context }),
		}),
		[call, status, token],
	);
}
