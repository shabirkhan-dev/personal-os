import { describe, expect, it } from "bun:test";
import { routeLine } from "./route-line";

describe("routeLine", () => {
	it("sends a line to the module its words belong to", () => {
		const all = ["faith", "career", "food", "finance"] as const;
		expect(routeLine("prayed fajr", all)).toBe("faith");
		expect(routeLine("When is Maghrib?", all)).toBe("faith");
		expect(routeLine("applied to tessera, frontend", all)).toBe("career");
		expect(routeLine("had dal for lunch", all)).toBe("food");
		expect(routeLine("hello there", all)).toBeNull();
		expect(routeLine("what should I wear tonight", [...all, "fashion"])).toBe("fashion");
	});

	it("sends a dream to Wishlist before Finance's money words", () => {
		const both = ["finance", "wishlist"] as const;
		expect(routeLine("I want to save for an adventure bike", both)).toBe("wishlist");
		expect(routeLine("spent 500 on fuel", both)).toBe("finance");
		expect(routeLine("someday a pro laptop", ["finance"])).toBeNull();
	});

	it("skips modules the person turned off", () => {
		expect(routeLine("prayed fajr", ["career"])).toBeNull();
	});
});
