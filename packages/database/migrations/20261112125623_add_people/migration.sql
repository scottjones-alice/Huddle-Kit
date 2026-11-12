CREATE TABLE "people" (
	"address_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date_of_birth" date,
	"email" text,
	"first_name" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"phone" text,
	"preferred_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE INDEX "people_addressId_idx" ON "people" ("address_id");--> statement-breakpoint
CREATE INDEX "people_organizationId_idx" ON "people" ("organization_id");--> statement-breakpoint
CREATE INDEX "people_organizationId_lastName_firstName_idx" ON "people" ("organization_id","last_name","first_name");--> statement-breakpoint
CREATE UNIQUE INDEX "people_organizationId_userId_uidx" ON "people" ("organization_id","user_id");--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;