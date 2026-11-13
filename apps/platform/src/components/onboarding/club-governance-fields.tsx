"use client";

import * as React from "react";

import { ConsentItem } from "@/components/onboarding/consent-item";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { LEGAL_STRUCTURE_OPTIONS } from "@/components/onboarding/options";
import { FormSection } from "@/components/onboarding/step-panel";

const ACCEPTED_DOCUMENTS = ".pdf,.jpg,.jpeg,.png";

export function ClubGovernanceFields() {
  const [registeredForVat, setRegisteredForVat] = React.useState(false);

  return (
    <div className="flex flex-col gap-8">
      <FormSection
        title="Safeguarding policy"
        description="Upload your current children's safeguarding policy."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="policy-upload"
            name="policy-upload"
            label="Policy document"
            type="file"
            accept={ACCEPTED_DOCUMENTS}
            optional
          />
          <TextField
            id="policy-review-date"
            name="policy-review-date"
            label="Next review date"
            type="date"
            optional
          />
        </div>
      </FormSection>
      <FormSection
        title="Insurance"
        description="Public liability cover for your sessions and matches."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="insurance-provider"
            name="insurance-provider"
            label="Insurance provider"
            required
          />
          <TextField
            id="insurance-policy-number"
            name="insurance-policy-number"
            label="Policy number"
            required
          />
          <TextField
            id="insurance-expiry"
            name="insurance-expiry"
            label="Expiry date"
            type="date"
            required
          />
          <TextField
            id="insurance-certificate"
            name="insurance-certificate"
            label="Certificate"
            type="file"
            accept={ACCEPTED_DOCUMENTS}
            optional
          />
        </div>
      </FormSection>
      <FormSection title="Registration">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="legal-structure"
            name="legal-structure"
            label="Legal structure"
            options={LEGAL_STRUCTURE_OPTIONS}
            required
          />
          <TextField
            id="registration-number"
            name="registration-number"
            label="Company or charity number"
            optional
          />
          <TextField
            id="constitution-upload"
            name="constitution-upload"
            label="Constitution"
            type="file"
            accept={ACCEPTED_DOCUMENTS}
            optional
            className="sm:col-span-2"
          />
        </div>
        <ConsentItem
          name="vat-registered"
          title="Registered for VAT"
          checked={registeredForVat}
          onCheckedChange={setRegisteredForVat}
        />
        {registeredForVat ? (
          <TextField
            id="vat-number"
            name="vat-number"
            label="VAT number"
            placeholder="GB123456789"
          />
        ) : null}
      </FormSection>
    </div>
  );
}
