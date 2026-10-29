import { describe, expect, it } from "bun:test";
import { parseApplication } from "./model";
import { createApplication, withEdit, withInterview, withNudge, withStage } from "./ops";

const now = new Date("2026-10-30T09:00:00Z");

describe("career operations", () => {
	it("creates an applied application with a follow-up a week out, readable by the app", () => {
		const app = createApplication(
			{ company: " Tessera ", role: "Senior TS", stage: "applied" },
			now,
			"a1",
		);
		expect(app.company).toBe("Tessera");
		expect(app.followUpAt).toBe("2026-11-06T09:00:00.000Z");
		expect(app.events).toEqual([{ at: now.toISOString(), kind: "applied", note: "" }]);
		expect(parseApplication(JSON.parse(JSON.stringify(app)))).toEqual(app);
	});

	it("saves without a follow-up", () => {
		expect(
			createApplication({ company: "A", role: "B", stage: "saved" }, now).followUpAt,
		).toBeNull();
	});

	it("logs a stage move and clears the follow-up past applied", () => {
		const app = createApplication({ company: "A", role: "B", stage: "applied" }, now);
		const offer = withStage(app, "offer", now);
		expect(offer.stage).toBe("offer");
		expect(offer.followUpAt).toBeNull();
		expect(offer.events.at(-1)?.kind).toBe("offer");
	});

	it("books an interview and records a nudge", () => {
		const app = createApplication({ company: "A", role: "B", stage: "applied" }, now);
		const booked = withInterview(
			app,
			{ at: "2026-11-02T10:00:00.000Z", round: "Tech", minutes: 60, interviewers: 2 },
			now,
		);
		expect(booked.stage).toBe("interview");
		expect(booked.events.at(-1)).toMatchObject({ kind: "interview", note: "Tech" });
		const nudged = withNudge(app, { name: "Sara", role: "HR", email: "" }, now);
		expect(nudged.contact?.name).toBe("Sara");
		expect(nudged.events.at(-1)?.kind).toBe("nudged");
	});

	it("edits only the given text fields", () => {
		const app = createApplication({ company: "A", role: "B", stage: "saved" }, now);
		expect(withEdit(app, { notes: " remote ok " })).toEqual({ ...app, notes: "remote ok" });
	});
});
