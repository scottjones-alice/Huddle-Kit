import { Button } from "../components/button";
import { EmailLayout } from "../components/email-layout";
import { LinkFallback } from "../components/link-fallback";
import { Paragraph } from "../components/paragraph";
import { Title } from "../components/title";

const DEFAULT_EXPIRES_IN_DAYS = 7;

export interface AcceptInviteEmailProps {
  /** How long the invite stays valid. Defaults to 7 days. */
  expiresInDays?: number;
  inviteUrl: string;
  inviterName: string;
  /** Name of the team or workspace being joined. */
  teamName: string;
}

export const AcceptInviteEmail = ({
  expiresInDays = DEFAULT_EXPIRES_IN_DAYS,
  inviteUrl,
  inviterName,
  teamName,
}: AcceptInviteEmailProps) => (
  <EmailLayout preview={`${inviterName} invited you to join ${teamName}.`}>
    <Title>Join {teamName}</Title>
    <Paragraph>
      {inviterName} invited you to join <strong>{teamName}</strong>. Accept the
      invite to get started. It expires in {expiresInDays} days.
    </Paragraph>
    <Button href={inviteUrl}>Accept invite</Button>
    <LinkFallback href={inviteUrl} />
    <Paragraph muted>
      Don&apos;t know {inviterName}? You can ignore this email and no account
      will be created.
    </Paragraph>
  </EmailLayout>
);

AcceptInviteEmail.PreviewProps = {
  expiresInDays: 7,
  inviteUrl: "https://huddlekit.com/invite?token=example-token",
  inviterName: "Sam",
  teamName: "Acme Team",
} satisfies AcceptInviteEmailProps;

export default AcceptInviteEmail;
