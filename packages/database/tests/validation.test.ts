import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import * as authentication from "../src/schema/authentication";
import * as clubSettings from "../src/schema/club/club-settings";
import * as opponents from "../src/schema/club/opponents";
import * as pitches from "../src/schema/club/pitches";
import * as venues from "../src/schema/club/venues";
import * as announcements from "../src/schema/communications/announcements";
import * as notifications from "../src/schema/communications/notifications";
import * as storage from "../src/schema/files/files";
import * as clubStripeAccounts from "../src/schema/finance/club-stripe-accounts";
import * as feeCharges from "../src/schema/finance/fee-charges";
import * as fees from "../src/schema/finance/fees";
import * as payments from "../src/schema/finance/payments";
import * as eventAttendance from "../src/schema/football/event-attendance";
import * as eventAvailability from "../src/schema/football/event-availability";
import * as eventSeries from "../src/schema/football/event-series";
import * as events from "../src/schema/football/events";
import * as matchDetails from "../src/schema/football/match-details";
import * as matchSquad from "../src/schema/football/match-squad";
import * as registrations from "../src/schema/football/registrations";
import * as seasons from "../src/schema/football/seasons";
import * as teamMemberships from "../src/schema/football/team-memberships";
import * as teams from "../src/schema/football/teams";
import * as auditEvents from "../src/schema/governance/audit-events";
import * as consent from "../src/schema/governance/consent";
import * as consentDocuments from "../src/schema/governance/consent-documents";
import * as roleAssignmentTeams from "../src/schema/governance/role-assignment-teams";
import * as roleAssignments from "../src/schema/governance/role-assignments";
import * as onboardingDrafts from "../src/schema/onboarding/onboarding-drafts";
import * as onboardingSteps from "../src/schema/onboarding/onboarding-steps";
import * as addresses from "../src/schema/people/addresses";
import * as allergies from "../src/schema/people/allergies";
import * as medicalRecords from "../src/schema/people/medical-records";
import * as people from "../src/schema/people/people";
import * as personIdentifiers from "../src/schema/people/person-identifiers";
import * as playerProfiles from "../src/schema/people/player-profiles";
import * as qualifications from "../src/schema/people/qualifications";
import * as relationships from "../src/schema/people/relationships";
import * as safeguardingChecks from "../src/schema/safeguarding/checks";
import * as safeguardingConcerns from "../src/schema/safeguarding/concerns";
import * as safeguardingNotes from "../src/schema/safeguarding/notes";
import * as incidentReports from "../src/schema/welfare/incident-reports";
import {
  addressInsertSchema,
  onboardingStepInsertSchema,
  allergyInsertSchema,
  consentInsertSchema,
  incidentReportInsertSchema,
  medicalRecordInsertSchema,
  safeguardingCheckInsertSchema,
  safeguardingConcernInsertSchema,
  safeguardingConcernUpdateSchema,
  safeguardingNoteInsertSchema,
  roleAssignmentInsertSchema,
  roleAssignmentUpdateSchema,
  personRelationshipInsertSchema,
  personRelationshipUpdateSchema,
  teamInsertSchema,
  teamMembershipInsertSchema,
  teamMembershipUpdateSchema,
  teamUpdateSchema,
  addressUpdateSchema,
  auditEventInsertSchema,
  seasonInsertSchema,
  seasonUpdateSchema,
  clubSettingsInsertSchema,
  clubSettingsUpdateSchema,
  opponentInsertSchema,
  opponentUpdateSchema,
  eventInsertSchema,
  eventSeriesInsertSchema,
  eventUpdateSchema,
  matchDetailInsertSchema,
  matchSquadInsertSchema,
  fileInsertSchema,
  fileUpdateSchema,
  personInsertSchema,
  personUpdateSchema,
  tableSchemas,
  venueInsertSchema,
  venueUpdateSchema,
} from "../src/validation";

const tablesIn = (module: Record<string, unknown>) =>
  Object.values(module).filter((value) => is(value, PgTable));

