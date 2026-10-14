/// <reference types="bun" />
import { describe, expect, mock, test } from "bun:test";

mock.module("expo-secure-store", () => ({
	getItemAsync: async () => null,
	setItemAsync: async () => undefined,
	deleteItemAsync: async () => undefined,
}));

const { parseDraft } = await import("./draft-storage");
const { initialAnswers } = await import("./onboarding-store");
const { onboardingRoutes, previousRoute, routeForPathname } = await import("../lib/flow");

describe("parseDraft", () => {
	test("keeps the answers and a resumable step", () => {
		const draft = parseDraft({ answers: { name: "Ayesha" }, route: onboardingRoutes.goals });
		expect(draft?.answers.name).toBe("Ayesha");
		expect(draft?.route).toBe(onboardingRoutes.goals);
	});

	test("does not resume the intro screens", () => {
		expect(parseDraft({ answers: {}, route: onboardingRoutes.welcomeVoice })?.route).toBeNull();
	});

	test("drops unknown routes and damaged answers", () => {
		const draft = parseDraft({ answers: "nope", route: "/(onboarding)/gone" });
		expect(draft?.answers).toEqual(initialAnswers);
		expect(draft?.route).toBeNull();
		expect(parseDraft(null)).toBeNull();
	});
});

describe("flow", () => {
	test("maps a pathname to its route", () => {
		expect(routeForPathname("/goals")).toBe(onboardingRoutes.goals);
		expect(routeForPathname("/")).toBeNull();
	});

	test("Back from a resumed step goes to the step before it", () => {
		expect(previousRoute(onboardingRoutes.body)).toBe(onboardingRoutes.aboutYou);
		expect(previousRoute(onboardingRoutes.planReveal)).toBe(onboardingRoutes.reminders);
	});
});
