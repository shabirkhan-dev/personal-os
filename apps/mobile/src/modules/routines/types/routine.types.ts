export type RoutineScheduleType = "daily" | "specific_days";

export interface RoutineItem {
	id: string;
	name: string;
	notes: string | null;
	targetTime: string | null;
	sortOrder: number;
}

export interface TodayItem extends RoutineItem {
	completed: boolean;
}

export interface TodayRoutine {
	id: string;
	name: string;
	description: string | null;
	completedItems: number;
	totalItems: number;
	items: TodayItem[];
}

export interface TodayView {
	date: string;
	timeZone: string;
	weekday: number;
	routines: TodayRoutine[];
}

export interface ToggleResult {
	itemId: string;
	date: string;
	completed: boolean;
}
