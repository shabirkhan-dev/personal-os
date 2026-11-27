import { AI_LIMITS } from "./config";
import { AiError } from "./errors";
import { timeoutSignal } from "./timeout";

const { maxBytes, maxRedirects, maxText, minText, timeoutMs } = AI_LIMITS.page;

const unreadable = (message: string) => new AiError("page_unreadable", { message });

/**
 * Reads the text of a public job page. Redirects are followed by hand so every hop is checked;
 * local names and private addresses are refused (a Worker cannot reach private networks anyway,
 * this keeps it that way if the code ever runs elsewhere).
 */
export async function fetchPageText(url: string, fetcher: typeof fetch = fetch): Promise<string> {
	return (await fetchPage(url, fetcher)).text;
}

/** A public page's text and its share image (`og:image`), for product links. */
export async function fetchPage(
	url: string,
	fetcher: typeof fetch = fetch,
): Promise<{ text: string; image: string | null }> {
	let current = url;
	for (let hop = 0; hop <= maxRedirects; hop += 1) {
		assertPublicUrl(current);
		let response: Response;
		try {
			// oxlint-disable-next-line eslint/no-await-in-loop -- each hop depends on the last
			response = await fetcher(current, {
				redirect: "manual",
				headers: { "User-Agent": "PersonalOS/1.0 (job reader)", Accept: "text/html" },
				signal: timeoutSignal(timeoutMs),
			});
		} catch {
			throw unreadable("The page could not be loaded.");
		}
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("location");
			if (!location) throw unreadable("The page redirected without a target.");
			current = new URL(location, current).toString();
			continue;
		}
		if (response.status >= 400) throw unreadable(`The page answered ${response.status}.`);
		// oxlint-disable-next-line eslint/no-await-in-loop -- the loop ends here
		const html = await readLimited(response);
		const text = htmlToText(html);
		if (text.length < minText) throw unreadable("The page needs a sign-in or blocks reading.");
		return { text: text.slice(0, maxText), image: shareImage(html, current) };
	}
	throw unreadable("The page redirected too many times.");
}

/** Each `<meta …>` tag's attributes, read by scanning (no backtracking on hostile pages). */
function metaTags(html: string): Map<string, string>[] {
	const lower = html.toLowerCase();
	const tags: Map<string, string>[] = [];
	let at = lower.indexOf("<meta");
	while (at !== -1 && tags.length < 400) {
		const close = lower.indexOf(">", at);
		if (close === -1) break;
		tags.push(attributes(html.slice(at + 5, close)));
		at = lower.indexOf("<meta", close);
	}
	return tags;
}

/** `name="value"` pairs of one tag; names lowercased. */
function attributes(source: string): Map<string, string> {
	const out = new Map<string, string>();
	let i = 0;
	while (i < source.length) {
		while (i < source.length && " \t\n\r/".includes(source[i] ?? "")) i += 1;
		let name = "";
		while (i < source.length && !" \t\n\r=/".includes(source[i] ?? "")) {
			name += source[i];
			i += 1;
		}
		if (!name) break;
		let value = "";
		if (source[i] === "=") {
			i += 1;
			const quote = source[i];
			if (quote === '"' || quote === "'") {
				const end = source.indexOf(quote, i + 1);
				value = source.slice(i + 1, end === -1 ? source.length : end);
				i = end === -1 ? source.length : end + 1;
			} else {
				while (i < source.length && !" \t\n\r".includes(source[i] ?? "")) {
					value += source[i];
					i += 1;
				}
			}
		}
		out.set(name.toLowerCase(), value);
	}
	return out;
}

const IMAGE_KEYS = new Set(["og:image", "og:image:secure_url", "twitter:image"]);

/** The page's `og:image` (or `twitter:image`) as an absolute https URL, or null. */
export function shareImage(html: string, base: string): string | null {
	const tag = metaTags(html).find((item) =>
		IMAGE_KEYS.has((item.get("property") ?? item.get("name") ?? "").toLowerCase()),
	);
	const content = tag?.get("content");
	if (!content) return null;
	try {
		const absolute = new URL(content.replaceAll("&amp;", "&"), base);
		return absolute.protocol === "https:" ? absolute.toString() : null;
	} catch {
		return null;
	}
}

export function assertPublicUrl(value: string): void {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw unreadable("That isn't a valid link.");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw unreadable("Only http and https links can be read.");
	}
	const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (isPrivateHost(host)) throw unreadable("Links to private or local addresses are not read.");
}

