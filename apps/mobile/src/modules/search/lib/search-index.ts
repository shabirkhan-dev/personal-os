/**
 * One search across the app: every module turns its records into entries, and `searchEntries`
 * ranks them against what the person typed. Pure, so it is tested without a phone.
 */

export type SearchEntry = {
	id: string;
	/** "Food", "Money", "Health"… shown above the title. */
	module: string;
	title: string;
	subtitle: string;
	/** The screen it opens, as an Expo Router href. */
	href: string;
};

const normal = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim();

/** How well an entry matches every word typed; 0 when one of the words is missing. */
export function scoreEntry(entry: SearchEntry, words: readonly string[]): number {
	const title = normal(entry.title);
	const rest = normal(`${entry.subtitle} ${entry.module}`);
	let score = 0;
	for (const word of words) {
		if (title.startsWith(word)) score += 4;
		else if (title.split(/\s+/).some((part) => part.startsWith(word))) score += 3;
		else if (title.includes(word)) score += 2;
		else if (rest.includes(word)) score += 1;
		else return 0;
	}
	return score;
}

/** The best `limit` matches for `query`, best first; nothing for an empty query. */
export function searchEntries(
	entries: readonly SearchEntry[],
	query: string,
	limit = 40,
): SearchEntry[] {
	const words = normal(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return [];
	return entries
		.map((entry) => ({ entry, score: scoreEntry(entry, words) }))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
		.slice(0, limit)
		.map((item) => item.entry);
}
