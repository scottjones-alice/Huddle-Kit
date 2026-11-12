import { people, teamMemberships } from "@alice/database";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import peopleRouter from "../../src/routes/people/people.index";
import roles from "../../src/routes/roles/roles.index";
import teamsRouter from "../../src/routes/teams/teams.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", peopleRouter)
  .route("/", teamsRouter)
  .route("/", roles);

const idBody = z.object({ id: z.string() });
const peopleBody = z.object({
  people: z.array(z.object({ firstName: z.string() })),
});

let club: Awaited<ReturnType<typeof setup>>;
const setup = async () =>
  await createTestClub(router, {
    coachA: {},
    owner: { role: "owner" },
    parent: {},
    stranger: {},
  });

const names = (body: unknown): string[] =>
  peopleBody.parse(body).people.map((person) => person.firstName);

describe("people and teams (real Postgres)", () => {
  let childId = "";
  let strangersChildId = "";
  let teamAId = "";
  let teamBId = "";

  beforeAll(async () => {
    club = await setup();
    const { owner, parent, stranger, coachA } = club.people;
    // The parent and the stranger each have their own person record, made by onboarding in real life.
    const own = await testDb
      .insert(people)
      .values([
        {
          firstName: "Pat",
          lastName: "Parent",
          organizationId: club.organizationId,
          userId: parent.id,
        },
        {
          firstName: "Sam",
          lastName: "Stranger",
          organizationId: club.organizationId,
          userId: stranger.id,
        },
      ])
      .returning();
    const patId = own.find((row) => row.firstName === "Pat")?.id ?? "";
    const samId = own.find((row) => row.firstName === "Sam")?.id ?? "";
    const child = await owner.request("POST", "/people", {
      dateOfBirth: "2016-04-02",
      firstName: "Kit",
      lastName: "Parent",
    });
    childId = idBody.parse(child.body).id;
    const other = await owner.request("POST", "/people", {
      firstName: "Sky",
      lastName: "Stranger",
    });
    strangersChildId = idBody.parse(other.body).id;
    await owner.request("POST", `/people/${childId}/relationships`, {
      hasParentalResponsibility: true,
      relatedPersonId: patId,
      relationship: "parent",
    });
    await owner.request("POST", `/people/${strangersChildId}/relationships`, {
      hasParentalResponsibility: true,
      relatedPersonId: samId,
      relationship: "parent",
    });
    const season = await owner.request("POST", "/seasons", {
      endsOn: "2027-05-31",
      isCurrent: true,
      name: "2026/27",
      startsOn: "2026-08-01",
    });
    const seasonId = idBody.parse(season.body).id;
    const a = await owner.request("POST", "/teams", {
      ageGroup: 10,
      name: "U10 Reds",
      seasonId,
    });
    const b = await owner.request("POST", "/teams", {
      ageGroup: 12,
      name: "U12 Blues",
      seasonId,
    });
    teamAId = idBody.parse(a.body).id;
    teamBId = idBody.parse(b.body).id;
    // coachA's coaching job covers team A only.
    await owner.request("POST", "/role-assignments", {
      role: "assistant_coach",
      scope: "teams",
      teamIds: [teamAId],
      userId: coachA.id,
    });
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("shows managers everyone, and parents only themselves and their children", async () => {
    const { owner, parent } = club.people;
    const all = await owner.request("GET", "/people");
    const mine = await parent.request("GET", "/people");

    expect(names(all.body)).toStrictEqual(
      expect.arrayContaining(["Pat", "Kit", "Sam", "Sky"])
    );
    expect(new Set(names(mine.body))).toStrictEqual(new Set(["Kit", "Pat"]));
  });

  it("hides another family's child, even with the id", async () => {
    const response = await club.people.parent.request(
      "GET",
      `/people/${strangersChildId}`
    );

    expect(response.status).toBe(404);
  });

  it("lets a parent edit their own child but not someone else's, and not archive", async () => {
    const { parent } = club.people;
    const ok = await parent.request("PATCH", `/people/${childId}`, {
      phone: "07000 000000",
    });
    const blocked = await parent.request(
      "PATCH",
      `/people/${strangersChildId}`,
      { phone: "07999 999999" }
    );
    const archive = await parent.request("PATCH", `/people/${childId}`, {
      isActive: false,
    });

    expect(ok.status).toBe(200);
    expect(blocked.status).toBe(403);
    expect(archive.status).toBe(403);
  });

  it("archives a person for a manager and hides them from the default list", async () => {
    const { owner } = club.people;
    const created = await owner.request("POST", "/people", {
      firstName: "Gone",
      lastName: "Player",
    });
    const { id } = idBody.parse(created.body);
    await owner.request("PATCH", `/people/${id}`, { isActive: false });
    const rows = await testDb.select().from(people).where(eq(people.id, id));
    const active = await owner.request("GET", "/people");
    const all = await owner.request("GET", "/people?includeArchived=true");

    expect(rows).toHaveLength(1);
    expect(names(active.body)).not.toContain("Gone");
    expect(names(all.body)).toContain("Gone");
  });

  it("lets a coach add players to their own team but not another", async () => {
    const { coachA } = club.people;
    const own = await coachA.request("POST", `/teams/${teamAId}/members`, {
      personId: childId,
      role: "player",
    });
    const other = await coachA.request("POST", `/teams/${teamBId}/members`, {
      personId: childId,
      role: "player",
    });

    expect(own.status).toBe(201);
    expect(other.status).toBe(403);
  });

  it("shows the roster to the coach and the player's parent, not a stranger", async () => {
    const { coachA, parent, stranger } = club.people;

    const path = `/teams/${teamAId}/members`;
    const [asCoach, asParent, asStranger] = await Promise.all([
      coachA.request("GET", path),
      parent.request("GET", path),
      stranger.request("GET", path),
    ]);

    expect(asCoach.status).toBe(200);
    expect(asParent.status).toBe(200);
    expect(asStranger.status).toBe(404);
  });

  it("lets a coach see the people on their team but not the rest of the club", async () => {
    const { coachA } = club.people;
    const visible = await coachA.request("GET", "/people");

    expect(names(visible.body)).toStrictEqual(["Kit"]);
  });

  it("takes someone off a team, keeping the record", async () => {
    const { coachA, owner } = club.people;
    const roster = await coachA.request("GET", `/teams/${teamAId}/members`);
    const membershipId = z
      .object({ members: z.array(z.object({ id: z.string() })) })
      .parse(roster.body).members[0]?.id;
    const ended = await coachA.request(
      "POST",
      `/team-memberships/${membershipId}/end`
    );
    const after = await owner.request("GET", `/teams/${teamAId}/members`);
    const rows = await testDb
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.id, membershipId ?? ""));

    expect(ended.status).toBe(200);
    expect(after.body).toMatchObject({ members: [] });
    expect(rows).toHaveLength(1);
  });

  it("keeps only one current season", async () => {
    const { owner } = club.people;
    await owner.request("POST", "/seasons", {
      endsOn: "2028-05-31",
      isCurrent: true,
      name: "2027/28",
      startsOn: "2027-08-01",
    });
    const list = await owner.request("GET", "/seasons");
    const current = z
      .object({ seasons: z.array(z.object({ isCurrent: z.boolean() })) })
      .parse(list.body)
      .seasons.filter((season) => season.isCurrent);

    expect(current).toHaveLength(1);
  });
});
