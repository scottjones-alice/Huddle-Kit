CREATE TABLE "member_joining_roles" (
	"joined_as" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"person_id" uuid PRIMARY KEY,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_joining_roles_chk" CHECK ("joined_as" in ('staff', 'player', 'parent'))
);
--> statement-breakpoint
CREATE TABLE "person_social_links" (
	"handle" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_social_links_platform_chk" CHECK ("platform" in ('facebook', 'instagram', 'tiktok', 'x'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "person_social_links_person_platform_uidx" ON "person_social_links" ("person_id","platform");--> statement-breakpoint
ALTER TABLE "member_joining_roles" ADD CONSTRAINT "member_joining_roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member_joining_roles" ADD CONSTRAINT "member_joining_roles_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_social_links" ADD CONSTRAINT "person_social_links_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_social_links" ADD CONSTRAINT "person_social_links_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;