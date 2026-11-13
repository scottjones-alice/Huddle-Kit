DROP INDEX "members_userId_idx";--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "person_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "team_role" text;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_organizationId_email_pending_uidx" ON "invitations" ("organization_id","email") WHERE "status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "members_userId_uidx" ON "members" ("user_id");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_chk" CHECK ("role" ~ '^(owner|admin|member)(,(owner|admin|member))*$');--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_status_chk" CHECK ("status" in ('pending', 'accepted', 'rejected', 'canceled'));--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_chk" CHECK (("team_id" is null) = ("team_role" is null) and ("team_id" is null or "person_id" is not null));--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_teamRole_chk" CHECK ("team_role" is null or "team_role" in ('player', 'coach', 'assistant_coach', 'manager', 'volunteer'));--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_email_chk" CHECK ("email" = lower("email"));--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_role_chk" CHECK ("role" ~ '^(owner|admin|member)(,(owner|admin|member))*$');