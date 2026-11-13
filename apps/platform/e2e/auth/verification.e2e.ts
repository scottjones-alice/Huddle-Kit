import { API_URL, PLATFORM_URL } from "../env";
import { expect, test } from "../fixtures/test";
import { gotoReady, signInThroughForm, signUpViaApi } from "../helpers/auth";
import { findUser } from "../helpers/database";
import { countEmails, extractLink, waitForEmail } from "../helpers/mailpit";

const VERIFY_SUBJECT = "Verify your email address";

test.describe("email verification", () => {
  test("the emailed link verifies the account and signs the person in @smoke", async ({
    context,
    newUser,
    page,
  }) => {
    await signUpViaApi(newUser);
    const email = await waitForEmail({
      subject: VERIFY_SUBJECT,
      to: newUser.email,
    });

    await page.goto(extractLink(email, /verify-email/u));

    await expect(page).not.toHaveURL(/verify-email|link-expired|login/u);
    const verified = await findUser(newUser.email);
    expect(verified?.emailVerified).toBe(true);
    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => cookie.name.endsWith("session_token"))
    ).toBe(true);
  });

  test("the link lands on the platform, not the API", async ({
    newUser,
    page,
  }) => {
    await signUpViaApi(newUser);
    const email = await waitForEmail({
      subject: VERIFY_SUBJECT,
      to: newUser.email,
    });
    await page.goto(extractLink(email, /verify-email/u));

    expect(new URL(page.url()).origin).toBe(new URL(PLATFORM_URL).origin);
  });

  test("signing in before verifying sends the person to verify and mails a fresh link @smoke", async ({
    newUser,
    page,
  }) => {
    await signUpViaApi(newUser);
    await waitForEmail({ subject: VERIFY_SUBJECT, to: newUser.email });
    const before = await countEmails(newUser.email, VERIFY_SUBJECT);

    await signInThroughForm(page, newUser);

    await expect(page).toHaveURL(/\/verify-email\?email=/u);
    await expect
      .poll(async () => await countEmails(newUser.email, VERIFY_SUBJECT))
      .toBeGreaterThan(before);
  });

  test("resend sends another email and starts a cooldown", async ({
    newUser,
    page,
  }) => {
    await signUpViaApi(newUser);
    await waitForEmail({ subject: VERIFY_SUBJECT, to: newUser.email });
    const before = await countEmails(newUser.email, VERIFY_SUBJECT);

    await gotoReady(
      page,
      `/verify-email?email=${encodeURIComponent(newUser.email)}`
    );
    await page
      .getByRole("button", { name: "Resend verification email" })
      .click();

    await expect(page.getByText("Verification email sent")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Resend available in \d+s/u })
    ).toBeDisabled();
    await expect
      .poll(async () => await countEmails(newUser.email, VERIFY_SUBJECT))
      .toBeGreaterThan(before);
  });

  test("an invalid token shows the link-expired page", async ({ page }) => {
    await page.goto(
      `${API_URL}/api/auth/verify-email?token=not-a-real-token&callbackURL=${encodeURIComponent(`${PLATFORM_URL}/`)}`
    );

    await expect(page).toHaveURL(/\/link-expired\?type=verify/u);
    await expect(
      page.getByRole("heading", { name: "Link expired" })
    ).toBeVisible();
  });

  test("a verified person can sign in with their password", async ({
    page,
    verifiedUser,
  }) => {
    await signInThroughForm(page, verifiedUser);

    await expect(page).not.toHaveURL(/\/login/u);
  });
});
