CREATE TABLE "file_views" (
	"file_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"viewed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "uploaded_at" timestamp;--> statement-breakpoint
CREATE INDEX "file_views_fileId_viewedAt_idx" ON "file_views" ("file_id","viewed_at");--> statement-breakpoint
CREATE INDEX "file_views_viewedBy_idx" ON "file_views" ("viewed_by");--> statement-breakpoint
ALTER TABLE "file_views" ADD CONSTRAINT "file_views_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "file_views" ADD CONSTRAINT "file_views_viewed_by_users_id_fkey" FOREIGN KEY ("viewed_by") REFERENCES "users"("id") ON DELETE SET NULL;