CREATE TABLE "club_settings" (
	"address_id" uuid,
	"contact_email" text,
	"contact_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"home_venue_id" uuid,
	"organization_id" uuid PRIMARY KEY,
	"short_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "opponents" (
	"address_id" uuid,
	"contact_email" text,
	"contact_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"home_venue_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"linked_organization_id" uuid,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"short_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"website" text
);
--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_club_id_clubs_id_fkey";--> statement-breakpoint
DROP TABLE "clubs";--> statement-breakpoint
DROP INDEX "teams_clubId_idx";--> statement-breakpoint
DROP INDEX "teams_clubId_seasonId_name_uidx";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "club_id";--> statement-breakpoint
CREATE INDEX "club_settings_addressId_idx" ON "club_settings" ("address_id");--> statement-breakpoint
CREATE INDEX "club_settings_homeVenueId_idx" ON "club_settings" ("home_venue_id");--> statement-breakpoint
CREATE INDEX "opponents_addressId_idx" ON "opponents" ("address_id");--> statement-breakpoint
CREATE INDEX "opponents_homeVenueId_idx" ON "opponents" ("home_venue_id");--> statement-breakpoint
CREATE INDEX "opponents_linkedOrganizationId_idx" ON "opponents" ("linked_organization_id");--> statement-breakpoint
CREATE INDEX "opponents_organizationId_idx" ON "opponents" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "opponents_organizationId_name_uidx" ON "opponents" ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_organizationId_seasonId_name_uidx" ON "teams" ("organization_id","season_id","name");--> statement-breakpoint
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_home_venue_id_venues_id_fkey" FOREIGN KEY ("home_venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_home_venue_id_venues_id_fkey" FOREIGN KEY ("home_venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_linked_organization_id_organizations_id_fkey" FOREIGN KEY ("linked_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;