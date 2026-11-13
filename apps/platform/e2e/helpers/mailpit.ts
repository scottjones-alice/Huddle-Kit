import { setTimeout as sleep } from "node:timers/promises";

import { z } from "zod";

import { MAILPIT_URL } from "../env";

const POLL_INTERVAL_MS = 250;
const DEFAULT_TIMEOUT_MS = 15_000;
const HREF_PATTERN = /href="(?<href>[^"]+)"/gu;

const searchSchema = z.object({
  messages: z.array(z.object({ ID: z.string() })).nullish(),
});

const messageSchema = z.object({
  HTML: z.string(),
  ID: z.string(),
  Subject: z.string(),
  Text: z.string(),
});

export interface TestEmail {
  html: string;
  id: string;
  subject: string;
  text: string;
}

const search = async (to: string, subject?: string) => {
  const query =
    subject === undefined ? `to:"${to}"` : `to:"${to}" subject:"${subject}"`;
  const response = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(query)}`
  );
  if (!response.ok) {
    throw new Error(`Mailpit search failed with ${response.status}`);
  }
  const body = searchSchema.parse(await response.json());
  return body.messages ?? [];
};

const readMessage = async (id: string): Promise<TestEmail> => {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  if (!response.ok) {
    throw new Error(`Mailpit message ${id} failed with ${response.status}`);
  }
  const message = messageSchema.parse(await response.json());
  return {
    html: message.HTML,
    id: message.ID,
    subject: message.Subject,
    text: message.Text,
  };
};

/**
 * Waits for the newest email to an address, optionally with a subject. Mailpit
 * lists newest first. Use a unique recipient per test so runs never mix.
 */
export const waitForEmail = async ({
  subject,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  to,
}: {
  subject?: string;
  timeoutMs?: number;
  to: string;
}): Promise<TestEmail> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // oxlint-disable-next-line eslint/no-await-in-loop
    const found = await search(to, subject);
    const [newest] = found;
    if (newest !== undefined) {
      // oxlint-disable-next-line eslint/no-await-in-loop
      return await readMessage(newest.ID);
    }
    // oxlint-disable-next-line eslint/no-await-in-loop
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(
    `No email to ${to}${subject === undefined ? "" : ` with subject "${subject}"`} within ${timeoutMs}ms`
  );
};

/** How many emails an address has received, for checking that nothing extra was sent. */
export const countEmails = async (
  to: string,
  subject?: string
): Promise<number> => {
  const found = await search(to, subject);
  return found.length;
};

/** Gives the mail server a moment, then confirms an address got no email with this subject. */
export const expectNoEmail = async (
  to: string,
  subject: string,
  waitMs = 1500
): Promise<boolean> => {
  await sleep(waitMs);
  const count = await countEmails(to, subject);
  return count === 0;
};

/** The first link in an email whose URL matches the pattern. Throws if none does. */
export const extractLink = (email: TestEmail, pattern: RegExp): string => {
  for (const match of email.html.matchAll(HREF_PATTERN)) {
    const href = match.groups?.href?.replaceAll("&amp;", "&");
    if (href !== undefined && pattern.test(href)) {
      return href;
    }
  }
  throw new Error(`No link matching ${pattern} in "${email.subject}"`);
};
