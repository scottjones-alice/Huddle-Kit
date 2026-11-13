import { randomUUID } from "node:crypto";

import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures/test";
import { signInViaApi } from "../helpers/auth";
import {
  findOrganizationBySlug,
  membershipRole,
  seedInvitation,
} from "../helpers/database";

const fillClubStep = async (page: Page, name: string, slug: string) => {
  await page.getByLabel("Club name").fill(name);
  await page.getByLabel("Club web address").fill(slug);
  await page.getByLabel("Type of club").selectOption("grassroots");
  await page.getByRole("textbox", { name: "County FA" }).fill("Test County FA");
  await page.getByText("Youth football").click();
  await page.getByRole("button", { name: "Continue" }).click();
};

test.describe("where a signed-in person goes", () => {
  test("someone with no club is sent to set one up @smoke", async ({
    page,
    verifiedUser,
  }) => {
    await signInViaApi(page, verifiedUser);

    await page.goto("/");

    await expect(page).toHaveURL(/\/onboarding-club/u);
    await expect(
      page.getByRole("heading", { name: "Tell us about your club" })
    ).toBeVisible();
  });

  test("someone with an invite waiting is sent to accept it @smoke", async ({
    club,
    page,
    verifiedUser,
  }) => {
    const invite = await seedInvitation(club, { email: verifiedUser.email });
    await signInViaApi(page, verifiedUser);

    await page.goto("/");

    await expect(page).toHaveURL(
      new RegExp(`/accept-invite/${invite.id}`, "u")
    );
  });
});

test.describe("club onboarding", () => {
  test("the first step creates the club and moves on @smoke", async ({
    page,
    verifiedUser,
  }) => {
    const slug = `e2e-new-${randomUUID().slice(0, 8)}`;
    await signInViaApi(page, verifiedUser);
    await page.goto("/onboarding-club");
    await expect(
      page.getByRole("heading", { name: "Tell us about your club" })
    ).toBeVisible();

    await fillClubStep(page, "New Town FC", slug);

    await expect(
      page.getByRole("heading", { name: "Where is your club based?" })
    ).toBeVisible();
    const created = await findOrganizationBySlug(slug);
    expect(created?.name).toBe("New Town FC");
    expect(await membershipRole(verifiedUser.email, created?.id ?? "")).toBe(
      "owner"
    );
  });

  test("a web address that is taken is refused", async ({
    club,
    page,
    verifiedUser,
  }) => {
    await signInViaApi(page, verifiedUser);
    await page.goto("/onboarding-club");

    await fillClubStep(page, "Copycat FC", club.slug);

    await expect(
      page.getByRole("alert").filter({ hasText: "already taken" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tell us about your club" })
    ).toBeVisible();
  });
});
