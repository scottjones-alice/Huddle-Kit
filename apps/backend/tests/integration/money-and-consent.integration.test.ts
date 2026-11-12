import { feeCharges, payments, people } from "@alice/database";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import consentsRouter from "../../src/routes/consents/consents.index";
import feesRouter from "../../src/routes/fees/fees.index";
import peopleRouter from "../../src/routes/people/people.index";
import registrationsRouter from "../../src/routes/registrations/registrations.index";
import roles from "../../src/routes/roles/roles.index";
import teamsRouter from "../../src/routes/teams/teams.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", consentsRouter)
  .route("/", feesRouter)
  .route("/", peopleRouter)
  .route("/", registrationsRouter)
  .route("/", teamsRouter)
  .route("/", roles);

const idBody = z.object({ id: z.string() });
const chargesBody = z.object({
  charges: z.array(
    z.object({
      charge: z.object({ id: z.string(), status: z.string() }),
      paidMinor: z.number(),
    })
  ),
});

const setup = async () =>
  await createTestClub(router, {
    owner: { role: "owner" },
    parent: {},
    stranger: {},
    treasurer: { jobs: ["treasurer"] },
  });

let club: Awaited<ReturnType<typeof setup>>;

describe("fees, registrations and consents (real Postgres)", () => {
  let childId = "";
  let strangersChildId = "";
  let patId = "";
  let seasonId = "";
  let teamId = "";
  let feeId = "";

  beforeAll(async () => {
    club = await setup();
    const { owner, parent, stranger } = club.people;
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
    patId = own.find((row) => row.firstName === "Pat")?.id ?? "";
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
    seasonId = idBody.parse(season.body).id;
    const team = await owner.request("POST", "/teams", {
      ageGroup: 10,
      name: "U10 Reds",
      seasonId,
    });
    teamId = idBody.parse(team.body).id;
    await owner.request("POST", `/teams/${teamId}/members`, {
      personId: childId,
      role: "player",
    });
    await owner.request("POST", `/teams/${teamId}/members`, {
      personId: strangersChildId,
      role: "player",
    });
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("lets the treasurer but not a parent create fees", async () => {
    const { parent, treasurer } = club.people;
    const body = {
      amountMinor: 2500,
      name: "Subs",
      seasonId,
      teamId,
    };
    const blocked = await parent.request("POST", "/fees", body);
    const ok = await treasurer.request("POST", "/fees", body);
    feeId = idBody.parse(ok.body).id;

    expect(blocked.status).toBe(403);
    expect(ok.status).toBe(201);
  });

  it("rejects a negative amount", async () => {
    const response = await club.people.treasurer.request("POST", "/fees", {
      amountMinor: -5,
      name: "Bad",
      seasonId,
    });

    expect(response.status).toBe(422);
  });

  it("charges every player on the team once, and skips repeats", async () => {
    const { treasurer } = club.people;
    const path = `/fees/${feeId}/charges`;
    const first = await treasurer.request("POST", path, {});
    const again = await treasurer.request("POST", path, {});

    expect(first.body).toStrictEqual({ created: 2 });
    expect(again.body).toStrictEqual({ created: 0 });
  });

  it("shows a parent only their own child's charge", async () => {
    const { parent, treasurer } = club.people;
    const mine = chargesBody.parse(
      (await parent.request("GET", "/charges")).body
    );
    const all = chargesBody.parse(
      (await treasurer.request("GET", "/charges")).body
    );

    expect(mine.charges).toHaveLength(1);
    expect(all.charges).toHaveLength(2);
  });

  it("keeps an old charge's amount when the fee changes", async () => {
    const { treasurer } = club.people;
    await treasurer.request("PATCH", `/fees/${feeId}`, { amountMinor: 9900 });
    const rows = await testDb
      .select()
      .from(feeCharges)
      .where(eq(feeCharges.feeId, feeId));

    expect(rows.map((row) => row.amountMinor)).toStrictEqual([2500, 2500]);
  });

  it("marks a charge paid when payments cover it and refuses overpaying", async () => {
    const { parent, treasurer } = club.people;
    const listed = chargesBody.parse(
      (await parent.request("GET", "/charges")).body
    );
    const chargeId = listed.charges[0]?.charge.id ?? "";
    const path = `/charges/${chargeId}/payments`;
    const byParent = await parent.request("POST", path, {
      amountMinor: 1000,
      method: "cash",
    });
    const part = await treasurer.request("POST", path, {
      amountMinor: 1000,
      method: "cash",
    });
    const tooMuch = await treasurer.request("POST", path, {
      amountMinor: 2000,
      method: "bank_transfer",
    });
    const rest = await treasurer.request("POST", path, {
      amountMinor: 1500,
      method: "bank_transfer",
      reference: "BACS-1",
    });
    const after = chargesBody.parse(
      (await parent.request("GET", "/charges")).body
    );
    const rows = await testDb
      .select()
      .from(payments)
      .where(eq(payments.chargeId, chargeId));
    const closed = await treasurer.request(
      "POST",
      `/charges/${chargeId}/close`,
      {
        reason: "late",
        status: "waived",
      }
    );

    expect(byParent.status).toBe(403);
    expect(part.status).toBe(201);
    expect(tooMuch.status).toBe(422);
    expect(rest.status).toBe(201);
    expect(after.charges[0]).toMatchObject({
      charge: { status: "paid" },
      paidMinor: 2500,
    });
    expect(rows).toHaveLength(2);
    expect(closed.status).toBe(409);
  });

  it("waives a charge only with a reason and keeps it on record", async () => {
    const { treasurer } = club.people;
    const all = chargesBody.parse(
      (await treasurer.request("GET", "/charges?status=due")).body
    );
    const chargeId = all.charges[0]?.charge.id ?? "";
    const noReason = await treasurer.request(
      "POST",
      `/charges/${chargeId}/close`,
      {
        status: "waived",
      }
    );
    const ok = await treasurer.request("POST", `/charges/${chargeId}/close`, {
      reason: "Hardship",
      status: "waived",
    });
    const rows = await testDb
      .select()
      .from(feeCharges)
      .where(eq(feeCharges.id, chargeId));

    expect(noReason.status).toBe(422);
    expect(ok.status).toBe(200);
    expect(rows[0]?.status).toBe("waived");
  });

  it("registers a child as pending, once per season, and lets the parent withdraw", async () => {
    const { owner, parent } = club.people;
    const made = await parent.request("POST", "/registrations", {
      personId: childId,
      seasonId,
    });
    const twice = await parent.request("POST", "/registrations", {
      personId: childId,
      seasonId,
    });
    const forOther = await parent.request("POST", "/registrations", {
      personId: strangersChildId,
      seasonId,
    });
    const placing = await parent.request("POST", "/registrations", {
      personId: patId,
      seasonId,
      teamId,
    });
    const { id } = idBody.parse(made.body);
    const accept = await parent.request("PATCH", `/registrations/${id}`, {
      status: "active",
    });
    const accepted = await owner.request("PATCH", `/registrations/${id}`, {
      status: "active",
      teamId,
    });
    const withdrawn = await parent.request("PATCH", `/registrations/${id}`, {
      status: "withdrawn",
    });

    expect(made.body).toMatchObject({ status: "pending" });
    expect(twice.status).toBe(409);
    expect(forOther.status).toBe(403);
    expect(placing.status).toBe(403);
    expect(accept.status).toBe(403);
    expect(accepted.status).toBe(200);
    expect(withdrawn.body).toMatchObject({ status: "withdrawn" });
  });

  it("versions consent forms and records who agreed for a child", async () => {
    const { owner, parent, stranger } = club.people;
    const body = {
      body: "We may take photos at matches.",
      title: "Photos",
      type: "photo_video",
    };
    const blocked = await parent.request("POST", "/consent-forms", body);
    const v1 = await owner.request("POST", "/consent-forms", body);
    const v2 = await owner.request("POST", "/consent-forms", body);
    const given = await parent.request("POST", `/people/${childId}/consents`, {
      documentId: idBody.parse(v2.body).id,
      type: "photo_video",
    });
    const twice = await parent.request("POST", `/people/${childId}/consents`, {
      type: "photo_video",
    });
    const forOther = await parent.request(
      "POST",
      `/people/${strangersChildId}/consents`,
      { type: "photo_video" }
    );
    const peek = await stranger.request("GET", `/people/${childId}/consents`);

    expect(blocked.status).toBe(403);
    expect(v1.body).toMatchObject({ version: 1 });
    expect(v2.body).toMatchObject({ version: 2 });
    expect(given.body).toMatchObject({
      grantedByPersonId: patId,
      personId: childId,
    });
    expect(twice.status).toBe(409);
    expect(forOther.status).toBe(403);
    expect(peek.status).toBe(404);
  });

  it("withdraws consent but keeps the record, and then allows a new grant", async () => {
    const { parent } = club.people;
    const listed = z
      .object({ consents: z.array(idBody) })
      .parse((await parent.request("GET", `/people/${childId}/consents`)).body);
    const consentId = listed.consents[0]?.id ?? "";
    const out = await parent.request(
      "POST",
      `/consents/${consentId}/withdraw`,
      {}
    );
    const again = await parent.request(
      "POST",
      `/consents/${consentId}/withdraw`,
      {}
    );
    const renewed = await parent.request(
      "POST",
      `/people/${childId}/consents`,
      {
        type: "photo_video",
      }
    );
    const history = z
      .object({ consents: z.array(z.unknown()) })
      .parse((await parent.request("GET", `/people/${childId}/consents`)).body);

    expect(out.status).toBe(200);
    expect(again.status).toBe(409);
    expect(renewed.status).toBe(201);
    expect(history.consents).toHaveLength(2);
  });
});
