import { events, people } from "@alice/database";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import eventsRouter from "../../src/routes/events/events.index";
import opponentsRouter from "../../src/routes/opponents/opponents.index";
import peopleRouter from "../../src/routes/people/people.index";
import roles from "../../src/routes/roles/roles.index";
import teamsRouter from "../../src/routes/teams/teams.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", eventsRouter)
  .route("/", opponentsRouter)
  .route("/", peopleRouter)
  .route("/", teamsRouter)
  .route("/", roles);

const idBody = z.object({ id: z.string() });
const createdBody = z.object({ created: z.number() });
const eventsBody = z.object({
  events: z.array(z.object({ status: z.string(), title: z.string() })),
});

const setup = async () =>
  await createTestClub(router, {
    coachA: {},
    owner: { role: "owner" },
    parent: {},
    stranger: {},
  });

let club: Awaited<ReturnType<typeof setup>>;

const at = (hour: number): string =>
  `2026-12-01T${String(hour).padStart(2, "0")}:00:00Z`;

describe("events (real Postgres)", () => {
  let childId = "";
  let strangersChildId = "";
  let teamAId = "";
  let teamBId = "";
  let opponentId = "";

  beforeAll(async () => {
    club = await setup();
    const { owner, parent, stranger, coachA } = club.people;
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
    await owner.request("POST", "/role-assignments", {
      role: "assistant_coach",
      scope: "teams",
      teamIds: [teamAId],
      userId: coachA.id,
    });
    const opponent = await owner.request("POST", "/opponents", {
      name: "Rivals FC",
    });
    opponentId = idBody.parse(opponent.body).id;
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("lets a coach add an event for their team but not another team or the whole club", async () => {
    const { coachA } = club.people;
    const base = { endsAt: at(19), kind: "training", startsAt: at(18) };
    const own = await coachA.request("POST", "/events", {
      ...base,
      teamId: teamAId,
      title: "Tuesday training",
    });
    const other = await coachA.request("POST", "/events", {
      ...base,
      teamId: teamBId,
      title: "Not mine",
    });
    const wide = await coachA.request("POST", "/events", {
      ...base,
      title: "Club social",
    });

    expect(own.status).toBe(201);
    expect(other.status).toBe(403);
    expect(wide.status).toBe(403);
  });

  it("rejects an event that ends before it starts", async () => {
    const response = await club.people.owner.request("POST", "/events", {
      endsAt: at(17),
      kind: "training",
      startsAt: at(18),
      teamId: teamAId,
      title: "Backwards",
    });

    expect(response.status).toBe(422);
  });

  it("saves a match with its opponent and later its score", async () => {
    const { coachA, parent } = club.people;
    const created = await coachA.request("POST", "/events", {
      endsAt: at(12),
      kind: "match",
      match: { homeAway: "home", opponentId },
      startsAt: at(10),
      teamId: teamAId,
      title: "U10 v Rivals",
    });
    const { id } = idBody.parse(created.body);
    const scored = await coachA.request("PATCH", `/events/${id}`, {
      match: { goalsAgainst: 1, goalsFor: 3 },
      status: "completed",
    });
    const seen = await parent.request("GET", `/events/${id}`);

    expect(created.status).toBe(201);
    expect(scored.status).toBe(200);
    expect(seen.body).toMatchObject({
      match: { goalsAgainst: 1, goalsFor: 3, homeAway: "home" },
      status: "completed",
    });
  });

  it("cancels an event with a reason and keeps the record", async () => {
    const { coachA, owner } = club.people;
    const created = await coachA.request("POST", "/events", {
      endsAt: at(15),
      kind: "training",
      startsAt: at(14),
      teamId: teamAId,
      title: "Rained off",
    });
    const { id } = idBody.parse(created.body);
    const noReason = await coachA.request("PATCH", `/events/${id}`, {
      status: "cancelled",
    });
    const ok = await coachA.request("PATCH", `/events/${id}`, {
      cancellationReason: "Waterlogged pitch",
      status: "cancelled",
    });
    const rows = await testDb.select().from(events).where(eq(events.id, id));
    const list = await owner.request("GET", "/events?status=cancelled");

    expect(noReason.status).toBe(422);
    expect(ok.status).toBe(200);
    expect(rows).toHaveLength(1);
    expect(eventsBody.parse(list.body).events.map((e) => e.title)).toContain(
      "Rained off"
    );
  });

  it("lets a parent answer for their child but not another family's, and a coach sees all answers", async () => {
    const { coachA, parent, stranger } = club.people;
    const created = await coachA.request("POST", "/events", {
      endsAt: at(20),
      kind: "training",
      startsAt: at(19),
      teamId: teamAId,
      title: "RSVP night",
    });
    const { id } = idBody.parse(created.body);
    const path = `/events/${id}/availability`;
    const ok = await parent.request("PUT", path, {
      personId: childId,
      status: "available",
    });
    const changed = await parent.request("PUT", path, {
      personId: childId,
      status: "unavailable",
    });
    const blocked = await parent.request("PUT", path, {
      personId: strangersChildId,
      status: "available",
    });
    await stranger.request("PUT", path, {
      personId: strangersChildId,
      status: "maybe",
    });
    const asCoach = await coachA.request("GET", path);
    const asParent = await parent.request("GET", path);

    expect(ok.status).toBe(200);
    expect(changed.status).toBe(200);
    expect(blocked.status).toBe(403);
    expect(asCoach.body).toMatchObject({
      availability: [{ status: "unavailable" }, { status: "maybe" }],
    });
    expect(
      z.object({ availability: z.array(z.unknown()) }).parse(asParent.body)
        .availability
    ).toHaveLength(1);
  });

  it("lets only the team's coach record attendance, and a second save changes the first", async () => {
    const { coachA, owner, parent } = club.people;
    const created = await coachA.request("POST", "/events", {
      endsAt: at(10),
      kind: "training",
      startsAt: at(9),
      teamId: teamAId,
      title: "Register",
    });
    const { id } = idBody.parse(created.body);
    const path = `/events/${id}/attendance`;
    const first = await coachA.request("PUT", path, {
      records: [{ personId: childId, status: "late" }],
    });
    const second = await coachA.request("PUT", path, {
      records: [{ personId: childId, status: "present" }],
    });
    const byParent = await parent.request("PUT", path, {
      records: [{ personId: childId, status: "present" }],
    });
    const seenByParent = await parent.request("GET", path);
    const seenByOwner = await owner.request("GET", path);

    expect(first.status).toBe(200);
    expect(second.body).toMatchObject({
      attendance: [{ personId: childId, status: "present" }],
    });
    expect(byParent.status).toBe(403);
    expect(seenByParent.status).toBe(403);
    expect(seenByOwner.status).toBe(200);
  });

  it("replaces the match squad each time it is sent", async () => {
    const { coachA } = club.people;
    const created = await coachA.request("POST", "/events", {
      endsAt: at(12),
      kind: "match",
      match: { homeAway: "away", opponentId },
      startsAt: at(10),
      teamId: teamAId,
      title: "Squad game",
    });
    const { id } = idBody.parse(created.body);
    const path = `/events/${id}/squad`;
    await coachA.request("PUT", path, {
      squad: [
        { personId: childId, role: "starter", shirtNumber: 7 },
        { personId: strangersChildId, role: "substitute" },
      ],
    });
    const again = await coachA.request("PUT", path, {
      squad: [{ personId: childId, role: "substitute" }],
    });
    const twice = await coachA.request("PUT", path, {
      squad: [
        { personId: childId, role: "starter" },
        { personId: childId, role: "substitute" },
      ],
    });

    expect(again.body).toMatchObject({
      squad: [{ personId: childId, role: "substitute" }],
    });
    expect(twice.status).toBe(409);
  });

  it("makes repeating events, stops the series, and keeps what was made", async () => {
    const { coachA, owner } = club.people;
    const created = await coachA.request("POST", "/event-series", {
      durationMinutes: 60,
      generateUntil: "2027-01-31",
      kind: "training",
      startTime: "18:00",
      startsOn: "2027-01-05",
      teamId: teamAId,
      timeZone: "Europe/London",
      title: "Tuesday training series",
      weekday: 2,
    });
    const body = z
      .object({ created: z.number(), series: idBody })
      .parse(created.body);
    const again = await coachA.request(
      "POST",
      `/event-series/${body.series.id}/generate`,
      { until: "2027-01-31" }
    );
    const stopped = await coachA.request(
      "PATCH",
      `/event-series/${body.series.id}`,
      { isActive: false }
    );
    const blocked = await coachA.request("POST", "/event-series", {
      durationMinutes: 60,
      kind: "training",
      startTime: "18:00",
      startsOn: "2027-01-05",
      teamId: teamBId,
      timeZone: "Europe/London",
      title: "Not my team",
      weekday: 2,
    });
    const list = await owner.request(
      "GET",
      `/events?teamId=${teamAId}&from=2027-01-01T00:00:00Z&to=2027-02-01T00:00:00Z`
    );

    expect(body.created).toBe(4);
    expect(createdBody.parse(again.body).created).toBe(0);
    expect(stopped.status).toBe(200);
    expect(blocked.status).toBe(403);
    expect(eventsBody.parse(list.body).events).toHaveLength(4);
  });
});
