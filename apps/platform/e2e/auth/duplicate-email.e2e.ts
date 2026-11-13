import { TEST_PASSWORD } from "../env";
import { expect, test } from "../fixtures/test";
import { gotoReady } from "../helpers/auth";
import { countUsers } from "../helpers/database";
import { extractLink, waitForEmail } from "../helpers/mailpit";

const ACCOUNT_EXISTS_SUBJECT = "Someone tried to sign up with your email";

test.describe("signing up with an email that already has an account", () => {
  test("shows an inline error, keeps the form values and makes no second user @smoke", async ({
    page,
    verifiedUser,
  }) => {
    await gotoReady(page, "/signup");
    await page.getByLabel("Full Name").fill("Someone Else");
    await page.getByLabel("Email").fill(verifiedUser.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("another-long-password-7");
    await page.getByLabel("Confirm Password").fill("another-long-password-7");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(
      page.getByText("An account with this email already exists.")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup/u);
    await expect(page.getByLabel("Full Name")).toHaveValue("Someone Else");
    await expect(page.getByLabel("Email")).toHaveValue(verifiedUser.email);
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Confirm Password")).toHaveValue("");
    await expect(page.getByLabel("Email")).toBeFocused();
    expect(await countUsers(verifiedUser.email)).toBe(1);
  });

  test("emails the owner that someone tried to use their address @smoke", async ({
    page,
    verifiedUser,
  }) => {
    await gotoReady(page, "/signup");
    await page.getByLabel("Full Name").fill("Someone Else");
    await page.getByLabel("Email").fill(verifiedUser.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("another-long-password-7");
    await page.getByLabel("Confirm Password").fill("another-long-password-7");
    await page.getByRole("button", { name: "Create Account" }).click();

    const email = await waitForEmail({
      subject: ACCOUNT_EXISTS_SUBJECT,
      to: verifiedUser.email,
    });
    expect(email.html).toMatch(/login|sign in/iu);
    expect(() =>
      extractLink(email, /reset-password|forgot-password/u)
    ).not.toThrow();
  });

  test("the Sign in link carries the email to the login form", async ({
    page,
    verifiedUser,
  }) => {
    await gotoReady(page, "/signup");
    await page.getByLabel("Full Name").fill("Someone Else");
    await page.getByLabel("Email").fill(verifiedUser.email);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create Account" }).click();

    await page
      .getByText("An account with this email already exists.")
      .waitFor();
    await page
      .getByRole("link", { exact: true, name: "Sign in" })
      .first()
      .click();

    await expect(page).toHaveURL(/\/login\?/u);
    await expect(
      page.getByRole("heading", { name: "Login to your account" })
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(
      verifiedUser.email
    );
  });

  test("the error goes away once the email is edited", async ({
    page,
    verifiedUser,
  }) => {
    await gotoReady(page, "/signup");
    await page.getByLabel("Full Name").fill("Someone Else");
    await page.getByLabel("Email").fill(verifiedUser.email);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(
      page.getByText("An account with this email already exists.")
    ).toBeVisible();

    await page.getByLabel("Email").fill(`fixed-${verifiedUser.email}`);
    await expect(
      page.getByText("An account with this email already exists.")
    ).toBeHidden();
  });

  test("an unverified account is also reported, not silently re-created", async ({
    newUser,
    page,
  }) => {
    // First sign-up leaves the account unverified.
    await gotoReady(page, "/signup");
    await page.getByLabel("Full Name").fill(newUser.name);
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password", { exact: true }).fill(newUser.password);
    await page.getByLabel("Confirm Password").fill(newUser.password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/verify-email/u);

    await gotoReady(page, "/signup");
    await page.getByLabel("Full Name").fill(newUser.name);
    await page.getByLabel("Email").fill(newUser.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("a-second-long-password-3");
    await page.getByLabel("Confirm Password").fill("a-second-long-password-3");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(
      page.getByText("An account with this email already exists.")
    ).toBeVisible();
    expect(await countUsers(newUser.email)).toBe(1);
  });
});
