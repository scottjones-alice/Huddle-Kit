import { describe, expect, it } from "vitest";

import { createDatabase } from "../src/index";

describe("relations", () => {
  it("exposes every table on db.query and joins related tables", async () => {
    const db = createDatabase({
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    expect(new Set(Object.keys(db.query))).toStrictEqual(
      new Set([
        "accounts",
        "addresses",
        "allergies",
        "auditEvents",
        "announcements",
        "consentDocuments",
        "consents",
        "feeCharges",
        "fees",
        "notifications",
        "onboardingDrafts",
        "onboardingSteps",
        "payments",
        "personIdentifiers",
        "pitches",
        "playerProfiles",
        "qualifications",
        "registrations",
        "eventAttendance",
        "eventAvailability",
        "eventSeries",
        "events",
        "matchDetails",
        "matchSquad",
        "incidentReports",
        "medicalRecords",
        "safeguardingChecks",
        "safeguardingConcerns",
        "safeguardingNotes",
        "roleAssignmentTeams",
        "roleAssignments",
        "personRelationships",
        "subscriptions",
        "teamMemberships",
        "teams",
        "seasons",
        "clubSettings",
        "clubStripeAccounts",
        "opponents",
        "fileViews",
        "files",
        "invitations",
        "members",
        "organizations",
        "passkeys",
        "people",
        "sessions",
        "users",
        "venues",
        "verifications",
      ])
    );

    const { sql } = db.query.users
      .findMany({ with: { members: true, sessions: true } })
      .toSQL();

    expect(sql).toContain("sessions");
    expect(sql).toContain("members");

    const files = db.query.files
      .findMany({ with: { organization: true, uploader: true } })
      .toSQL().sql;

    expect(files).toContain("organizations");
    expect(files).toContain("users");

    await db.$client.end();
  });
});
