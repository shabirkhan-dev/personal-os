import { describe, expect, it } from "bun:test";
import { dotTime, spokenTime } from "./dot-time";

describe("dot timer time", () => {
	it("writes m:ss, and h:mm:ss past an hour", () => {
		expect(dotTime(0)).toBe("0:00");
		expect(dotTime(65_400)).toBe("1:05");
		expect(dotTime(3_725_000)).toBe("1:02:05");
		expect(dotTime(-5)).toBe("0:00");
	});

	it("says it in words", () => {
		expect(spokenTime(0)).toBe("0 seconds");
		expect(spokenTime(61_000)).toBe("1 minute 1 second");
		expect(spokenTime(7_320_000)).toBe("2 hours 2 minutes");
	});
});
