import { describe, expect, it } from "bun:test";
import { dayKey } from "@/lib/day";
import { ayahs } from "./ayahs";
import {
	consistencyGrid,
	currentHawl,
	isCalendarDay,
	parseRate,
	currentPrayer,
	insights,
	lakhs,
	prayedCount,
	recitationStreak,
	shortRupees,
	tasbihProgress,
	prayerDate,
	prayerLogFor,
	todayRows,
	toHijri,
	weekRecap,
	zakatView,
	ayahOfTheDay,
	momentAt,
} from "./faith-math";
import {
	DEFAULT_TASBIH,
	defaultSettings,
	defaultZakat,
	parseSettings,
	type PrayerLog,
	parsePrayerLog,
} from "./faith-model";
import { parseFaithLine } from "./parse-faith-line";
import {
	compassPoint,
	dayTimes,
	distanceToMakkah,
	nextPrayer,
	parseClock,
	phaseAt,
	qiblaBearing,
	turnBetween,
	untilLabel,
} from "./prayer-times";

const gilgit = { latitude: 35.92, longitude: 74.31, name: "Gilgit" };

function settingsAt(manual = { fajr: 298, maghrib: 1058, isha: 1138 }) {
	return { ...defaultSettings(), setUp: true, manual };
}

function log(
	day: string,
	prayer: PrayerLog["prayer"],
	status: PrayerLog["status"],
	at?: string,
): PrayerLog {
	return { id: `${day}:${prayer}`, day, prayer, status, at: at ?? `${day}T05:00:00` };
}

describe("prayer times", () => {
	it("works out the Qibla and distance from a place", () => {
		expect(Math.round(qiblaBearing(gilgit))).toBe(254);
		expect(compassPoint(254)).toBe("west-southwest");
		expect(distanceToMakkah(gilgit)).toBeGreaterThan(3600);
		expect(distanceToMakkah(gilgit)).toBeLessThan(3800);
	});

	it("calculates from a location and lets typed times win", () => {
		const day = new Date(2026, 9, 15, 9);
		const calculated = dayTimes(
			{ place: gilgit, method: "karachi", asr: "standard", manual: {} },
			day,
		);
		// Checked in order rather than by clock hour, so the test passes in any timezone (CI is UTC).
		const { fajr, maghrib, isha } = calculated.prayers;
		expect(calculated.sunrise).not.toBeNull();
		expect(fajr && calculated.sunrise && fajr < calculated.sunrise).toBe(true);
		expect(maghrib && isha && maghrib < isha).toBe(true);
		const typed = dayTimes(
			{ place: gilgit, method: "karachi", asr: "standard", manual: { maghrib: 1058 } },
			day,
		);
		expect(typed.prayers.maghrib?.getHours()).toBe(17);
		expect(typed.prayers.maghrib?.getMinutes()).toBe(38);
	});

	it("finds the next prayer, rolling into tomorrow", () => {
		const source = {
			place: null,
			method: "karachi" as const,
			asr: "standard" as const,
			manual: { fajr: 298, maghrib: 1058, isha: 1138 },
		};
		const prayers = ["fajr", "maghrib", "isha"] as const;
		expect(nextPrayer(source, prayers, new Date(2026, 9, 15, 15, 28))?.prayer).toBe("maghrib");
		const late = nextPrayer(source, prayers, new Date(2026, 9, 15, 22));
		expect(late?.prayer).toBe("fajr");
		expect(late?.at.getDate()).toBe(16);
	});

	it("names the part of the day for the Sky header", () => {
		const times = dayTimes(
			{
				place: null,
				method: "karachi",
				asr: "standard",
				manual: { fajr: 298, maghrib: 1058, isha: 1138 },
			},
			new Date(2026, 9, 15),
		);
		expect(phaseAt(times, new Date(2026, 9, 15, 3))).toBe("isha");
		expect(phaseAt(times, new Date(2026, 9, 15, 5, 10))).toBe("fajr");
		expect(phaseAt(times, new Date(2026, 9, 15, 13))).toBe("day");
		expect(phaseAt(times, new Date(2026, 9, 15, 18))).toBe("maghrib");
		expect(phaseAt(times, new Date(2026, 9, 15, 20))).toBe("isha");
	});

	it("turns, clocks and countdowns", () => {
		expect(turnBetween(242, 254)).toBe(12);
		expect(turnBetween(10, 350)).toBe(-20);
		expect(parseClock("17:38")).toBe(1058);
		expect(parseClock("5:38 pm")).toBe(1058);
		expect(parseClock("12 am")).toBe(0);
		expect(parseClock("25:00")).toBeNull();
		expect(untilLabel(130 * 60_000)).toBe("2h 10m");
		expect(untilLabel(45 * 60_000)).toBe("45m");
	});
});

