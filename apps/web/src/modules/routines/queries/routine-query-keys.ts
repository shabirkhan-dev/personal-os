export const routineQueryKeys = {
	all: ["routines"] as const,
	list: () => [...routineQueryKeys.all, "list"] as const,
	detail: (id: string) => [...routineQueryKeys.all, "detail", id] as const,
	today: () => [...routineQueryKeys.all, "today"] as const,
};
