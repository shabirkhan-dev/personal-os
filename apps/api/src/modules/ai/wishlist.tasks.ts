import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import { type DreamFound, dreamFound, type FindDreamInput } from "./wishlist.schema";

type Deps = { config: Config };

const GUIDANCE =
	"The person describes something they want to buy one day, in Pakistan, paying cash. Give it a " +
	"short product name, pick the category, and list up to three versions (budget, standard, " +
	"premium) with a typical cash price in Pakistani rupees today, plus the overall price range. " +
	"Use whole rupees. If you are unsure of prices, give a wide range rather than a precise guess. " +
	"`fits` says what it is for in a few words. Never suggest instalments or loans.";

/** Wishlist's AI task: reading a typed dream into a name, versions and a price range. */
export async function findDream(deps: Deps, input: FindDreamInput): Promise<DreamFound> {
	if (deps.config.ai.provider === "mock") {
		const name = input.text.replace(/^(a|an|the)\s+/i, "").split(/\s+for\s+/i)[0] ?? input.text;
		return dreamFound.parse({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			category: "other",
			options: [],
			fits: "",
		});
	}
	return askJson(
		deps.config,
		"Wishlist",
		"wishlist-find",
		GUIDANCE,
		JSON.stringify(input),
		dreamFound,
	);
}
