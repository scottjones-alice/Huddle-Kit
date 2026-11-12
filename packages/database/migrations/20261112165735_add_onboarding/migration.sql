CREATE TABLE "onboarding_drafts" (
	"data" text NOT NULL,
	"flow" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"step_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "onboarding_drafts_flow_chk" CHECK ("flow" in ('club', 'people'))
);
--> statement-breakpoint
CREATE TABLE "onboarding_steps" (
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_by" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid,
	"step" text NOT NULL,
	"user_id" uuid,
	CONSTRAINT "onboarding_steps_subject_chk" CHECK (("user_id" is not null and "organization_id" is null and "step" in ('you', 'emergency', 'safeguarding', 'role', 'details', 'address', 'safety', 'dbs', 'availability', 'children', 'permissions', 'billing', 'social'))
        or ("organization_id" is not null and "user_id" is null and "step" in ('club', 'location', 'governance', 'schedule', 'fees', 'payouts', 'team', 'billing', 'social')))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_drafts_userId_flow_uidx" ON "onboarding_drafts" ("user_id","flow");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_steps_userId_step_uidx" ON "onboarding_steps" ("user_id","step") WHERE "user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_steps_organizationId_step_uidx" ON "onboarding_steps" ("organization_id","step") WHERE "organization_id" is not null;--> statement-breakpoint
CREATE INDEX "onboarding_steps_completedBy_idx" ON "onboarding_steps" ("completed_by");--> statement-breakpoint
ALTER TABLE "onboarding_drafts" ADD CONSTRAINT "onboarding_drafts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_completed_by_users_id_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;