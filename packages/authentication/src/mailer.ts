/**
 * The emails authentication needs. The app implements this with its own sender,
 * so this package stays free of any email provider. Methods are fire-and-forget:
 * they must not throw and are never awaited by Better Auth.
 */

interface AuthMail {
  to: string;
  name: string;
}

export interface AuthMailer {
  sendInvitation: (input: {
    /** Link to the accept-invite page; the invitation id in it is the token. */
    inviteUrl: string;
    inviterName: string;
    teamName: string;
    to: string;
  }) => void;
  sendPasswordChanged: (input: AuthMail & { signInUrl: string }) => void;
  sendPasswordReset: (
    input: AuthMail & { expiresInMinutes: number; resetUrl: string }
  ) => void;
  sendVerification: (
    input: AuthMail & { expiresInMinutes: number; verificationUrl: string }
  ) => void;
  sendWelcome: (
    input: AuthMail & { getStartedUrl: string; userId: string }
  ) => void;
}
