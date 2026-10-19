ALTER TABLE "sessions" ADD COLUMN "previous_refresh_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "rotated_at" timestamp with time zone;