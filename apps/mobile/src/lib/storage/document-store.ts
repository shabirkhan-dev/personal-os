import { create, type StoreApi, type UseBoundStore } from "zustand";
import { readJson, writeJson } from "./json-file";

export type DocumentState<T> = {
	data: T;
	/** False until the saved document has been read; screens show their empty state meanwhile. */
	hydrated: boolean;
	hydrate: () => Promise<void>;
	/** Replaces the document with `recipe(current)` and saves it. */
	update: (recipe: (current: T) => T) => void;
	/** Back to `initial`, saved. */
	reset: () => void;
};

export type DocumentStore<T> = UseBoundStore<StoreApi<DocumentState<T>>>;

const SAVE_DELAY_MS = 250;

/**
 * A zustand store backed by one JSON file on the phone. `parse` turns whatever was stored (or
 * nothing) into a valid document, so an old or damaged file never crashes a screen.
 */
export function createDocumentStore<T>(
	name: string,
	initial: T,
	parse: (raw: unknown) => T,
): DocumentStore<T> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let loading: Promise<void> | null = null;

	return create<DocumentState<T>>()((set, get) => {
		const save = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				writeJson(name, get().data).catch((error: unknown) =>
					console.error(`Could not save ${name}`, error),
				);
			}, SAVE_DELAY_MS);
		};

		return {
			data: initial,
			hydrated: false,
			hydrate: () => {
				if (get().hydrated) return Promise.resolve();
				loading ??= readJson(name)
					.then((raw) => set({ data: parse(raw), hydrated: true }))
					.catch((error: unknown) => {
						console.error(`Could not read ${name}`, error);
						set({ hydrated: true });
					});
				return loading;
			},
			update: (recipe) => {
				set({ data: recipe(get().data) });
				save();
			},
			reset: () => {
				set({ data: initial });
				save();
			},
		};
	});
}
