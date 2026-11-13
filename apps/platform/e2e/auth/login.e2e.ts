import { setTimeout as sleep } from "node:timers/promises";

import { expect, test } from "../fixtures/test";
import { gotoReady, signInThroughForm, formAlert } from "../helpers/auth";

const WRONG_CREDENTIALS = "That email and password don't match";

test.describe("login", () => {
  test("signs in with the right email and password @smoke", async ({
    context,
    page,
    verifiedUser,
  }) => {
    await signInThroughForm(page, verifiedUser);

    await expect(page).not.toHaveURL(/\/login/u);
    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => cookie.name.endsWith("session_token"))
    ).toBe(true);
  });

  test("a wrong password shows one clear error and keeps the email @smoke", async ({
    page,
    verifiedUser,
  }) => {
    await signInThroughForm(page, {
      ...verifiedUser,
      password: "not-the-password-1",
    });

    await expect(formAlert(page)).toContainText(WRONG_CREDENTIALS);
    await expect(page).toHaveURL(/\/login/u);
    await expect(page.getByLabel("Email")).toHaveValue(verifiedUser.email);
    await expect(page.getByRole("button", { name: "Login" })).toBeEnabled();
  });

  test("an unknown email gets the same message as a wrong password", async ({
    newUser,
    page,
  }) => {
    await signInThroughForm(page, newUser);

    await expect(formAlert(page)).toContainText(WRONG_CREDENTIALS);
  });

  test("empty fields show an error on each", async ({ page }) => {
    await gotoReady(page, "/login");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeFocused();
  });

  test("the email is matched without regard to case", async ({
    page,
    verifiedUser,
  }) => {
    await signInThroughForm(page, {
      ...verifiedUser,
      email: verifiedUser.email.toUpperCase(),
    });

    await expect(page).not.toHaveURL(/\/login/u);
  });

  test("sends the person on to the page they asked for", async ({
    page,
    verifiedUser,
  }) => {
    await signInThroughForm(
      page,
      verifiedUser,
      `/login?next=${encodeURIComponent("/accept-invite/some-invite")}`
    );

    await expect(page).toHaveURL(/\/accept-invite\/some-invite/u);
  });

  test("ignores a next value that points at another site", async ({
    page,
    verifiedUser,
  }) => {
    await signInThroughForm(
      page,
      verifiedUser,
      `/login?next=${encodeURIComponent("//evil.example.com")}`
    );

    await expect(page).not.toHaveURL(/\/login/u);
    expect(new URL(page.url()).hostname).not.toBe("evil.example.com");
  });

  test("shows a loading state while signing in", async ({
    page,
    verifiedUser,
  }) => {
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await sleep(1500);
      await route.continue();
    });
    await gotoReady(page, "/login");
    await page.getByLabel("Email").fill(verifiedUser.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(verifiedUser.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(
      page.getByRole("button", { name: "Signing in…" })
    ).toBeDisabled();
  });

  test("links to sign up, password reset and passkey", async ({ page }) => {
    await gotoReady(page, "/login");

    await expect(page.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup"
    );
    await expect(
      page.getByRole("link", { name: "Forgot your password?" })
    ).toHaveAttribute("href", "/forgot-password");
    await expect(
      page.getByRole("link", { name: "Sign in with passkey" })
    ).toHaveAttribute("href", "/passkey");
  });
});
