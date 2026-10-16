import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { groceries } from "../data/collections";
import { saveGroceryItems } from "../data/food-actions";
import { groceryMatches } from "../lib/grocery-match";

/**
 * For Finance's Log spending: which items on this week's grocery list the spending names, and a
 * way to tick them as bought when it is saved.
 */
export function useGroceryMatch(names: readonly string[]) {
	const lists = useCollection(groceries);
	return useMemo(() => {
		const list = [...(lists.data ?? [])].sort((a, b) => b.id.localeCompare(a.id))[0] ?? null;
		const ids = list ? groceryMatches(list.items, names) : [];
		return {
			ids,
			/** Per name: whether it ticks something on the list. */
			matched: names.map((name) => (list ? groceryMatches(list.items, [name]).length > 0 : false)),
			tick: async (): Promise<void> => {
				if (!list || ids.length === 0) return;
				const picked = new Set(ids);
				await saveGroceryItems(
					list,
					list.items.map((item) =>
						picked.has(item.id) ? Object.assign({}, item, { bought: true }) : item,
					),
				);
			},
		};
	}, [lists.data, names]);
}
