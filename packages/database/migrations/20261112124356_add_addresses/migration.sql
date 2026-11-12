CREATE TABLE "addresses" (
	"city" text NOT NULL,
	"country_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"latitude" double precision,
	"line_1" text NOT NULL,
	"line_2" text,
	"longitude" double precision,
	"organization_id" uuid NOT NULL,
	"postal_code" text,
	"region" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "addresses_organizationId_idx" ON "addresses" ("organization_id");--> statement-breakpoint
CREATE INDEX "addresses_organizationId_postalCode_idx" ON "addresses" ("organization_id","postal_code");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;