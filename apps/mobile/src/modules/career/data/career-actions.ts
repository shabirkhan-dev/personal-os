import { addDays, dayKey, newId } from "@/lib/day";
import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import {
	createApplication,
	type NewApplication as DomainNewApplication,
	withContact,
	withFollowUp,
	withInterview,
	withNudge,
	withStage,
} from "@personal-os/domain/career";
import type {
	Application,
	CareerSettings,
	Contact,
	Flashcard,
	Halal,
	Interview,
	Prep,
	SkillPlan,
	SkillSession,
	SkillWeek,
	Stage,
	Story,
} from "../lib/career-model";
import { review, type Rating } from "@/lib/flashcards/schedule";
import {
	applications,
	careerSettings,
	flashcards,
	preps,
	skillPlans,
	skillSessions,
	stories,
} from "./collections";

/**
 * Every Career write. Each one saves to the on-device store first (instant and offline); the
 * sync engine backs it up later. Screens never write documents directly.
 */

export type NewApplication = DomainNewApplication & {
	pay: string;
	where: string;
	cv: string;
	link: string;
	halal: Halal;
};

export async function addApplication(
	input: NewApplication,
	now = new Date(),
): Promise<Application> {
	const app = createApplication(input, now);
	await saveItem(applications, app);
	return app;
}

export function updateApplication(app: Application): Promise<void> {
	return saveItem(applications, app);
}

/** Moves an application along; logs the step and sets or clears the follow-up. */
export function setStage(app: Application, stage: Stage, now = new Date()): Promise<void> {
	return saveItem(applications, withStage(app, stage, now));
}

/**
 * After a nudge goes out: logged, the next follow-up a week later, and the contact it went to
 * saved (pass `undefined` to keep the current one).
 */
export function recordNudge(
	app: Application,
	contact?: Contact | null,
	now = new Date(),
): Promise<void> {
	return saveItem(applications, withNudge(app, contact, now));
}

export function setFollowUp(app: Application, at: Date | null): Promise<void> {
	return saveItem(applications, withFollowUp(app, at));
}

export function bookInterview(
	app: Application,
	interview: Interview,
	now = new Date(),
): Promise<void> {
	return saveItem(applications, withInterview(app, interview, now));
}

export function setContact(app: Application, contact: Contact | null): Promise<void> {
	return saveItem(applications, withContact(app, contact));
}

export function confirmHalal(app: Application): Promise<void> {
	return saveItem(applications, { ...app, halal: { ...app.halal, confirmed: true } });
}

/** Deletes an application with its prep and cards (used by undo and by delete). */
export async function deleteApplication(
	app: Application,
	deckCards: readonly Flashcard[],
): Promise<void> {
	await Promise.all([
		removeItem(applications, app.id),
		removeItem(preps, app.id),
		...deckCards.map((card) => removeItem(flashcards, card.id)),
	]);
}

// --- Interview prep and flashcards ---------------------------------------------------------------

export type GeneratedPrep = {
	topics: { title: string; detail: string }[];
	questions: string[];
	flashcards: { topic: string; tag: string; front: string; back: string; code: string }[];
};

/** Saves AI-built prep for an application and its flashcards (all due now). */
export async function savePrep(
	appId: string,
	generated: GeneratedPrep,
	now = new Date(),
): Promise<void> {
	const prep: Prep = {
		id: appId,
		topics: generated.topics.map((topic) => ({ id: newId(), ...topic, done: false })),
		questions: generated.questions,
		createdAt: now.toISOString(),
	};
	const due = now.toISOString();
	await Promise.all([
		saveItem(preps, prep),
		...generated.flashcards.map((card) =>
			saveItem(flashcards, {
				id: newId(),
				deckId: appId,
				...card,
				dueAt: due,
				intervalMinutes: 0,
				reps: 0,
			}),
		),
	]);
}

export function toggleTopic(prep: Prep, topicId: string): Promise<void> {
	return saveItem(preps, {
		...prep,
		topics: prep.topics.map((topic) =>
			topic.id === topicId ? { ...topic, done: !topic.done } : topic,
		),
	});
}

export function rateCard(card: Flashcard, rating: Rating, now = new Date()): Promise<void> {
	return saveItem(flashcards, review(card, rating, now));
}

export function saveStory(story: Omit<Story, "id"> & { id?: string }): Promise<void> {
	return saveItem(stories, { ...story, id: story.id ?? newId() });
}

export function deleteStory(id: string): Promise<void> {
	return removeItem(stories, id);
}

// --- Skill block -----------------------------------------------------------------------------

/**
 * Starts a path this week (week 1 begins on this Monday). Sessions are keyed by week and day, so
 * the previous plan's ones are cleared first; otherwise the new plan would inherit its progress.
 */
export async function startSkillPlan(
	title: string,
	weeks: SkillWeek[],
	now = new Date(),
): Promise<void> {
	const sinceMonday = (now.getDay() + 6) % 7;
	const plan: SkillPlan = {
		id: "plan",
		title,
		startedOn: dayKey(addDays(now, -sinceMonday)),
		weeks,
	};
	const old = await listItems(skillSessions);
	await Promise.all(old.map((session) => removeItem(skillSessions, session.id)));
	await saveItem(skillPlans, plan);
}

/** Marks a plan day done (or partial), dated the day it was practised. */
export function logSkillSession(
	input: { week: number; day: number; minutes: number; status: SkillSession["status"] },
	now = new Date(),
): Promise<void> {
	return saveItem(skillSessions, {
		id: `w${input.week}d${input.day}`,
		date: dayKey(now),
		...input,
	});
}

export function removeSkillSession(id: string): Promise<void> {
	return removeItem(skillSessions, id);
}

export function saveSettings(settings: CareerSettings): Promise<void> {
	return saveItem(careerSettings, settings);
}
