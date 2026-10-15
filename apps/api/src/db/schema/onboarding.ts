import { integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/** The answers from the app's onboarding flow; the plan is derived from them on the phone. */
export const onboardingProfiles = pgTable("onboarding_profiles", {
	userId: uuid("user_id")
		.primaryKey()
		.references(() => users.id, { onDelete: "cascade" }),
	answers: jsonb("answers").notNull(),
	schemaVersion: integer("schema_version").notNull().default(1),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OnboardingRow = typeof onboardingProfiles.$inferSelect;
