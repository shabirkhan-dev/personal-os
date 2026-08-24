import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useAuth } from "@/modules/auth";
import { routinesService } from "../services/routines.service";
import type { Routine, TodayView } from "../types/routine.types";
import { useRoutinesListQuery, useTodayQuery } from "./use-routine-queries";

jest.mock("@/modules/auth", () => ({
	useAuth: jest.fn(),
}));

jest.mock("../services/routines.service", () => ({
	routinesService: {
		getToday: jest.fn(),
		list: jest.fn(),
	},
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedGetToday = jest.mocked(routinesService.getToday);
const mockedList = jest.mocked(routinesService.list);

const todayView: TodayView = {
	date: "2026-08-24",
	timeZone: "UTC",
	weekday: 1,
	routines: [],
};

function routineFixture(id: string): Routine {
	return {
		id,
		name: `Routine ${id}`,
		description: null,
		scheduleType: "daily",
		daysOfWeek: [],
		archivedAt: null,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		items: [],
	};
}

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

describe("user-scoped routine query keys", () => {
	it("stores the today view under a user-scoped key", async () => {
		mockedUseAuth.mockReturnValue({
			token: "access-token",
			user: { id: "user-a" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedGetToday.mockResolvedValue(todayView);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useTodayQuery(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedGetToday).toHaveBeenCalledWith("access-token");
		expect(result.current.data).toEqual(expect.objectContaining({ date: "2026-08-24" }));
	});

	it("is disabled while auth bootstrap has not produced a session identity", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			user: null,
			loading: true,
		} as ReturnType<typeof useAuth>);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useTodayQuery(), { wrapper });

		expect(result.current.isEnabled).toBe(false);
		expect(mockedGetToday).not.toHaveBeenCalled();
	});

	it("keeps different accounts in separate cache entries", async () => {
		const { wrapper, queryClient } = createWrapper();

		mockedUseAuth.mockReturnValue({
			token: "token-a",
			user: { id: "user-a" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedList.mockResolvedValue([routineFixture("routine-a")]);
		const first = renderHook(() => useRoutinesListQuery(), { wrapper });
		await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
		first.unmount();

		mockedUseAuth.mockReturnValue({
			token: "token-b",
			user: { id: "user-b" },
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedList.mockResolvedValue([routineFixture("routine-b")]);
		const second = renderHook(() => useRoutinesListQuery(), { wrapper });
		await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
		second.unmount();

		expect(mockedList).toHaveBeenNthCalledWith(1, "token-a", undefined);
		expect(mockedList).toHaveBeenNthCalledWith(2, "token-b", undefined);
		expect(queryClient.getQueryData(["routines", "user-a", "list", undefined])).toEqual([
			routineFixture("routine-a"),
		]);
		expect(queryClient.getQueryData(["routines", "user-b", "list", undefined])).toEqual([
			routineFixture("routine-b"),
		]);
	});
});