function isPrivateHost(host: string): boolean {
	if (!host.includes(".") && !host.includes(":")) return true; // bare names: intranet hosts
	if (/(^|\.)(localhost|local|internal|home\.arpa)$/.test(host)) return true;
	const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
	if (v4) {
		const [a, b] = [Number(v4[1]), Number(v4[2])];
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			a >= 224 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			(a === 198 && (b === 18 || b === 19))
		);
	}
	if (host.includes(":")) {
		return (
			host === "::" ||
			host === "::1" ||
			/^f[cd]/.test(host) ||
			/^fe[89ab]/.test(host) ||
			host.startsWith("::ffff:")
		);
	}
	return false;
}

async function readLimited(response: Response): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) return "";
	const decoder = new TextDecoder();
	let size = 0;
	let html = "";
	for (;;) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- streaming read
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > maxBytes) {
			// oxlint-disable-next-line eslint/no-await-in-loop -- leaves the loop
			await reader.cancel();
			throw unreadable("The page is too large to read.");
		}
		html += decoder.decode(value, { stream: true });
	}
	return html + decoder.decode();
}

const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

/** Blocks whose content is never visible text. */
const HIDDEN = new Set(["script", "style", "noscript", "svg", "head", "template"]);
/** Tags that start a new line of text. */
const BLOCKS = new Set([
	"p",
	"div",
	"li",
	"br",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"section",
	"article",
	"tr",
	"ul",
	"ol",
]);

/** Where an HTML comment opened at `from` ends (`-->`, or `--!>` as browsers also accept). */
function commentEnd(lower: string, from: number): number {
	const plain = lower.indexOf("-->", from);
	const bang = lower.indexOf("--!>", from);
	if (plain === -1 && bang === -1) return lower.length;
	if (bang === -1 || (plain !== -1 && plain < bang)) return plain + 3;
	return bang + 4;
}

function decodeEntity(entity: string): string | null {
	if (entity.startsWith("#")) {
		const hex = entity[1]?.toLowerCase() === "x";
		const digits = entity.slice(hex ? 2 : 1);
		if (!digits || !/^[0-9a-f]+$/i.test(digits)) return null;
		const code = hex ? parseInt(digits, 16) : Number(digits);
		return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : " ";
	}
	return ENTITIES[entity.toLowerCase()] ?? null;
}

/** Text with entities decoded; angle brackets that come out of it stay harmless text. */
function decodeText(text: string): string {
	let out = "";
	let i = 0;
	while (i < text.length) {
		const amp = text.indexOf("&", i);
		if (amp === -1) {
			out += text.slice(i);
			break;
		}
		out += text.slice(i, amp);
		const semi = text.indexOf(";", amp);
		const decoded =
			semi !== -1 && semi - amp <= 10 ? decodeEntity(text.slice(amp + 1, semi)) : null;
		if (decoded === null) {
			out += "&";
			i = amp + 1;
		} else {
			out += decoded;
			i = semi + 1;
		}
	}
	return out.replaceAll("<", "‹").replaceAll(">", "›");
}

/**
 * Visible text of an HTML page: comments, scripts, styles and the head dropped, blocks on new
 * lines. One pass with `indexOf`, never a backtracking regex, so a hostile page stays linear.
 */
export function htmlToText(html: string): string {
	const lower = html.toLowerCase();
	const parts: string[] = [];
	let i = 0;
	while (i < html.length) {
		const open = html.indexOf("<", i);
		if (open === -1) {
			parts.push(decodeText(html.slice(i)));
			break;
		}
		parts.push(decodeText(html.slice(i, open)));
		if (lower.startsWith("<!--", open)) {
			parts.push(" ");
			i = commentEnd(lower, open + 4);
			continue;
		}
		const close = html.indexOf(">", open + 1);
		if (close === -1) break;
		const inner = lower.slice(open + 1, close).trim();
		const closing = inner.startsWith("/");
		const name = /^[a-z0-9]*/.exec(closing ? inner.slice(1) : inner)?.[0] ?? "";
		i = close + 1;
		if (!closing && HIDDEN.has(name)) {
			parts.push(" ");
			const end = lower.indexOf(`</${name}`, i);
			if (end === -1) break;
			const after = html.indexOf(">", end);
			i = after === -1 ? html.length : after + 1;
			continue;
		}
		parts.push(BLOCKS.has(name) ? "\n" : " ");
	}
	return parts
		.join("")
		.split("\n")
		.map((line) => line.replace(/[ \t\r\f\v]+/g, " ").trim())
		.filter(Boolean)
		.join("\n");
}
