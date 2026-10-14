/** Small guards for reading stored JSON back into typed documents. */

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asString(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

export function asBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

/** Keeps the entries `item` can read; drops the rest. */
export function asArray<T>(value: unknown, item: (raw: unknown) => T | null): T[] {
	if (!Array.isArray(value)) return [];
	const out: T[] = [];
	for (const raw of value) {
		const parsed = item(raw);
		if (parsed !== null) out.push(parsed);
	}
	return out;
}

export function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
	return typeof value === "string" && (options as readonly string[]).includes(value)
		? (value as T)
		: fallback;
}