// Better Auth owns the authentication tables, so they have no schemas here.
// Every other table must have them.
const ownTables = [
  ...tablesIn(addresses),
  ...tablesIn(onboardingDrafts),
  ...tablesIn(onboardingSteps),
  ...tablesIn(auditEvents),
  ...tablesIn(consent),
  ...tablesIn(allergies),
  ...tablesIn(medicalRecords),
  ...tablesIn(safeguardingChecks),
  ...tablesIn(safeguardingConcerns),
  ...tablesIn(safeguardingNotes),
  ...tablesIn(incidentReports),
  ...tablesIn(roleAssignments),
  ...tablesIn(roleAssignmentTeams),
  ...tablesIn(eventAttendance),
  ...tablesIn(eventAvailability),
  ...tablesIn(eventSeries),
  ...tablesIn(events),
  ...tablesIn(matchDetails),
  ...tablesIn(matchSquad),
  ...tablesIn(announcements),
  ...tablesIn(consentDocuments),
  ...tablesIn(clubStripeAccounts),
  ...tablesIn(feeCharges),
  ...tablesIn(fees),
  ...tablesIn(notifications),
  ...tablesIn(payments),
  ...tablesIn(personIdentifiers),
  ...tablesIn(pitches),
  ...tablesIn(playerProfiles),
  ...tablesIn(qualifications),
  ...tablesIn(registrations),
  ...tablesIn(seasons),
  ...tablesIn(teams),
  ...tablesIn(teamMemberships),
  ...tablesIn(relationships),
  ...tablesIn(clubSettings),
  ...tablesIn(opponents),
  ...tablesIn(people),
  ...tablesIn(storage),
  ...tablesIn(venues),
];

describe("table validation schemas", () => {
  it("exist for every table we own, so none is added without validation", () => {
    const tableNames = new Set(ownTables.map((table) => getTableName(table)));

    expect(tableNames.size).toBeGreaterThan(0);
    expect(new Set(Object.keys(tableSchemas))).toStrictEqual(tableNames);
  });

  it("do not cover Better Auth's tables", () => {
    for (const table of tablesIn(authentication)) {
      expect(tableSchemas).not.toHaveProperty(getTableName(table));
    }
  });

  it("provide select, insert and update for each table", () => {
    for (const schemas of Object.values(tableSchemas)) {
      expect(schemas.select).toBeDefined();
      expect(schemas.insert).toBeDefined();
      expect(schemas.update).toBeDefined();
    }
  });
});

describe("address refinements", () => {
  const base = {
    city: "Manchester",
    countryCode: "GB",
    line1: "1 Training Ground Road",
    organizationId: crypto.randomUUID(),
  };

  it("accepts a minimal address, with optional fields left out", () => {
    expect(addressInsertSchema.safeParse(base).success).toBeTruthy();
  });

  it("requires a 2-letter upper-case country code", () => {
    expect(
      addressInsertSchema.safeParse({ ...base, countryCode: "gb" }).success
    ).toBeFalsy();
    expect(
      addressInsertSchema.safeParse({ ...base, countryCode: "GBR" }).success
    ).toBeFalsy();
  });

  it("rejects blank street and city", () => {
    expect(
      addressInsertSchema.safeParse({ ...base, line1: "  " }).success
    ).toBeFalsy();
    expect(
      addressInsertSchema.safeParse({ ...base, city: "" }).success
    ).toBeFalsy();
  });

  it("keeps coordinates on the globe", () => {
    expect(
      addressInsertSchema.safeParse({
        ...base,
        latitude: 53.4,
        longitude: -2.2,
      }).success
    ).toBeTruthy();
    expect(addressUpdateSchema.safeParse({ latitude: 91 }).success).toBeFalsy();
    expect(
      addressUpdateSchema.safeParse({ longitude: -181 }).success
    ).toBeFalsy();
  });
});

describe("audit event refinements", () => {
  const base = {
    action: "person.read",
    entityType: "person",
    organizationId: crypto.randomUUID(),
  };

  it("accepts an event, with system actions and optional fields left out", () => {
    expect(auditEventInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      auditEventInsertSchema.safeParse({
        ...base,
        actorUserId: crypto.randomUUID(),
        entityId: crypto.randomUUID(),
        metadata: { fields: ["dateOfBirth"] },
      }).success
    ).toBeTruthy();
  });

  it("requires the entity.verb action shape", () => {
    for (const action of ["read", "Person.Read", "person.read.now", ""]) {
      expect(
        auditEventInsertSchema.safeParse({ ...base, action }).success
      ).toBeFalsy();
    }
  });
});

