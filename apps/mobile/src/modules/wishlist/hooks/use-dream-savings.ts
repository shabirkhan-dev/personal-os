import { useCallback } from "react";
import { newId } from "@/lib/day";
import { isFinanceCategory, useDreamFunding } from "@/modules/finance";
import { addContribution, removeContribution } from "../data/wishlist-actions";
import type { Contribution, Dream } from "../lib/wishlist-model";

/**
 * "Add savings" for a dream. The money comes out of the Finance budget as a category transfer:
 * it leaves line `from` (Buffer by default) for the Dreams line and leaves money now; the dream
 * records the contribution with the Finance entry so Undo reverses both sides.
 */
export function useDreamSavings() {
	const funding = useDreamFunding();
	const { fund, unfund } = funding;

	const add = useCallback(
		async (dream: Dream, amount: number, from: string): Promise<Contribution> => {
			if (!isFinanceCategory(from)) throw new Error("Pick a budget line.");
			const entry = await fund(amount, from, dream.name);
			const contribution: Contribution = {
				id: newId(),
				amount: entry.amount,
				at: entry.at,
				entryId: entry.id,
				from,
			};
			await addContribution(dream, contribution);
			return contribution;
		},
		[fund],
	);

	const undo = useCallback(
		async (dream: Dream, contribution: Contribution): Promise<void> => {
			if (contribution.entryId && contribution.from && isFinanceCategory(contribution.from)) {
				await unfund(contribution.entryId, contribution.amount, contribution.from);
			}
			await removeContribution(dream, contribution.id);
		},
		[unfund],
	);

	return { ...funding, add, undo };
}
