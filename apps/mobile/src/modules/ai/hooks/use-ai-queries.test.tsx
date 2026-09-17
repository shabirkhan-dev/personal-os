import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useAuth } from "@/modules/auth";
import { aiService } from "../services/ai.service";
import type { DailyIntelligence } from "../types/ai.types";
import {
	useChatMessagesQuery,
	useChatSessionsQuery,
	useDailyIntelligenceQuery,
} from "./use-ai-queries";

jest.mock("@/modules/auth", () => ({
	useAuth: jest.fn(),
}));

jest.mock("../services/ai.service", () => ({
	aiService: {
		getDaily: jest.fn(),
		listSessions: jest.fn(),
		getMessages: jest.fn(),
	},
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedGetDaily = jest.mocked(aiService.getDaily);
const mockedListSessions = jest.mocked(aiService.listSessions);
const mockedGetMessages = jest.mocked(aiService.getMessages);

const dailyFixture: DailyIntelligence = {
	date: "2026-08-25",
	timeZone: "UTC",
	insights: [
		{
			id: "ins-1",
			kind: "routine",
			priority: "high",
			title: "Morning Routine Streak",
			detail: "Completed 5 days in a row.",
			sourceRefs: [{ type: "routine", id: "rout-1", label: "Morning Routine" }],
		},
	],
	provider: "mock-llm",
	model: "mock-v1",
};

beforeEach(() => {
	jest.clearAllMocks();
});

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: 0, gcTime: Number.POSITIVE_INFINITY } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { wrapper, queryClient };
}

describe("user-scoped AI queries", () => {
	it("fetches daily intelligence under a user-scoped key", async () => {
		mockedUseAuth.mockReturnValue({
			token: "test-token",
			user: { id: "user-123" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedGetDaily.mockResolvedValue(dailyFixture);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDailyIntelligenceQuery(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedGetDaily).toHaveBeenCalledWith("test-token");
		expect(result.current.data?.insights).toHaveLength(1);
		expect(result.current.data?.insights[0]?.title).toBe("Morning Routine Streak");
	});

	it("is disabled when not authenticated", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			user: null,
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDailyIntelligenceQuery(), { wrapper });

		expect(result.current.fetchStatus).toBe("idle");
		expect(mockedGetDaily).not.toHaveBeenCalled();
	});

	it("fetches chat messages with sessionId parameter", async () => {
		mockedUseAuth.mockReturnValue({
			token: "test-token",
			user: { id: "user-123" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedGetMessages.mockResolvedValue({
			messages: [
				{
					id: "msg-1",
					role: "assistant",
					content: "Hello from Personal OS",
					sources: null,
					suggestions: null,
					provider: "test",
					model: "test",
					latencyMs: 120,
					createdAt: "2026-08-25T12:00:00.000Z",
				},
			],
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useChatMessagesQuery("session-abc", 50), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockedGetMessages).toHaveBeenCalledWith("test-token", "session-abc", 50);
		expect(result.current.data?.messages[0]?.content).toBe("Hello from Personal OS");
	});

	it("fetches chat sessions list under a user-scoped key", async () => {
		mockedUseAuth.mockReturnValue({
			token: "test-token",
			user: { id: "user-123" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedListSessions.mockResolvedValue({
			sessions: [
				{
					id: "sess-1",
					title: "Morning Planning",
					context: { route: null, entity: null, date: null },
					createdAt: "2026-08-25T10:00:00.000Z",
					updatedAt: "2026-08-25T10:00:00.000Z",
				},
			],
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useChatSessionsQuery({ limit: 10 }), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockedListSessions).toHaveBeenCalledWith("test-token", { limit: 10 });
		expect(result.current.data?.sessions).toHaveLength(1);
	});

	it("isolates cache between different user accounts", async () => {
		const { wrapper, queryClient } = createWrapper();

		mockedUseAuth.mockReturnValue({
			token: "token-user-a",
			user: { id: "user-a" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedGetDaily.mockResolvedValue({ ...dailyFixture, date: "2026-08-25" });
		const first = renderHook(() => useDailyIntelligenceQuery(), { wrapper });
		await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
		first.unmount();

		mockedUseAuth.mockReturnValue({
			token: "token-user-b",
			user: { id: "user-b" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedGetDaily.mockResolvedValue({ ...dailyFixture, date: "2026-08-26" });
		const second = renderHook(() => useDailyIntelligenceQuery(), { wrapper });
		await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
		second.unmount();

		expect(queryClient.getQueryData(["ai", "user-a", "daily"])).toEqual(
			expect.objectContaining({ date: "2026-08-25" }),
		);
		expect(queryClient.getQueryData(["ai", "user-b", "daily"])).toEqual(
			expect.objectContaining({ date: "2026-08-26" }),
		);
	});
});