describe("role assignment refinements", () => {
  const base = {
    organizationId: crypto.randomUUID(),
    role: "coach",
    scope: "teams",
    userId: crypto.randomUUID(),
  };

  it("accepts team-scoped coaches and organization-wide roles", () => {
    expect(roleAssignmentInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      roleAssignmentInsertSchema.safeParse({
        ...base,
        role: "safeguarding_lead",
        scope: "organization",
      }).success
    ).toBeTruthy();
  });

  it("makes scope explicit and limits team scope to coaches and managers", () => {
    const { scope: _scope, ...withoutScope } = base;

    expect(
      roleAssignmentInsertSchema.safeParse(withoutScope).success
    ).toBeFalsy();
    expect(
      roleAssignmentInsertSchema.safeParse({
        ...base,
        role: "welfare_officer",
      }).success
    ).toBeFalsy();
    expect(
      roleAssignmentInsertSchema.safeParse({ ...base, role: "referee" }).success
    ).toBeFalsy();
  });

  it("rejects a role that ends before it starts", () => {
    expect(
      roleAssignmentInsertSchema.safeParse({
        ...base,
        endsAt: new Date("2026-01-01"),
        startsAt: new Date("2026-02-01"),
      }).success
    ).toBeFalsy();
    expect(
      roleAssignmentUpdateSchema.safeParse({ endsAt: new Date() }).success
    ).toBeTruthy();
  });
});

describe("welfare refinements", () => {
  const organizationId = crypto.randomUUID();
  const personId = crypto.randomUUID();

  it("validates allergies: known severity, non-blank allergen", () => {
    const base = { allergen: "peanuts", organizationId, personId };

    expect(
      allergyInsertSchema.safeParse({ ...base, severity: "life_threatening" })
        .success
    ).toBeTruthy();
    expect(
      allergyInsertSchema.safeParse({ ...base, severity: "fatal" }).success
    ).toBeFalsy();
    expect(
      allergyInsertSchema.safeParse({
        ...base,
        allergen: " ",
        severity: "mild",
      }).success
    ).toBeFalsy();
  });

  it("validates medical records: known kind and date order", () => {
    const base = {
      kind: "condition",
      name: "Asthma",
      organizationId,
      personId,
    };

    expect(medicalRecordInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      medicalRecordInsertSchema.safeParse({ ...base, kind: "hobby" }).success
    ).toBeFalsy();
    expect(
      medicalRecordInsertSchema.safeParse({
        ...base,
        endedOn: "2020-01-01",
        startedOn: "2021-01-01",
      }).success
    ).toBeFalsy();
  });

  it("validates consents: known type, withdrawal and expiry in order", () => {
    const grantedAt = new Date("2026-08-01");
    const base = {
      grantedAt,
      organizationId,
      personId,
      type: "photo_video",
    };

    expect(consentInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      consentInsertSchema.safeParse({ ...base, type: "gossip" }).success
    ).toBeFalsy();
    expect(
      consentInsertSchema.safeParse({
        ...base,
        withdrawnAt: new Date("2026-07-01"),
      }).success
    ).toBeFalsy();
    expect(
      consentInsertSchema.safeParse({ ...base, expiresAt: grantedAt }).success
    ).toBeFalsy();
  });

  it("validates incident reports: known kind and severity, a description", () => {
    const base = {
      description: "Twisted ankle in a tackle",
      kind: "injury",
      occurredAt: new Date(),
      organizationId,
      personId,
      severity: "minor",
    };

    expect(incidentReportInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      incidentReportInsertSchema.safeParse({ ...base, severity: "dire" })
        .success
    ).toBeFalsy();
    expect(
      incidentReportInsertSchema.safeParse({ ...base, description: " " })
        .success
    ).toBeFalsy();
  });
});

