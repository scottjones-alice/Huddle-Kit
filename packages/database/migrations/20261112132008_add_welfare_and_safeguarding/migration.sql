CREATE TABLE "consents" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"file_id" uuid,
	"granted_at" timestamp NOT NULL,
	"granted_by_person_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"notes" text,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp,
	CONSTRAINT "consents_dates_chk" CHECK (("withdrawn_at" is null or "withdrawn_at" >= "granted_at") and ("expires_at" is null or "expires_at" > "granted_at"))
);
--> statement-breakpoint
CREATE TABLE "allergies" (
	"allergen" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"reaction" text,
	"severity" text NOT NULL,
	"treatment" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"details" text,
	"emergency_notes" text,
	"ended_on" date,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_emergency_relevant" boolean DEFAULT false NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"started_on" date,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "medicalRecords_dates_chk" CHECK ("ended_on" is null or "started_on" is null or "ended_on" >= "started_on")
);
--> statement-breakpoint
CREATE TABLE "safeguarding_checks" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_on" date,
	"file_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"issued_on" date,
	"kind" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	CONSTRAINT "safeguardingChecks_dates_chk" CHECK ("expires_on" is null or "issued_on" is null or "expires_on" >= "issued_on")
);
--> statement-breakpoint
CREATE TABLE "safeguarding_concerns" (
	"assigned_to" uuid,
	"closed_at" timestamp,
	"closed_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"details" text,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	"raised_by" uuid,
	"referred_at" timestamp,
	"referred_to" text,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"subject_person_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "safeguardingConcerns_closed_chk" CHECK (("status" = 'closed') = ("closed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "safeguarding_notes" (
	"author_user_id" uuid,
	"body" text NOT NULL,
	"concern_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_reports" (
	"action_taken" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"first_aider_person_id" uuid,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"kind" text NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"organization_id" uuid NOT NULL,
	"parents_notified_at" timestamp,
	"person_id" uuid NOT NULL,
	"reported_by" uuid,
	"severity" text NOT NULL,
	"team_id" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"venue_id" uuid
);
--> statement-breakpoint
CREATE INDEX "consents_fileId_idx" ON "consents" ("file_id");--> statement-breakpoint
CREATE INDEX "consents_grantedByPersonId_idx" ON "consents" ("granted_by_person_id");--> statement-breakpoint
CREATE INDEX "consents_organizationId_idx" ON "consents" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consents_active_uidx" ON "consents" ("person_id","type") WHERE "withdrawn_at" is null;--> statement-breakpoint
CREATE INDEX "allergies_organizationId_idx" ON "allergies" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "allergies_personId_allergen_uidx" ON "allergies" ("person_id","allergen");--> statement-breakpoint
CREATE INDEX "medical_records_organizationId_idx" ON "medical_records" ("organization_id");--> statement-breakpoint
CREATE INDEX "medical_records_personId_idx" ON "medical_records" ("person_id");--> statement-breakpoint
CREATE INDEX "safeguarding_checks_fileId_idx" ON "safeguarding_checks" ("file_id");--> statement-breakpoint
CREATE INDEX "safeguarding_checks_organizationId_idx" ON "safeguarding_checks" ("organization_id");--> statement-breakpoint
CREATE INDEX "safeguarding_checks_personId_kind_idx" ON "safeguarding_checks" ("person_id","kind");--> statement-breakpoint
CREATE INDEX "safeguarding_checks_verifiedBy_idx" ON "safeguarding_checks" ("verified_by");--> statement-breakpoint
CREATE INDEX "safeguarding_concerns_assignedTo_idx" ON "safeguarding_concerns" ("assigned_to");--> statement-breakpoint
CREATE INDEX "safeguarding_concerns_organizationId_status_idx" ON "safeguarding_concerns" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "safeguarding_concerns_raisedBy_idx" ON "safeguarding_concerns" ("raised_by");--> statement-breakpoint
CREATE INDEX "safeguarding_concerns_subjectPersonId_idx" ON "safeguarding_concerns" ("subject_person_id");--> statement-breakpoint
CREATE INDEX "safeguarding_notes_concernId_createdAt_idx" ON "safeguarding_notes" ("concern_id","created_at");--> statement-breakpoint
CREATE INDEX "safeguarding_notes_organizationId_idx" ON "safeguarding_notes" ("organization_id");--> statement-breakpoint
CREATE INDEX "incident_reports_firstAiderPersonId_idx" ON "incident_reports" ("first_aider_person_id");--> statement-breakpoint
CREATE INDEX "incident_reports_organizationId_occurredAt_idx" ON "incident_reports" ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "incident_reports_personId_idx" ON "incident_reports" ("person_id");--> statement-breakpoint
CREATE INDEX "incident_reports_reportedBy_idx" ON "incident_reports" ("reported_by");--> statement-breakpoint
CREATE INDEX "incident_reports_teamId_idx" ON "incident_reports" ("team_id");--> statement-breakpoint
CREATE INDEX "incident_reports_venueId_idx" ON "incident_reports" ("venue_id");--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_granted_by_person_id_people_id_fkey" FOREIGN KEY ("granted_by_person_id") REFERENCES "people"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguarding_checks_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguarding_checks_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguarding_checks_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguarding_checks_verified_by_users_id_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguarding_concerns_assigned_to_users_id_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguarding_concerns_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguarding_concerns_raised_by_users_id_fkey" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguarding_concerns_subject_person_id_people_id_fkey" FOREIGN KEY ("subject_person_id") REFERENCES "people"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_notes" ADD CONSTRAINT "safeguarding_notes_concern_id_safeguarding_concerns_id_fkey" FOREIGN KEY ("concern_id") REFERENCES "safeguarding_concerns"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_notes" ADD CONSTRAINT "safeguarding_notes_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_first_aider_person_id_people_id_fkey" FOREIGN KEY ("first_aider_person_id") REFERENCES "people"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reported_by_users_id_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_venue_id_venues_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;