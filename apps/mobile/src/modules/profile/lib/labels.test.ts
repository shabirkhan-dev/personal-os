/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
	healthName,
	micAction,
	modulesOnLabel,
	syncState,
	themeLabel,
	unitsFor,
	unitsLabel,
	unitSystem,
	versionLabel,
	weekStartLabel,
} from "./labels";

describe("profile labels", () => {
	test("counts modules", () => {
		expect(modulesOnLabel(1)).toBe("1 module on");
		expect(modulesOnLabel(4)).toBe("4 modules on");
	});

	test("units round-trip between systems", () => {
		expect(unitSystem("cm", "kg")).toBe("metric");
		expect(unitSystem("ft", "lb")).toBe("imperial");
		expect(unitSystem("ft", "kg")).toBe("metric");
		expect(unitsFor("imperial")).toEqual({ heightUnit: "ft", weightUnit: "lb" });
		expect(unitsLabel("cm", "kg")).toBe("cm · kg");
	});

	test("theme, week and health names", () => {
		expect(themeLabel("system")).toBe("System");
		expect(themeLabel("dark")).toBe("Dark");
		expect(weekStartLabel("sunday")).toBe("Sunday");
		expect(healthName("ios")).toBe("Apple Health");
		expect(healthName("android")).toBe("Health Connect");
	});

	test("sync never claims a sync that did not happen", () => {
		expect(syncState("signed-out", null)).toEqual({
			title: "Sync",
			meta: "Only on this phone · Sign in to back up",
			canSignIn: true,
		});
		expect(syncState("offline", "a@b.co").meta).toBe("Can't reach Personal OS");
		expect(syncState("signed-in", null).meta).toBe("Synced to your account");
		expect(syncState("signed-in", "a@b.co").canSignIn).toBe(false);
	});

	test("microphone actions follow the permission", () => {
		expect(micAction("ask").action).toBe("Allow");
		expect(micAction("blocked").action).toBe("Settings");
		expect(micAction("granted").action).toBeNull();
		expect(micAction("unavailable").action).toBeNull();
	});

	test("version footer", () => {
		expect(versionLabel("1.0")).toBe("Personal OS 1.0 · by RabtX");
		expect(versionLabel(undefined)).toBe("Personal OS · by RabtX");
	});
});
