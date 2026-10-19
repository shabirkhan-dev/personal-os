import { date, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/** AI calls per user per UTC day, so one account can't run up the provider bill. */
export const aiUsage = pgTable(
	"ai_usage",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		day: date("day").notNull(),
		calls: integer("calls").notNull().default(0),
	},
	(table) => [primaryKey({ columns: [table.userId, table.day] })],
);
