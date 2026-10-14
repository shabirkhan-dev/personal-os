/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { countStates, gridRows, monthCells } from "./grid";
import type { WorkoutSession } from "./types";

const at = (date: Date, durationMin: number): WorkoutSession => ({
	id: date.toISOString(),
	type: "strength",
	title: "Strength",
	startedAt: date.toISOString(),
	durationMin,
	kcal: 0,
	feel: null,
});

const weekdays = [true, true, true, true, true, false, false];

describe("monthCells", () => {
	test("done, partial, missed and rest in a past month", () => {
		const cells = monthCells(
			[at(new Date(2026, 8, 1, 18), 45), at(new Date(2026, 8, 2, 18), 10)],
			new Date(2026, 8, 1),
			weekdays,
			new Date(2026, 9, 14),
		);
		expect(cells).toHaveLength(30);
		expect(cells[0]?.state).toBe("done"); // Tue 1 Sep
		expect(cells[1]?.state).toBe("partial"); // Wed 2 Sep
		expect(cells[2]?.state).toBe("missed"); // Thu 3 Sep
		expect(cells[4]?.state).toBe("rest"); // Sat 5 Sep
		const counts = countStates(cells);
		expect(counts.done + counts.partial + counts.missed + counts.rest).toBe(30);
		expect(counts.missed).toBe(20);
	});
	test("today and later are upcoming", () => {
		const cells = monthCells([], new Date(2026, 9, 1), weekdays, new Date(2026, 9, 14, 9));
		expect(cells[12]?.state).toBe("missed"); // Tue 13 Oct
		expect(cells[13]?.state).toBe("upcoming");
		expect(cells[30]?.state).toBe("upcoming");
	});
});

test("gridRows splits into three rows", () => {
	const rows = gridRows(Array.from({ length: 31 }, (_, index) => index));
	expect(rows.map((row) => row.length)).toEqual([11, 11, 9]);
	expect(
		gridRows([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
			27, 28, 29, 30,
		]).map((row) => row.length),
	).toEqual([10, 10, 10]);
});
