import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures/test";
import { gotoReady, signInThroughForm, formAlert } from "../helpers/auth";
import { countEmails, extractLink, waitForEmail } from "../helpers/mailpit";

const RESET_SUBJECT = "Reset your password";
const NEW_PASSWORD = "a-brand-new-password-42";

const requestReset = async (page: Page, email: string) => {
  await gotoReady(page, "/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
};

const fillReset = async (page: Page, password: string, confirm = password) => {
  await page.getByLabel("New password").fill(password);
  await page.getByLabel("Confirm password").fill(confirm);
  await page.getByRole("button", { name: "Reset password" }).click();
};

test.describe("password reset", () => {
  test("a person can reset their password and sign in with the new one @smoke", async ({
    page,
    verifiedUser,
  }) => {
    await requestReset(page, verifiedUser.email);
    await expect(page).toHaveURL(/\/check-email/u);

    const email = await waitForEmail({
      subject: RESET_SUBJECT,
      to: verifiedUser.email,
    });
    await page.goto(extractLink(email, /reset-password/u));
    await expect(page).toHaveURL(/\/reset-password\?token=/u);
    await page.locator("html[data-hydrated]").waitFor();

    await fillReset(page, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/login/u);
    await expect(page.getByText("Password updated")).toBeVisible();

    // The old password no longer works, the new one does.
    await signInThroughForm(page, verifiedUser);
    await expect(formAlert(page)).toContainText(
      "That email and password don't match"
    );
    await page.getByLabel("Password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).not.toHaveURL(/\/login/u);
  });

  test("an unknown email looks the same and sends nothing", async ({
    newUser,
    page,
  }) => {
    await requestReset(page, newUser.email);

    await expect(page).toHaveURL(/\/check-email/u);
    await page.waitForTimeout(1500);
    expect(await countEmails(newUser.email, RESET_SUBJECT)).toBe(0);
  });

  test("an invalid email is caught before anything is sent", async ({
    page,
  }) => {
    await requestReset(page, "not-an-email");

    await expect(page.getByText(/Enter a valid email address/u)).toBeVisible();
    await expect(page).toHaveURL(/\/forgot-password/u);
  });

  test("a reset link works once", async ({ page, verifiedUser }) => {
    await requestReset(page, verifiedUser.email);
    const email = await waitForEmail({
      subject: RESET_SUBJECT,
      to: verifiedUser.email,
    });
    const link = extractLink(email, /reset-password/u);

    await page.goto(link);
    await page.locator("html[data-hydrated]").waitFor();
    await fillReset(page, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/login/u);

    // A used link comes back with an error, so the page shows link-expired instead of the form.
    await page.goto(link);
    await expect(
      page.getByRole("heading", { name: "Link expired" })
    ).toBeVisible();
  });

  test("a made-up token shows the link-expired page", async ({ page }) => {
    await gotoReady(page, "/reset-password?token=not-a-real-token");
    await fillReset(page, NEW_PASSWORD);

    await expect(page).toHaveURL(/\/link-expired\?type=reset/u);
    await expect(
      page.getByRole("heading", { name: "Link expired" })
    ).toBeVisible();
  });

  test("the new password must meet the rules", async ({
    page,
    verifiedUser,
  }) => {
    await requestReset(page, verifiedUser.email);
    const email = await waitForEmail({
      subject: RESET_SUBJECT,
      to: verifiedUser.email,
    });
    await page.goto(extractLink(email, /reset-password/u));
    await page.locator("html[data-hydrated]").waitFor();

    await fillReset(page, "short");
    await expect(page.getByText(/Use at least 12 characters/u)).toBeVisible();

    await fillReset(page, NEW_PASSWORD, "something-different-99");
    await expect(page.getByText("The passwords don't match.")).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password/u);
  });
});
