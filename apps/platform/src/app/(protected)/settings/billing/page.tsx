import { FootballLoader } from "@alice/user-interface/components/football-loader";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ClubBilling } from "@/components/billing/club-billing";

export const metadata: Metadata = { title: "Club billing | Huddlekit" };

export default function BillingPage() {
  return (
    <Suspense
      fallback={<FootballLoader label="Opening club billing" variant="page" />}
    >
      <ClubBilling />
    </Suspense>
  );
}
