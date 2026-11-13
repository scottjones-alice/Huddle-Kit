"use client";

import * as React from "react";

import { ConsentItem } from "@/components/onboarding/consent-item";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { RELATIONSHIP_OPTIONS } from "@/components/onboarding/options";

interface OtherGuardianFieldsProps {
  prefix: string;
}

export function OtherGuardianFields({ prefix }: OtherGuardianFieldsProps) {
  const [hasGuardian, setHasGuardian] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <ConsentItem
        name={`${prefix}-has-guardian`}
        title="Another parent or guardian shares responsibility"
        description="Add them so the club can contact both of you."
        checked={hasGuardian}
        onCheckedChange={setHasGuardian}
      />
      {hasGuardian ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id={`${prefix}-guardian-name`}
              name={`${prefix}-guardian-name`}
              label="Full name"
              required
            />
            <SelectField
              id={`${prefix}-guardian-relationship`}
              name={`${prefix}-guardian-relationship`}
              label="Relationship to the child"
              options={RELATIONSHIP_OPTIONS}
            />
            <TextField
              id={`${prefix}-guardian-phone`}
              name={`${prefix}-guardian-phone`}
              label="Phone number"
              type="tel"
            />
            <TextField
              id={`${prefix}-guardian-email`}
              name={`${prefix}-guardian-email`}
              label="Email address"
              type="email"
            />
          </div>
          <ConsentItem
            name={`${prefix}-guardian-responsibility`}
            title="Has parental responsibility"
          />
          <ConsentItem
            name={`${prefix}-guardian-other-address`}
            title="Lives at a different address"
          />
          <ConsentItem
            name={`${prefix}-guardian-emergency`}
            title="Can be an emergency contact"
            defaultChecked
          />
        </div>
      ) : null}
    </div>
  );
}
