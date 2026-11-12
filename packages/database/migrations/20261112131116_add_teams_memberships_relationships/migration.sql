CREATE TABLE "team_memberships" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ends_on" date,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" text NOT NULL,
	"shirt_number" integer,
	"starts_on" date NOT NULL,
	"team_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teamMemberships_dates_chk" CHECK ("ends_on" is null or "ends_on" >= "starts_on"),
	CONSTRAINT "teamMemberships_shirtNumber_chk" CHECK ("shirt_number" is null or "shirt_number" between 0 and 999)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"age_group" integer,
	"club_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"training_venue_id" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_ageGroup_chk" CHECK ("age_group" is null or "age_group" between 4 and 99)
);
--> statement-breakpoint
CREATE TABLE "person_relationships" (
	"can_collect" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"has_parental_responsibility" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_emergency_contact" boolean DEFAULT false NOT NULL,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"related_person_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personRelationships_notSelf_chk" CHECK ("person_id" <> "related_person_id")
);
--> statement-breakpoint
CREATE INDEX "team_memberships_organizationId_idx" ON "team_memberships" ("organization_id");--> statement-breakpoint
CREATE INDEX "team_memberships_personId_idx" ON "team_memberships" ("person_id");--> statement-breakpoint
CREATE INDEX "team_memberships_teamId_idx" ON "team_memberships" ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_team_person_role_start_uidx" ON "team_memberships" ("team_id","person_id","role","starts_on");--> statement-breakpoint
CREATE INDEX "teams_clubId_idx" ON "teams" ("club_id");--> statement-breakpoint
CREATE INDEX "teams_organizationId_idx" ON "teams" ("organization_id");--> statement-breakpoint
CREATE INDEX "teams_seasonId_idx" ON "teams" ("season_id");--> statement-breakpoint
CREATE INDEX "teams_trainingVenueId_idx" ON "teams" ("training_venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_clubId_seasonId_name_uidx" ON "teams" ("club_id","season_id","name");--> statement-breakpoint
CREATE INDEX "person_relationships_organizationId_idx" ON "person_relationships" ("organization_id");--> statement-breakpoint
CREATE INDEX "person_relationships_relatedPersonId_idx" ON "person_relationships" ("related_person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_relationships_person_related_kind_uidx" ON "person_relationships" ("person_id","related_person_id","relationship");--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_club_id_clubs_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_season_id_seasons_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_training_venue_id_venues_id_fkey" FOREIGN KEY ("training_venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_id_people_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_related_person_id_people_id_fkey" FOREIGN KEY ("related_person_id") REFERENCES "people"("id") ON DELETE CASCADE;