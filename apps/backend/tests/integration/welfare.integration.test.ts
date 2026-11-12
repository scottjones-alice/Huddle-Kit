/* oxlint-disable vitest/max-expects -- each test walks one whole scenario and checks every step of it */
import { allergies, auditEvents, people } from "@alice/database";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import peopleRouter from "../../src/routes/people/people.index";
import roles from "../../src/routes/roles/roles.index";
import teamsRouter from "../../src/routes/teams/teams.index";
import welfareRouter from "../../src/routes/welfare/welfare.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", peopleRouter)
  .route("/", teamsRouter)
  .route("/", welfareRouter)
  .route("/", roles);

const idBody = z.object({ id: z.string() });
const listBody = z.object({ incidents: z.array(idBody) });

const setup = async () =>
  await createTestClub(router, {
    coachA: {},
    coachB: {},
    owner: { role: "owner" },
    parent: {},
    stranger: {},
  });

let club: Awaited<ReturnType<typeof setup>>;

describe("welfare (real Postgres)", () => {
  let childId = "";
  let teamAId = "";
  let allergyId = "";
  let incidentId = "";

  beforeAll(async () => {
    club = await setup();
    const { owner, parent, stranger, coachA, coachB } = club.people;
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
    const child = await owner.request("POST", "/people", {
      firstName: "Kit",
      lastName: "Parent",
    });
    childId = idBody.parse(child.body).id;
    await owner.request("POST", `/people/${childId}/relationships`, {
      hasParentalResponsibility: true,
      relatedPersonId: patId,
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
    const teamBId = idBody.parse(b.body).id;
    await owner.request("POST", `/teams/${teamAId}/members`, {
      personId: childId,
      role: "player",
    });
    await owner.request("POST", "/role-assignments", {
      role: "coach",
      scope: "teams",
      teamIds: [teamAId],
      userId: coachA.id,
    });
    await owner.request("POST", "/role-assignments", {
      role: "coach",
      scope: "teams",
      teamIds: [teamBId],
      userId: coachB.id,
    });
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("lets a parent add an allergy for their child but not a stranger or a coach", async () => {
    const { coachA, parent, stranger } = club.people;
    const body = {
      allergen: "Peanuts",
      severity: "life_threatening",
      treatment: "EpiPen in the red bag",
    };
    const path = `/people/${childId}/allergies`;
    const byStranger = await stranger.request("POST", path, body);
    const byCoach = await coachA.request("POST", path, body);
    const ok = await parent.request("POST", path, body);
    const twice = await parent.request("POST", path, body);
    allergyId = idBody.parse(ok.body).id;

    expect(byStranger.status).toBe(403);
    expect(byCoach.status).toBe(403);
    expect(ok.status).toBe(201);
    expect(twice.status).toBe(409);
  });

  it("shows health to the parent, the child's coach and the owner, and hides it from others", async () => {
    const { coachA, coachB, owner, parent, stranger } = club.people;
    const path = `/people/${childId}/health`;
    const [asParent, asCoach, asOwner, otherCoach, asStranger] =
      await Promise.all([
        parent.request("GET", path),
        coachA.request("GET", path),
        owner.request("GET", path),
        coachB.request("GET", path),
        stranger.request("GET", path),
      ]);

    expect(asParent.status).toBe(200);
    expect(asCoach.body).toMatchObject({
      allergies: [{ allergen: "Peanuts" }],
    });
    expect(asOwner.status).toBe(200);
    expect(otherCoach.status).toBe(404);
    expect(asStranger.status).toBe(404);
  });

  it("records who read the health information", async () => {
    const events = await testDb
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.entityId, childId),
          eq(auditEvents.action, "medical_record.read")
        )
      );

    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it("archives an allergy and keeps the record", async () => {
    const { parent } = club.people;
    const response = await parent.request("PATCH", `/allergies/${allergyId}`, {
      archived: true,
    });
    const rows = await testDb
      .select()
      .from(allergies)
      .where(eq(allergies.id, allergyId));

    expect(response.status).toBe(200);
    expect(rows[0]?.archivedAt).not.toBeNull();
  });

  it("ends a medical record by date instead of removing it", async () => {
    const { parent } = club.people;
    const made = await parent.request(
      "POST",
      `/people/${childId}/medical-records`,
      {
        kind: "condition",
        name: "Asthma",
        startedOn: "2020-01-01",
      }
    );
    const { id } = idBody.parse(made.body);
    const ended = await parent.request("PATCH", `/medical-records/${id}`, {
      endedOn: "2026-06-01",
    });
    const backwards = await parent.request("PATCH", `/medical-records/${id}`, {
      endedOn: "2019-01-01",
    });

    expect(made.status).toBe(201);
    expect(ended.body).toMatchObject({ endedOn: "2026-06-01" });
    expect(backwards.status).toBe(422);
  });

  it("lets the child's coach write an incident report, the parent read it, and others not", async () => {
    const { coachA, coachB, parent, stranger } = club.people;
    const body = {
      description: "Twisted ankle in a tackle",
      kind: "injury",
      occurredAt: "2026-11-10T18:30:00Z",
      personId: childId,
      severity: "moderate",
      teamId: teamAId,
    };
    const byParent = await parent.request("POST", "/incidents", body);
    const byOtherCoach = await coachB.request("POST", "/incidents", body);
    const ok = await coachA.request("POST", "/incidents", body);
    incidentId = idBody.parse(ok.body).id;
    const [seenByParent, seenByStranger] = await Promise.all([
      parent.request("GET", "/incidents"),
      stranger.request("GET", "/incidents"),
    ]);
    const direct = await stranger.request("GET", `/incidents/${incidentId}`);

    expect(byParent.status).toBe(403);
    expect(byOtherCoach.status).toBe(403);
    expect(ok.status).toBe(201);
    expect(listBody.parse(seenByParent.body).incidents).toHaveLength(1);
    expect(listBody.parse(seenByStranger.body).incidents).toHaveLength(0);
    expect(direct.status).toBe(404);
  });

  it("lets only the writer or an admin add to a report", async () => {
    const { coachA, owner, parent } = club.people;
    const path = `/incidents/${incidentId}`;
    const byParent = await parent.request("PATCH", path, {
      actionTaken: "nothing",
    });
    const byWriter = await coachA.request("PATCH", path, {
      actionTaken: "Ice and rest",
      parentsNotifiedAt: "2026-11-10T19:00:00Z",
    });
    const byOwner = await owner.request("PATCH", path, {
      followUpRequired: true,
    });

    expect(byParent.status).toBe(403);
    expect(byWriter.body).toMatchObject({ actionTaken: "Ice and rest" });
    expect(byOwner.body).toMatchObject({ followUpRequired: true });
  });

  it("keeps qualifications to the person and their admins", async () => {
    const { owner, stranger } = club.people;
    const made = await owner.request(
      "POST",
      `/people/${childId}/qualifications`,
      {
        expiresOn: "2025-01-01",
        issuedOn: "2026-01-01",
        kind: "coaching",
        title: "FA Level 1",
      }
    );
    const ok = await owner.request(
      "POST",
      `/people/${childId}/qualifications`,
      {
        kind: "coaching",
        title: "FA Level 1",
      }
    );
    const peek = await stranger.request(
      "GET",
      `/people/${childId}/qualifications`
    );

    expect(made.status).toBe(422);
    expect(ok.status).toBe(201);
    expect(peek.status).toBe(404);
  });
});
