ALTER TABLE "files" ADD COLUMN "checksum_sha256" text;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "file_views" ALTER COLUMN "viewed_at" SET DATA TYPE timestamp with time zone USING "viewed_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "uploaded_at" SET DATA TYPE timestamp with time zone USING "uploaded_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "occurred_at" SET DATA TYPE timestamp with time zone USING "occurred_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team_memberships" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team_memberships" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "person_relationships" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "person_relationships" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_assignments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_assignments" ALTER COLUMN "ends_at" SET DATA TYPE timestamp with time zone USING "ends_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_assignments" ALTER COLUMN "starts_at" SET DATA TYPE timestamp with time zone USING "starts_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_assignments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "granted_at" SET DATA TYPE timestamp with time zone USING "granted_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "withdrawn_at" SET DATA TYPE timestamp with time zone USING "withdrawn_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "allergies" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "allergies" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "medical_records" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "medical_records" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ALTER COLUMN "verified_at" SET DATA TYPE timestamp with time zone USING "verified_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ALTER COLUMN "closed_at" SET DATA TYPE timestamp with time zone USING "closed_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ALTER COLUMN "opened_at" SET DATA TYPE timestamp with time zone USING "opened_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ALTER COLUMN "referred_at" SET DATA TYPE timestamp with time zone USING "referred_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "safeguarding_notes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "incident_reports" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "incident_reports" ALTER COLUMN "occurred_at" SET DATA TYPE timestamp with time zone USING "occurred_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "incident_reports" ALTER COLUMN "parents_notified_at" SET DATA TYPE timestamp with time zone USING "parents_notified_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "incident_reports" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "club_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "club_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "opponents" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "opponents" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_kinds_chk" CHECK (cardinality("kinds") > 0 and "kinds" <@ array['training_ground', 'classroom', 'clubhouse', 'match_venue']::text[]);--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_kind_chk" CHECK ("kind" in ('photo', 'report', 'other'));--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_status_chk" CHECK ("status" in ('pending', 'uploaded', 'failed'));--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_sizeBytes_chk" CHECK ("size_bytes" >= 0);--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_checksumSha256_chk" CHECK ("checksum_sha256" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "teamMemberships_role_chk" CHECK ("role" in ('player', 'coach', 'assistant_coach', 'manager', 'volunteer'));--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "auditEvents_action_chk" CHECK ("action" ~ '^[a-z][a-z_]*[.][a-z][a-z_]*$');--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_type_chk" CHECK ("type" in ('photo_video', 'medical_treatment', 'travel', 'data_sharing', 'social_media'));--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "roleAssignments_role_chk" CHECK ("role" in ('admin', 'coach', 'team_manager', 'welfare_officer', 'safeguarding_lead', 'safeguarding_deputy'));--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "roleAssignments_scope_chk" CHECK ("scope" in ('organization', 'teams'));--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_countryCode_chk" CHECK ("country_code" ~ '^[A-Z]{2}$');--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_latitude_chk" CHECK ("latitude" between -90 and 90);--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_longitude_chk" CHECK ("longitude" between -180 and 180);--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_severity_chk" CHECK ("severity" in ('mild', 'moderate', 'severe', 'life_threatening'));--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medicalRecords_kind_chk" CHECK ("kind" in ('condition', 'medication', 'disability', 'other'));--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "personRelationships_relationship_chk" CHECK ("relationship" in ('parent', 'guardian', 'carer', 'grandparent', 'other'));--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguardingChecks_kind_chk" CHECK ("kind" in ('dbs', 'safeguarding_training', 'first_aid', 'reference'));--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguardingChecks_status_chk" CHECK ("status" in ('pending', 'valid', 'rejected', 'revoked'));--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguardingConcerns_status_chk" CHECK ("status" in ('open', 'under_review', 'referred', 'closed'));--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguardingConcerns_severity_chk" CHECK ("severity" in ('low', 'medium', 'high', 'immediate_risk'));--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incidentReports_kind_chk" CHECK ("kind" in ('injury', 'illness', 'accident', 'behaviour', 'near_miss', 'other'));--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incidentReports_severity_chk" CHECK ("severity" in ('minor', 'moderate', 'serious'));