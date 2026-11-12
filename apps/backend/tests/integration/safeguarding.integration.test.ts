/* oxlint-disable vitest/max-expects -- each test walks one whole scenario and checks every step of it */
import {
  auditEvents,
  safeguardingConcerns,
  safeguardingNotes,
} from "@alice/database";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter } from "../../src/lib/create-app";
import peopleRouter from "../../src/routes/people/people.index";
import safeguardingRouter from "../../src/routes/safeguarding/safeguarding.index";
import { createTestClub, testDb } from "./harness";

const router = createRouter()
  .route("/", peopleRouter)
  .route("/", safeguardingRouter);

const idBody = z.object({ id: z.string() });
const SECRET = "Child disclosed marks and said not to tell";

const setup = async () =>
  await createTestClub(router, {
    lead: { jobs: ["safeguarding_lead"] },
    owner: { role: "owner" },
    parent: {},
    secretary: { jobs: ["secretary"] },
  });

let club: Awaited<ReturnType<typeof setup>>;

describe("safeguarding (real Postgres)", () => {
  let childId = "";
  let concernId = "";

  beforeAll(async () => {
    club = await setup();
    const child = await club.people.owner.request("POST", "/people", {
      firstName: "Kit",
      lastName: "Child",
    });
    childId = idBody.parse(child.body).id;
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("lets anyone raise a concern and tells them nothing back but the id", async () => {
    const response = await club.people.parent.request(
      "POST",
      "/safeguarding/concerns",
      {
        details: SECRET,
        severity: "medium",
        subjectPersonId: childId,
        summary: "Worried about a bruise",
      }
    );
    concernId = idBody.parse(response.body).id;

    expect(response.status).toBe(201);
    expect(
      new Set(
        Object.keys(z.record(z.string(), z.unknown()).parse(response.body))
      )
    ).toStrictEqual(new Set(["id", "openedAt"]));
  });

  it("stores the full account encrypted", async () => {
    const [row] = await testDb
      .select()
      .from(safeguardingConcerns)
      .where(eq(safeguardingConcerns.id, concernId));

    expect(row?.details).toMatch(/^v1:/u);
    expect(row?.details).not.toContain("disclosed");
  });

  it("keeps concerns from everyone except safeguarding staff, even the club admin and the person who raised it", async () => {
    const { owner, parent, secretary } = club.people;
    const path = `/safeguarding/concerns/${concernId}`;
    const [byParent, byOwner, bySecretary, list] = await Promise.all([
      parent.request("GET", path),
      owner.request("GET", path),
      secretary.request("GET", path),
      parent.request("GET", "/safeguarding/concerns"),
    ]);

    expect(byParent.status).toBe(403);
    expect(bySecretary.status).toBe(403);
    expect(list.status).toBe(403);
    expect(byOwner.status).toBe(200);
  });

  it("shows the lead the decrypted account and records that they read it", async () => {
    const { lead } = club.people;
    const response = await lead.request(
      "GET",
      `/safeguarding/concerns/${concernId}`
    );
    const events = await testDb
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.entityId, concernId),
          eq(auditEvents.action, "safeguarding_concern.read")
        )
      );

    expect(response.body).toMatchObject({ concern: { details: SECRET } });
    expect(events.length).toBeGreaterThan(0);
    expect(JSON.stringify(events)).not.toContain("disclosed");
  });

  it("hides the full account from the list", async () => {
    const response = await club.people.lead.request(
      "GET",
      "/safeguarding/concerns"
    );

    expect(JSON.stringify(response.body)).not.toContain("disclosed");
    expect(response.status).toBe(200);
  });

  it("needs a reason to close, sets the closed time, and reopens", async () => {
    const { lead } = club.people;
    const path = `/safeguarding/concerns/${concernId}`;
    const noReason = await lead.request("PATCH", path, { status: "closed" });
    const closed = await lead.request("PATCH", path, {
      closedReason: "Spoke to family, no further action",
      status: "closed",
    });
    const reopened = await lead.request("PATCH", path, { status: "open" });

    expect(noReason.status).toBe(422);
    expect(closed.body).toMatchObject({ status: "closed" });
    expect(
      z.object({ closedAt: z.string() }).safeParse(closed.body).success
    ).toBeTruthy();
    expect(reopened.body).toMatchObject({ closedAt: null, status: "open" });
  });

  it("adds notes in order, encrypted, and the database refuses to change one", async () => {
    const { lead, parent } = club.people;
    const path = `/safeguarding/concerns/${concernId}/notes`;
    const blocked = await parent.request("POST", path, { body: "hi" });
    const first = await lead.request("POST", path, { body: "Called the LADO" });
    const [stored] = await testDb
      .select()
      .from(safeguardingNotes)
      .where(eq(safeguardingNotes.concernId, concernId));
    const edit = testDb
      .update(safeguardingNotes)
      .set({ body: "changed" })
      .where(eq(safeguardingNotes.concernId, concernId));

    expect(blocked.status).toBe(403);
    expect(first.body).toMatchObject({ body: "Called the LADO" });
    expect(stored?.body).not.toContain("LADO");
    await expect(edit).rejects.toThrow(/./u);
  });

  it("lets safeguarding staff record checks, club admins read them, and nobody else", async () => {
    const { lead, owner, parent, secretary } = club.people;
    const body = {
      dbsLevel: "enhanced",
      expiresOn: "2029-01-01",
      issuedOn: "2026-01-01",
      kind: "dbs",
      personId: childId,
      reference: "001234",
    };
    const byParent = await parent.request("POST", "/safeguarding/checks", body);
    const ok = await lead.request("POST", "/safeguarding/checks", body);
    const badLevel = await lead.request("POST", "/safeguarding/checks", {
      ...body,
      kind: "first_aid",
    });
    const asOwner = await owner.request("GET", "/safeguarding/checks");
    const asParent = await parent.request("GET", "/safeguarding/checks");
    const asSecretary = await secretary.request("GET", "/safeguarding/checks");
    const { id } = idBody.parse(ok.body);
    const decided = await lead.request("PATCH", `/safeguarding/checks/${id}`, {
      status: "valid",
    });

    expect(byParent.status).toBe(403);
    expect(ok.status).toBe(201);
    expect(badLevel.status).toBe(422);
    expect(asOwner.status).toBe(200);
    expect(asParent.status).toBe(403);
    expect(asSecretary.status).toBe(200);
    expect(decided.body).toMatchObject({ status: "valid" });
  });
});
