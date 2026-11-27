/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { momentAt, momentSteps } from "./day-moment";

const at = (hours: number, minutes = 0) => hours * 60 + minutes;
const ordinary = (hours: number, minutes = 0) => momentAt(at(hours, minutes), at(6), at(23));

describe("home follows the day", () => {
	test("an ordinary 06:00 to 23:00 day", () => {
		expect(ordinary(6)).toBe("morning");
		expect(ordinary(8, 59)).toBe("morning");
		expect(ordinary(9)).toBe("day");
		expect(ordinary(16, 59)).toBe("day");
		expect(ordinary(17)).toBe("evening");
		expect(ordinary(21)).toBe("night");
		expect(ordinary(23, 30)).toBe("night");
		expect(ordinary(3)).toBe("night");
	});

	test("a late riser still gets a morning, and a night owl's bed after midnight", () => {
		expect(momentAt(at(11), at(10, 30), at(2))).toBe("morning");
		expect(momentAt(at(14), at(10, 30), at(2))).toBe("day");
		expect(momentAt(at(19), at(10, 30), at(2))).toBe("evening");
		expect(momentAt(at(1), at(10, 30), at(2))).toBe("night");
		expect(momentAt(at(5), at(10, 30), at(2))).toBe("night");
	});

	test("only the person's modules, in order, at most four", () => {
		const steps = momentSteps("morning", [
			"food",
			"faith",
			"fashion",
			"skincare",
			"daily-life",
			"health",
		]);
		expect(steps.map((step) => step.id)).toEqual(["brief", "prayer", "care-am", "outfit"]);
		expect(momentSteps("night", ["finance"])).toEqual([]);
		expect(momentSteps("evening", ["workout", "finance"]).map((step) => step.id)).toEqual([
			"train",
			"money-pm",
		]);
	});
});
