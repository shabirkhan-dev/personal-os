import { describe, expect, it } from "vitest";

import { signIn, testApp } from "./support";

const { call } = testApp();

const answers = {
	path: "steps",
	name: "Shabir",
	gender: "male",
	birthday: { day: 1, month: 1, year: 2000 },
	heightCm: 180,
	weightKg: 65,
	heightUnit: "cm",
	weightUnit: "kg",
	wakeMinutes: 360,
	bedMinutes: 1350,
	workStartMinutes: 540,
	workEndMinutes: 1080,
	workdays: [false, true, true, true, true, true, false],
	workStyle: "remote",
	goals: ["build-muscle"],
	modules: ["career", "workout"],
	connections: { calendar: false, smartwatch: false, "bank-sms": false, microphone: false },
	appleHealth: false,
	heyOs: false,
	reminders: {
		"morning-plan": true,
		"evening-check-in": true,
		"workout-nudge": false,
		"bill-reminders": false,
	},
	completed: true,
};

describe("onboarding answers", () => {
	it("is null before the first save, then returns what was saved", async () => {
		const { accessToken: token } = await signIn(call);
		const empty = await call<{ data: null }>("GET", "/users/me/onboarding", { token });
		expect(empty.status).toBe(200);
		expect(empty.json?.data).toBeNull();

		const saved = await call("PUT", "/users/me/onboarding", { token, body: { answers } });
		expect(saved.json).toMatchObject({ data: { answers, schemaVersion: 1 } });
		const read = await call("GET", "/users/me/onboarding", { token });
		expect(read.json).toMatchObject({ data: { answers } });
	});

	it("refuses answers that don't match the schema", async () => {
		const { accessToken: token } = await signIn(call);
		const response = await call("PUT", "/users/me/onboarding", {
			token,
			body: { answers: { ...answers, modules: ["moon"] } },
		});
		expect(response.json).toMatchObject({ code: "VALIDATION_FAILED" });
	});
});
