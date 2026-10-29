import { addDays, newId } from "../dates";
import type { Application, CareerEventKind, Contact, Halal, Interview, Stage } from "./model";

/**
 * Career's changes as pure functions: each takes a record and returns the next one. The app saves
 * the result on the phone; the assistant saves it on the server. Both apply the same rules.
 */

const STAGE_EVENT: Record<Stage, CareerEventKind> = {
	saved: "saved",
	applied: "applied",
	interview: "interview",
	offer: "offer",
	closed: "closed",
};

/** Days until the follow-up after applying, when none is given. */
export const FOLLOW_UP_DAYS = 7;

export type NewApplication = {
	company: string;
	role: string;
	pay?: string;
	where?: string;
	cv?: string;
	link?: string;
	notes?: string;
	stage: Extract<Stage, "saved" | "applied">;
	halal?: Halal;
	followUpInDays?: number | null;
};

const unsure: Halal = { status: "unsure", note: "", confirmed: false };

export function createApplication(
	input: NewApplication,
	now = new Date(),
	id = newId(),
): Application {
	const at = now.toISOString();
	const followUpInDays =
		input.followUpInDays ?? (input.stage === "applied" ? FOLLOW_UP_DAYS : null);
	return {
		id,
		company: input.company.trim(),
		role: input.role.trim(),
		pay: (input.pay ?? "").trim(),
		where: (input.where ?? "").trim(),
		cv: (input.cv ?? "").trim(),
		link: (input.link ?? "").trim(),
		notes: (input.notes ?? "").trim(),
		stage: input.stage,
		halal: input.halal ?? unsure,
		contact: null,
		interview: null,
		followUpAt:
			input.stage === "applied" && followUpInDays
				? addDays(now, followUpInDays).toISOString()
				: null,
		events: [{ at, kind: input.stage, note: "" }],
		createdAt: at,
	};
}

/** Moves an application along: logs the step and sets the follow-up (applied) or clears it. */
export function withStage(app: Application, stage: Stage, now = new Date()): Application {
	return {
		...app,
		stage,
		events: [...app.events, { at: now.toISOString(), kind: STAGE_EVENT[stage], note: "" }],
		followUpAt: stage === "applied" ? addDays(now, FOLLOW_UP_DAYS).toISOString() : null,
	};
}

/** After a nudge goes out: logged, the next follow-up a week later, the contact kept or set. */
export function withNudge(
	app: Application,
	contact?: Contact | null,
	now = new Date(),
): Application {
	return {
		...app,
		contact: contact === undefined ? app.contact : contact,
		events: [...app.events, { at: now.toISOString(), kind: "nudged", note: "" }],
		followUpAt: addDays(now, FOLLOW_UP_DAYS).toISOString(),
	};
}

export function withFollowUp(app: Application, at: Date | null): Application {
	return { ...app, followUpAt: at ? at.toISOString() : null };
}

/** Books an interview: the stage moves to interview and the follow-up is no longer needed. */
export function withInterview(
	app: Application,
	interview: Interview,
	now = new Date(),
): Application {
	return {
		...app,
		stage: "interview",
		interview,
		followUpAt: null,
		events: [...app.events, { at: now.toISOString(), kind: "interview", note: interview.round }],
	};
}

export function withContact(app: Application, contact: Contact | null): Application {
	return { ...app, contact };
}

/** Fields the person (or the assistant) may change directly. */
export type ApplicationEdit = Partial<
	Pick<Application, "company" | "role" | "pay" | "where" | "cv" | "link" | "notes">
>;

export function withEdit(app: Application, edit: ApplicationEdit): Application {
	const next = { ...app };
	for (const [key, value] of Object.entries(edit) as [keyof ApplicationEdit, string][]) {
		if (typeof value === "string") next[key] = value.trim();
	}
	return next;
}
