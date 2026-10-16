import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { useNow } from "@/lib/use-now";
import { zakatPayments, zakatProfiles } from "../data/collections";
import { zakatView } from "../lib/faith-math";
import { defaultZakat } from "../lib/faith-model";

export type ZakatLine = { due: boolean; text: string };

/** One line about zakat for other modules (Finance's Budget): due, paid, or below nisab. */
export function useZakatLine(): ZakatLine | null {
	const profiles = useCollection(zakatProfiles);
	const payments = useCollection(zakatPayments);
	const now = useNow(60 * 60_000);
	return useMemo(() => {
		if (profiles.isPending) return null;
		const profile = profiles.data?.[0] ?? defaultZakat();
		const view = zakatView(profile, payments.data ?? [], now);
		if (!profiles.data?.[0]) return { due: false, text: "Set up zakat in Faith" };
		if (!view.aboveNisab) return { due: false, text: "Below nisab this year · nothing due" };
		if (view.left <= 0) return { due: false, text: "Paid for this year" };
		const amount = `Rs ${Math.round(view.left).toLocaleString("en-US")}`;
		return view.monthsLeft > 0
			? { due: false, text: `${amount} due in ${view.monthsLeft} months` }
			: { due: true, text: `${amount} due now` };
	}, [profiles.isPending, profiles.data, payments.data, now]);
}
