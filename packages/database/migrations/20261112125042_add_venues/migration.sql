CREATE TABLE "venues" (
	"address_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"directions" text,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"kinds" text[] NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"what3words" text
);
--> statement-breakpoint
CREATE INDEX "venues_addressId_idx" ON "venues" ("address_id");--> statement-breakpoint
CREATE INDEX "venues_organizationId_idx" ON "venues" ("organization_id");--> statement-breakpoint
CREATE INDEX "venues_kinds_idx" ON "venues" USING gin ("kinds");--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;