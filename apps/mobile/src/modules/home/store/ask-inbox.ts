import { create } from "zustand";
import type { ModuleId } from "@/modules/onboarding/lib/options";

/**
 * A line said on the Talk to OS screen, waiting for the module it belongs to. Today switches to
 * that module and the module's Home takes the line as if it was typed into its own ask bar.
 */
export type InboxLine = { module: ModuleId; text: string; spoken: boolean; at: number };

type AskInbox = {
	line: InboxLine | null;
	send: (line: Omit<InboxLine, "at">) => void;
	/** Returns the line for `module` once, then forgets it. */
	take: (module: ModuleId) => InboxLine | null;
};

export const useAskInbox = create<AskInbox>((set, get) => ({
	line: null,
	send: (line) => set({ line: { ...line, at: Date.now() } }),
	take: (module) => {
		const line = get().line;
		if (!line || line.module !== module) return null;
		set({ line: null });
		return line;
	},
}));
