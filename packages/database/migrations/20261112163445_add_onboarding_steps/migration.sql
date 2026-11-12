CREATE TABLE "onboarding_steps" (
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_by" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid,
	"step" text NOT NULL,
	"user_id" uuid,
	CONSTRAINT "onboarding_steps_subject_chk" CHECK (("user_id" is not null and "organization_id" is null and "step" in ('profile', 'notification-preferences'))
        or ("organization_id" is not null and "user_id" is null and "step" in ('club-details', 'payments', 'billing', 'invite-members')))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_steps_userId_step_uidx" ON "onboarding_steps" ("user_id","step") WHERE "user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_steps_organizationId_step_uidx" ON "onboarding_steps" ("organization_id","step") WHERE "organization_id" is not null;--> statement-breakpoint
CREATE INDEX "onboarding_steps_completedBy_idx" ON "onboarding_steps" ("completed_by");--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_completed_by_users_id_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
