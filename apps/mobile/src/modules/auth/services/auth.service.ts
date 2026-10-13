import { apiClient } from "@/lib/api/client";
import type { User } from "@/modules/users/types/user.types";
import type {
	AuthChallengeResult,
	AuthSession,
	EmailCodeRequest,
	EmailCodeVerify,
} from "../types/auth.types";

/** Auth endpoints the app uses; the contract lives in `apps/docs/content/docs/backend-api.mdx`. */
export const authService = {
	requestEmailCode: (input: EmailCodeRequest) =>
		apiClient.post<AuthChallengeResult>("/auth/methods/email-code/request", input),
	verifyEmailCode: (input: EmailCodeVerify) =>
		apiClient.post<AuthSession>("/auth/methods/email-code/verify", input),
	refresh: (refreshToken: string) => apiClient.post<AuthSession>("/auth/refresh", { refreshToken }),
	logout: (refreshToken: string | null) =>
		apiClient.post<void>("/auth/logout", refreshToken ? { refreshToken } : {}),
	me: (accessToken: string) => apiClient.get<User>("/auth/me", { accessToken }),
};
