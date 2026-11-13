"use client";

import { Button } from "@alice/user-interface/components/button";
import { CheckCircle2Icon, LandmarkIcon } from "lucide-react";
import * as React from "react";

import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { PAYOUT_SCHEDULE_OPTIONS } from "@/components/onboarding/options";

// UI only. A real build sends the user to Stripe Connect; Stripe collects
// the bank details, so none are collected here.
export function StripeConnectCard() {
  const [connected, setConnected] = React.useState(false);

  const handleToggle = () => {
    setConnected((current) => !current);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-input flex flex-col gap-4 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <LandmarkIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Payments run through Stripe</p>
            <p className="text-muted-foreground text-sm text-pretty">
              Connect your club&apos;s Stripe account to take subscriptions and
              match fees. Stripe collects your bank details securely, so we
              never see or store them.
            </p>
          </div>
        </div>
        {connected ? (
          <output className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2Icon className="size-4" aria-hidden="true" />
            Stripe account connected
          </output>
        ) : null}
        <Button
          type="button"
          variant={connected ? "outline" : "default"}
          className="h-10 self-start"
          onClick={handleToggle}
        >
          {connected ? "Disconnect Stripe" : "Connect with Stripe"}
        </Button>
        <input
          type="hidden"
          name="stripe-connected"
          value={connected ? "yes" : "no"}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="stripe-statement-descriptor"
          name="stripe-statement-descriptor"
          label="Statement descriptor"
          maxLength={22}
          placeholder="RIVERSIDE FC"
          hint="What members see on their bank statement. Up to 22 characters."
        />
        <SelectField
          id="stripe-payout-schedule"
          name="stripe-payout-schedule"
          label="Payout schedule"
          options={PAYOUT_SCHEDULE_OPTIONS}
          defaultValue="weekly"
        />
        <TextField
          id="stripe-payout-email"
          name="stripe-payout-email"
          label="Payout contact email"
          type="email"
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}
