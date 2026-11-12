import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";
import { brand } from "../lib/brand";

export interface WelcomeEmailProps {
  /** Where the primary button sends the new user (usually the app dashboard). */
  getStartedUrl: string;
  name: string;
}

export const WelcomeEmail = ({ getStartedUrl, name }: WelcomeEmailProps) => (
  <EmailLayout preview={`Welcome to ${brand.name}, ${name}!`}>
    <Title>
      Welcome to {brand.name}, {name}!
    </Title>
    <Paragraph>
      Your account is ready. We&apos;re glad to have you on board.
    </Paragraph>
    <Paragraph>Jump in and get set up with a couple of clicks:</Paragraph>
    <Button href={getStartedUrl}>Get started</Button>
    <Paragraph muted>
      Questions? Just reply to this email or contact {brand.supportEmail}.
    </Paragraph>
  </EmailLayout>
);

WelcomeEmail.PreviewProps = {
  getStartedUrl: "https://huddlekit.com/dashboard",
  name: "Alex",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
