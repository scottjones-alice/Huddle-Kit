"use client";

import { ConsentItem } from "@/components/onboarding/consent-item";
import { ContactList } from "@/components/onboarding/contact-list";
import {
  QUALIFICATION_OPTIONS,
  REFERENCE_RELATIONSHIP_OPTIONS,
} from "@/components/onboarding/options";

interface PrefixProps {
  prefix: string;
}

export function CoachingQualificationFields({ prefix }: PrefixProps) {
  return (
    <ContactList
      idPrefix={`${prefix}-badge`}
      rowLabel="Qualification"
      addLabel="Add another qualification"
      primary={{ label: "Certificate number", placeholder: "Optional" }}
      select={{ label: "Qualification", options: QUALIFICATION_OPTIONS }}
      secondary={{ label: "Expiry date", type: "date" }}
    />
  );
}

export function ReferenceFields({ prefix }: PrefixProps) {
  return (
    <div className="flex flex-col gap-4">
      <ContactList
        idPrefix={`${prefix}-reference`}
        rowLabel="Referee"
        addLabel="Add another referee"
        primary={{ label: "Full name", placeholder: "Alex Taylor" }}
        select={{
          label: "How do they know you?",
          options: REFERENCE_RELATIONSHIP_OPTIONS,
        }}
        secondary={{
          label: "Email address",
          placeholder: "alex@example.com",
          type: "email",
        }}
        defaultRows={2}
        minRows={2}
      />
      <ConsentItem
        name={`${prefix}-reference-consent`}
        title="The club may contact my referees"
        description="Referees are only contacted about your suitability to work with children."
      />
    </div>
  );
}
