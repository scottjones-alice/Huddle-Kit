import { randomUUID } from "node:crypto";

import { request } from "@playwright/test";
import type { Page } from "@playwright/test";

import { API_URL, PLATFORM_URL, TEST_PASSWORD } from "../env";
import { extractLink, waitForEmail } from "./mailpit";

export interface Credentials {
  email: string;
  name: string;
  password: string;
}

const ID_LENGTH = 12;

/** Credentials nobody has used before, so tests never share an account. */
export const uniqueCredentials = (label = "user"): Credentials => ({
  email: `e2e-${randomUUID().slice(0, ID_LENGTH)}@example.com`,
  name: `E2E ${label}`,
  password: TEST_PASSWORD,
});

/** The form-level error banner. Next.js has its own route announcer with role="alert", so this skips it. */
export const formAlert = (page: Page) =>
  page.locator('[role="alert"]:not(#__next-route-announcer__)');

/** Opens a page and waits until React has taken over, so forms behave. */
export const gotoReady = async (page: Page, path: string): Promise<void> => {
  await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor();
};

/**
 * Creates an account through the API. The browser is not involved, so this is
 * the quick way to get a user for tests that are about something else.
 */
export const signUpViaApi = async (
  credentials: Credentials,
  callbackPath = "/"
): Promise<void> => {
  const api = await request.newContext();
  try {
    const response = await api.post(`${API_URL}/api/auth/sign-up/email`, {
      data: {
        callbackURL: `${PLATFORM_URL}${callbackPath}`,
        email: credentials.email,
        name: credentials.name,
        password: credentials.password,
      },
      headers: { origin: PLATFORM_URL },
    });
    if (!response.ok()) {
      throw new Error(
        `Sign-up failed: ${response.status()} ${await response.text()}`
      );
    }
  } finally {
    await api.dispose();
  }
};

/** Opens the newest verification link, as a person clicking it in their inbox would. */
export const verifyEmailViaApi = async (email: string): Promise<void> => {
  const message = await waitForEmail({
    subject: "Verify your email address",
    to: email,
  });
  const link = extractLink(message, /verify-email/u);
  const api = await request.newContext();
  try {
    const response = await api.get(link, { maxRedirects: 0 });
    // Better Auth answers a good link with a redirect to the callback.
    if (response.status() !== 302) {
      throw new Error(
        `Verification link did not redirect: ${response.status()}`
      );
    }
  } finally {
    await api.dispose();
  }
};

/** A verified account, ready to sign in with. */
export const createVerifiedUser = async (
  label = "verified"
): Promise<Credentials> => {
  const credentials = uniqueCredentials(label);
  await signUpViaApi(credentials);
  await verifyEmailViaApi(credentials.email);
  return credentials;
};

/** Signs the browser in through the API, so its cookies are set without using the form. */
export const signInViaApi = async (
  page: Page,
  credentials: Credentials
): Promise<void> => {
  const response = await page
    .context()
    .request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: credentials.email, password: credentials.password },
      headers: { origin: PLATFORM_URL },
    });
  if (!response.ok()) {
    throw new Error(
      `Sign-in failed: ${response.status()} ${await response.text()}`
    );
  }
};

/** Signs in through the login form, exactly as a person would. */
export const signInThroughForm = async (
  page: Page,
  credentials: Credentials,
  path = "/login"
): Promise<void> => {
  await gotoReady(page, path);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Login" }).click();
};
