/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parseTemplateFile, TEMPLATE_KINDS } from "@personal-os/domain/templates";
import { TEMPLATE_FORMATS, templatePrompt } from "./template-formats";

describe("template formats", () => {
	test("cover every kind of template, once", () => {
		expect(TEMPLATE_FORMATS.map((format) => format.kind).toSorted()).toEqual(
			[...TEMPLATE_KINDS].toSorted(),
		);
	});

	test("the prompt carries the exact file shape, whose example is itself a valid template", () => {
		for (const format of TEMPLATE_FORMATS) {
			const prompt = templatePrompt(format.kind, "something nice");
			expect(prompt).toContain("What I want: something nice");
			const start = prompt.indexOf("{");
			const end = prompt.indexOf("\n\nEach item");
			const parsed = parseTemplateFile(JSON.parse(prompt.slice(start, end)));
			expect(parsed.ok && parsed.file.kind).toBe(format.kind);
		}
	});

	test("falls back to the example idea when nothing is asked", () => {
		expect(templatePrompt("minimum", "  ")).toContain("a minimum day for a busy parent");
	});
});
