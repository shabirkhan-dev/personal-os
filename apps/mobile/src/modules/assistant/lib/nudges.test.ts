import { describe, expect, it } from "bun:test";
import { defaultAssistantSettings } from "@personal-os/domain/assistant";
import { createApplication } from "@personal-os/domain/career";
import { pathOf, planNudges } from "./nudges";

const now = new Date(2026, 10, 3, 9, 0);
const settings = defaultAssistantSettings;
const bill = {
	id: "b1",
	name: "Internet",
	provider: "",
	amount: 3000,
	dueDay: 5,
	category: "bills" as const,
	paid: [],
	since: null,
};

describe("assistant nudges", () => {
	it("plans the morning brief, a bill the evening before and an interview's prep", () => {
		const app = {
			...createApplication({ company: "Tessera", role: "Senior TS", stage: "applied" }, now, "a1"),
			stage: "interview" as const,
			followUpAt: null,
			interview: {
				at: new Date(2026, 10, 4, 15, 0).toISOString(),
				round: "Tech round",
				minutes: 60,
				interviewers: 2,
			},
		};
		const nudges = planNudges({ settings, bills: [bill], applications: [app], now });
		expect(nudges.find((nudge) => nudge.id === "brief")).toMatchObject({
			daily: { hour: 8, minute: 0 },
		});
		const due = nudges.find((nudge) => nudge.id.startsWith("bill-"));
		expect(due).toMatchObject({
			title: "Internet is due tomorrow",
			at: new Date(2026, 10, 4, 19, 0),
		});
		const prep = nudges.find((nudge) => nudge.id.startsWith("interview-"));
		expect(prep).toMatchObject({
			title: "Interview with Tessera tomorrow",
			at: new Date(2026, 10, 3, 20, 0),
		});
		expect(prep?.ask).toContain("15:00");
	});

	it("skips what is past, too far off or closed, and everything when turned off", () => {
		const closed = {
			...createApplication({ company: "Old", role: "Dev", stage: "applied" }, now),
			stage: "closed" as const,
		};
		const later = { ...bill, id: "b2", dueDay: 25 };
		const nudges = planNudges({ settings, bills: [later], applications: [closed], now });
		expect(nudges.map((nudge) => nudge.id)).toEqual(["brief"]);
		expect(
			planNudges({
				settings: { ...settings, nudges: false },
				bills: [bill],
				applications: [],
				now,
			}),
		).toEqual([]);
	});

	it("follows only the app's own links", () => {
		expect(pathOf("personalos://assistant?ask=hi")).toBe("/assistant?ask=hi");
		expect(pathOf("personalos://")).toBeNull();
		expect(pathOf("https://evil.example.com")).toBeNull();
		expect(pathOf(undefined)).toBeNull();
	});
});