describe("today's prayers", () => {
	it("marks prayed, due, next and later, like the Home timeline", () => {
		const now = new Date(2026, 9, 15, 15, 28);
		const rows = todayRows(
			settingsAt(),
			[log("2026-10-15", "fajr", "prayed", "2026-10-15T05:06:00")],
			now,
		);
		expect(rows.map((row) => row.state)).toEqual(["prayed", "next", "later"]);
		expect(rows[0]?.note).toBe("05:06 · on time");
		expect(rows[1]?.pill).toBe("in 2h 10m");
		expect(rows[1]?.note).toBe("Reminder 10 min before");
		expect(prayedCount(rows)).toBe(1);
	});

	it("keeps the night with the day before until Fajr", () => {
		const night = new Date(2026, 9, 16, 0, 30);
		expect(prayerDate(settingsAt(), night).getDate()).toBe(15);
		expect(prayerDate(settingsAt(), new Date(2026, 9, 16, 5, 30)).getDate()).toBe(16);
		const rows = todayRows(settingsAt(), [log("2026-10-15", "maghrib", "prayed")], night);
		expect(rows.map((row) => row.day)).toEqual(["2026-10-15", "2026-10-15", "2026-10-15"]);
		expect(rows.map((row) => row.state)).toEqual(["due", "prayed", "due"]);
		expect(currentPrayer(rows)?.prayer).toBe("isha");
		expect(rows[2]?.at.getDate()).toBe(15);
		const isha = prayerLogFor("isha", {
			day: rows[2]?.day ?? "",
			prayerAt: rows[2]?.at ?? null,
			now: night,
		});
		expect(isha?.id).toBe("2026-10-15:isha");
		expect(isha?.status).toBe("late");
	});

	it("won't log a prayer before its time", () => {
		const now = new Date(2026, 9, 15, 15, 28);
		const maghrib = new Date(2026, 9, 15, 17, 38);
		expect(prayerLogFor("maghrib", { day: "2026-10-15", prayerAt: maghrib, now })).toBeNull();
		expect(
			prayerLogFor("maghrib", { day: "2026-10-15", prayerAt: maghrib, status: "missed", now }),
		).toBeNull();
		expect(
			prayerLogFor("maghrib", {
				day: "2026-10-15",
				prayerAt: maghrib,
				now: new Date(2026, 9, 15, 17, 50),
			})?.status,
		).toBe("prayed");
	});

	it("knows which prayer a bare 'prayed' means", () => {
		const rows = todayRows(settingsAt(), [], new Date(2026, 9, 15, 18));
		expect(currentPrayer(rows)?.prayer).toBe("maghrib");
	});

	it("builds the consistency grid oldest first", () => {
		const grid = consistencyGrid(
			[log("2026-10-15", "fajr", "prayed"), log("2026-10-14", "fajr", "late")],
			["fajr", "isha"],
			new Date(2026, 9, 15, 12),
			3,
		);
		expect(grid[0]?.cells.map((cell) => cell.state)).toEqual(["none", "late", "prayed"]);
		expect(grid[1]?.cells.every((cell) => cell.state === "none")).toBe(true);
	});
});

