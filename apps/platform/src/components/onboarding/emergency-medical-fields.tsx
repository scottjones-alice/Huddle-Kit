"use client";

import { ConsentItem } from "@/components/onboarding/consent-item";
import { ContactList } from "@/components/onboarding/contact-list";
import { TextareaField } from "@/components/onboarding/form-fields";
import { RELATIONSHIP_OPTIONS } from "@/components/onboarding/options";

interface PrefixProps {
  prefix: string;
}

export function EmergencyContactFields({ prefix }: PrefixProps) {
  return (
    <ContactList
      idPrefix={`${prefix}-emergency`}
      rowLabel="Emergency contact"
      addLabel="Add another contact"
      primary={{ label: "Full name", placeholder: "Jordan Smith" }}
      select={{ label: "Relationship", options: RELATIONSHIP_OPTIONS }}
      secondary={{
        label: "Phone number",
        placeholder: "07123 456789",
        type: "tel",
      }}
    />
  );
}

interface MedicalFieldsProps extends PrefixProps {
  subject?: string;
}

export function MedicalFields({ prefix, subject = "you" }: MedicalFieldsProps) {
  const isSelf = subject === "you";

  return (
    <div className="flex flex-col gap-4">
      <TextareaField
        id={`${prefix}-conditions`}
        name={`${prefix}-conditions`}
        label="Medical conditions and allergies"
        optional
        placeholder="For example asthma, a nut allergy or a previous injury"
      />
      <TextareaField
        id={`${prefix}-medication`}
        name={`${prefix}-medication`}
        label="Regular medication"
        optional
        placeholder="Name, dose and when it is taken"
      />
      <TextareaField
        id={`${prefix}-additional-needs`}
        name={`${prefix}-additional-needs`}
        label="Disability or additional needs"
        optional
        hint={`Anything that would help ${subject} take part, such as support at sessions or a quiet space.`}
      />
      <ConsentItem
        name={`${prefix}-welfare-contact`}
        title="Talk to the welfare officer about support"
        description={`The welfare officer can get in touch with ${isSelf ? "me" : "us"} privately to agree any support.`}
      />
      <ConsentItem
        name={`${prefix}-emergency-treatment`}
        title="Emergency medical treatment"
        description={`A coach or first aider may arrange urgent treatment for ${subject} if the emergency contacts cannot be reached.`}
      />
    </div>
  );
}
