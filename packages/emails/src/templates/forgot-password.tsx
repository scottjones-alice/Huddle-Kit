import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { LinkFallback } from "../components/link-fallback";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";

const DEFAULT_EXPIRES_IN_MINUTES = 30;

export interface ForgotPasswordEmailProps {
  /** How long the reset link stays valid. Defaults to 30 minutes. */
  expiresInMinutes?: number;
  name: string;
  resetUrl: string;
}

export const ForgotPasswordEmail = ({
  expiresInMinutes = DEFAULT_EXPIRES_IN_MINUTES,
  name,
  resetUrl,
}: ForgotPasswordEmailProps) => (
  <EmailLayout preview="Use this link to choose a new password.">
    <Title>Reset your password</Title>
    <Paragraph>Hi {name},</Paragraph>
    <Paragraph>
      We got a request to reset your password. Choose a new one with the button
      below. This link expires in {expiresInMinutes} minutes.
    </Paragraph>
    <Button href={resetUrl}>Reset password</Button>
    <LinkFallback href={resetUrl} />
    <Paragraph muted>
      If you didn&apos;t ask for this, you can ignore this email. Your password
      won&apos;t change.
    </Paragraph>
  </EmailLayout>
);

ForgotPasswordEmail.PreviewProps = {
  expiresInMinutes: 30,
  name: "Alex",
  resetUrl: "https://huddlekit.com/reset-password?token=example-token",
} satisfies ForgotPasswordEmailProps;

export default ForgotPasswordEmail;
