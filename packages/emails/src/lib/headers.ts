/**
 * Headers for transactional email. Pass them to your sender (Resend, Novu, …)
 * so mail clients treat these messages correctly and threads don't collide.
 */

export interface TransactionalHeadersInput {
  /**
   * Stable id for this email (e.g. the user or invite id). Stops Gmail from
   * grouping unrelated messages into one thread.
   */
  entityRefId: string;
}

export const transactionalHeaders = ({
  entityRefId,
}: TransactionalHeadersInput): Record<string, string> => ({
  // Marks the message as machine-generated so auto-replies and
  // out-of-office bots don't answer it.
  "Auto-Submitted": "auto-generated",
  "X-Entity-Ref-ID": entityRefId,
});
