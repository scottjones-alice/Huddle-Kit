import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { LinkFallback } from "../components/link-fallback";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";

const DEFAULT_EXPIRES_IN_MINUTES = 60;

export interface VerifyEmailProps {
  /** How long the link stays valid. Defaults to 60 minutes. */
  expiresInMinutes?: number;
  name: string;
  verificationUrl: string;
}

export const VerifyEmail = ({
  expiresInMinutes = DEFAULT_EXPIRES_IN_MINUTES,
  name,
  verificationUrl,
}: VerifyEmailProps) => (
  <EmailLayout preview="Confirm your email address to finish signing up.">
    <Title>Verify your email</Title>
    <Paragraph>Hi {name}, thanks for signing up!</Paragraph>
    <Paragraph>
      Confirm your email address to activate your account. This link expires in{" "}
      {expiresInMinutes} minutes.
    </Paragraph>
    <Button href={verificationUrl}>Verify email address</Button>
    <LinkFallback href={verificationUrl} />
    <Paragraph muted>
      If you didn&apos;t create an account, you can safely ignore this email.
    </Paragraph>
  </EmailLayout>
);

VerifyEmail.PreviewProps = {
  expiresInMinutes: 60,
  name: "Alex",
  verificationUrl: "https://huddlekit.com/verify-email?token=example-token",
} satisfies VerifyEmailProps;

export default VerifyEmail;
