ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_address_id_addresses_id_fkey";--> statement-breakpoint
ALTER TABLE "opponents" DROP CONSTRAINT "opponents_address_id_addresses_id_fkey";--> statement-breakpoint
ALTER TABLE "venues" DROP CONSTRAINT "venues_address_id_addresses_id_fkey";--> statement-breakpoint
ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_team_id_teams_id_fkey";--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_season_id_seasons_id_fkey";--> statement-breakpoint
ALTER TABLE "consents" DROP CONSTRAINT "consents_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "role_assignment_teams" DROP CONSTRAINT "role_assignment_teams_xXP15UBidDN8_fkey";--> statement-breakpoint
ALTER TABLE "role_assignment_teams" DROP CONSTRAINT "role_assignment_teams_team_id_teams_id_fkey";--> statement-breakpoint
ALTER TABLE "allergies" DROP CONSTRAINT "allergies_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "people" DROP CONSTRAINT "people_address_id_addresses_id_fkey";--> statement-breakpoint
ALTER TABLE "person_relationships" DROP CONSTRAINT "person_relationships_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "person_relationships" DROP CONSTRAINT "person_relationships_related_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "safeguarding_checks" DROP CONSTRAINT "safeguarding_checks_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" DROP CONSTRAINT "safeguarding_concerns_subject_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "safeguarding_notes" DROP CONSTRAINT "safeguarding_notes_concern_id_safeguarding_concerns_id_fkey";--> statement-breakpoint
ALTER TABLE "incident_reports" DROP CONSTRAINT "incident_reports_person_id_people_id_fkey";--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
UPDATE "role_assignment_teams" SET "organization_id" = (SELECT ra."organization_id" FROM "role_assignments" ra WHERE ra."id" = "role_assignment_teams"."role_assignment_id");--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguarding_concerns_organization_id_id_uniq" UNIQUE("organization_id","id");--> statement-breakpoint
CREATE INDEX "role_assignment_teams_organizationId_idx" ON "role_assignment_teams" ("organization_id");--> statement-breakpoint
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_address_same_org_fkey" FOREIGN KEY ("organization_id","address_id") REFERENCES "addresses"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_address_same_org_fkey" FOREIGN KEY ("organization_id","address_id") REFERENCES "addresses"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_address_same_org_fkey" FOREIGN KEY ("organization_id","address_id") REFERENCES "addresses"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_season_same_org_fkey" FOREIGN KEY ("organization_id","season_id") REFERENCES "seasons"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ADD CONSTRAINT "role_assignment_teams_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ADD CONSTRAINT "role_assignment_teams_assignment_same_org_fkey" FOREIGN KEY ("organization_id","role_assignment_id") REFERENCES "role_assignments"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_assignment_teams" ADD CONSTRAINT "role_assignment_teams_team_same_org_fkey" FOREIGN KEY ("organization_id","team_id") REFERENCES "teams"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_address_same_org_fkey" FOREIGN KEY ("organization_id","address_id") REFERENCES "addresses"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_related_person_same_org_fkey" FOREIGN KEY ("organization_id","related_person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "safeguarding_checks" ADD CONSTRAINT "safeguarding_checks_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_concerns" ADD CONSTRAINT "safeguarding_concerns_subject_person_same_org_fkey" FOREIGN KEY ("organization_id","subject_person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "safeguarding_notes" ADD CONSTRAINT "safeguarding_notes_concern_same_org_fkey" FOREIGN KEY ("organization_id","concern_id") REFERENCES "safeguarding_concerns"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE RESTRICT;