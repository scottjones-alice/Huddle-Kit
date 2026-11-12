CREATE TABLE "club_fee_settings" (
	"absorb_direct_debit_fee" boolean DEFAULT false NOT NULL,
	"frequency" text NOT NULL,
	"joining_fee_minor" integer,
	"kit_fee_minor" integer,
	"late_reminders" boolean DEFAULT true NOT NULL,
	"match_fee_minor" integer,
	"organization_id" uuid PRIMARY KEY,
	"sibling_discount" boolean DEFAULT false NOT NULL,
	"subscription_minor" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_fee_settings_frequency_chk" CHECK ("frequency" in ('monthly', 'termly', 'annually', 'per-session')),
	CONSTRAINT "club_fee_settings_amounts_chk" CHECK ("subscription_minor" >= 0 and coalesce("match_fee_minor", 0) >= 0 and coalesce("joining_fee_minor", 0) >= 0 and coalesce("kit_fee_minor", 0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "club_profiles" (
	"affiliation_number" text,
	"club_type" text,
	"constitution_file_id" uuid,
	"copy_parents_on_messages" boolean DEFAULT true NOT NULL,
	"county_fa" text,
	"founded_year" smallint,
	"insurance_certificate_file_id" uuid,
	"insurance_expires_on" date,
	"insurance_policy_number" text,
	"insurance_provider" text,
	"leagues" text,
	"legal_structure" text,
	"no_private_messages" boolean DEFAULT true NOT NULL,
	"organization_id" uuid PRIMARY KEY,
	"publish_results" boolean DEFAULT false NOT NULL,
	"registration_number" text,
	"safeguarding_policy_file_id" uuid,
	"safeguarding_policy_review_on" date,
	"sections" text[],
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"vat_number" text,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"welfare_officer_email" text,
	"welfare_officer_name" text,
	CONSTRAINT "club_profiles_type_chk" CHECK ("club_type" in ('grassroots', 'academy', 'school-or-college', 'community-or-charity', 'other')),
	CONSTRAINT "club_profiles_legal_chk" CHECK ("legal_structure" in ('unincorporated-association', 'cic', 'registered-charity', 'company-limited-by-guarantee', 'company-limited-by-shares', 'other')),
	CONSTRAINT "club_profiles_sections_chk" CHECK ("sections" is null or (cardinality("sections") > 0 and "sections" <@ array['mini-soccer', 'youth', 'adult-men', 'adult-women', 'veterans', 'disability']::text[]))
);
--> statement-breakpoint
CREATE TABLE "club_social_links" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "club_social_links_platform_chk" CHECK ("platform" in ('facebook', 'instagram', 'tiktok', 'x'))
);
--> statement-breakpoint
CREATE TABLE "club_training_slots" (
	"day_of_week" smallint NOT NULL,
	"ends_at" time NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"starts_at" time NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"venue_id" uuid,
	CONSTRAINT "club_training_slots_times_chk" CHECK ("day_of_week" between 1 and 7 and "ends_at" > "starts_at")
);
--> statement-breakpoint
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
CREATE UNIQUE INDEX "club_social_links_organizationId_platform_uidx" ON "club_social_links" ("organization_id","platform");--> statement-breakpoint
CREATE INDEX "club_training_slots_organizationId_idx" ON "club_training_slots" ("organization_id");--> statement-breakpoint
CREATE INDEX "club_training_slots_venueId_idx" ON "club_training_slots" ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_drafts_userId_flow_uidx" ON "onboarding_drafts" ("user_id","flow");--> statement-breakpoint
ALTER TABLE "club_fee_settings" ADD CONSTRAINT "club_fee_settings_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "club_profiles" ADD CONSTRAINT "club_profiles_constitution_file_id_files_id_fkey" FOREIGN KEY ("constitution_file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "club_profiles" ADD CONSTRAINT "club_profiles_insurance_certificate_file_id_files_id_fkey" FOREIGN KEY ("insurance_certificate_file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "club_profiles" ADD CONSTRAINT "club_profiles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "club_profiles" ADD CONSTRAINT "club_profiles_safeguarding_policy_file_id_files_id_fkey" FOREIGN KEY ("safeguarding_policy_file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "club_social_links" ADD CONSTRAINT "club_social_links_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "club_training_slots" ADD CONSTRAINT "club_training_slots_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "club_training_slots" ADD CONSTRAINT "club_training_slots_venue_id_venues_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "onboarding_drafts" ADD CONSTRAINT "onboarding_drafts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;;--> statement-breakpoint
-- onboarding_steps already exists (migration 20261112163445) and is empty: only the allowed step names change.
ALTER TABLE "onboarding_steps" DROP CONSTRAINT "onboarding_steps_subject_chk";--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_subject_chk" CHECK (("user_id" is not null and "organization_id" is null and "step" in ('you', 'emergency', 'safeguarding', 'role', 'details', 'address', 'safety', 'dbs', 'availability', 'children', 'permissions', 'billing', 'social'))
        or ("organization_id" is not null and "user_id" is null and "step" in ('club', 'location', 'governance', 'schedule', 'fees', 'payouts', 'team', 'billing', 'social')));