describe("safeguarding refinements", () => {
  const organizationId = crypto.randomUUID();
  const personId = crypto.randomUUID();

  it("validates checks: known kind and status, expiry after issue", () => {
    const base = { kind: "dbs", organizationId, personId };

    expect(safeguardingCheckInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      safeguardingCheckInsertSchema.safeParse({ ...base, status: "expired" })
        .success
    ).toBeFalsy();
    expect(
      safeguardingCheckInsertSchema.safeParse({
        ...base,
        expiresOn: "2024-01-01",
        issuedOn: "2025-01-01",
      }).success
    ).toBeFalsy();
  });

  it("validates concerns: closed exactly when it has a closing time", () => {
    const base = {
      organizationId,
      severity: "medium",
      subjectPersonId: personId,
      summary: "Unexplained bruising noticed at training",
    };
    const closedAt = new Date();

    expect(
      safeguardingConcernInsertSchema.safeParse(base).success
    ).toBeTruthy();
    expect(
      safeguardingConcernInsertSchema.safeParse({ ...base, status: "closed" })
        .success
    ).toBeFalsy();
    expect(
      safeguardingConcernInsertSchema.safeParse({ ...base, closedAt }).success
    ).toBeFalsy();
    expect(
      safeguardingConcernInsertSchema.safeParse({
        ...base,
        closedAt,
        status: "closed",
      }).success
    ).toBeTruthy();
  });

  it("checks the closed rule on updates only when both fields are sent", () => {
    expect(
      safeguardingConcernUpdateSchema.safeParse({
        closedAt: null,
        status: "closed",
      }).success
    ).toBeFalsy();
    expect(
      safeguardingConcernUpdateSchema.safeParse({ status: "referred" }).success
    ).toBeTruthy();
  });

  it("requires a note to have text", () => {
    const base = { concernId: crypto.randomUUID(), organizationId };

    expect(
      safeguardingNoteInsertSchema.safeParse({ ...base, body: "Called LADO" })
        .success
    ).toBeTruthy();
    expect(
      safeguardingNoteInsertSchema.safeParse({ ...base, body: " " }).success
    ).toBeFalsy();
  });
});

describe("season refinements", () => {
  const base = {
    endsOn: "2027-06-30",
    name: "2026/27",
    organizationId: crypto.randomUUID(),
    startsOn: "2026-08-01",
  };

  it("accepts a season", () => {
    expect(seasonInsertSchema.safeParse(base).success).toBeTruthy();
  });

  it("rejects a season that ends before it starts, or bad dates", () => {
    expect(
      seasonInsertSchema.safeParse({ ...base, endsOn: "2026-07-31" }).success
    ).toBeFalsy();
    expect(
      seasonInsertSchema.safeParse({ ...base, startsOn: "1 Aug 2026" }).success
    ).toBeFalsy();
  });

  it("checks the order only when an update carries both dates", () => {
    expect(
      seasonUpdateSchema.safeParse({ endsOn: "2027-07-31" }).success
    ).toBeTruthy();
    expect(
      seasonUpdateSchema.safeParse({
        endsOn: "2026-01-01",
        startsOn: "2026-08-01",
      }).success
    ).toBeFalsy();
  });
});

describe("team refinements", () => {
  const base = {
    name: "U12 Boys",
    organizationId: crypto.randomUUID(),
    seasonId: crypto.randomUUID(),
  };

  it("accepts a team, with an open-age team having no age group", () => {
    expect(teamInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      teamInsertSchema.safeParse({ ...base, ageGroup: 12 }).success
    ).toBeTruthy();
  });

  it("keeps age group a whole number from 4 to 99, and names non-blank", () => {
    for (const ageGroup of [3, 100, 12.5]) {
      expect(
        teamInsertSchema.safeParse({ ...base, ageGroup }).success
      ).toBeFalsy();
    }
    expect(teamUpdateSchema.safeParse({ name: " " }).success).toBeFalsy();
  });
});

