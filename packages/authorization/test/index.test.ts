import { describe, expect, it } from "vitest";

import {
  accessScope,
  assertCan,
  authorize,
  ForbiddenError,
  isRole,
  ROLE_PERMISSIONS,
} from "../src/index";
import type { AccessContext, AccessTarget } from "../src/index";

const ORG = "org-1";
const OTHER_ORG = "org-2";
const U10 = "team-u10";
const U12 = "team-u12";
const NOW = new Date("2026-11-12T12:00:00Z");

const makeContext = (
  overrides: Partial<AccessContext> = {}
): AccessContext => ({
  assignments: [],
  linkedChildren: [],
  memberRole: "member",
  organizationId: ORG,
  personId: null,
  player: null,
  userId: "user-1",
  ...overrides,
});

const target = (overrides: Partial<AccessTarget> = {}): AccessTarget => ({
  organizationId: ORG,
  ...overrides,
});

const coachOf = (teamIds: string[], role = "coach") =>
  makeContext({
    assignments: [{ role, scope: "teams", teamIds }],
  });

describe("organization and membership", () => {
  it("denies non-members everything", () => {
    const decision = authorize(
      makeContext({ memberRole: null }),
      "clubs",
      "read",
      target(),
      NOW
    );
    expect(decision).toStrictEqual({ allowed: false, reason: "not_a_member" });
  });

  it("denies records from another organization even for an owner", () => {
    const decision = authorize(
      makeContext({ memberRole: "owner" }),
      "clubs",
      "read",
      target({ organizationId: OTHER_ORG }),
      NOW
    );
    expect(decision).toStrictEqual({
      allowed: false,
      reason: "wrong_organization",
    });
  });

  it("reads comma-separated Better Auth roles", () => {
    const context = makeContext({ memberRole: "member,admin" });
    expect(
      authorize(context, "teams", "create", target(), NOW).allowed
    ).toBeTruthy();
  });

  it("treats an unknown member role as a plain member", () => {
    const context = makeContext({ memberRole: "superuser" });
    expect(
      authorize(context, "teams", "create", target(), NOW).allowed
    ).toBeFalsy();
    expect(
      authorize(context, "teams", "read", target(), NOW).allowed
    ).toBeTruthy();
  });
});

