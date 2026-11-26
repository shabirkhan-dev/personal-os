import { parseTemplateFile, type TemplateFile } from "@personal-os/domain/templates";
import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import { packById as builtInPack, type TemplatePack } from "./packs";
import { packFromFile } from "./template-files";

/**
 * The packs that aren't built into the app: the server's (fetched when Templates opens, so new
 * ones arrive without an update) and a file someone shared (kept until another is opened).
 */
type TemplateState = {
	server: TemplatePack[];
	serverState: "idle" | "loading" | "ready" | "offline";
	imported: TemplatePack | null;
	loadServer: () => Promise<void>;
	openImported: (file: TemplateFile) => TemplatePack;
};

export const useTemplateStore = create<TemplateState>((set, get) => ({
	server: [],
	serverState: "idle",
	imported: null,

	loadServer: async () => {
		if (get().serverState === "loading" || get().serverState === "ready") return;
		set({ serverState: "loading" });
		try {
			const data = await apiClient.get<{ packs: unknown[] }>("/templates", { timeoutMs: 10_000 });
			const packs = data.packs
				.map((raw) => parseTemplateFile(raw))
				.filter((parsed) => parsed.ok)
				.map((parsed) => packFromFile(parsed.file, "server"));
			set({ server: packs, serverState: "ready" });
		} catch (error) {
			console.warn("[templates] server packs unavailable", error);
			set({ serverState: "offline" });
		}
	},

	openImported: (file) => {
		const pack = packFromFile(file, "shared");
		set({ imported: pack });
		return pack;
	},
}));

/** Any pack by id: built in, from the server, or the file just opened. */
export function findPack(id: string): TemplatePack | undefined {
	const state = useTemplateStore.getState();
	return (
		builtInPack(id) ??
		state.server.find((pack) => pack.id === id) ??
		(state.imported?.id === id ? state.imported : undefined)
	);
}