describe("team membership refinements", () => {
  const base = {
    organizationId: crypto.randomUUID(),
    personId: crypto.randomUUID(),
    role: "player",
    startsOn: "2026-08-01",
    teamId: crypto.randomUUID(),
  };

  it("accepts a player and an ended coach membership", () => {
    expect(
      teamMembershipInsertSchema.safeParse({ ...base, shirtNumber: 9 }).success
    ).toBeTruthy();
    expect(
      teamMembershipInsertSchema.safeParse({
        ...base,
        endsOn: "2027-05-31",
        role: "coach",
      }).success
    ).toBeTruthy();
  });

  it("restricts role, shirt number and date order", () => {
    expect(
      teamMembershipInsertSchema.safeParse({ ...base, role: "captain" }).success
    ).toBeFalsy();
    expect(
      teamMembershipInsertSchema.safeParse({ ...base, shirtNumber: 1000 })
        .success
    ).toBeFalsy();
    expect(
      teamMembershipInsertSchema.safeParse({ ...base, endsOn: "2026-07-31" })
        .success
    ).toBeFalsy();
    expect(
      teamMembershipUpdateSchema.safeParse({ endsOn: "2027-05-31" }).success
    ).toBeTruthy();
  });
});

describe("person relationship refinements", () => {
  const child = crypto.randomUUID();
  const adult = crypto.randomUUID();
  const base = {
    organizationId: crypto.randomUUID(),
    personId: child,
    relatedPersonId: adult,
    relationship: "parent",
  };

  it("accepts a link, with the permission flags defaulting off", () => {
    expect(personRelationshipInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      personRelationshipInsertSchema.safeParse({
        ...base,
        canCollect: true,
        hasParentalResponsibility: true,
        isEmergencyContact: true,
      }).success
    ).toBeTruthy();
  });

  it("rejects an unknown relationship and a person linked to themselves", () => {
    expect(
      personRelationshipInsertSchema.safeParse({
        ...base,
        relationship: "friend",
      }).success
    ).toBeFalsy();
    expect(
      personRelationshipInsertSchema.safeParse({
        ...base,
        relatedPersonId: child,
      }).success
    ).toBeFalsy();
    expect(
      personRelationshipUpdateSchema.safeParse({ canCollect: true }).success
    ).toBeTruthy();
  });
});

describe("club settings refinements", () => {
  const base = { organizationId: crypto.randomUUID() };

  it("accepts settings with only the organization, leaving the rest out", () => {
    expect(clubSettingsInsertSchema.safeParse(base).success).toBeTruthy();
  });

  it("accepts links to an address and a home venue", () => {
    expect(
      clubSettingsInsertSchema.safeParse({
        ...base,
        addressId: crypto.randomUUID(),
        homeVenueId: crypto.randomUUID(),
      }).success
    ).toBeTruthy();
  });

  it("rejects malformed contact details", () => {
    expect(
      clubSettingsInsertSchema.safeParse({ ...base, contactEmail: "nope" })
        .success
    ).toBeFalsy();
    expect(
      clubSettingsUpdateSchema.safeParse({ website: "not a url" }).success
    ).toBeFalsy();
  });
});

describe("opponent refinements", () => {
  const base = {
    name: "Riverside Rovers",
    organizationId: crypto.randomUUID(),
  };

  it("accepts an opponent with only a name, and one linked to an organization", () => {
    expect(opponentInsertSchema.safeParse(base).success).toBeTruthy();
    expect(
      opponentInsertSchema.safeParse({
        ...base,
        linkedOrganizationId: crypto.randomUUID(),
      }).success
    ).toBeTruthy();
  });

  it("rejects a blank name and malformed contact details", () => {
    expect(
      opponentInsertSchema.safeParse({ ...base, name: " " }).success
    ).toBeFalsy();
    expect(
      opponentUpdateSchema.safeParse({ contactEmail: "nope" }).success
    ).toBeFalsy();
  });
});

