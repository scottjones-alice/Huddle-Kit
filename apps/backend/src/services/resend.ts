import { renderEmail, transactionalHeaders } from "@alice/emails";
import type { EmailPropsMap, EmailTemplateName } from "@alice/emails";
import { createTransport } from "nodemailer";
import { Resend } from "resend";

import { keys } from "@/keys";
import { shouldRetryEmailSend } from "@/lib/email-retry";
import { withRetry } from "@/lib/retry";
import { logger } from "@/services/logger";

const { FROM_EMAIL, NODE_ENV, RESEND_API_KEY, SMTP_URL } = keys();

if (SMTP_URL !== undefined && NODE_ENV === "production") {
  throw new Error(
    "SMTP_URL is for local and test use. Production sends through Resend."
  );
}

const resend = new Resend(RESEND_API_KEY);

/** Local and test only: a catch-all SMTP inbox such as Mailpit. Absent in production. */
const smtp = SMTP_URL === undefined ? undefined : createTransport(SMTP_URL);

/** Recipient domains only: enough to spot a bad address without logging personal data. */
const recipientDomains = (to: string | string[]): string[] =>
  (Array.isArray(to) ? to : [to]).map(
    (address) => address.split("@").at(-1) ?? "unknown"
  );

const SEND_ATTEMPTS = 3;
const SEND_RETRY_DELAY_MS = 300;

export interface SendEmailInput<Name extends EmailTemplateName> {
  /** Stable id (user id, invite id…) so mail clients don't thread unrelated emails. */
  entityRefId?: string;
  /** Display name in the From field, e.g. a club name. Defaults to the address only. */
  fromName?: string;
  /** Pass one so a retry can never double-send. */
  idempotencyKey?: string;
  props: EmailPropsMap[Name];
  /** Replaces the template's default subject. */
  subject?: string;
  template: Name;
  to: string | string[];
}

export type SendEmailResult =
  | { id: string; ok: true }
  | { error: string; ok: false };

/**
 * The one function every part of the app uses to send email.
 * Pick a template by name; its props are type-checked against that template.
 * Never throws: check `ok`, or ignore it for fire-and-forget sends.
 *
 * @example
 * await sendEmail({
 *   template: "welcome",
 *   to: user.email,
 *   props: { name: user.name, getStartedUrl },
 * });
 */
export const sendEmail = async <Name extends EmailTemplateName>({
  entityRefId,
  fromName,
  idempotencyKey,
  props,
  subject,
  template,
  to,
}: SendEmailInput<Name>): Promise<SendEmailResult> => {
  try {
    const rendered = await renderEmail(template, props, { subject });

    if (smtp !== undefined) {
      const info = await smtp.sendMail({
        from:
          fromName === undefined || fromName === ""
            ? FROM_EMAIL
            : `${fromName} <${FROM_EMAIL}>`,
        html: rendered.html,
        subject: rendered.subject,
        text: rendered.text,
        to,
      });
      logger.debug({ template }, "Email sent over SMTP");
      return { id: info.messageId, ok: true };
    }

    const hasIdempotencyKey = idempotencyKey !== undefined;
    const { data, error } = await withRetry(
      async () =>
        await resend.emails.send(
          {
            from:
              fromName === undefined || fromName === ""
                ? FROM_EMAIL
                : `${fromName} <${FROM_EMAIL}>`,
            headers:
              entityRefId === undefined
                ? undefined
                : transactionalHeaders({ entityRefId }),
            html: rendered.html,
            subject: rendered.subject,
            text: rendered.text,
            to,
          },
          idempotencyKey === undefined ? undefined : { idempotencyKey }
        ),
      {
        attempts: SEND_ATTEMPTS,
        baseDelayMs: SEND_RETRY_DELAY_MS,
        shouldRetry: (outcome) =>
          shouldRetryEmailSend(outcome, hasIdempotencyKey),
      }
    );

    if (error !== null) {
      logger.error(
        {
          resendError: error.name,
          statusCode: error.statusCode,
          template,
          toDomains: recipientDomains(to),
        },
        `Email not sent: ${error.message}`
      );
      return { error: error.message, ok: false };
    }
    if (data === null) {
      logger.error({ template }, "Email not sent: Resend returned no data");
      return { error: "Resend returned no data", ok: false };
    }
    logger.debug(
      { emailId: data.id, template, toDomains: recipientDomains(to) },
      "Email sent"
    );
    return { id: data.id, ok: true };
  } catch (error) {
    logger.error(
      { err: error, template, toDomains: recipientDomains(to) },
      "Email not sent: unexpected error"
    );
    return {
      error: error instanceof Error ? error.message : "Unknown email error",
      ok: false,
    };
  }
};
