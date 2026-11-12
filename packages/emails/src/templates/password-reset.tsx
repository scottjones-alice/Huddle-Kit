import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";
import { brand } from "../lib/brand";

export interface PasswordResetEmailProps {
  name: string;
  /** Where the button sends the user to sign in with their new password. */
  signInUrl: string;
}

export const PasswordResetEmail = ({
  name,
  signInUrl,
}: PasswordResetEmailProps) => (
  <EmailLayout preview="Your password has been changed.">
    <Title>Your password has been reset</Title>
    <Paragraph>Hi {name},</Paragraph>
    <Paragraph>
      The password for your {brand.name} account was just changed. You can now
      sign in with your new password.
    </Paragraph>
    <Button href={signInUrl}>Sign in</Button>
    <Paragraph muted>
      Didn&apos;t make this change? Contact {brand.supportEmail} right away so
      we can secure your account.
    </Paragraph>
  </EmailLayout>
);

PasswordResetEmail.PreviewProps = {
  name: "Alex",
  signInUrl: "https://huddlekit.com/sign-in",
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