describe("person refinements", () => {
  const base = {
    firstName: "Sam",
    lastName: "Taylor",
    organizationId: crypto.randomUUID(),
  };

  it("accepts a person with only names, leaving optional fields out", () => {
    expect(personInsertSchema.safeParse(base).success).toBeTruthy();
  });

  it("accepts a real date of birth and rejects bad or future ones", () => {
    expect(
      personInsertSchema.safeParse({ ...base, dateOfBirth: "2015-04-09" })
        .success
    ).toBeTruthy();
    expect(
      personInsertSchema.safeParse({ ...base, dateOfBirth: "09/04/2015" })
        .success
    ).toBeFalsy();
    expect(
      personUpdateSchema.safeParse({ dateOfBirth: "2999-01-01" }).success
    ).toBeFalsy();
  });

  it("rejects blank names and a malformed email", () => {
    expect(
      personInsertSchema.safeParse({ ...base, firstName: " " }).success
    ).toBeFalsy();
    expect(
      personInsertSchema.safeParse({ ...base, email: "nope" }).success
    ).toBeFalsy();
  });
});

describe("venue refinements", () => {
  const base = {
    addressId: crypto.randomUUID(),
    kinds: ["training_ground"],
    name: "Top Pitch",
    organizationId: crypto.randomUUID(),
  };

  it("accepts one or several kinds, with optional fields left out", () => {
    for (const kinds of [
      ["classroom"],
      ["clubhouse"],
      ["training_ground", "match_venue"],
    ]) {
      expect(
        venueInsertSchema.safeParse({ ...base, kinds }).success
      ).toBeTruthy();
    }
  });

  it("needs at least one known, non-repeated kind, and a name", () => {
    expect(
      venueInsertSchema.safeParse({ ...base, kinds: ["stadium"] }).success
    ).toBeFalsy();
    expect(
      venueInsertSchema.safeParse({ ...base, kinds: [] }).success
    ).toBeFalsy();
    expect(
      venueInsertSchema.safeParse({
        ...base,
        kinds: ["clubhouse", "clubhouse"],
      }).success
    ).toBeFalsy();
    expect(
      venueInsertSchema.safeParse({ ...base, name: " " }).success
    ).toBeFalsy();
  });

  it("checks the what3words shape", () => {
    expect(
      venueInsertSchema.safeParse({ ...base, what3words: "filled.count.soap" })
        .success
    ).toBeTruthy();
    expect(
      venueInsertSchema.safeParse({
        ...base,
        what3words: "///filled.count.soap",
      }).success
    ).toBeFalsy();
    expect(
      venueUpdateSchema.safeParse({ what3words: "two.words" }).success
    ).toBeFalsy();
  });
});

describe("file refinements", () => {
  const base = {
    bucket: "uploads",
    contentType: "image/png",
    fileName: "photo.png",
    key: "org/photo.png",
    organizationId: crypto.randomUUID(),
    sizeBytes: 10,
  };

  it("accepts a valid file, with database defaults left out", () => {
    expect(
      fileInsertSchema.safeParse({ ...base, kind: "photo" }).success
    ).toBeTruthy();
  });

  it("restricts kind and status to known values", () => {
    expect(
      fileInsertSchema.safeParse({ ...base, kind: "video" }).success
    ).toBeFalsy();
    expect(
      fileInsertSchema.safeParse({ ...base, kind: "photo", status: "nope" })
        .success
    ).toBeFalsy();
  });

  it("rejects negative sizes on update", () => {
    expect(fileUpdateSchema.safeParse({ sizeBytes: -1 }).success).toBeFalsy();
  });
});

