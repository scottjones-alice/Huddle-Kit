/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
"use client";

import {
  CLUB_PLAN,
  CLUB_ANNUAL_SAVING_MINOR,
  CLUB_ANNUAL_MONTHLY_EQUIVALENT_MINOR,
  formatClubPrice,
} from "@alice/payments/plans";
import type { ClubBillingInterval } from "@alice/payments/plans";
import { Button } from "@alice/ui/components/button";
import { ArrowUpRight, Check, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** Single-club adaptation of the licensed shadcnuikit pricing2 block. */
export function ClubPricing({ signupUrl }: { signupUrl: string }) {
  const [interval, setInterval] = useState<ClubBillingInterval>("yearly");
  const annual = interval === "yearly";
  return (
    <div className="pricing-card">
      <div className="pricing-main">
        <span className="plan-icon">
          <Shield aria-hidden="true" />
        </span>
        <h3>{CLUB_PLAN.name}</h3>
        <p>One subscription. A whole club together.</p>
        <fieldset className="billing-selector">
          <legend className="sr-only">Billing frequency</legend>
          {(["monthly", "yearly"] as const).map((value) => (
            <label key={value} data-selected={interval === value}>
              <input
                type="radio"
                name="billing-interval"
                value={value}
                checked={interval === value}
                onChange={() => {
                  setInterval(value);
                }}
              />
              {value === "yearly" ? "Yearly" : "Monthly"}
              {value === "yearly" ? (
                <span>Save {formatClubPrice(CLUB_ANNUAL_SAVING_MINOR)}</span>
              ) : null}
            </label>
          ))}
        </fieldset>
        <div aria-live="polite" aria-atomic="true" className="price-display">
          <div>
            <strong>
              {formatClubPrice(
                annual
                  ? CLUB_PLAN.annualAmountMinor
                  : CLUB_PLAN.monthlyAmountMinor
              )}
            </strong>
            <span>per club / {annual ? "year" : "month"}</span>
          </div>
          <p>
            {annual
              ? `Equivalent to ${formatClubPrice(CLUB_ANNUAL_MONTHLY_EQUIVALENT_MINOR)}/month, billed £500 yearly.`
              : "Billed monthly. Same club features."}
          </p>
        </div>
        <Button asChild size="lg" className="w-full rounded-full">
          <Link href={signupUrl}>
            Create your club <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
        <p className="pricing-next">
          Create your club first. Choose and confirm billing in your club
          settings.
        </p>
      </div>
      <div className="pricing-included">
        <span className="eyebrow">In your club’s kitbag</span>
        <ul>
          {CLUB_PLAN.features.map((feature) => (
            <li key={feature}>
              <Check size={18} aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="pricing-details">
          <p>
            Players and parents join your club. They don’t need their own
            Huddlekit subscription.
          </p>
          <p>{CLUB_PLAN.vatNotice}</p>
          <p>{CLUB_PLAN.processingNotice}</p>
        </div>
      </div>
    </div>
  );
}
