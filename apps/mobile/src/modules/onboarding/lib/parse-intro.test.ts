/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
	highlightSpans,
	introAnswers,
	introChips,
	numberWordsToDigits,
	parseIntro,
} from "./parse-intro";

describe("numberWordsToDigits", () => {
	test("turns spoken numbers into digits", () => {
		expect(numberWordsToDigits("twenty eight")).toBe("28");
		expect(numberWordsToDigits("twenty-eight")).toBe("28");
		expect(numberWordsToDigits("six thirty")).toBe("6 30");
		expect(numberWordsToDigits("a hundred and seventy five")).toBe("175");
		expect(numberWordsToDigits("one hundred sixty")).toBe("160");
	});
});

describe("parseIntro", () => {
	test("reads the frame 07 introduction", () => {
		const facts = parseIntro(
			"I'm Shabir, 28. I'm 175 and about 72 kilos. I wake up at 6:30 and sleep around 11. " +
				"I work hybrid, 9 to 6. I want to lose weight and save money",
		);
		expect(facts.name).toBe("Shabir");
		expect(facts.age).toBe(28);
		expect(facts.heightCm).toBe(175);
		expect(facts.heightUnit).toBe("cm");
		expect(facts.weightKg).toBe(72);
		expect(facts.wakeMinutes).toBe(6 * 60 + 30);
		expect(facts.bedMinutes).toBe(23 * 60);
		expect(facts.workStyle).toBe("hybrid");
		expect(facts.workStartMinutes).toBe(9 * 60);
		expect(facts.workEndMinutes).toBe(18 * 60);
		expect(facts.goals).toEqual(["lose-weight", "save-money"]);
		expect(facts.gender).toBeUndefined();
	});

	test("understands spoken numbers, feet and pounds", () => {
		const facts = parseIntro(
			"my name is ayesha i am twenty six years old a woman five foot four and 130 pounds " +
				"i get up at seven a.m. and go to bed at ten thirty. I work from home",
		);
		expect(facts.name).toBe("Ayesha");
		expect(facts.age).toBe(26);
		expect(facts.gender).toBe("female");
		expect(facts.heightUnit).toBe("ft");
		expect(facts.heightCm).toBe(163);
		expect(facts.weightUnit).toBe("lb");
		expect(facts.weightKg).toBe(59);
		expect(facts.wakeMinutes).toBe(7 * 60);
		expect(facts.bedMinutes).toBe(22 * 60 + 30);
		expect(facts.workStyle).toBe("remote");
	});

	test("keeps goals in the order they were said, at most three", () => {
		const facts = parseIntro("I want to sleep better, save money, build muscle and stress less");
		expect(facts.goals).toEqual(["sleep-better", "save-money", "build-muscle"]);
	});

	test("does not take filler words for a name", () => {
		expect(parseIntro("I'm a developer and I'm up at 6").name).toBeUndefined();
		expect(parseIntro("Hi, this is Omar").name).toBe("Omar");
	});

	test("leaves everything missing for silence", () => {
		const facts = parseIntro("");
		expect(facts.goals).toEqual([]);
		expect(introChips(facts).every((chip) => !chip.known)).toBe(true);
	});
});

describe("introAnswers and chips", () => {
	test("an age becomes a birthday this many years ago", () => {
		const answers = introAnswers(parseIntro("I'm Sara, 30"), new Date(2026, 9, 14));
		expect(answers).toEqual({ name: "Sara", birthday: { day: 1, month: 1, year: 1996 } });
	});

	test("chips show what was heard in the units it was said", () => {
		const chips = introChips(parseIntro("I'm Ali, 5 foot 9 and 160 pounds"));
		expect(chips.find((chip) => chip.fact === "body")?.value).toBe("5′9″ · 160 lb");
		expect(chips.find((chip) => chip.fact === "gender")).toMatchObject({
			known: false,
			label: "Tap to add",
		});
	});
});

describe("highlightSpans", () => {
	test("marks understood phrases", () => {
		expect(highlightSpans("I'm Shabir, 28.", ["Shabir", "28"])).toEqual([
			{ text: "I'm " },
			{ text: "Shabir", fact: true },
			{ text: ", " },
			{ text: "28", fact: true },
			{ text: "." },
		]);
	});
});
