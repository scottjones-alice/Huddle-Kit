import { setTimeout as sleep } from "node:timers/promises";

import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures/test";
import { gotoReady, formAlert } from "../helpers/auth";
import type { Credentials } from "../helpers/auth";
import { countUsers, findUser } from "../helpers/database";
import { extractLink, waitForEmail } from "../helpers/mailpit";

const fillSignUp = async (
  page: Page,
  credentials: Credentials,
  confirm = credentials.password
) => {
  await page.getByLabel("Full Name").fill(credentials.name);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByLabel("Confirm Password").fill(confirm);
};

test.describe("sign up", () => {
  test("new user signs up, verifies by email and is signed in @smoke", async ({
    context,
    newUser,
    page,
  }) => {
    await gotoReady(page, "/signup");
    await fillSignUp(page, newUser);
    await page.getByRole("button", { name: "Create Account" }).click();

    // The toast is short-lived, so check it before waiting on the next page to load.
    await expect(page.getByText("Account created")).toBeVisible();
    await expect(page).toHaveURL(/\/verify-email\?email=/u);
    await expect(
      page.getByRole("heading", { name: "Verify your email" })
    ).toBeVisible();

    // Not verified yet, so no session.
    const unverified = await findUser(newUser.email);
    expect(unverified?.emailVerified).toBe(false);

    const email = await waitForEmail({
      subject: "Verify your email address",
      to: newUser.email,
    });
    await page.goto(extractLink(email, /verify-email/u));

    await expect(page).not.toHaveURL(/\/login|\/signup|\/verify-email/u);
    const verified = await findUser(newUser.email);
    expect(verified?.emailVerified).toBe(true);
    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => cookie.name.endsWith("session_token"))
    ).toBe(true);
  });

  test("empty form shows an error on every required field", async ({
    page,
  }) => {
    await gotoReady(page, "/signup");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await expect(page.getByText("Enter a password.")).toBeVisible();
    await expect(page.getByLabel("Full Name")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page.getByLabel("Full Name")).toBeFocused();
  });

  test("rejects an email that is not valid", async ({ newUser, page }) => {
    await gotoReady(page, "/signup");
    await fillSignUp(page, { ...newUser, email: "not-an-email" });
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText(/Enter a valid email address/u)).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  test("rejects a password that is too short", async ({ newUser, page }) => {
    await gotoReady(page, "/signup");
    await fillSignUp(page, { ...newUser, password: "short" });
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText(/Use at least 12 characters/u)).toBeVisible();
    expect(await countUsers(newUser.email)).toBe(0);
  });

  test("rejects passwords that do not match", async ({ newUser, page }) => {
    await gotoReady(page, "/signup");
    await fillSignUp(page, newUser, "a-different-password-9");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("The passwords don't match.")).toBeVisible();
    expect(await countUsers(newUser.email)).toBe(0);
  });

  test("shows a loading state and disables the form while submitting", async ({
    newUser,
    page,
  }) => {
    await page.route("**/api/auth/sign-up/email", async (route) => {
      await sleep(1500);
      await route.continue();
    });
    await gotoReady(page, "/signup");
    await fillSignUp(page, newUser);
    await page.getByRole("button", { name: "Create Account" }).click();

    const busy = page.getByRole("button", { name: "Creating account…" });
    await expect(busy).toBeDisabled();
    await expect(page.getByLabel("Email")).toBeDisabled();
    await expect(page).toHaveURL(/\/verify-email/u);
  });

  test("double-clicking Create Account makes one account", async ({
    newUser,
    page,
  }) => {
    await gotoReady(page, "/signup");
    await fillSignUp(page, newUser);
    const button = page.getByRole("button", { name: "Create Account" });
    await button.dblclick();

    await expect(page).toHaveURL(/\/verify-email/u);
    await waitForEmail({
      subject: "Verify your email address",
      to: newUser.email,
    });
    expect(await countUsers(newUser.email)).toBe(1);
  });

  test("pressing Enter submits the form", async ({ newUser, page }) => {
    await gotoReady(page, "/signup");
    await fillSignUp(page, newUser);
    await page.getByLabel("Confirm Password").press("Enter");

    await expect(page).toHaveURL(/\/verify-email/u);
  });

  test("a network failure shows a message and keeps the form usable", async ({
    newUser,
    page,
  }) => {
    await page.route("**/api/auth/sign-up/email", async (route) => {
      await route.abort("connectionrefused");
    });
    await gotoReady(page, "/signup");
    await fillSignUp(page, newUser);
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(formAlert(page)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Account" })
    ).toBeEnabled();
    await expect(page.getByLabel("Email")).toHaveValue(newUser.email);
    expect(await countUsers(newUser.email)).toBe(0);
  });
});
