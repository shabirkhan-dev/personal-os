import { apiClient } from "@/lib/api/client";
import type { OnboardingAnswers } from "../store/onboarding-store";

export type RemoteOnboarding = {
	answers: OnboardingAnswers;
	schemaVersion: number;
	updatedAt: string;
};

/** `GET`/`PUT /users/me/onboarding`; the contract lives in `backend-api.mdx`. */
export const onboardingService = {
	get: (accessToken: string) =>
		apiClient.get<RemoteOnboarding | null>("/users/me/onboarding", { accessToken }),
	save: (accessToken: string, answers: OnboardingAnswers) =>
		apiClient.put<RemoteOnboarding>("/users/me/onboarding", { answers }, { accessToken }),
};
