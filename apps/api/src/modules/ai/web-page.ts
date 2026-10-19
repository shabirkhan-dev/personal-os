import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";

const { maxBytes, maxRedirects, maxText, minText, timeoutMs } = settings.ai.page;

const unreadable = (message: string) => new AppError("JOB_LINK_UNREADABLE", { message });

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
				signal: AbortSignal.timeout(timeoutMs),
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

/** The page's `og:image` (or `twitter:image`) as an absolute https URL, or null. */
export function shareImage(html: string, base: string): string | null {
	const tag =
		/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i.exec(
			html,
		)?.[0];
	const content = tag ? /content=["']([^"']+)["']/i.exec(tag)?.[1] : undefined;
	if (!content) return null;
	try {
		const absolute = new URL(content.replace(/&amp;/g, "&"), base);
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

const HIDDEN = /<(!--|script|style|noscript|svg|head|template)\b/gi;

/**
 * Drops comments and hidden blocks (scripts, styles, the head) in one pass. A lazy regex would
 * rescan to the end for every unclosed tag, which a hostile page can make quadratic.
 */
function dropHidden(html: string): string {
	const lower = html.toLowerCase();
	let out = "";
	let from = 0;
	HIDDEN.lastIndex = 0;
	for (let match = HIDDEN.exec(html); match; match = HIDDEN.exec(html)) {
		const tag = (match[1] ?? "").toLowerCase();
		const closer = tag === "!--" ? "-->" : `</${tag}`;
		const close = lower.indexOf(closer, match.index + match[0].length);
		out += `${html.slice(from, match.index)} `;
		if (close === -1) return out;
		const end = tag === "!--" ? close + 3 : lower.indexOf(">", close) + 1 || lower.length;
		from = end;
		HIDDEN.lastIndex = end;
	}
	return out + html.slice(from);
}

/** Visible text of an HTML page: scripts, styles and the head dropped, blocks on new lines. */
export function htmlToText(html: string): string {
	return dropHidden(html)
		.replace(/<\/?(p|div|li|br|h[1-6]|section|article|tr|ul|ol)\b[^<>]*>/gi, "\n")
		.replace(/<[^<>]*>/g, " ")
		.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
			if (entity.startsWith("#")) {
				const code =
					entity[1]?.toLowerCase() === "x"
						? parseInt(entity.slice(2), 16)
						: Number(entity.slice(1));
				return Number.isFinite(code) && code > 0 && code < 0x110000
					? String.fromCodePoint(code)
					: " ";
			}
			return ENTITIES[entity.toLowerCase()] ?? match;
		})
		.replace(/[ \t\r\f\v]+/g, " ")
		.replace(/ *\n[\s]*/g, "\n")
		.trim();
}
