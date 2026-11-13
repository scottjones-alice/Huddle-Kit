import { expect, test } from "../fixtures/test";
import { signInViaApi } from "../helpers/auth";

test.describe("sessions", () => {
  test("a signed-out visitor is sent to login @smoke", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login/u);
  });

  test("a signed-out visitor can still reach the open pages", async ({
    page,
  }) => {
    for (const path of ["/signup", "/forgot-password", "/link-expired"]) {
      // oxlint-disable-next-line eslint/no-await-in-loop
      await page.goto(path);
      // oxlint-disable-next-line eslint/no-await-in-loop
      await expect(page).toHaveURL(new RegExp(path, "u"));
    }
  });

  test("a signed-in person is moved off the login and signup pages", async ({
    page,
    verifiedUser,
  }) => {
    await signInViaApi(page, verifiedUser);

    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/login/u);

    await page.goto("/signup");
    await expect(page).not.toHaveURL(/\/signup/u);
  });

  test("the session survives a refresh", async ({ page, verifiedUser }) => {
    await signInViaApi(page, verifiedUser);
    await page.goto("/");
    const landed = page.url();

    await page.reload();

    await expect(page).not.toHaveURL(/\/login/u);
    expect(page.url()).toBe(landed);
  });

  test("a second browser context is not signed in", async ({
    browser,
    page,
    verifiedUser,
  }) => {
    await signInViaApi(page, verifiedUser);

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto("/");
    await expect(otherPage).toHaveURL(/\/login/u);
    await other.close();
  });
});
