ALTER TYPE "public"."auth_challenge_purpose" ADD VALUE 'step_up';--> statement-breakpoint
ALTER TABLE "auth_challenges" ADD COLUMN "action" varchar(64);--> statement-breakpoint
ALTER TABLE "auth_challenges" ADD COLUMN "session_id" varchar(36);