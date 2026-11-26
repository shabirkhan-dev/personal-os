/**
 * A template file: the one shape for templates people share with each other (a `.posx.json`
 * file), import back, and the packs the server offers. Items stay loosely typed here; the app
 * reads each one with its module's own parser before anything is saved.
 */

export const TEMPLATE_FORMAT = "personal-os-template";
export const TEMPLATE_VERSION = 1;

export const TEMPLATE_KINDS = [
	"recipes",
	"programs",
	"care-routine",
	"tasbih",
	"budget",
	"minimum",
] as const;
export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

export const TEMPLATE_MODULE_OF: Record<TemplateKind, string> = {
	recipes: "food",
	programs: "training",
	"care-routine": "care",
	tasbih: "faith",
	budget: "finance",
	minimum: "daily",
};

export type TemplateFile = {
	format: typeof TEMPLATE_FORMAT;
	version: number;
	id: string;
	kind: TemplateKind;
	title: string;
	summary: string;
	/** Who made it, as they wrote it ("Sam"); empty for anonymous. */
	author: string;
	createdAt: string;
	items: unknown[];
};

export type ParsedTemplate = { ok: true; file: TemplateFile } | { ok: false; reason: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown, max: number) =>
	typeof value === "string" ? value.trim().slice(0, max) : "";

/** Reads a template file; says plainly what's wrong when it isn't one. */
export function parseTemplateFile(raw: unknown): ParsedTemplate {
	if (!isObject(raw) || raw.format !== TEMPLATE_FORMAT) {
		return { ok: false, reason: "This isn't a Personal OS template." };
	}
	if (typeof raw.version !== "number" || raw.version > TEMPLATE_VERSION) {
		return {
			ok: false,
			reason:
				"This template was made by a newer version of the app. Update the app, then try again.",
		};
	}
	const kind = (TEMPLATE_KINDS as readonly string[]).includes(String(raw.kind))
		? (raw.kind as TemplateKind)
		: null;
	if (!kind)
		return { ok: false, reason: "This template is for something the app doesn't know yet." };
	const items = Array.isArray(raw.items) ? raw.items.slice(0, 60) : [];
	const title = text(raw.title, 80);
	if (!title || items.length === 0)
		return { ok: false, reason: "This template is empty or damaged." };
	return {
		ok: true,
		file: {
			format: TEMPLATE_FORMAT,
			version: raw.version,
			id: text(raw.id, 80) || `shared-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
			kind,
			title,
			summary: text(raw.summary, 400),
			author: text(raw.author, 40),
			createdAt: text(raw.createdAt, 40),
			items,
		},
	};
}

/** A new template file around `items`. */
export function makeTemplateFile(input: {
	kind: TemplateKind;
	title: string;
	summary: string;
	author: string;
	items: unknown[];
	now?: Date;
}): TemplateFile {
	const now = input.now ?? new Date();
	const slug = input.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
	return {
		format: TEMPLATE_FORMAT,
		version: TEMPLATE_VERSION,
		id: `shared-${slug || input.kind}-${now.getTime().toString(36)}`,
		kind: input.kind,
		title: input.title.trim().slice(0, 80),
		summary: input.summary.trim().slice(0, 400),
		author: input.author.trim().slice(0, 40),
		createdAt: now.toISOString(),
		items: input.items,
	};
}

/** "karahi-and-more.posx.json" */
export function templateFileName(file: Pick<TemplateFile, "title">): string {
	const slug = file.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
	return `${slug || "template"}.posx.json`;
}
