export type RoutineScheduleType = "daily" | "specific_days";

export interface RoutineItem {
	id: string;
	name: string;
	notes: string | null;
	targetTime: string | null;
	sortOrder: number;
}

export interface Routine {
	id: string;
	name: string;
	description: string | null;
	scheduleType: RoutineScheduleType;
	daysOfWeek: number[];
	archivedAt: string | null;
	createdAt: string;
	updatedAt: string;
	items: RoutineItem[];
}

export interface RoutineItemInput {
	name: string;
	notes?: string | null;
	targetTime?: string | null;
}

export interface CreateRoutineInput {
	name: string;
	description?: string | null;
	scheduleType: RoutineScheduleType;
	daysOfWeek?: number[];
	items?: RoutineItemInput[];
}

export interface UpdateRoutineInput {
	name?: string;
	description?: string | null;
	scheduleType?: RoutineScheduleType;
	daysOfWeek?: number[];
	items?: RoutineItemInput[];
	archived?: boolean;
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
