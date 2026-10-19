import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { fashionSettings, pieces, plans, wears, wishes } from "../data/collections";
import { defaultSettings } from "../lib/fashion-model";

/** Everything Fashion keeps on the phone, read through React Query from the record store. */
export function useFashion() {
	const pieceList = useCollection(pieces);
	const wearList = useCollection(wears);
	const planList = useCollection(plans);
	const wishList = useCollection(wishes);
	const settingsList = useCollection(fashionSettings);

	return useMemo(() => {
		const queries = [pieceList, wearList, planList, wishList, settingsList];
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			pieces: [...(pieceList.data ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
			wears: [...(wearList.data ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
			plans: planList.data ?? [],
			wishes: [...(wishList.data ?? [])].sort(
				(a, b) => WISH_ORDER[a.tag] - WISH_ORDER[b.tag] || a.createdAt.localeCompare(b.createdAt),
			),
			settings: settingsList.data?.[0] ?? defaultSettings(),
		};
	}, [pieceList, wearList, planList, wishList, settingsList]);
}

const WISH_ORDER = { first: 0, replace: 1, someday: 2 } as const;

export type FashionData = ReturnType<typeof useFashion>;