describe("recaps and insights", () => {
	it("sums a week and finds what slipped", () => {
		const logs = [
			log("2026-10-12", "fajr", "prayed"),
			log("2026-10-12", "maghrib", "missed"),
			log("2026-10-13", "fajr", "late"),
		];
		const recap = weekRecap(
			logs,
			[{ id: "a", day: "2026-10-12", minutes: 10, at: "2026-10-12T05:30:00" }],
			["fajr", "maghrib", "isha"],
			new Date(2026, 9, 12),
			7,
		);
		expect(recap.prayed).toBe(2);
		expect(recap.possible).toBe(21);
		expect(recap.onTimeShare).toBe(0.5);
		expect(recap.recitationMinutes).toBe(10);
		expect(recap.slipped?.prayer).toBe("maghrib");
	});

	it("notices the prayer that slips most", () => {
		const now = new Date(2026, 9, 15, 12);
		const logs = [log("2026-10-10", "maghrib", "missed"), log("2026-10-12", "maghrib", "late")];
		const found = insights(logs, [], settingsAt(), now);
		expect(found[0]?.id).toBe("most-missed");
		expect(insights([], [], settingsAt(), now)[0]?.id).toBe("start");
	});

	it("counts the recitation streak from yesterday when today is empty", () => {
		const sessions = ["2026-10-13", "2026-10-14"].map((day, index) => ({
			id: String(index),
			day,
			minutes: 10,
			at: `${day}T05:30:00`,
		}));
		expect(recitationStreak(sessions, new Date(2026, 9, 15, 4))).toBe(2);
	});
});

describe("tasbih, zakat, hijri, ayahs", () => {
	it("moves through the sequence as sets finish", () => {
		const progress = tasbihProgress(DEFAULT_TASBIH, {
			id: "2026-10-15",
			counts: { "ya-allah": 33, "ya-ali": 21 },
		});
		expect(progress).toMatchObject({ index: 1, count: 21, target: 33, setsDone: 1, total: 54 });
	});

	it("works out zakat above nisab and what is left to pay", () => {
		const profile = {
			...defaultZakat(),
			gold: 150_000,
			cash: 120_000,
			savings: 70_000,
			debts: 20_000,
			hawlStart: "2026-03-20",
		};
		const payments = [
			{ id: "p", to: "A family", note: "", amount: 3000, at: "2026-09-01T00:00:00Z" },
		];
		const view = zakatView(profile, payments, new Date(2026, 9, 15));
		expect(view.net).toBe(320_000);
		expect(view.aboveNisab).toBe(true);
		expect(view.due).toBe(8000);
		expect(view.left).toBe(5000);
		expect(view.monthsHeld).toBe(7);
		expect(shortRupees(150_000)).toBe("1.5L");
		expect(shortRupees(70_000)).toBe("70k");
		expect(lakhs(320_000)).toBe("3,20,000");
		expect(lakhs(155_000)).toBe("1,55,000");
	});

	it("rolls the hawl over each lunar year and counts only this hawl's payments", () => {
		const profile = {
			...defaultZakat(),
			gold: 150_000,
			cash: 120_000,
			savings: 70_000,
			debts: 20_000,
			hawlStart: "2025-03-20",
		};
		const payments = [
			{ id: "old", to: "A family", note: "", amount: 8000, at: "2025-12-01T12:00:00Z" },
			{ id: "new", to: "A family", note: "", amount: 3000, at: "2026-09-01T12:00:00Z" },
		];
		const now = new Date(2026, 9, 15);
		const hawl = currentHawl(profile.hawlStart, now);
		expect(dayKey(hawl?.start ?? now)).toBe("2026-03-09");
		expect(dayKey(hawl?.end ?? now)).toBe("2027-02-26");
		const view = zakatView(profile, payments, now);
		expect(view.paid).toBe(3000);
		expect(view.left).toBe(5000);
		expect(view.monthsHeld).toBe(7);
		expect(currentHawl("2027-01-01", now)?.start.getFullYear()).toBe(2027);
		expect(currentHawl(null, now)).toBeNull();
	});

	it("checks the typed hawl date and rate", () => {
		expect(isCalendarDay("2026-03-20")).toBe(true);
		expect(isCalendarDay("2028-02-29")).toBe(true);
		expect(isCalendarDay("2026-02-30")).toBe(false);
		expect(isCalendarDay("2026-13-01")).toBe(false);
		expect(isCalendarDay("20-03-2026")).toBe(false);
		expect(parseRate("2.5")).toBe(0.025);
		expect(parseRate("")).toBeNull();
		expect(parseRate("  ")).toBeNull();
		expect(parseRate("0")).toBeNull();
		expect(parseRate("101")).toBeNull();
		expect(parseRate("abc")).toBeNull();
	});

	it("converts to the Hijri calendar", () => {
		expect(toHijri(new Date(2025, 2, 1))).toEqual({ year: 1446, month: 9, day: 1 });
		expect(toHijri(new Date(2026, 5, 17)).year).toBe(1448);
	});

	it("rotates the ayah of the day and picks moments by time", () => {
		const day = new Date(2026, 9, 15, 12);
		expect(ayahOfTheDay(day).id).not.toBe(ayahOfTheDay(day, 1).id);
		expect(ayahs.every((ayah) => ayah.arabic.length > 0 && ayah.translation.length > 0)).toBe(true);
		expect(momentAt(new Date(2026, 9, 15, 5, 30), [])?.id).toBe("wake");
		expect(momentAt(new Date(2026, 9, 15, 5, 30), ["2026-10-15:wake"])).toBeNull();
		expect(momentAt(new Date(2026, 9, 15, 22, 30), [])?.id).toBe("sleep");
		expect(momentAt(day, [])).toBeNull();
	});
});

