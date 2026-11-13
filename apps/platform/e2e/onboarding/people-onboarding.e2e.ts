import { expect, test } from "../fixtures/test";
import { createVerifiedUser, gotoReady, signInViaApi } from "../helpers/auth";
import { joiningRole, seedInvitation } from "../helpers/database";

test.describe("people onboarding", () => {
  test("accepting an invite leads to the people steps, and each step saves @smoke", async ({
    club,
    page,
  }) => {
    // The first visit to each page compiles it, which is slow in dev mode.
    test.setTimeout(120_000);
    const user = await createVerifiedUser("joiner");
    const invite = await seedInvitation(club, { email: user.email });
    await signInViaApi(page, user);

    await gotoReady(page, `/accept-invite/${invite.id}`);
    await page.getByRole("button", { name: "Accept invite" }).click();
    await expect(page).toHaveURL(/\/onboarding-people/u);

    await expect(
      page.getByRole("heading", { name: "How are you joining?" })
    ).toBeVisible();
    await page.locator("label", { hasText: "Adult players" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", { name: "Tell us about you" })
    ).toBeVisible();
    expect(await joiningRole(club.organizationId)).toBe("player");

    await page.getByLabel("First name").fill("Sam");
    await page.getByLabel("Last name").fill("Player");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", { name: "Where do you live?" })
    ).toBeVisible();
  });
});
