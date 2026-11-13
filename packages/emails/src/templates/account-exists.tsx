import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";

export interface AccountExistsEmailProps {
  /** Where they can reset their password if the attempt wasn't them. */
  forgotPasswordUrl: string;
  name: string;
  /** The sign-in page. */
  signInUrl: string;
}

/**
 * Sent to the owner of an address when someone tries to sign up with it again.
 * Either it was them, who forgot they had an account, or it was someone else.
 */
export const AccountExistsEmail = ({
  forgotPasswordUrl,
  name,
  signInUrl,
}: AccountExistsEmailProps) => (
  <EmailLayout preview="Someone tried to sign up with your email address.">
    <Title>Someone tried to sign up with your email</Title>
    <Paragraph>Hi {name},</Paragraph>
    <Paragraph>
      Someone just tried to create an account using your email address. You
      already have an account, so nothing has changed.
    </Paragraph>
    <Paragraph>
      <strong>If this was you,</strong> sign in here:
    </Paragraph>
    <Button href={signInUrl}>Sign in</Button>
    <Paragraph>
      <strong>If this wasn&apos;t you,</strong> someone may be trying to get
      into your account. Reset your password now to keep it safe:
    </Paragraph>
    <Button href={forgotPasswordUrl}>Reset my password</Button>
  </EmailLayout>
);

AccountExistsEmail.PreviewProps = {
  forgotPasswordUrl: "https://huddlekit.com/forgot-password",
  name: "Alex",
  signInUrl: "https://huddlekit.com/login",
} satisfies AccountExistsEmailProps;

export default AccountExistsEmail;
