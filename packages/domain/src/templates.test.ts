import { describe, expect, test } from "bun:test";
import { makeTemplateFile, parseTemplateFile, templateFileName } from "./templates";

describe("template files", () => {
	test("round-trips a template the person shares", () => {
		const file = makeTemplateFile({
			kind: "recipes",
			title: "Mum's karahi",
			summary: "Sunday dinner",
			author: "Sam",
			items: [{ name: "Karahi" }],
			now: new Date("2026-11-25T10:00:00Z"),
		});
		const parsed = parseTemplateFile(JSON.parse(JSON.stringify(file)));
		expect(parsed).toEqual({ ok: true, file });
		expect(templateFileName(file)).toBe("mum-s-karahi.posx.json");
	});

	test("says what's wrong with anything else", () => {
		expect(parseTemplateFile({ format: "nope" })).toEqual({
			ok: false,
			reason: "This isn't a Personal OS template.",
		});
		const newer = parseTemplateFile({ format: "personal-os-template", version: 9 });
		expect(newer.ok ? "" : newer.reason).toContain("newer version");
		const unknown = parseTemplateFile({
			format: "personal-os-template",
			version: 1,
			kind: "spaceships",
			title: "x",
			items: [1],
		});
		expect(unknown.ok).toBe(false);
		const empty = parseTemplateFile({
			format: "personal-os-template",
			version: 1,
			kind: "tasbih",
			title: "x",
			items: [],
		});
		expect(empty.ok ? "" : empty.reason).toContain("empty");
	});
});
