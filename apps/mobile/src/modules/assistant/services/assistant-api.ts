import type {
	AssistantContext,
	AssistantEvent,
	ThreadMessage,
	ThreadSummary,
} from "@personal-os/domain/assistant";
import { fetch as streamingFetch } from "expo/fetch";
import { ApiError, apiClient, apiUrl, refreshToken } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";

/**
 * The assistant API. A message or an approval answers as a stream of events, read as they
 * arrive (Expo's fetch streams the body on every platform); the rest is plain JSON.
 */

export class AssistantError extends Error {
	constructor(
		message: string,
		readonly code: string,
	) {
		super(message);
		this.name = "AssistantError";
	}
}

/** One sentence for any failure, worded for the chat. */
export function assistantErrorMessage(error: unknown): string {
	if (error instanceof AssistantError) return error.message;
	const limit = aiLimitMessage(error);
	if (limit) return limit;
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. The assistant needs a connection.";
		if (error.statusCode === 401) return "Sign in again to use the assistant.";
		return error.message;
	}
	return "The assistant couldn't answer just now. Try again.";
}

type Emit = (event: AssistantEvent) => void;

/** Posts to a streaming route and calls `emit` for each event; resolves when the stream ends. */
async function stream(
	path: string,
	body: unknown,
	token: string,
	emit: Emit,
	signal?: AbortSignal,
	retried = false,
): Promise<void> {
	const url = apiUrl(path);
	if (!url)
		throw new AssistantError(
			"This version can't reach its server. Update the app.",
			"API_NOT_CONFIGURED",
		);
	let response: Awaited<ReturnType<typeof streamingFetch>>;
	try {
		response = await streamingFetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				Accept: "text/event-stream",
			},
			body: JSON.stringify(body),
			signal,
		});
	} catch (error) {
		if (signal?.aborted) return;
		console.warn("[assistant] could not reach the API", error);
		throw new ApiError("offline", 0, "API_UNREACHABLE");
	}
	if (!response.ok) {
		const failure = (await response.json().catch(() => ({}))) as {
			code?: string;
			message?: string;
		};
		if (failure.code === "AUTH_ACCESS_TOKEN_INVALID" && !retried) {
			const fresh = await refreshToken();
			if (fresh && fresh !== token) return stream(path, body, fresh, emit, signal, true);
		}
		throw new ApiError(failure.message ?? "Request failed", response.status, failure.code);
	}
	if (!response.body)
		throw new AssistantError("The assistant sent nothing back. Try again.", "EMPTY");

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	const flush = (line: string) => {
		if (!line.startsWith("data:")) return;
		try {
			emit(JSON.parse(line.slice(5)) as AssistantEvent);
		} catch (error) {
			console.warn("[assistant] skipped an unreadable event", error);
		}
	};
	for (;;) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- streaming read
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		let end = buffer.indexOf("\n");
		while (end !== -1) {
			flush(buffer.slice(0, end).trim());
			buffer = buffer.slice(end + 1);
			end = buffer.indexOf("\n");
		}
	}
	flush(buffer.trim());
}

export const assistantApi = {
	send: (
		token: string,
		input: { threadId: string | null; text: string; context: AssistantContext },
		emit: Emit,
		signal?: AbortSignal,
	) =>
		stream(
			"/assistant/messages",
			{
				...(input.threadId ? { threadId: input.threadId } : {}),
				text: input.text,
				context: input.context,
			},
			token,
			emit,
			signal,
		),
	decide: (
		token: string,
		input: { callId: string; approve: boolean; timeZone: string },
		emit: Emit,
	) => stream("/assistant/approvals", input, token, emit),
	undo: (token: string, callId: string) =>
		apiClient.post<{ changed: string[] }>("/assistant/undo", { callId }, { accessToken: token }),
	threads: (token: string) =>
		apiClient.get<ThreadSummary[]>("/assistant/threads", { accessToken: token }),
	thread: (token: string, id: string) =>
		apiClient.get<{ id: string; title: string; messages: ThreadMessage[] }>(
			`/assistant/threads/${id}`,
			{
				accessToken: token,
			},
		),
	deleteThread: (token: string, id: string) =>
		apiClient.delete<void>(`/assistant/threads/${id}`, { accessToken: token }),
	memories: (token: string) =>
		apiClient.get<{ id: string; text: string; createdAt: string }[]>("/assistant/memories", {
			accessToken: token,
		}),
	forget: (token: string, id: string) =>
		apiClient.delete<void>(`/assistant/memories/${id}`, { accessToken: token }),
};

/** The phone's time zone, "Asia/Karachi". */
export function deviceTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
}