describe("event validation schemas", () => {
  const event = {
    endsAt: new Date("2026-09-05T11:00:00Z"),
    kind: "training",
    organizationId: "11111111-1111-4111-8111-111111111111",
    startsAt: new Date("2026-09-05T10:00:00Z"),
    title: "Saturday training",
  } as const;

  it("accepts an event and rejects one that ends before it starts", () => {
    expect(eventInsertSchema.safeParse(event).success).toBeTruthy();
    expect(
      eventInsertSchema.safeParse({ ...event, endsAt: event.startsAt }).success
    ).toBeFalsy();
  });

  it("rejects an unknown kind, a blank title and a late meeting time", () => {
    expect(
      eventInsertSchema.safeParse({ ...event, kind: "party" }).success
    ).toBeFalsy();
    expect(eventUpdateSchema.safeParse({ title: "  " }).success).toBeFalsy();
    expect(
      eventInsertSchema.safeParse({
        ...event,
        meetAt: new Date("2026-09-05T10:30:00Z"),
      }).success
    ).toBeFalsy();
  });

  it("requires a match score to be set together and non-negative", () => {
    const match = {
      eventId: "22222222-2222-4222-8222-222222222222",
      homeAway: "home",
      opponentId: "33333333-3333-4333-8333-333333333333",
      organizationId: event.organizationId,
    } as const;

    expect(matchDetailInsertSchema.safeParse(match).success).toBeTruthy();
    expect(
      matchDetailInsertSchema.safeParse({
        ...match,
        goalsAgainst: 1,
        goalsFor: 2,
      }).success
    ).toBeTruthy();
    expect(
      matchDetailInsertSchema.safeParse({ ...match, goalsFor: 2 }).success
    ).toBeFalsy();
    expect(
      matchDetailInsertSchema.safeParse({
        ...match,
        goalsAgainst: 0,
        goalsFor: -1,
      }).success
    ).toBeFalsy();
  });

  it("limits squad roles and minutes played", () => {
    const player = {
      eventId: "22222222-2222-4222-8222-222222222222",
      organizationId: event.organizationId,
      personId: "44444444-4444-4444-8444-444444444444",
      role: "starter",
    } as const;

    expect(matchSquadInsertSchema.safeParse(player).success).toBeTruthy();
    expect(
      matchSquadInsertSchema.safeParse({ ...player, role: "captain" }).success
    ).toBeFalsy();
    expect(
      matchSquadInsertSchema.safeParse({ ...player, minutesPlayed: 500 })
        .success
    ).toBeFalsy();
  });
});

describe("event series validation schema", () => {
  const series = {
    durationMinutes: 90,
    kind: "training",
    organizationId: "11111111-1111-4111-8111-111111111111",
    startTime: "18:00",
    startsOn: "2026-09-01",
    timeZone: "Europe/London",
    title: "U12 training",
    weekday: 2,
  } as const;

  it("accepts a weekly series", () => {
    expect(eventSeriesInsertSchema.safeParse(series).success).toBeTruthy();
  });

  it("rejects a bad weekday, time of day or time zone", () => {
    expect(
      eventSeriesInsertSchema.safeParse({ ...series, weekday: 0 }).success
    ).toBeFalsy();
    expect(
      eventSeriesInsertSchema.safeParse({ ...series, startTime: "25:00" })
        .success
    ).toBeFalsy();
    expect(
      eventSeriesInsertSchema.safeParse({ ...series, timeZone: "Mars/Base" })
        .success
    ).toBeFalsy();
  });

  it("rejects a series that ends before it starts", () => {
    expect(
      eventSeriesInsertSchema.safeParse({ ...series, endsOn: "2026-08-01" })
        .success
    ).toBeFalsy();
  });
});

describe("onboarding step refinements", () => {
  const ID = "11111111-1111-4111-8111-111111111111";

  it("accepts a user step for a user", () => {
    const result = onboardingStepInsertSchema.safeParse({
      step: "you",
      userId: ID,
    });

    expect(result.success).toBeTruthy();
  });

  it("accepts a club step for an organization", () => {
    const result = onboardingStepInsertSchema.safeParse({
      completedBy: ID,
      organizationId: ID,
      step: "payouts",
    });

    expect(result.success).toBeTruthy();
  });

  it("rejects a club step given to a user", () => {
    const result = onboardingStepInsertSchema.safeParse({
      step: "payouts",
      userId: ID,
    });

    expect(result.success).toBeFalsy();
  });

  it("rejects a step with both a user and an organization", () => {
    const result = onboardingStepInsertSchema.safeParse({
      organizationId: ID,
      step: "you",
      userId: ID,
    });

    expect(result.success).toBeFalsy();
  });

  it("rejects a step with no subject", () => {
    const result = onboardingStepInsertSchema.safeParse({ step: "you" });

    expect(result.success).toBeFalsy();
  });

  it("rejects a step name that is not in the list", () => {
    const result = onboardingStepInsertSchema.safeParse({
      step: "made-up",
      userId: ID,
    });

    expect(result.success).toBeFalsy();
  });
});