describe("parsing", () => {
	it("reads stored settings tolerantly", () => {
		const parsed = parseSettings({
			prayers: ["isha", "fajr", "nope"],
			manual: { fajr: 298, isha: 9999 },
			method: "x",
		});
		expect(parsed?.prayers).toEqual(["fajr", "isha"]);
		expect(parsed?.manual).toEqual({ fajr: 298 });
		expect(parsed?.method).toBe("karachi");
		expect(parsePrayerLog({ day: "2026-10-15", prayer: "fajr", status: "weird" })?.status).toBe(
			"prayed",
		);
		expect(parsePrayerLog({ day: "bad", prayer: "fajr" })).toBeNull();
	});

	it("reads ask-bar lines", () => {
		expect(parseFaithLine("prayed fajr")).toEqual({
			kind: "prayer",
			prayer: "fajr",
			status: "prayed",
		});
		expect(parseFaithLine("Missed maghrib today")).toEqual({
			kind: "prayer",
			prayer: "maghrib",
			status: "missed",
		});
		expect(parseFaithLine("isha late")).toEqual({ kind: "prayer", prayer: "isha", status: "late" });
		expect(parseFaithLine("just prayed")).toEqual({
			kind: "prayer",
			prayer: null,
			status: "prayed",
		});
		expect(parseFaithLine("recited quran 15 min")).toEqual({ kind: "recite", minutes: 15 });
		expect(parseFaithLine("when is maghrib?")).toEqual({ kind: "when", prayer: "maghrib" });
		expect(parseFaithLine("qibla")).toEqual({ kind: "open", screen: "qibla" });
		expect(parseFaithLine("What does sabr mean?")).toEqual({
			kind: "question",
			text: "What does sabr mean?",
		});
		expect(parseFaithLine("   ")).toBeNull();
	});
});
