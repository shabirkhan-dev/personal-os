import type { IconName } from "@/components/icons";

/**
 * A template pack: a template file (made with any AI, pasted, or shared by someone) shown as a
 * preview to pick from. Nothing ships with the app; adding copies the items into the person's own
 * data, where they change or delete them like anything they made.
 */

export type TemplateModule =
	| "food"
	| "training"
	| "care"
	| "faith"
	| "finance"
	| "fashion"
	| "daily";

export const MODULE_LABELS: Record<TemplateModule, string> = {
	food: "Food",
	training: "Training",
	care: "Care",
	faith: "Faith",
	finance: "Finance",
	fashion: "Fashion",
	daily: "Daily life",
};

export type PackItem = {
	id: string;
	title: string;
	subtitle: string;
	/** Longer lines shown when the item is opened (a recipe's ingredients, a program's sessions). */
	detail?: readonly string[];
};

export type TemplatePack = {
	id: string;
	module: TemplateModule;
	title: string;
	summary: string;
	icon: IconName;
	items: readonly PackItem[];
	/** "pick": choose items one by one; "one": only one at a time; "all": one set. */
	choose: "pick" | "one" | "all";
	/** Ids of the items already in the person's data. */
	added: () => Promise<ReadonlySet<string>>;
	add: (ids: readonly string[]) => Promise<void>;
	/** Where to go to see what was added. */
	open: string;
	/** Who shared it, for a template someone sent. */
	author?: string;
};
