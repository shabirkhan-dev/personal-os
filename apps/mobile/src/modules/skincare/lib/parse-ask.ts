/** What typed text in the Skincare ask bar means. */
export type SkincareAsk =
	| { kind: "complete-routine" }
	| { kind: "add-product"; name: string }
	| { kind: "check-in" };

const DONE = /\b(did|done|finished|completed?)\b.*\broutine\b|\broutine\b.*\b(done|finished)\b/i;
const ADD = /^\s*(?:add|bought|new|opened)\s+(?:product\s+)?(.+?)\s*$/i;

export function parseSkincareAsk(text: string): SkincareAsk {
	if (DONE.test(text)) return { kind: "complete-routine" };
	const add = ADD.exec(text);
	if (add?.[1]) {
		const name = add[1].replace(/^(a|an|the)\s+/i, "").trim();
		if (/^product$/i.test(name)) return { kind: "add-product", name: "" };
		return { kind: "add-product", name: name.charAt(0).toUpperCase() + name.slice(1) };
	}
	return { kind: "check-in" };
}
