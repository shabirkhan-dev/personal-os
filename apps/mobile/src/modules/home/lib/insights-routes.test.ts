/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { insightsAreaFor, insightsAreas, insightsTarget } from "./insights-routes";

describe("insights routes", () => {
	test("lists only the person's modules that have Insights, in module order", () => {
		const areas = insightsAreas(["faith", "career", "finance", "daily-life"]);
		expect(areas.map((area) => area.id)).toEqual(["daily-life", "finance", "faith"]);
		expect(areas[1]?.route).toBe("/finance/insights");
	});

	test("finds the module from a pathname", () => {
		expect(insightsAreaFor("/training/insights")).toBe("workout");
		expect(insightsAreaFor("/training/week")).toBeNull();
	});

	test("goes back to the last Insights while it is still on, else the first", () => {
		expect(insightsTarget(["food", "faith"], "faith")).toBe("/faith/insights");
		expect(insightsTarget(["food", "faith"], "finance")).toBe("/food/insights");
		expect(insightsTarget(["career"], null)).toBeNull();
	});
});
