/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { syncDirection } from "./sync";

describe("syncDirection", () => {
	test("pushes when the server has nothing", () => {
		expect(syncDirection("2026-10-13T10:00:00.000Z", null)).toBe("push");
		expect(syncDirection(null, null)).toBe("push");
	});

	test("the newer side wins", () => {
		expect(syncDirection("2026-10-13T11:00:00.000Z", "2026-10-13T10:00:00.000Z")).toBe("push");
		expect(syncDirection("2026-10-13T09:00:00.000Z", "2026-10-13T10:00:00.000Z")).toBe("pull");
		expect(syncDirection("2026-10-13T10:00:00.000Z", "2026-10-13T10:00:00.000Z")).toBe("none");
	});

	test("pulls when this device does not know when its answers changed", () => {
		expect(syncDirection(null, "2026-10-13T10:00:00.000Z")).toBe("pull");
		expect(syncDirection("garbage", "2026-10-13T10:00:00.000Z")).toBe("pull");
	});
});
