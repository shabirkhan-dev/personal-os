/// <reference types="bun" />
import { beforeEach, describe, expect, test } from "bun:test";
import { introAnswers, parseIntro } from "../lib/parse-intro";
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

	test("the spoken introduction fills what was said and leaves the rest", () => {
		const said =
			"I'm Shabir, 28. I'm 175 and about 72 kilos. I wake up at 6:30 and sleep around 11. " +
			"I work hybrid, 9 to 6. I want to lose weight and save money";
		useOnboardingStore.getState().applyIntro(introAnswers(parseIntro(said), new Date(2026, 9, 13)));
		const state = useOnboardingStore.getState();
		expect(state.path).toBe("talk");
		expect(state.name).toBe("Shabir");
		expect(state.birthday.year).toBe(1998);
		expect(state.heightCm).toBe(175);
		expect(state.weightKg).toBe(72);
		expect(state.workStyle).toBe("hybrid");
		expect(state.goals).toEqual(["lose-weight", "save-money"]);
		expect(state.modules).toEqual(["daily-life", "workout", "finance"]);
		expect(state.gender).toBeNull();
	});

	test("an introduction without goals keeps the chosen modules", () => {
		useOnboardingStore.getState().set("modules", ["daily-life", "food"]);
		useOnboardingStore.getState().applyIntro(introAnswers(parseIntro("I'm Sara"), new Date()));
		expect(useOnboardingStore.getState().modules).toEqual(["daily-life", "food"]);
	});

	test("reset restores the defaults", () => {
		useOnboardingStore.getState().set("name", "Someone");
		useOnboardingStore.getState().reset();
		expect(useOnboardingStore.getState().name).toBe(initialAnswers.name);
	});
});
