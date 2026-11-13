"use client";

import { Button } from "@alice/user-interface/components/button";
import { CheckCircle2Icon, LandmarkIcon } from "lucide-react";
import * as React from "react";

import { FormError } from "@/components/auth/form-error";
import { SelectField, TextField } from "@/components/onboarding/form-fields";
import { PAYOUT_SCHEDULE_OPTIONS } from "@/components/onboarding/options";
import { loadConnectStatus, startConnect } from "@/lib/onboarding/payouts";
import type { ConnectStatus } from "@/lib/onboarding/payouts";
import { saveDraft } from "@/lib/onboarding/save";

// Sends the person to Stripe Connect. Stripe collects the bank details, so none
// are collected here. The person comes back through /settings/payments.
export function StripeConnectCard() {
  const [status, setStatus] = React.useState<ConnectStatus | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const connected = status === "active";

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const found = await loadConnectStatus();
      if (!cancelled) {
        setStatus(found);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConnect = async (form: HTMLFormElement | null) => {
    setError(null);
    setStarting(true);
    try {
      // Keep their answers so far, so they land back on this step.
      if (form !== null) {
        await saveDraft("club", "payouts", new FormData(form));
      }
      window.location.assign(await startConnect());
    } catch {
      setError("We couldn't reach Stripe. Please try again.");
      setStarting(false);
    }
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
        {status === "pending" || status === "restricted" ? (
          <p className="text-muted-foreground text-sm">
            Stripe still needs a few details before payments can start.
          </p>
        ) : null}
        <FormError message={error} />
        {connected ? null : (
          <Button
            type="button"
            className="h-10 self-start"
            disabled={starting || status === "unsupported"}
            onClick={(event) => {
              void handleConnect(event.currentTarget.form);
            }}
          >
            {status === "pending" || status === "restricted"
              ? "Continue with Stripe"
              : "Connect with Stripe"}
          </Button>
        )}
        <p className="text-muted-foreground text-xs">
          You can skip this and connect later from your club settings.
        </p>
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
