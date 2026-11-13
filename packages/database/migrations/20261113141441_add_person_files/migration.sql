CREATE TABLE "person_files" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"file_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	CONSTRAINT "person_files_purpose_chk" CHECK ("purpose" in ('avatar', 'cover', 'document'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "person_files_fileId_uidx" ON "person_files" ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_files_person_single_uidx" ON "person_files" ("person_id","purpose") WHERE "purpose" in ('avatar', 'cover');--> statement-breakpoint
CREATE INDEX "person_files_organizationId_idx" ON "person_files" ("organization_id");--> statement-breakpoint
CREATE INDEX "person_files_personId_idx" ON "person_files" ("person_id");--> statement-breakpoint
CREATE INDEX "person_files_createdBy_idx" ON "person_files" ("created_by");--> statement-breakpoint
ALTER TABLE "person_files" ADD CONSTRAINT "person_files_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "person_files" ADD CONSTRAINT "person_files_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_files" ADD CONSTRAINT "person_files_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_files" ADD CONSTRAINT "person_files_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;