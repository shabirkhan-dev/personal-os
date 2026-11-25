import { describe, expect, test } from "bun:test";
import { parseSettings, SLOTS } from "./model";

describe("food settings: the meals the person tracks", () => {
	test("start empty, keep the person's choice in order, and keep all five for older set-up users", () => {
		expect(parseSettings({ setUp: false })?.meals).toEqual([]);
		expect(parseSettings({ meals: ["dinner", "breakfast", "brunch"] })?.meals).toEqual([
			"breakfast",
			"dinner",
		]);
		expect(parseSettings({ setUp: true })?.meals).toEqual([...SLOTS]);
	});
});
