import { create } from "zustand";
import type { WishLine } from "../lib/parse-wish-line";

type WishlistUi = {
	/** What Add dream opens with: the ask bar's line or an empty-state tile. */
	draft: (WishLine & { text: string }) | null;
	setDraft: (draft: (WishLine & { text: string }) | null) => void;
	/** Insights notes put away this session. */
	hidden: string[];
	hide: (key: string) => void;
};

/** Wishlist's screen state that outlives one screen. */
export const useWishlistUi = create<WishlistUi>((set) => ({
	draft: null,
	setDraft: (draft) => set({ draft }),
	hidden: [],
	hide: (key) => set((state) => ({ hidden: [...state.hidden, key] })),
}));

export const WISHLIST_FIND_JOB = "wishlist:find";
