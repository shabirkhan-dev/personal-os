import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { useNow } from "@/lib/use-now";
import { useDreamFunding } from "@/modules/finance";
import { wishlistDreams, wishlistOwned, wishlistSettings } from "../data/collections";
import {
	inLine,
	monthlyForDreams,
	perDay,
	roadmap,
	totalToSave,
	upNext,
} from "../lib/wishlist-math";
import { defaultWishlistSettings } from "../lib/wishlist-model";

/** Everything Wishlist keeps on the phone, read through React Query from the record store. */
export function useWishlist() {
	const settingsList = useCollection(wishlistSettings);
	const dreamList = useCollection(wishlistDreams);
	const ownedList = useCollection(wishlistOwned);

	return useMemo(() => {
		const queries = [settingsList, dreamList, ownedList];
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			settings: settingsList.data?.[0] ?? defaultWishlistSettings(),
			dreams: dreamList.data ?? [],
			owned: [...(ownedList.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
		};
	}, [settingsList, dreamList, ownedList]);
}

export type WishlistData = ReturnType<typeof useWishlist>;

/** The line, what's left to save, and the saving rate from Finance's income. */
export function useWishlistToday() {
	const data = useWishlist();
	const funding = useDreamFunding();
	const now = useNow();
	const view = useMemo(() => {
		const income = funding.income > 0 ? funding.income : data.settings.plannedIncome;
		const monthly = monthlyForDreams(income, data.settings.saveShare);
		return {
			line: inLine(data.dreams),
			next: upNext(data.dreams),
			toSave: totalToSave(data.dreams),
			income,
			monthly,
			daily: perDay(monthly),
			stops: roadmap(data.dreams, monthly, now),
		};
	}, [data, funding.income, now]);
	return { data, funding, now, ...view };
}
