"use client";

import { ConsentItem } from "@/components/onboarding/consent-item";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { DBS_LEVEL_OPTIONS } from "@/components/onboarding/options";

interface DbsFieldsProps {
  prefix: string;
  showQualifications?: boolean;
}

export function DbsFields({
  prefix,
  showQualifications = true,
}: DbsFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id={`${prefix}-dbs-level`}
          name={`${prefix}-dbs-level`}
          label="DBS level"
          options={DBS_LEVEL_OPTIONS}
          required
        />
        <TextField
          id={`${prefix}-dbs-number`}
          name={`${prefix}-dbs-number`}
          label="Certificate number"
          inputMode="numeric"
          maxLength={12}
          placeholder="12 digit number"
          required
        />
        <TextField
          id={`${prefix}-dbs-issued`}
          name={`${prefix}-dbs-issued`}
          label="Date of issue"
          type="date"
          required
        />
        <TextField
          id={`${prefix}-dbs-upload`}
          name={`${prefix}-dbs-upload`}
          label="Upload certificate"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          optional
        />
      </div>
      <ConsentItem
        name={`${prefix}-dbs-update-service`}
        title="Registered with the DBS Update Service"
        description="The club can then check your certificate status online."
      />
      {showQualifications ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${prefix}-safeguarding-expiry`}
            name={`${prefix}-safeguarding-expiry`}
            label="Safeguarding course expiry"
            type="date"
            optional
            hint="FA Safeguarding Children or equivalent."
          />
          <TextField
            id={`${prefix}-first-aid-expiry`}
            name={`${prefix}-first-aid-expiry`}
            label="First aid certificate expiry"
            type="date"
            optional
          />
        </div>
      ) : null}
    </div>
  );
}
