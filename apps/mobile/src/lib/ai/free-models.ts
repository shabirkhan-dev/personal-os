/**
 * OpenRouter's free models, from its public model list (no key needed), so someone without a
 * paid account can still pick a model that works. The list changes often, so it is read live.
 */

export type FreeModel = { id: string; name: string; context: number };

const MODELS_URL = "https://openrouter.ai/api/v1/models";

type RawModel = {
	id?: unknown;
	name?: unknown;
	context_length?: unknown;
	pricing?: { prompt?: unknown; completion?: unknown };
	architecture?: { output_modalities?: unknown };
	supported_parameters?: unknown;
};

/** OpenRouter's own router that picks any free model; the easiest default. */
export const AUTO_FREE_MODEL = "openrouter/free";

/** Answers in text only (not audio or images), and can be asked for JSON, which every task needs. */
function fits(model: RawModel): boolean {
	const output = model.architecture?.output_modalities;
	const params = model.supported_parameters;
	return (
		Array.isArray(output) &&
		output.length === 1 &&
		output[0] === "text" &&
		Array.isArray(params) &&
		params.includes("response_format")
	);
}

const isFree = (value: unknown) => value === "0" || value === 0;

/**
 * The free text models in OpenRouter's list that can answer in JSON: the auto router first, then
 * biggest context first, at most `limit`.
 */
export function pickFreeModels(payload: unknown, limit = 8): FreeModel[] {
	const data = (payload as { data?: unknown } | null)?.data;
	if (!Array.isArray(data)) return [];
	return (data as RawModel[])
		.filter(
			(model) =>
				typeof model.id === "string" &&
				isFree(model.pricing?.prompt) &&
				isFree(model.pricing?.completion) &&
				fits(model),
		)
		.map((model) => ({
			id: model.id as string,
			name:
				model.id === AUTO_FREE_MODEL
					? "Any free model (auto)"
					: typeof model.name === "string"
						? model.name.replace(/\s*\(free\)$/i, "")
						: String(model.id),
			context: typeof model.context_length === "number" ? model.context_length : 0,
		}))
		.toSorted(
			(a, b) =>
				Number(b.id === AUTO_FREE_MODEL) - Number(a.id === AUTO_FREE_MODEL) ||
				b.context - a.context ||
				a.id.localeCompare(b.id),
		)
		.slice(0, limit);
}

export async function loadFreeModels(): Promise<FreeModel[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10_000);
	try {
		const response = await fetch(MODELS_URL, { signal: controller.signal });
		if (!response.ok) throw new Error(`OpenRouter answered ${response.status}`);
		return pickFreeModels(await response.json());
	} finally {
		clearTimeout(timer);
	}
}
