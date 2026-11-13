import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures/test";
import {
  createVerifiedUser,
  gotoReady,
  signInViaApi,
  uniqueCredentials,
} from "../helpers/auth";
import {
  countMemberships,
  membershipRole,
  seedInvitation,
} from "../helpers/database";
import { extractLink, waitForEmail } from "../helpers/mailpit";

const VERIFY_SUBJECT = "Verify your email address";
const ONE_HOUR_MS = 60 * 60 * 1000;

test.describe("invitations", () => {
  test("a visitor with no session is guided to log in or sign up, keeping the invite", async ({
    club,
    page,
  }) => {
    const invite = await seedInvitation(club, { email: "someone@example.com" });
    await gotoReady(page, `/accept-invite/${invite.id}`);

    await expect(
      page.getByRole("heading", { name: "You've been invited" })
    ).toBeVisible();
    const next = encodeURIComponent(`/accept-invite/${invite.id}`);
    await expect(page.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      `/login?next=${next}`
    );
    await expect(
      page.getByRole("link", { name: "Create account" })
    ).toHaveAttribute("href", `/signup?next=${next}`);
  });

  test("an existing user accepts and becomes a member @smoke", async ({
    club,
    page,
  }) => {
    const user = await createVerifiedUser("invitee");
    const invite = await seedInvitation(club, {
      email: user.email,
      role: "member",
    });
    await signInViaApi(page, user);

    await gotoReady(page, `/accept-invite/${invite.id}`);
    await expect(
      page.getByRole("heading", { name: "Accept your invite" })
    ).toBeVisible();
    await expect(page.getByText(club.name)).toBeVisible();
    await page.getByRole("button", { name: "Accept invite" }).click();

    await expect(page.getByText("You've joined the club")).toBeVisible();
    await expect
      .poll(async () => await membershipRole(user.email, club.organizationId))
      .toBe("member");
  });

  test("a new user signs up from the invite, verifies, and lands back on it @smoke", async ({
    club,
    page,
  }) => {
    const user = uniqueCredentials("invited");
    const invite = await seedInvitation(club, { email: user.email });
    const invitePath = `/accept-invite/${invite.id}`;

    await gotoReady(page, `/signup?next=${encodeURIComponent(invitePath)}`);
    await page.getByLabel("Full Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByLabel("Confirm Password").fill(user.password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/verify-email/u);
    expect(page.url()).toContain(encodeURIComponent(invitePath));

    const email = await waitForEmail({
      subject: VERIFY_SUBJECT,
      to: user.email,
    });
    await page.goto(extractLink(email, /verify-email/u));

    await expect(page).toHaveURL(new RegExp(`${invitePath}$`, "u"));
    await expect(
      page.getByRole("heading", { name: "Accept your invite" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Accept invite" }).click();

    await expect(page.getByText("You've joined the club")).toBeVisible();
    await expect
      .poll(async () => await countMemberships(user.email, club.organizationId))
      .toBe(1);
  });

  test("the resend button on the verify page keeps the invite", async ({
    club,
    page,
  }) => {
    const user = uniqueCredentials("resend");
    const invite = await seedInvitation(club, { email: user.email });
    const invitePath = `/accept-invite/${invite.id}`;

    await gotoReady(page, `/signup?next=${encodeURIComponent(invitePath)}`);
    await page.getByLabel("Full Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByLabel("Confirm Password").fill(user.password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/verify-email/u);

    const link = page.getByRole("link", { name: "Sign in instead" });
    await expect(link).toHaveAttribute("href", /next=/u);
  });

  test("an invite for a different email is refused", async ({ club, page }) => {
    const user = await createVerifiedUser("wrong");
    const invite = await seedInvitation(club, {
      email: "someone-else@example.com",
    });
    await signInViaApi(page, user);

    await page.goto(`/accept-invite/${invite.id}`);

    await expect(
      page.getByRole("heading", { name: "Link expired" })
    ).toBeVisible();
    expect(await countMemberships(user.email, club.organizationId)).toBe(0);
  });

  test("declining leaves no membership", async ({ club, page }) => {
    const user = await createVerifiedUser("decline");
    const invite = await seedInvitation(club, { email: user.email });
    await signInViaApi(page, user);

    await gotoReady(page, `/accept-invite/${invite.id}`);
    await page.getByRole("button", { name: "Decline" }).click();

    await expect(page.getByText("Invite declined")).toBeVisible();
    expect(await countMemberships(user.email, club.organizationId)).toBe(0);
  });

  for (const status of ["canceled", "accepted", "rejected"] as const) {
    test(`a ${status} invite shows the expired page`, async ({
      club,
      page,
    }) => {
      const user = await createVerifiedUser(status);
      const invite = await seedInvitation(club, { email: user.email, status });
      await signInViaApi(page, user);

      await page.goto(`/accept-invite/${invite.id}`);

      await expect(
        page.getByRole("heading", { name: "Link expired" })
      ).toBeVisible();
    });
  }

  test("an expired invite shows the expired page", async ({ club, page }) => {
    const user = await createVerifiedUser("expired");
    const invite = await seedInvitation(club, {
      email: user.email,
      expiresAt: new Date(Date.now() - ONE_HOUR_MS),
    });
    await signInViaApi(page, user);

    await page.goto(`/accept-invite/${invite.id}`);

    await expect(
      page.getByRole("heading", { name: "Link expired" })
    ).toBeVisible();
    expect(await countMemberships(user.email, club.organizationId)).toBe(0);
  });

  test("an invite id that does not exist shows the expired page", async ({
    page,
  }) => {
    const user = await createVerifiedUser("missing");
    await signInViaApi(page, user);

    await page.goto(`/accept-invite/${randomUUID()}`);

    await expect(
      page.getByRole("heading", { name: "Link expired" })
    ).toBeVisible();
  });
});
