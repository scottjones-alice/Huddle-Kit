CREATE TABLE "role_assignment_teams" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"role_assignment_id" uuid,
	"team_id" uuid,
	CONSTRAINT "role_assignment_teams_pk" PRIMARY KEY("role_assignment_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	"granted_by" uuid,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL,
	"scope" text NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "roleAssignments_dates_chk" CHECK ("ends_at" is null or "ends_at" >= "starts_at"),
	CONSTRAINT "roleAssignments_teamScope_chk" CHECK ("scope" = 'organization' or "role" in ('coach', 'team_manager'))
);
--> statement-breakpoint
CREATE INDEX "role_assignment_teams_teamId_idx" ON "role_assignment_teams" ("team_id");--> statement-breakpoint
CREATE INDEX "role_assignments_grantedBy_idx" ON "role_assignments" ("granted_by");--> statement-breakpoint
CREATE INDEX "role_assignments_organizationId_userId_idx" ON "role_assignments" ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "role_assignments_userId_idx" ON "role_assignments" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_assignments_active_uidx" ON "role_assignments" ("organization_id","user_id","role") WHERE "ends_at" is null;--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ADD CONSTRAINT "role_assignment_teams_xXP15UBidDN8_fkey" FOREIGN KEY ("role_assignment_id") REFERENCES "role_assignments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ADD CONSTRAINT "role_assignment_teams_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_granted_by_users_id_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;