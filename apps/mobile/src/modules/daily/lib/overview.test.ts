import { describe, expect, it } from "bun:test";
import type { AgendaItem } from "./daily-math";
import { agendaRows } from "./overview";

const item = (overrides: Partial<AgendaItem>): AgendaItem => ({
	id: "faith-fajr",
	minutes: 5 * 60 + 10,
	length: 15,
	title: "Fajr and Quran",
	detail: "Faith · 15 min",
	module: "faith",
	done: false,
	...overrides,
});

describe("agendaRows", () => {
	it("maps a block to a row with its module's icon and the detail after the module name", () => {
		expect(agendaRows([item({})], [])).toEqual([
			{
				id: "faith-fajr",
				minutes: 310,
				time: "05:10",
				title: "Fajr and Quran",
				meta: "15 min",
				icon: "Moon",
				tone: "statusSuccess",
			},
		]);
	});

	it("leaves out finished and postponed blocks", () => {
		const rows = agendaRows(
			[
				item({ id: "done", done: true }),
				item({ id: "later" }),
				item({ id: "open", module: "career", detail: "Career · 2 h" }),
			],
			["later"],
		);
		expect(rows.map((row) => row.id)).toEqual(["open"]);
		expect(rows[0]?.meta).toBe("2 h");
	});

	it("keeps a detail with no module prefix as it is", () => {
		expect(agendaRows([item({ detail: "620 kcal" })], [])[0]?.meta).toBe("620 kcal");
	});
});
