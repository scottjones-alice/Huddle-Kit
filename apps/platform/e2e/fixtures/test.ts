import { test as base } from "@playwright/test";

import { createVerifiedUser, uniqueCredentials } from "../helpers/auth";
import type { Credentials } from "../helpers/auth";
import { seedClub } from "../helpers/database";
import type { SeededClub } from "../helpers/database";

interface Fixtures {
  /** A club with an owner, created fresh for the test. */
  club: SeededClub;
  /** Credentials for an account that does not exist yet. */
  newUser: Credentials;
  /** An account that has signed up and verified its email. */
  verifiedUser: Credentials;
}

/** `test` with fixtures for the accounts and clubs the auth journeys need. */
export const test = base.extend<Fixtures>({
  club: async ({}, use) => {
    await use(await seedClub());
  },
  newUser: async ({}, use) => {
    await use(uniqueCredentials("new"));
  },
  verifiedUser: async ({}, use) => {
    await use(await createVerifiedUser());
  },
});

export { expect } from "@playwright/test";
