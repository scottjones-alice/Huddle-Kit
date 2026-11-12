CREATE TABLE "clubs" (
	"address_id" uuid,
	"contact_email" text,
	"contact_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"home_venue_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"short_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"website" text
);
--> statement-breakpoint
CREATE INDEX "clubs_addressId_idx" ON "clubs" ("address_id");--> statement-breakpoint
CREATE INDEX "clubs_homeVenueId_idx" ON "clubs" ("home_venue_id");--> statement-breakpoint
CREATE INDEX "clubs_organizationId_idx" ON "clubs" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_organizationId_name_uidx" ON "clubs" ("organization_id","name");--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_home_venue_id_venues_id_fkey" FOREIGN KEY ("home_venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;