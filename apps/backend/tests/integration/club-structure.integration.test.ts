import { seasons, teams } from "@alice/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import opponents from "../../src/routes/opponents/opponents.index";
import roles from "../../src/routes/roles/roles.index";
import venues from "../../src/routes/venues/venues.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", venues)
  .route("/", opponents)
  .route("/", roles);

const idBody = z.object({ id: z.string() });
const address = {
  city: "Leeds",
  countryCode: "GB",
  line1: "1 Pitch Lane",
  postalCode: "LS1 1AA",
};

let club: Awaited<ReturnType<typeof setup>>;
const setup = async () =>
  await createTestClub(router, {
    coach: { jobs: ["coach"] },
    owner: { role: "owner" },
    player: {},
  });

describe("venues, pitches, opponents and jobs (real Postgres)", () => {
  beforeAll(async () => {
    club = await setup();
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("lets the owner add a venue and a pitch, and anyone read them", async () => {
    const { owner, player } = club.people;
    const venue = await owner.request("POST", "/venues", {
      address,
      kinds: ["training_ground"],
      name: "Hall Park",
    });
    const venueId = idBody.parse(venue.body).id;
    const pitch = await owner.request("POST", "/pitches", {
      format: "7v7",
      name: "Pitch 1",
      surface: "grass",
      venueId,
    });
    const list = await player.request("GET", "/venues");

    expect(venue.status).toBe(201);
    expect(pitch.status).toBe(201);
    expect(list.body).toMatchObject({
      venues: [{ address: { city: "Leeds" }, name: "Hall Park" }],
    });
  });

  it("stops a player adding a venue", async () => {
    const response = await club.people.player.request("POST", "/venues", {
      address,
      kinds: ["clubhouse"],
      name: "Secret Hall",
    });

    expect(response.status).toBe(403);
  });

  it("refuses a second pitch with the same name", async () => {
    const { owner } = club.people;
    const listed = await owner.request("GET", "/venues");
    const [first] = z
      .object({ venues: z.array(idBody) })
      .parse(listed.body).venues;
    const response = await owner.request("POST", "/pitches", {
      format: "5v5",
      name: "Pitch 1",
      surface: "3g",
      venueId: first?.id,
    });

    expect(response.status).toBe(409);
  });

  it("archives a venue instead of deleting it, and hides it from the default list", async () => {
    const { owner } = club.people;
    const created = await owner.request("POST", "/venues", {
      address,
      kinds: ["classroom"],
      name: "Old Classroom",
    });
    const { id } = idBody.parse(created.body);
    await owner.request("PATCH", `/venues/${id}`, { isActive: false });
    const active = await owner.request("GET", "/venues");
    const all = await owner.request("GET", "/venues?includeArchived=true");

    expect(JSON.stringify(active.body)).not.toContain("Old Classroom");
    expect(JSON.stringify(all.body)).toContain("Old Classroom");
  });

  it("lets a coach add an opponent but not a player", async () => {
    const { coach, player } = club.people;
    const added = await coach.request("POST", "/opponents", {
      name: "Rovers FC",
    });
    const blocked = await player.request("POST", "/opponents", {
      name: "Nope FC",
    });
    const duplicate = await coach.request("POST", "/opponents", {
      name: "Rovers FC",
    });

    expect(added.status).toBe(201);
    expect(blocked.status).toBe(403);
    expect(duplicate.status).toBe(409);
  });

  it("lists logins and jobs for managers only", async () => {
    const { owner, player } = club.people;
    const ok = await owner.request("GET", "/members");
    const blocked = await player.request("GET", "/members");

    expect(ok.status).toBe(200);
    expect(JSON.stringify(ok.body)).toContain("coach");
    expect(blocked.status).toBe(403);
  });

  it("gives a job, refuses a duplicate, and ends it while keeping the record", async () => {
    const { owner, player } = club.people;
    const grant = await owner.request("POST", "/role-assignments", {
      role: "treasurer",
      scope: "organization",
      userId: player.id,
    });
    const again = await owner.request("POST", "/role-assignments", {
      role: "treasurer",
      scope: "organization",
      userId: player.id,
    });
    const jobId = idBody.parse(grant.body).id;
    const ended = await owner.request("POST", `/role-assignments/${jobId}/end`);
    const active = await owner.request("GET", "/role-assignments");
    const history = await owner.request(
      "GET",
      "/role-assignments?includeEnded=true"
    );

    expect(grant.status).toBe(201);
    expect(again.status).toBe(409);
    expect(ended.status).toBe(200);
    expect(JSON.stringify(active.body)).not.toContain(jobId);
    expect(JSON.stringify(history.body)).toContain(jobId);
  });

  it("limits a coaching job to named teams, and refuses a club-wide job for teams", async () => {
    const { owner, player } = club.people;
    const [season] = await testDb
      .insert(seasons)
      .values({
        endsOn: "2027-05-31",
        name: "2026/27",
        organizationId: club.organizationId,
        startsOn: "2026-08-01",
      })
      .returning();
    const [team] = await testDb
      .insert(teams)
      .values({
        name: "U10s",
        organizationId: club.organizationId,
        seasonId: season?.id ?? "",
      })
      .returning();
    const scoped = await owner.request("POST", "/role-assignments", {
      role: "assistant_coach",
      scope: "teams",
      teamIds: [team?.id],
      userId: player.id,
    });
    const wrong = await owner.request("POST", "/role-assignments", {
      role: "treasurer",
      scope: "teams",
      teamIds: [team?.id],
      userId: player.id,
    });
    const noTeams = await owner.request("POST", "/role-assignments", {
      role: "coach",
      scope: "teams",
      userId: player.id,
    });

    expect(scoped.status).toBe(201);
    expect(scoped.body).toMatchObject({ teamIds: [team?.id] });
    expect(wrong.status).toBe(422);
    expect(noTeams.status).toBe(422);
  });
});