describe("team scoping", () => {
  it("lets a coach edit fixtures on their own team", () => {
    const decision = authorize(
      coachOf([U10]),
      "fixtures",
      "update",
      target({ teamIds: [U10] }),
      NOW
    );
    expect(decision).toStrictEqual({ allowed: true, role: "coach" });
  });

  it("denies the same coach on another team", () => {
    const decision = authorize(
      coachOf([U10]),
      "fixtures",
      "update",
      target({ teamIds: [U12] }),
      NOW
    );
    expect(decision).toStrictEqual({ allowed: false, reason: "out_of_scope" });
  });

  it("grants nothing for a team assignment with no teams", () => {
    const decision = authorize(
      coachOf([]),
      "fixtures",
      "update",
      target({ teamIds: [U10] }),
      NOW
    );
    expect(decision.allowed).toBeFalsy();
  });

  it("denies a team-scoped coach a record with no team", () => {
    expect(
      authorize(coachOf([U10]), "fixtures", "create", target(), NOW).allowed
    ).toBeFalsy();
  });

  it("ignores a club-wide-only role that was scoped to teams", () => {
    const context = makeContext({
      assignments: [{ role: "treasurer", scope: "teams", teamIds: [U10] }],
    });
    expect(
      authorize(context, "finance", "read", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeFalsy();
  });

  it("ignores roles that are not assignable", () => {
    const context = makeContext({
      assignments: [{ role: "owner", scope: "organization", teamIds: [] }],
    });
    expect(
      authorize(context, "clubs", "archive", target(), NOW).allowed
    ).toBeFalsy();
  });

  it("denies an action the role does not hold", () => {
    const decision = authorize(
      coachOf([U10]),
      "fixtures",
      "publish",
      target({ teamIds: [U10] }),
      NOW
    );
    expect(decision).toStrictEqual({ allowed: false, reason: "no_permission" });
  });
});

describe("assignment dates", () => {
  it("ignores an ended assignment", () => {
    const context = makeContext({
      assignments: [
        {
          endsAt: new Date("2026-10-01T00:00:00Z"),
          role: "coach",
          scope: "teams",
          teamIds: [U10],
        },
      ],
    });
    expect(
      authorize(context, "fixtures", "update", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeFalsy();
  });

  it("ignores an assignment that has not started", () => {
    const context = makeContext({
      assignments: [
        {
          role: "coach",
          scope: "teams",
          startsAt: new Date("2026-12-01T00:00:00Z"),
          teamIds: [U10],
        },
      ],
    });
    expect(
      authorize(context, "fixtures", "update", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeFalsy();
  });
});

describe("multiple roles", () => {
  const treasurerAndCoach = makeContext({
    assignments: [
      { role: "treasurer", scope: "organization", teamIds: [] },
      { role: "coach", scope: "teams", teamIds: [U10] },
    ],
  });

  it("combines club-wide and team roles, each within its reach", () => {
    expect(
      authorize(treasurerAndCoach, "finance", "export", target(), NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(
        treasurerAndCoach,
        "fixtures",
        "update",
        target({ teamIds: [U10] }),
        NOW
      ).allowed
    ).toBeTruthy();
    expect(
      authorize(
        treasurerAndCoach,
        "fixtures",
        "update",
        target({ teamIds: [U12] }),
        NOW
      ).allowed
    ).toBeFalsy();
  });

  it("does not hand the treasurer medical or safeguarding access", () => {
    const record = target({ subjectPersonId: "kid-1", teamIds: [U10] });
    expect(
      authorize(treasurerAndCoach, "medical", "read_full", record, NOW).allowed
    ).toBeFalsy();
    expect(
      authorize(treasurerAndCoach, "safeguarding", "manage", record, NOW)
        .allowed
    ).toBeFalsy();
  });
});

describe("sensitive records", () => {
  it("keeps owners and admins out of full medical and safeguarding cases", () => {
    for (const memberRole of ["owner", "admin"]) {
      const context = makeContext({ memberRole });
      const record = target({ subjectPersonId: "kid-1" });
      expect(
        authorize(context, "medical", "read_full", record, NOW).allowed
      ).toBeFalsy();
      expect(
        authorize(context, "safeguarding", "read_assigned", record, NOW).allowed
      ).toBeFalsy();
      expect(
        authorize(context, "safeguarding", "report", record, NOW).allowed
      ).toBeTruthy();
    }
  });

  it("gives the safeguarding lead every case but not their own", () => {
    const lead = makeContext({
      assignments: [
        { role: "safeguarding_lead", scope: "organization", teamIds: [] },
      ],
      personId: "lead-person",
    });
    expect(
      authorize(
        lead,
        "safeguarding",
        "manage",
        target({ subjectPersonId: "kid-1" }),
        NOW
      ).allowed
    ).toBeTruthy();
    expect(
      authorize(
        lead,
        "safeguarding",
        "manage",
        target({ subjectPersonId: "lead-person" }),
        NOW
      )
    ).toStrictEqual({ allowed: false, reason: "conflict_of_interest" });
  });

  it("lets a deputy read only the cases they are assigned to", () => {
    const deputy = makeContext({
      assignments: [
        { role: "safeguarding_deputy", scope: "organization", teamIds: [] },
      ],
    });
    expect(
      authorize(
        deputy,
        "safeguarding",
        "read_assigned",
        target({ assignedUserIds: ["user-1"] }),
        NOW
      ).allowed
    ).toBeTruthy();
    expect(
      authorize(
        deputy,
        "safeguarding",
        "read_assigned",
        target({ assignedUserIds: ["someone-else"] }),
        NOW
      )
    ).toStrictEqual({ allowed: false, reason: "not_assigned" });
    expect(
      authorize(deputy, "safeguarding", "close", target(), NOW).allowed
    ).toBeFalsy();
  });

  it("gives a first aider emergency medical details only", () => {
    const aider = coachOf([U10], "first_aider");
    const record = target({ subjectPersonId: "kid-1", teamIds: [U10] });
    expect(
      authorize(aider, "medical", "read_emergency", record, NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(aider, "medical", "read_full", record, NOW).allowed
    ).toBeFalsy();
  });
});

describe("locked records", () => {
  const record = target({ locked: true, teamIds: [U10] });

  it("stops a coach editing a locked fixture but not reading it", () => {
    expect(
      authorize(coachOf([U10]), "fixtures", "update", record, NOW)
    ).toStrictEqual({ allowed: false, reason: "locked" });
    expect(
      authorize(coachOf([U10]), "fixtures", "read", record, NOW).allowed
    ).toBeTruthy();
  });

  it("lets a club admin still correct it", () => {
    expect(
      authorize(
        makeContext({ memberRole: "admin" }),
        "fixtures",
        "update",
        record,
        NOW
      ).allowed
    ).toBeTruthy();
  });
});

describe("guardians", () => {
  const guardian = makeContext({
    linkedChildren: [
      { hasParentalResponsibility: true, personId: "kid-1", teamIds: [U10] },
      { hasParentalResponsibility: false, personId: "kid-2", teamIds: [U12] },
    ],
  });

  it("reaches the linked child's records", () => {
    expect(
      authorize(
        guardian,
        "medical",
        "read_full",
        target({ subjectPersonId: "kid-1" }),
        NOW
      ).allowed
    ).toBeTruthy();
  });

  it("denies unrelated children", () => {
    expect(
      authorize(
        guardian,
        "players",
        "read",
        target({ subjectPersonId: "kid-9", teamIds: [U10] }),
        NOW
      )
    ).toStrictEqual({ allowed: false, reason: "out_of_scope" });
  });

  it("shows the child's team fixtures but not the team's other kids", () => {
    expect(
      authorize(guardian, "fixtures", "read", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeTruthy();
    expect(
      authorize(guardian, "attendance", "read", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeFalsy();
  });

  it("needs parental responsibility to change medical details", () => {
    expect(
      authorize(
        guardian,
        "medical",
        "update",
        target({ subjectPersonId: "kid-2" }),
        NOW
      )
    ).toStrictEqual({
      allowed: false,
      reason: "needs_parental_responsibility",
    });
    expect(
      authorize(
        guardian,
        "players",
        "read",
        target({ subjectPersonId: "kid-2" }),
        NOW
      ).allowed
    ).toBeTruthy();
  });
});

describe("players", () => {
  const player = makeContext({
    personId: "me",
    player: { teamIds: [U10] },
  });

  it("reaches their own record but nobody else's", () => {
    expect(
      authorize(
        player,
        "players",
        "read",
        target({ subjectPersonId: "me", teamIds: [U10] }),
        NOW
      ).allowed
    ).toBeTruthy();
    expect(
      authorize(
        player,
        "players",
        "read",
        target({ subjectPersonId: "teammate", teamIds: [U10] }),
        NOW
      ).allowed
    ).toBeFalsy();
  });

  it("sees their own team squad only", () => {
    expect(
      authorize(player, "squads", "read", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeTruthy();
    expect(
      authorize(player, "squads", "read", target({ teamIds: [U12] }), NOW)
        .allowed
    ).toBeFalsy();
  });
});

describe(accessScope, () => {
  it("lists club-wide access", () => {
    expect(
      accessScope(makeContext({ memberRole: "admin" }), "players", "read", NOW)
    ).toStrictEqual({ organization: true, personIds: [], teamIds: [] });
  });

  it("lists a coach's teams, and merges several assignments", () => {
    const context = makeContext({
      assignments: [
        { role: "coach", scope: "teams", teamIds: [U12] },
        { role: "team_manager", scope: "teams", teamIds: [U10, U12] },
      ],
    });
    expect(accessScope(context, "fixtures", "update", NOW)).toStrictEqual({
      organization: false,
      personIds: [],
      teamIds: [U12, U10],
    });
  });

  it("lists a guardian's children, skipping ones they cannot change", () => {
    const context = makeContext({
      linkedChildren: [
        { hasParentalResponsibility: true, personId: "kid-1", teamIds: [] },
        { hasParentalResponsibility: false, personId: "kid-2", teamIds: [] },
      ],
    });
    expect(
      accessScope(context, "medical", "update", NOW).personIds
    ).toStrictEqual(["kid-1"]);
    expect(
      accessScope(context, "players", "read", NOW).personIds
    ).toStrictEqual(["kid-1", "kid-2"]);
  });
});

describe(assertCan, () => {
  it("returns the role that allowed it", () => {
    expect(
      assertCan(
        makeContext({ memberRole: "owner" }),
        "clubs",
        "archive",
        target(),
        NOW
      )
    ).toBe("owner");
  });

  it("throws a ForbiddenError with the reason", () => {
    expect(() =>
      assertCan(makeContext(), "finance", "read", target(), NOW)
    ).toThrow(ForbiddenError);
  });
});

describe("policy", () => {
  it("never lets member hold manage-style or destructive actions", () => {
    const { member } = ROLE_PERMISSIONS;
    expect(JSON.stringify(member)).not.toMatch(/delete|refund|manage|assign/u);
  });

  it("knows its roles", () => {
    expect(isRole("head_coach")).toBeTruthy();
    expect(isRole("wizard")).toBeFalsy();
  });
});

describe("consents, credentials, audit and venues", () => {
  const guardian = makeContext({
    linkedChildren: [
      { hasParentalResponsibility: true, personId: "kid-1", teamIds: [U10] },
      { hasParentalResponsibility: false, personId: "kid-2", teamIds: [U10] },
    ],
  });
  const assigned = (
    role: string,
    scope: "organization" | "teams" = "organization"
  ) => makeContext({ assignments: [{ role, scope, teamIds: [U10] }] });

  it("lets a guardian consent only for a child they hold responsibility for", () => {
    expect(
      authorize(
        guardian,
        "consents",
        "record",
        target({ subjectPersonId: "kid-1" }),
        NOW
      ).allowed
    ).toBeTruthy();
    expect(
      authorize(
        guardian,
        "consents",
        "record",
        target({ subjectPersonId: "kid-2" }),
        NOW
      )
    ).toStrictEqual({
      allowed: false,
      reason: "needs_parental_responsibility",
    });
    expect(
      authorize(
        guardian,
        "consents",
        "read",
        target({ subjectPersonId: "kid-2" }),
        NOW
      ).allowed
    ).toBeTruthy();
  });

  it("keeps staff credentials with the safeguarding lead, with read-only for others", () => {
    const lead = assigned("safeguarding_lead");
    const deputy = assigned("safeguarding_deputy");
    const welfare = assigned("welfare_officer");
    const treasurer = assigned("treasurer");

    expect(
      authorize(lead, "credentials", "verify", target(), NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(deputy, "credentials", "read", target(), NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(deputy, "credentials", "verify", target(), NOW).allowed
    ).toBeFalsy();
    expect(
      authorize(welfare, "credentials", "read", target(), NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(treasurer, "credentials", "read", target(), NOW).allowed
    ).toBeFalsy();
  });

  it("lets a team coach read consents for their team only, and never credentials", () => {
    const coach = coachOf([U10]);

    expect(
      authorize(coach, "consents", "read", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeTruthy();
    expect(
      authorize(coach, "consents", "read", target({ teamIds: [U12] }), NOW)
        .allowed
    ).toBeFalsy();
    expect(
      authorize(coach, "consents", "record", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeFalsy();
    expect(
      authorize(coach, "credentials", "read", target({ teamIds: [U10] }), NOW)
        .allowed
    ).toBeFalsy();
  });

  it("lets only owners and admins read the audit log", () => {
    const admin = makeContext({ memberRole: "admin" });

    expect(
      authorize(admin, "audit", "read", target(), NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(makeContext(), "audit", "read", target(), NOW).allowed
    ).toBeFalsy();
    expect(
      authorize(coachOf([U10]), "audit", "read", target(), NOW).allowed
    ).toBeFalsy();
  });

  it("lets every member look up venues but only the secretary and admins change them", () => {
    expect(
      authorize(makeContext(), "venues", "read", target(), NOW).allowed
    ).toBeTruthy();
    expect(
      authorize(makeContext(), "venues", "update", target(), NOW).allowed
    ).toBeFalsy();
    expect(
      authorize(assigned("secretary"), "venues", "update", target(), NOW)
        .allowed
    ).toBeTruthy();
  });
});
