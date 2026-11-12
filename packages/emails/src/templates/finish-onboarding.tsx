import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";
import { brand } from "../lib/brand";

export interface FinishOnboardingEmailProps {
  /** Which wizard was left unfinished. */
  flow: "club" | "people";
  name: string;
  /** 1 = the first nudge, 2 = a day on, 3 = the last one. */
  reminder: 1 | 2 | 3;
  /** Opens the wizard where they stopped. */
  resumeUrl: string;
}

const WHAT: Record<FinishOnboardingEmailProps["flow"], string> = {
  club: "setting up your club",
  people: "joining your club",
};

const LEAD: Record<FinishOnboardingEmailProps["reminder"], string> = {
  1: "You saved your progress, and everything you entered is still here.",
  2: "Your saved answers are waiting. It only takes a few minutes to finish.",
  3: "This is our last reminder. Your saved answers are still here whenever you are ready.",
};

export const finishOnboardingSubject = ({
  flow,
  reminder,
}: Pick<FinishOnboardingEmailProps, "flow" | "reminder">) =>
  reminder === 3
    ? `Last reminder: finish ${WHAT[flow]}`
    : `Pick up where you left off with ${brand.name}`;

export const FinishOnboardingEmail = ({
  flow,
  name,
  reminder,
  resumeUrl,
}: FinishOnboardingEmailProps) => (
  <EmailLayout preview={`Finish ${WHAT[flow]} on ${brand.name}`}>
    <Title>Hi {name}, you are nearly there</Title>
    <Paragraph>
      You started {WHAT[flow]} on {brand.name} but have not finished yet.
    </Paragraph>
    <Paragraph>{LEAD[reminder]}</Paragraph>
    <Button href={resumeUrl}>Continue where I left off</Button>
    <Paragraph muted>
      Questions? Just reply to this email or contact {brand.supportEmail}.
    </Paragraph>
  </EmailLayout>
);

FinishOnboardingEmail.PreviewProps = {
  flow: "club",
  name: "Alex",
  reminder: 1,
  resumeUrl: "https://huddlekit.com/onboarding-club",
} satisfies FinishOnboardingEmailProps;

export default FinishOnboardingEmail;
