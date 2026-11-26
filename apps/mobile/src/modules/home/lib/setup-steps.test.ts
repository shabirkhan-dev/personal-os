/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { setupProgress, setupSteps } from "./setup-steps";

describe("setup checklist", () => {
	test("one step per picked module, in order", () => {
		const steps = setupSteps(["food", "faith", "career"]);
		expect(steps.map((step) => step.module)).toEqual(["food", "faith", "career"]);
		expect(steps[0]?.template?.href).toBe("/templates?module=food");
		expect(steps[2]?.template).toBeNull();
	});

	test("counts what's started and points at the next one", () => {
		const steps = setupSteps(["food", "faith", "career"]);
		expect(setupProgress(steps, new Set(["food"]))).toMatchObject({ done: 1, total: 3 });
		expect(setupProgress(steps, new Set(["food"])).next?.module).toBe("faith");
		expect(setupProgress(steps, new Set(["food", "faith", "career"])).next).toBeNull();
	});
});
