ALTER TABLE "onboarding_drafts" ADD COLUMN "last_reminded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "onboarding_drafts" ADD COLUMN "reminders_sent" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding_drafts" ADD CONSTRAINT "onboarding_drafts_remindersSent_chk" CHECK ("reminders_sent" between 0 and 3);