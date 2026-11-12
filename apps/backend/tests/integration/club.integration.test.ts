import { afterAll, beforeAll, describe, expect, it } from "vitest";

import router from "../../src/routes/club/club.index";
import { createTestClub } from "./harness";

let club: Awaited<ReturnType<typeof setup>>;

const setup = async () =>
  await createTestClub(router, {
    owner: { role: "owner" },
    player: {},
  });

describe("club routes (real Postgres)", () => {
  beforeAll(async () => {
    club = await setup();
  });

  afterAll(async () => {
    await club.cleanup();
  });

  it("refuses a caller who is not signed in", async () => {
    await expect(club.anonymous("GET", "/club")).resolves.toBe(401);
  });

  it("lets any member read the club", async () => {
    const response = await club.people.player.request("GET", "/club");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fees: null,
      organization: { id: club.organizationId },
      socialLinks: [],
    });
  });

  it("stops a plain member changing the club", async () => {
    const response = await club.people.player.request("PUT", "/club", {
      data: {
        absorbDirectDebitFee: false,
        frequency: "monthly",
        lateReminders: true,
        siblingDiscount: false,
        subscriptionMinor: 2500,
      },
      step: "fees",
    });

    expect(response.status).toBe(403);
  });

  it("lets the owner change a section and returns the updated club", async () => {
    const response = await club.people.owner.request("PUT", "/club", {
      data: {
        absorbDirectDebitFee: false,
        frequency: "monthly",
        lateReminders: true,
        siblingDiscount: true,
        subscriptionMinor: 2500,
      },
      step: "fees",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fees: { siblingDiscount: true, subscriptionMinor: 2500 },
    });
  });

  it("rejects fields that are not valid", async () => {
    const response = await club.people.owner.request("PUT", "/club", {
      data: { frequency: "weekly" },
      step: "fees",
    });

    expect(response.status).toBe(422);
  });
});
