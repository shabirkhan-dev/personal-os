import { useMemo } from "react";
import { type DayEntry, minutesOf } from "@/modules/home/lib/module-day";
import { ayahOfTheDay } from "../lib/faith-math";
import { useFaithToday } from "./use-faith-today";

export type FaithDay = {
	setUp: boolean;
	entries: DayEntry[];
	prayed: number;
	total: number;
	/** "Fajr", "Maghrib", "Isha": the prayers set up, in order. */
	names: string[];
	/** Fajr today: when it starts and when it was prayed. */
	fajr: { minutes: number; prayedAt: string | null } | null;
	ayah: { text: string; ref: string };
};

/** Today's prayers for Daily life: the times, which are prayed, and the ayah of the day. */
export function useFaithDay(): FaithDay {
	const { data, rows, prayed, now } = useFaithToday();
	return useMemo(() => {
		const fajr = rows.find((row) => row.prayer === "fajr");
		const ayah = ayahOfTheDay(now);
		return {
			setUp: data.settings.setUp,
			entries: rows.map((row) => ({
				id: `faith-${row.prayer}`,
				minutes: minutesOf(row.at),
				length: 10,
				title: row.label,
				detail: "10 min",
				done: row.state === "prayed" || row.state === "late",
			})),
			prayed,
			total: rows.length,
			names: rows.map((row) => row.label),
			fajr: fajr
				? {
						minutes: minutesOf(fajr.at),
						prayedAt: fajr.log && fajr.log.status !== "missed" ? fajr.log.at : null,
					}
				: null,
			ayah: { text: ayah.translation, ref: ayah.id },
		};
	}, [data.settings.setUp, rows, prayed, now]);
}
