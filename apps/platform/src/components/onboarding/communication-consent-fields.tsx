"use client";

import { ChoiceCardGroup } from "@/components/onboarding/choice-card-group";
import { ConsentItem } from "@/components/onboarding/consent-item";
import { NOTIFICATION_CHANNEL_OPTIONS } from "@/components/onboarding/options";

interface ChatConsentFieldsProps {
  prefix: string;
  // "child" asks on behalf of an under 18, "adult" asks about the person's own chat.
  audience: "child" | "adult";
  subject?: string;
}

export function ChatConsentFields({
  prefix,
  audience,
  subject = "your child",
}: ChatConsentFieldsProps) {
  if (audience === "adult") {
    return (
      <div className="flex flex-col gap-4">
        <ChoiceCardGroup
          type="checkbox"
          columns={3}
          name={`${prefix}-notification-channels`}
          legend="How should we notify you?"
          options={NOTIFICATION_CHANNEL_OPTIONS}
        />
        <ConsentItem
          name={`${prefix}-team-chat`}
          title="Join the team chat"
          description="Fixtures, lift shares and match day updates."
          defaultChecked
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ConsentItem
        name={`${prefix}-team-chat`}
        title={`Let ${subject} join the team chat`}
        description="Group chat with team mates and coaches."
        defaultChecked
      />
      <ConsentItem
        name={`${prefix}-direct-messages`}
        title="Coaches may message directly"
        description="Off by default. Messages are always visible to the club's welfare officer."
      />
      <ConsentItem
        name={`${prefix}-copy-parent`}
        title="Copy me on messages"
        description={`You will see any message sent to ${subject}.`}
        defaultChecked
      />
    </div>
  );
}
