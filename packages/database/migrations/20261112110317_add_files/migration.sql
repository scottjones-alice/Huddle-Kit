CREATE TABLE "files" (
	"bucket" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"etag" text,
	"file_name" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"key" text NOT NULL,
	"kind" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"size_bytes" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "files_bucket_key_uidx" ON "files" ("bucket","key");--> statement-breakpoint
CREATE INDEX "files_organizationId_idx" ON "files" ("organization_id");--> statement-breakpoint
CREATE INDEX "files_uploadedBy_idx" ON "files" ("uploaded_by");--> statement-breakpoint
CREATE INDEX "files_organizationId_kind_idx" ON "files" ("organization_id","kind");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL;