CREATE TABLE "event_series" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"ends_on" date,
	"generated_until" date,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"interval_weeks" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"kind" text NOT NULL,
	"meet_minutes_before" integer,
	"organization_id" uuid NOT NULL,
	"start_time" time NOT NULL,
	"starts_on" date NOT NULL,
	"team_id" uuid,
	"time_zone" text NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"venue_id" uuid,
	"weekday" integer NOT NULL,
	CONSTRAINT "event_series_organization_id_id_uniq" UNIQUE("organization_id","id"),
	CONSTRAINT "eventSeries_kind_chk" CHECK ("kind" in ('training', 'match', 'social', 'meeting', 'other')),
	CONSTRAINT "eventSeries_weekday_chk" CHECK ("weekday" between 1 and 7),
	CONSTRAINT "eventSeries_intervalWeeks_chk" CHECK ("interval_weeks" between 1 and 52),
	CONSTRAINT "eventSeries_durationMinutes_chk" CHECK ("duration_minutes" between 1 and 1440),
	CONSTRAINT "eventSeries_meetMinutesBefore_chk" CHECK ("meet_minutes_before" is null or "meet_minutes_before" between 0 and 1440),
	CONSTRAINT "eventSeries_dates_chk" CHECK ("ends_on" is null or "ends_on" >= "starts_on"),
	CONSTRAINT "eventSeries_timeZone_chk" CHECK (length(trim("time_zone")) > 0)
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "series_occurrence_starts_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "event_series_organizationId_idx" ON "event_series" ("organization_id");--> statement-breakpoint
CREATE INDEX "event_series_teamId_idx" ON "event_series" ("team_id");--> statement-breakpoint
CREATE INDEX "event_series_venueId_idx" ON "event_series" ("venue_id");--> statement-breakpoint
CREATE INDEX "event_series_createdByUserId_idx" ON "event_series" ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_series_occurrence_uidx" ON "events" ("series_id","series_occurrence_starts_at");--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_venue_id_venues_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_same_org_fkey" FOREIGN KEY ("organization_id","series_id") REFERENCES "event_series"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_chk" CHECK (("series_id" is null) = ("series_occurrence_starts_at" is null));