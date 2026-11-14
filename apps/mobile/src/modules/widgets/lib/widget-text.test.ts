import { describe, expect, test } from "bun:test";
import { clockText, shortMoney, untilText } from "./widget-text";

describe("widget text", () => {
	test("says how long until the next prayer", () => {
		const now = new Date(2026, 10, 14, 12, 0);
		expect(untilText(new Date(2026, 10, 14, 12, 5), now)).toBe("in 5 min");
		expect(untilText(new Date(2026, 10, 14, 13, 20), now)).toBe("in 1 h 20 min");
		expect(untilText(new Date(2026, 10, 14, 15, 0), now)).toBe("in 3 h");
		expect(clockText(new Date(2026, 10, 14, 5, 7))).toBe("05:07");
	});

	test("fits money into a small widget", () => {
		expect(shortMoney(4250)).toBe("Rs 4,250");
		expect(shortMoney(12_500)).toBe("Rs 12.5k");
		expect(shortMoney(20_000)).toBe("Rs 20k");
		expect(shortMoney(148_500)).toBe("Rs 149k");
		expect(shortMoney(-3000)).toBe("−Rs 3,000");
	});
});
