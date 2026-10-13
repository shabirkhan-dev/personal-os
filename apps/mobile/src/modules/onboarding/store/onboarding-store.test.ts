/// <reference types="bun" />
import { beforeEach, describe, expect, test } from "bun:test";
import { initialAnswers, modulesForGoals, useOnboardingStore } from "./onboarding-store";

describe("onboarding store", () => {
	beforeEach(() => useOnboardingStore.getState().reset());

	test("goals keep pick order and stop at three", () => {
		const { toggleGoal } = useOnboardingStore.getState();
		toggleGoal("lose-weight");
		toggleGoal("save-money");
		toggleGoal("clear-skin");
		toggleGoal("sleep-better");
		expect(useOnboardingStore.getState().goals).toEqual([
			"lose-weight",
			"save-money",
			"clear-skin",
		]);

		toggleGoal("save-money");
		expect(useOnboardingStore.getState().goals).toEqual(["lose-weight", "clear-skin"]);
	});

	test("recommended modules follow the ranked goals", () => {
		expect(modulesForGoals(["lose-weight", "save-money", "clear-skin"])).toEqual([
			"daily-life",
			"workout",
			"finance",
			"skincare",
		]);
		expect(modulesForGoals(["lose-weight", "build-muscle"])).toEqual(["daily-life", "workout"]);
	});

	test("the voice transcript fills every answer except gender", () => {
		useOnboardingStore.getState().applyTranscript(new Date(2026, 9, 13));
		const state = useOnboardingStore.getState();
		expect(state.name).toBe("Shabir");
		expect(state.birthday.year).toBe(1998);
		expect(state.heightCm).toBe(175);
		expect(state.weightKg).toBe(72);
		expect(state.workStyle).toBe("hybrid");
		expect(state.goals).toEqual(["lose-weight", "save-money"]);
		expect(state.modules).toEqual(["daily-life", "workout", "finance"]);
		expect(state.gender).toBeNull();
	});

	test("reset restores the defaults", () => {
		useOnboardingStore.getState().set("name", "Someone");
		useOnboardingStore.getState().reset();
		expect(useOnboardingStore.getState().name).toBe(initialAnswers.name);
	});
});
