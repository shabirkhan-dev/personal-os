import type { TemplateFile } from "@personal-os/domain/templates";
import { create } from "zustand";
import type { TemplatePack } from "./template-pack";
import { packFromFile } from "./template-files";

/**
 * The template being looked at: the file just opened, pasted or made with AI, kept until another
 * one comes. Nothing is fetched from a server; templates are the person's own files.
 */
type TemplateState = {
	current: TemplatePack | null;
	open: (file: TemplateFile) => TemplatePack;
};

export const useTemplateStore = create<TemplateState>((set) => ({
	current: null,
	open: (file) => {
		const pack = packFromFile(file);
		set({ current: pack });
		return pack;
	},
}));

export function findPack(id: string): TemplatePack | undefined {
	const { current } = useTemplateStore.getState();
	return current?.id === id ? current : undefined;
}
