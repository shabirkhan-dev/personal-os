/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parseSkincareAsk } from "./parse-ask";

describe("parseSkincareAsk", () => {
	test("routine done", () => {
		expect(parseSkincareAsk("did my routine")).toEqual({ kind: "complete-routine" });
		expect(parseSkincareAsk("Done morning routine")).toEqual({ kind: "complete-routine" });
		expect(parseSkincareAsk("routine finished")).toEqual({ kind: "complete-routine" });
	});

	test("add product", () => {
		expect(parseSkincareAsk("add niacinamide serum")).toEqual({
			kind: "add-product",
			name: "Niacinamide serum",
		});
		expect(parseSkincareAsk("Add product")).toEqual({ kind: "add-product", name: "" });
	});

	test("anything else opens the check-in", () => {
		expect(parseSkincareAsk("skin feels dry")).toEqual({ kind: "check-in" });
	});
});
