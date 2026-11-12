CREATE TABLE "pitches" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"format" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"surface" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"venue_id" uuid NOT NULL,
	CONSTRAINT "pitches_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "pitches_format_chk" CHECK ("format" in ('5v5', '7v7', '9v9', '11v11', 'other')),
	CONSTRAINT "pitches_surface_chk" CHECK ("surface" in ('grass', '3g', '4g', 'astroturf', 'indoor', 'other')),
	CONSTRAINT "pitches_name_chk" CHECK (length(trim("name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"notes" text,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"registered_on" date NOT NULL,
	"season_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"team_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_on" date,
	CONSTRAINT "registrations_status_chk" CHECK ("status" in ('pending', 'active', 'withdrawn', 'rejected')),
	CONSTRAINT "registrations_withdrawn_chk" CHECK (("status" = 'withdrawn') = ("withdrawn_on" is not null))
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"author_user_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"team_id" uuid,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "announcements_title_chk" CHECK (length(trim("title")) > 0),
	CONSTRAINT "announcements_body_chk" CHECK (length(trim("body")) > 0),
	CONSTRAINT "announcements_expires_chk" CHECK ("expires_at" is null or "published_at" is null or "expires_at" > "published_at")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" uuid,
	"entity_type" text,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"kind" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"read_at" timestamp with time zone,
	"title" text NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "notifications_kind_chk" CHECK ("kind" in ('announcement', 'event_change', 'event_reminder', 'consent_request', 'payment_reminder', 'other')),
	CONSTRAINT "notifications_title_chk" CHECK (length(trim("title")) > 0),
	CONSTRAINT "notifications_entity_chk" CHECK (("entity_type" is null) = ("entity_id" is null))
);
--> statement-breakpoint
CREATE TABLE "fee_charges" (
	"amount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"due_on" date,
	"fee_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"status" text DEFAULT 'due' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"waived_reason" text,
	CONSTRAINT "fee_charges_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "feeCharges_amountMinor_chk" CHECK ("amount_minor" >= 0),
	CONSTRAINT "feeCharges_currency_chk" CHECK ("currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "feeCharges_status_chk" CHECK ("status" in ('due', 'paid', 'waived', 'cancelled')),
	CONSTRAINT "feeCharges_waived_chk" CHECK ("status" <> 'waived' or length(trim(coalesce("waived_reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "fees" (
	"amount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"description" text,
	"due_on" date,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"team_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fees_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "fees_amountMinor_chk" CHECK ("amount_minor" >= 0),
	CONSTRAINT "fees_currency_chk" CHECK ("currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "fees_name_chk" CHECK (length(trim("name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"amount_minor" integer NOT NULL,
	"charge_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"method" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by_user_id" uuid,
	"reference" text,
	CONSTRAINT "payments_amountMinor_chk" CHECK ("amount_minor" > 0),
	CONSTRAINT "payments_currency_chk" CHECK ("currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "payments_method_chk" CHECK ("method" in ('cash', 'card', 'bank_transfer', 'cheque', 'other'))
);
--> statement-breakpoint
CREATE TABLE "consent_documents" (
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer NOT NULL,
	CONSTRAINT "consent_documents_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "consent_documents_org_id_type_uniq" UNIQUE("organization_id","id","type"),
	CONSTRAINT "consent_documents_org_type_version_uniq" UNIQUE("organization_id","type","version"),
	CONSTRAINT "consentDocuments_type_chk" CHECK ("type" in ('photo_video', 'medical_treatment', 'travel', 'data_sharing', 'social_media')),
	CONSTRAINT "consentDocuments_version_chk" CHECK ("version" >= 1),
	CONSTRAINT "consentDocuments_body_chk" CHECK (length(trim("body")) > 0),
	CONSTRAINT "consentDocuments_title_chk" CHECK (length(trim("title")) > 0)
);
--> statement-breakpoint
CREATE TABLE "person_identifiers" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "personIdentifiers_type_chk" CHECK ("type" in ('fa_fan', 'league_registration', 'school', 'other')),
	CONSTRAINT "personIdentifiers_value_chk" CHECK (length(trim("value")) > 0)
);
--> statement-breakpoint
CREATE TABLE "player_profiles" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"height_cm" integer,
	"notes" text,
	"organization_id" uuid NOT NULL,
	"person_id" uuid,
	"preferred_foot" text,
	"primary_position" text,
	"secondary_position" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_profiles_pk" PRIMARY KEY("person_id"),
	CONSTRAINT "playerProfiles_preferredFoot_chk" CHECK ("preferred_foot" is null or "preferred_foot" in ('left', 'right', 'both')),
	CONSTRAINT "playerProfiles_heightCm_chk" CHECK ("height_cm" is null or "height_cm" between 50 and 250)
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"awarded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_on" date,
	"file_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"issued_on" date,
	"kind" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"reference" text,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qualifications_kind_chk" CHECK ("kind" in ('coaching', 'refereeing', 'first_aid', 'other')),
	CONSTRAINT "qualifications_dates_chk" CHECK ("expires_on" is null or "issued_on" is null or "expires_on" >= "issued_on"),
	CONSTRAINT "qualifications_title_chk" CHECK (length(trim("title")) > 0)
);
--> statement-breakpoint
ALTER TABLE "consents" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD COLUMN "dbs_level" text;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD COLUMN "dbs_update_service" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
CREATE INDEX "pitches_organizationId_idx" ON "pitches" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pitches_venueId_name_uidx" ON "pitches" ("venue_id","name");--> statement-breakpoint
CREATE INDEX "registrations_organizationId_idx" ON "registrations" ("organization_id");--> statement-breakpoint
CREATE INDEX "registrations_seasonId_idx" ON "registrations" ("season_id");--> statement-breakpoint
CREATE INDEX "registrations_teamId_idx" ON "registrations" ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_person_season_uidx" ON "registrations" ("person_id","season_id");--> statement-breakpoint
CREATE INDEX "announcements_authorUserId_idx" ON "announcements" ("author_user_id");--> statement-breakpoint
CREATE INDEX "announcements_organizationId_publishedAt_idx" ON "announcements" ("organization_id","published_at");--> statement-breakpoint
CREATE INDEX "announcements_teamId_idx" ON "announcements" ("team_id");--> statement-breakpoint
CREATE INDEX "notifications_organizationId_idx" ON "notifications" ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications" ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "fee_charges_organizationId_idx" ON "fee_charges" ("organization_id");--> statement-breakpoint
CREATE INDEX "fee_charges_personId_idx" ON "fee_charges" ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_charges_fee_person_uidx" ON "fee_charges" ("fee_id","person_id");--> statement-breakpoint
CREATE INDEX "fees_organizationId_idx" ON "fees" ("organization_id");--> statement-breakpoint
CREATE INDEX "fees_seasonId_idx" ON "fees" ("season_id");--> statement-breakpoint
CREATE INDEX "fees_teamId_idx" ON "fees" ("team_id");--> statement-breakpoint
CREATE INDEX "payments_chargeId_idx" ON "payments" ("charge_id");--> statement-breakpoint
CREATE INDEX "payments_organizationId_idx" ON "payments" ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_recordedByUserId_idx" ON "payments" ("recorded_by_user_id");--> statement-breakpoint
CREATE INDEX "consents_documentId_idx" ON "consents" ("document_id");--> statement-breakpoint
CREATE INDEX "consent_documents_organizationId_idx" ON "consent_documents" ("organization_id");--> statement-breakpoint
CREATE INDEX "person_identifiers_organizationId_idx" ON "person_identifiers" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_identifiers_person_type_uidx" ON "person_identifiers" ("person_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "person_identifiers_org_type_value_uidx" ON "person_identifiers" ("organization_id","type","value");--> statement-breakpoint
CREATE INDEX "player_profiles_organizationId_idx" ON "player_profiles" ("organization_id");--> statement-breakpoint
CREATE INDEX "qualifications_fileId_idx" ON "qualifications" ("file_id");--> statement-breakpoint
CREATE INDEX "qualifications_organizationId_idx" ON "qualifications" ("organization_id");--> statement-breakpoint
CREATE INDEX "qualifications_personId_idx" ON "qualifications" ("person_id");--> statement-breakpoint
ALTER TABLE "pitches" ADD CONSTRAINT "pitches_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pitches" ADD CONSTRAINT "pitches_venue_same_org_fkey" FOREIGN KEY ("organization_id","venue_id") REFERENCES "venues"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_season_same_org_fkey" FOREIGN KEY ("organization_id","season_id") REFERENCES "seasons"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_user_id_users_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_fee_same_org_fkey" FOREIGN KEY ("organization_id","fee_id") REFERENCES "fees"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_season_same_org_fkey" FOREIGN KEY ("organization_id","season_id") REFERENCES "seasons"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_users_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_charge_same_org_fkey" FOREIGN KEY ("organization_id","charge_id") REFERENCES "fee_charges"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_document_same_org_fkey" FOREIGN KEY ("organization_id","document_id","type") REFERENCES "consent_documents"("organization_id","id","type") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_identifiers" ADD CONSTRAINT "person_identifiers_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_identifiers" ADD CONSTRAINT "person_identifiers_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguardingChecks_dbsLevel_chk" CHECK ("dbs_level" is null or "dbs_level" in ('basic', 'standard', 'enhanced', 'enhanced_barred_list'));--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguardingChecks_dbsOnly_chk" CHECK ("kind" = 'dbs' or ("dbs_level" is null and "dbs_update_service" = false));