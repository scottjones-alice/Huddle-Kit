CREATE TABLE "event_attendance" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"note" text,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"recorded_by_user_id" uuid,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eventAttendance_status_chk" CHECK ("status" in ('present', 'late', 'absent', 'excused'))
);
--> statement-breakpoint
CREATE TABLE "event_availability" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"note" text,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eventAvailability_status_chk" CHECK ("status" in ('available', 'unavailable', 'maybe'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"description" text,
	"ends_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"kind" text NOT NULL,
	"meet_at" timestamp with time zone,
	"organization_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"venue_id" uuid,
	CONSTRAINT "events_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "events_kind_chk" CHECK ("kind" in ('training', 'match', 'social', 'meeting', 'other')),
	CONSTRAINT "events_status_chk" CHECK ("status" in ('scheduled', 'cancelled', 'postponed', 'completed')),
	CONSTRAINT "events_dates_chk" CHECK ("ends_at" > "starts_at"),
	CONSTRAINT "events_meetAt_chk" CHECK ("meet_at" is null or "meet_at" <= "starts_at")
);
--> statement-breakpoint
CREATE TABLE "match_details" (
	"competition" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_id" uuid,
	"goals_against" integer,
	"goals_for" integer,
	"home_away" text NOT NULL,
	"opponent_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_details_pk" PRIMARY KEY("event_id"),
	CONSTRAINT "matchDetails_homeAway_chk" CHECK ("home_away" in ('home', 'away', 'neutral')),
	CONSTRAINT "matchDetails_score_chk" CHECK (("goals_for" is null) = ("goals_against" is null) and ("goals_for" is null or ("goals_for" >= 0 and "goals_against" >= 0)))
);
--> statement-breakpoint
CREATE TABLE "match_squad" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_id" uuid NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"minutes_played" integer,
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"position" text,
	"role" text NOT NULL,
	"shirt_number" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matchSquad_role_chk" CHECK ("role" in ('starter', 'substitute')),
	CONSTRAINT "matchSquad_goals_chk" CHECK ("goals" >= 0),
	CONSTRAINT "matchSquad_minutesPlayed_chk" CHECK ("minutes_played" is null or "minutes_played" between 0 and 200),
	CONSTRAINT "matchSquad_shirtNumber_chk" CHECK ("shirt_number" is null or "shirt_number" between 0 and 999)
);
--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
CREATE INDEX "event_attendance_organizationId_idx" ON "event_attendance" ("organization_id");--> statement-breakpoint
CREATE INDEX "event_attendance_personId_idx" ON "event_attendance" ("person_id");--> statement-breakpoint
CREATE INDEX "event_attendance_recordedByUserId_idx" ON "event_attendance" ("recorded_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendance_event_person_uidx" ON "event_attendance" ("event_id","person_id");--> statement-breakpoint
CREATE INDEX "event_availability_organizationId_idx" ON "event_availability" ("organization_id");--> statement-breakpoint
CREATE INDEX "event_availability_personId_idx" ON "event_availability" ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_availability_event_person_uidx" ON "event_availability" ("event_id","person_id");--> statement-breakpoint
CREATE INDEX "events_organizationId_startsAt_idx" ON "events" ("organization_id","starts_at");--> statement-breakpoint
CREATE INDEX "events_teamId_startsAt_idx" ON "events" ("team_id","starts_at");--> statement-breakpoint
CREATE INDEX "events_venueId_idx" ON "events" ("venue_id");--> statement-breakpoint
CREATE INDEX "match_details_opponentId_idx" ON "match_details" ("opponent_id");--> statement-breakpoint
CREATE INDEX "match_details_organizationId_idx" ON "match_details" ("organization_id");--> statement-breakpoint
CREATE INDEX "match_squad_organizationId_idx" ON "match_squad" ("organization_id");--> statement-breakpoint
CREATE INDEX "match_squad_personId_idx" ON "match_squad" ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_squad_event_person_uidx" ON "match_squad" ("event_id","person_id");--> statement-breakpoint
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_recorded_by_user_id_users_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_event_same_org_fkey" FOREIGN KEY ("organization_id","event_id") REFERENCES "events"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_availability" ADD CONSTRAINT "event_availability_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_availability" ADD CONSTRAINT "event_availability_event_same_org_fkey" FOREIGN KEY ("organization_id","event_id") REFERENCES "events"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_availability" ADD CONSTRAINT "event_availability_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "match_details" ADD CONSTRAINT "match_details_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match_details" ADD CONSTRAINT "match_details_event_same_org_fkey" FOREIGN KEY ("organization_id","event_id") REFERENCES "events"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match_details" ADD CONSTRAINT "match_details_opponent_same_org_fkey" FOREIGN KEY ("organization_id","opponent_id") REFERENCES "opponents"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "match_squad" ADD CONSTRAINT "match_squad_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match_squad" ADD CONSTRAINT "match_squad_event_same_org_fkey" FOREIGN KEY ("organization_id","event_id") REFERENCES "events"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "match_squad" ADD CONSTRAINT "match_squad_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;