/**
 * Exercises are the person's own: added by hand, made with AI or imported from a template file.
 * Each has its movement pattern, difficulty, the equipment it needs, three short cues and the
 * person's own photo, animation or video. Names are stored on logged sets, so an exercise is
 * never renamed.
 */

export const PATTERNS = [
	"push",
	"vertical-push",
	"dip",
	"pull",
	"row",
	"lever",
	"squat",
	"hinge",
	"lunge",
	"core",
	"handstand",
	"conditioning",
	"mobility",
	"run",
	"boxing",
	"sport",
	"gym",
] as const;
export type Pattern = (typeof PATTERNS)[number];

export const PATTERN_LABELS: Record<Pattern, string> = {
	push: "Push",
	"vertical-push": "Overhead push",
	dip: "Dips",
	pull: "Pull-ups",
	row: "Rows",
	lever: "Levers",
	squat: "Squats",
	hinge: "Hips and hamstrings",
	lunge: "Lunges",
	core: "Core",
	handstand: "Handstand",
	conditioning: "Conditioning",
	mobility: "Mobility",
	run: "Running",
	boxing: "Boxing",
	sport: "Team sport",
	gym: "Gym lifts",
};

export const EQUIPMENT = [
	"pull-up-bar",
	"dip-bars",
	"rings",
	"band",
	"jump-rope",
	"heavy-bag",
	"gym",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
	"pull-up-bar": "Pull-up bar",
	"dip-bars": "Dip bars",
	rings: "Rings",
	band: "Resistance band",
	"jump-rope": "Jump rope",
	"heavy-bag": "Heavy bag",
	gym: "Gym",
};

export type ExerciseUnit = "reps" | "s" | "min";

/** Media someone added: photos and animations on R2, a video as a Google Drive link. */
export type ExerciseMedia = {
	image?: string;
	/** An animated GIF or WebP. */
	animation?: string;
	/** A Google Drive share link, played in Drive's own player. */
	video?: string;
};

export type CatalogExercise = {
	id: string;
	/** Shown and stored on logged sets; never renamed. */
	name: string;
	pattern: Pattern;
	/** 1 (anyone) to 10 (years of practice). */
	level: number;
	/** Everything it needs; empty for bodyweight anywhere. */
	equipment: readonly Equipment[];
	unit: ExerciseUnit;
	/** Done on each side. */
	each?: boolean;
	/** Loaded with weight (gym lifts): sets also log kilograms. */
	weighted?: boolean;
	/** Kept from older versions' bundled photos; ignored. */
	photo: string;
	cues: readonly [string, string, string];
	media?: ExerciseMedia;
	/** Always true now: every exercise is the person's own. */
	custom?: boolean;
};

export type ExerciseGuide = { cues: readonly string[]; media?: ExerciseMedia };

let merged: readonly CatalogExercise[] = [];
let byId = new Map<string, CatalogExercise>();
let byName = new Map<string, CatalogExercise>();

/** The person's exercises, set by the data layer whenever they change. */
let lastSaved: readonly CatalogExercise[] | null = null;

export function setCustomExercises(saved: readonly CatalogExercise[]): void {
	// The same list (same reference) changes nothing; skipping keeps `allExercises()` stable.
	if (saved === lastSaved) return;
	lastSaved = saved;
	merged = saved;
	byId = new Map(saved.map((exercise) => [exercise.id, exercise]));
	byName = new Map(saved.map((exercise) => [exercise.name, exercise]));
}

/** The person's exercises. */
export function allExercises(): readonly CatalogExercise[] {
	return merged;
}

export function exerciseById(id: string): CatalogExercise | null {
	return byId.get(id) ?? null;
}

export function exerciseByName(name: string): CatalogExercise | null {
	return byName.get(name) ?? null;
}

/** The guide for an exercise by its name, or null when there is none. */
export function guideFor(name: string): ExerciseGuide | null {
	const exercise = byName.get(name);
	if (!exercise || exercise.pattern === "sport") return null;
	return {
		cues: exercise.cues,
		...(exercise.media ? { media: exercise.media } : {}),
	};
}

/**
 * The Google Drive file id in a share link ("…/file/d/<id>/view", "open?id=<id>", "uc?id=<id>"),
 * or null when the link isn't a Drive file.
 */
export function driveFileId(link: string): string | null {
	let url: URL;
	try {
		url = new URL(link.trim());
	} catch {
		return null;
	}
	if (!/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(url.hostname)) return null;
	const path = /\/file\/d\/([\w-]{10,})/.exec(url.pathname);
	const id = path?.[1] ?? url.searchParams.get("id");
	return id && /^[\w-]{10,}$/.test(id) ? id : null;
}

/** Drive's embedded player for a file, which streams the video at the right quality. */
export function drivePreviewUrl(link: string): string | null {
	const id = driveFileId(link);
	return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

// --- saved exercises ----------------------------------------------------------------------------

const httpsUrl = (value: unknown): string | undefined => {
	if (typeof value !== "string" || value.length > 600) return undefined;
	try {
		return new URL(value).protocol === "https:" ? value : undefined;
	} catch {
		return undefined;
	}
};

function parseMedia(raw: unknown): ExerciseMedia | undefined {
	if (typeof raw !== "object" || raw === null) return undefined;
	const record = raw as Record<string, unknown>;
	const image = httpsUrl(record.image);
	const animation = httpsUrl(record.animation);
	const video =
		typeof record.video === "string" && driveFileId(record.video) ? record.video : undefined;
	if (!image && !animation && !video) return undefined;
	return {
		...(image ? { image } : {}),
		...(animation ? { animation } : {}),
		...(video ? { video } : {}),
	};
}

const text = (value: unknown, max: number) =>
	typeof value === "string" ? value.trim().slice(0, max) : "";

/** A saved exercise (`training-exercises`). Anything malformed falls back or is dropped. */
export function parseSavedExercise(raw: unknown): CatalogExercise | null {
	if (typeof raw !== "object" || raw === null) return null;
	const record = raw as Record<string, unknown>;
	const id = text(record.id, 60);
	if (!id) return null;
	const cuesRaw = Array.isArray(record.cues) ? record.cues : [];
	const cues = [0, 1, 2].map((index) => text(cuesRaw[index], 100)) as [string, string, string];
	const media = parseMedia(record.media);
	const name = text(record.name, 60);
	if (!name) return null;
	const pattern = (PATTERNS as readonly string[]).includes(String(record.pattern))
		? (record.pattern as Pattern)
		: "conditioning";
	const unit = record.unit === "s" || record.unit === "min" ? record.unit : "reps";
	const level =
		typeof record.level === "number" ? Math.min(10, Math.max(1, Math.round(record.level))) : 3;
	const equipment = Array.isArray(record.equipment)
		? record.equipment.filter((item): item is Equipment =>
				(EQUIPMENT as readonly string[]).includes(String(item)),
			)
		: [];
	return {
		id,
		name,
		pattern,
		level,
		equipment,
		unit,
		...(record.each === true ? { each: true } : {}),
		...(record.weighted === true ? { weighted: true } : {}),
		photo: "",
		cues,
		...(media ? { media } : {}),
		custom: true,
	};
}

/** Whether the equipment someone has covers what an exercise needs. */
export function canDo(exercise: CatalogExercise, equipment: readonly Equipment[]): boolean {
	return exercise.equipment.every((item) => equipment.includes(item));
}

/** A YouTube search for the exercise, for a real video when the photos aren't enough. */
export function videoSearchUrl(name: string): string {
	return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise tutorial`)}`;
}
