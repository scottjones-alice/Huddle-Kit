"use client";

import { ChoiceCardGroup } from "@/components/onboarding/choice-card-group";
import { ConsentItem } from "@/components/onboarding/consent-item";
import { ContactList } from "@/components/onboarding/contact-list";
import {
  PICKUP_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/components/onboarding/options";
import { FormSection } from "@/components/onboarding/step-panel";

interface TravelConsentFieldsProps {
  prefix: string;
  childName: string;
}

export function TravelConsentFields({
  prefix,
  childName,
}: TravelConsentFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection
        title="Travel"
        description={`Where ${childName} may travel, and who with.`}
      >
        <div className="flex flex-col gap-3">
          <ConsentItem
            name={`${prefix}-away-fixtures`}
            title="Away fixtures with coaches"
            description="Travel to away matches with the coach or manager."
          />
          <ConsentItem
            name={`${prefix}-other-parents`}
            title="Lift shares with other parents"
            description="Travel in another parent's or guardian's car."
          />
          <ConsentItem
            name={`${prefix}-minibus`}
            title="Club minibus or hired coach"
            description="Travel in a club or hired vehicle with trained drivers."
          />
          <ConsentItem
            name={`${prefix}-overnight`}
            title="Tournaments and overnight stays"
            description="Away trips that include staying overnight."
          />
        </div>
      </FormSection>
      <FormSection
        title="Approved adults"
        description={`Other adults who may take ${childName} to or from sessions.`}
      >
        <ContactList
          idPrefix={`${prefix}-approved`}
          rowLabel="Approved adult"
          addLabel="Add another adult"
          minRows={0}
          defaultRows={0}
          primary={{ label: "Full name", placeholder: "Alex Taylor" }}
          select={{ label: "Relationship", options: RELATIONSHIP_OPTIONS }}
          secondary={{
            label: "Phone number",
            placeholder: "07123 456789",
            type: "tel",
          }}
        />
      </FormSection>
      <FormSection title="Pick-up">
        <ChoiceCardGroup
          name={`${prefix}-pickup`}
          legend="Who can collect"
          options={PICKUP_OPTIONS}
          defaultValue="guardian"
        />
      </FormSection>
    </div>
  );
}
