import { isRecord, oneOf } from "../parse";

/**
 * The assistant's contract between the API and the app: the approval setting, the cards an
 * answer can carry, and the events streamed while it is written.
 */

// --- Approval ------------------------------------------------------------------------------------

/** How a tool changes things: reading, a normal change, or one that is hard to take back. */
export const EFFECTS = ["read", "write", "risky"] as const;
export type ToolEffect = (typeof EFFECTS)[number];

/** When the assistant asks before changing something. */
export const APPROVAL_MODES = ["always", "important", "never"] as const;
export type ApprovalMode = (typeof APPROVAL_MODES)[number];

export const APPROVAL_LABELS: Record<ApprovalMode, { title: string; detail: string }> = {
	always: {
		title: "Ask before every change",
		detail: "Nothing is added, edited or deleted until you approve it.",
	},
	important: {
		title: "Ask only for important changes",
		detail: "Small updates happen straight away. Deleting or anything hard to undo waits for you.",
	},
	never: {
		title: "Don't ask",
		detail: "Changes happen straight away. You can still undo them.",
	},
};

/** Assistant preferences, synced like any record. One per person, id "settings". */
export type AssistantSettings = { id: "settings"; approval: ApprovalMode };

export const defaultAssistantSettings: AssistantSettings = { id: "settings", approval: "always" };

export const ASSISTANT_SETTINGS_COLLECTION = "assistant-settings";

export function parseAssistantSettings(raw: unknown): AssistantSettings | null {
	if (!isRecord(raw) || raw.id !== "settings") return null;
	return { id: "settings", approval: oneOf(raw.approval, APPROVAL_MODES, "always") };
}

export function needsApproval(mode: ApprovalMode, effect: ToolEffect): boolean {
	if (effect === "read") return false;
	if (mode === "always") return true;
	return mode === "important" && effect === "risky";
}

// --- Cards ---------------------------------------------------------------------------------------

export type Tone = "accent" | "success" | "caution" | "danger" | "neutral";

/** A screen in the app a card can open. `id` is the record for detail screens. */
export type AppLink =
	| { screen: "career" }
	| { screen: "career-applications" }
	| { screen: "career-application"; id: string }
	| { screen: "career-prep"; id: string }
	| { screen: "career-skill" }
	| { screen: "finance" }
	| { screen: "finance-runway" }
	| { screen: "finance-budget" }
	| { screen: "finance-history" }
	| { screen: "finance-income" }
	| { screen: "finance-insights" }
	| { screen: "training" }
	| { screen: "training-insights" }
	| { screen: "training-programs" }
	| { screen: "training-exercises" }
	| { screen: "training-session"; id: string }
	| { screen: "food" }
	| { screen: "food-plan" }
	| { screen: "food-grocery" }
	| { screen: "food-recipes" }
	| { screen: "food-insights" };

/** One row of a list card: a record, a bill, an entry. */
export type ListItem = {
	id: string;
	title: string;
	subtitle?: string;
	/** Short value on the right: "Rs 2,400", "Due Mon". */
	value?: string;
	tone?: Tone;
	link?: AppLink;
};

export type ApplicationSummary = {
	id: string;
	company: string;
	role: string;
	stage: string;
	/** "Rs 450k / mo", as written. */
	pay: string;
	where: string;
	/** ISO, when a nudge is due. */
	followUpAt: string | null;
	/** ISO, the next interview. */
	interviewAt: string | null;
};

export type Card =
	| { kind: "stats"; title: string; items: { label: string; value: string; tone?: Tone }[] }
	| {
			kind: "records";
			title: string;
			items: ApplicationSummary[];
			/** Shown when `items` is empty. */
			empty: string;
			more?: AppLink;
	  }
	| { kind: "record"; item: ApplicationSummary; link: AppLink }
	| {
			kind: "approval";
			callId: string;
			title: string;
			detail: string;
			effect: ToolEffect;
			state: "waiting" | "approved" | "declined";
	  }
	| { kind: "change"; callId: string; title: string; detail: string; undone: boolean }
	| { kind: "link"; label: string; link: AppLink }
	| { kind: "choices"; prompt: string; options: string[] }
	/** One number that answers the question: "Runway · 142 days". */
	| { kind: "metric"; label: string; value: string; detail?: string; tone?: Tone; link?: AppLink }
	/** Rows of anything, with an optional value on the right. */
	| { kind: "list"; title: string; items: ListItem[]; empty: string; more?: AppLink }
	/** Bars to compare: spending per line, per week. Values are plain numbers; `unit` labels them. */
	| {
			kind: "chart";
			title: string;
			style: "bars" | "columns";
			unit: string;
			points: { label: string; value: number; display?: string; tone?: Tone }[];
			note?: string;
	  }
	/** Use against a limit: budget lines, targets. */
	| {
			kind: "progress";
			title: string;
			items: { label: string; used: number; limit: number; text: string; tone?: Tone }[];
	  }
	/** What happened, in order: an application's history. */
	| { kind: "timeline"; title: string; items: { when: string; text: string; tone?: Tone }[] }
	/** Something to notice: a warning, a tip. */
	| { kind: "callout"; tone: Tone; title: string; text: string };

// --- Streaming -----------------------------------------------------------------------------------

/** What the app sends with a message: where the person is, so answers fit the screen. */
export type AssistantContext = {
	/** IANA zone, "Asia/Karachi". */
	timeZone: string;
	module?: string;
	screen?: string;
	/** The record on screen, an application id for instance. */
	recordId?: string;
};

export type StepStatus = "running" | "done" | "failed";

/** Server-sent events while an answer is written, in order. */
export type AssistantEvent =
	| { type: "thread"; threadId: string; title: string }
	| { type: "text"; delta: string }
	| { type: "step"; callId: string; label: string; status: StepStatus }
	| { type: "card"; card: Card }
	/** `changed` lists collections the answer wrote, so the app syncs them at once. */
	| { type: "done"; changed: string[]; waiting: boolean }
	| { type: "error"; code: string; message: string };

/** One message of a saved conversation, ready to show. */
export type ThreadMessage = {
	id: string;
	role: "user" | "assistant";
	text: string;
	cards: Card[];
	steps: { callId: string; label: string; status: StepStatus }[];
	createdAt: string;
};

export type ThreadSummary = { id: string; title: string; updatedAt: string };
