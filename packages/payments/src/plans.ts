/** Public catalogue only. Safe to import in browsers; Stripe IDs stay on the server. */
export const CLUB_PLAN = {
  annualAmountMinor: 50_000,
  currency: "GBP",
  features: [
    "Club people and member profiles",
    "Fixtures and training schedules",
    "Player availability and squad organisation",
    "Club fees and payment tracking",
    "Access for organisers, coaches, players and parents",
  ],
  id: "club",
  monthlyAmountMinor: 5000,
  name: "Huddlekit Club",
  processingNotice:
    "Payment processing costs for money collected from members are separate from your Huddlekit subscription.",
  vatNotice: "No VAT is currently charged.",
} as const;

export type ClubBillingInterval = "monthly" | "yearly";

export const formatClubPrice = (amountMinor: number): string =>
  new Intl.NumberFormat("en-GB", {
    currency: CLUB_PLAN.currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(amountMinor / 100);

export const CLUB_ANNUAL_SAVING_MINOR =
  CLUB_PLAN.monthlyAmountMinor * 12 - CLUB_PLAN.annualAmountMinor;

export const CLUB_ANNUAL_MONTHLY_EQUIVALENT_MINOR = Math.round(
  CLUB_PLAN.annualAmountMinor / 12
);
