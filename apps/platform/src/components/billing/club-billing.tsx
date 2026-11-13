"use client";

import {
  CLUB_PLAN,
  CLUB_ANNUAL_SAVING_MINOR,
  CLUB_ANNUAL_MONTHLY_EQUIVALENT_MINOR,
  formatClubPrice,
} from "@alice/payments/plans";
import type { ClubBillingInterval } from "@alice/payments/plans";
import { Button } from "@alice/user-interface/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@alice/user-interface/components/card";
import { FootballLoader } from "@alice/user-interface/components/football-loader";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Logo } from "@/components/shared/logo";
import { authClient } from "@/lib/auth-client";
import {
  cancelSubscription,
  createCheckout,
  createPortalUrl,
  loadSubscription,
  restoreSubscription,
} from "@/lib/billing";
import type { ClubSubscription } from "@/lib/billing";
import { keys } from "@/lib/keys";

const publishableKey = keys().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Loaded once, outside any component, so Stripe.js is not fetched again on every render.
const stripePromise =
  publishableKey === undefined ? null : loadStripe(publishableKey);

// Stripe confirms payment by webhook, a moment after the page redirects back.
const CONFIRMATION_POLL_MS = 3000;
const CONFIRMATION_MAX_POLLS = 10;

// A subscription with one of these statuses needs the club to fix its payment.
const NEEDS_PAYMENT = new Set(["past_due", "unpaid", "incomplete", "paused"]);

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

interface BillingState {
  organizationId: string;
  subscription: ClubSubscription | null;
  error: string | null;
}

function dateLabel(value: string | null) {
  return value === null
    ? "See Stripe for your renewal date"
    : DATE_FORMAT.format(new Date(value));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message !== ""
    ? error.message
    : fallback;
}

interface ManageCardProps {
  subscription: ClubSubscription;
  pending: boolean;
  onPortal: () => void;
  onCancellation: (cancel: boolean) => void;
}

function ManageCard({
  subscription,
  pending,
  onPortal,
  onCancellation,
}: ManageCardProps) {
  const needsPayment = NEEDS_PAYMENT.has(subscription.status);
  const endingSoon =
    subscription.cancelAtPeriodEnd || subscription.cancelAt !== null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your club subscription</CardTitle>
        <CardDescription>
          Your current price stays in place. View the exact amount, invoices and
          payment details in Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="mt-1 font-medium capitalize">
              {subscription.status.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Billing</dt>
            <dd className="mt-1 font-medium">
              {subscription.billingInterval === "yearly" ? "Yearly" : "Monthly"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {endingSoon ? "Scheduled to end" : "Current period ends"}
            </dt>
            <dd className="mt-1 font-medium">
              {dateLabel(
                subscription.cancelAt ?? subscription.currentPeriodEnd
              )}
            </dd>
          </div>
        </dl>
        {needsPayment ? (
          <p role="alert" className="bg-muted rounded-lg p-4 text-sm">
            Your subscription needs attention. Open Stripe to update your
            payment method or resolve the outstanding payment.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={onPortal} disabled={pending}>
            {pending ? "Working…" : "Manage payment details and invoices"}
            <ExternalLink aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              onCancellation(!endingSoon);
            }}
          >
            {endingSoon
              ? "Keep my subscription"
              : "Cancel at the end of the period"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Cancelling keeps your club’s access until the period you’ve paid for
          ends.
        </p>
      </CardContent>
    </Card>
  );
}

interface CheckoutCardProps {
  interval: ClubBillingInterval;
  onBack: () => void;
}

function CheckoutCard({ interval, onBack }: CheckoutCardProps) {
  const fetchClientSecret = useCallback(
    async () => await createCheckout(interval),
    [interval]
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {CLUB_PLAN.name}, billed{" "}
          {interval === "yearly" ? "yearly" : "monthly"}
        </CardTitle>
        <CardDescription>
          Payment is handled securely by Stripe. Your access starts once Stripe
          confirms it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stripePromise === null ? (
          <p role="alert" className="text-destructive text-sm">
            Checkout isn’t set up on this server yet.
          </p>
        ) : (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
        <Button variant="outline" onClick={onBack}>
          Change billing option
        </Button>
      </CardContent>
    </Card>
  );
}

interface PlanCardProps {
  interval: ClubBillingInterval;
  disabled: boolean;
  onIntervalChange: (interval: ClubBillingInterval) => void;
  onContinue: () => void;
}

function PlanCard({
  interval,
  disabled,
  onIntervalChange,
  onContinue,
}: PlanCardProps) {
  const annual = interval === "yearly";
  return (
    <Card>
      <CardHeader>
        <CardTitle>{CLUB_PLAN.name}</CardTitle>
        <CardDescription>
          One subscription for your club. Players and parents don’t purchase
          individual Huddlekit subscriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-medium">Choose billing</legend>
          {(["monthly", "yearly"] as const).map((value) => (
            <label
              key={value}
              className="has-checked:border-primary has-checked:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-xl border p-4"
            >
              <input
                className="mt-1"
                type="radio"
                name="club-billing"
                checked={value === interval}
                onChange={() => {
                  onIntervalChange(value);
                }}
              />
              <span>
                <strong className="block text-sm">
                  {value === "yearly"
                    ? `${formatClubPrice(CLUB_PLAN.annualAmountMinor)} per club/year`
                    : `${formatClubPrice(CLUB_PLAN.monthlyAmountMinor)} per club/month`}
                </strong>
                <span className="text-muted-foreground mt-1 block text-xs">
                  {value === "yearly"
                    ? `Save ${formatClubPrice(CLUB_ANNUAL_SAVING_MINOR)} annually`
                    : "Billed monthly"}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="text-muted-foreground text-sm">
          {annual
            ? `£500 billed yearly, equivalent to ${formatClubPrice(CLUB_ANNUAL_MONTHLY_EQUIVALENT_MINOR)}/month.`
            : "£50 billed monthly."}{" "}
          {CLUB_PLAN.vatNotice}
        </p>
        <ul className="grid gap-3 text-sm">
          {CLUB_PLAN.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="size-4 shrink-0" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <Button onClick={onContinue} disabled={disabled}>
          {`Continue to ${annual ? "yearly" : "monthly"} checkout`}
        </Button>
        <p className="text-muted-foreground text-xs">
          Review the full total and confirm your subscription securely in the
          next step.
        </p>
      </CardContent>
    </Card>
  );
}

function BillingDetails({ organizationId }: { organizationId: string }) {
  const search = useSearchParams();
  const [interval, setInterval] = useState<ClubBillingInterval>("yearly");
  const [state, setState] = useState<BillingState | null>(null);
  const [polls, setPolls] = useState(0);
  const [pending, setPending] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const returningFromCheckout = search.get("checkout") === "complete";

  const load = useCallback(async () => {
    try {
      const subscription = await loadSubscription();
      setState({ error: null, organizationId, subscription });
    } catch {
      setState({
        error: "We couldn’t load billing. Please try again.",
        organizationId,
        subscription: null,
      });
    }
  }, [organizationId]);

  // Loading from the API is the point of this effect, so the state update is intended.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const subscription = state?.subscription ?? null;
  const waitingForStripe =
    returningFromCheckout &&
    state !== null &&
    subscription === null &&
    polls < CONFIRMATION_MAX_POLLS;

  // Coming back from Checkout, ask again until the webhook has landed.
  useEffect(() => {
    const nextPoll = polls + 1;
    const timer = setTimeout(() => {
      if (waitingForStripe) {
        setPolls(nextPoll);
        void load();
      }
    }, CONFIRMATION_POLL_MS);
    return () => {
      clearTimeout(timer);
    };
    // oxlint-disable-next-line react-doctor/prefer-use-effect-event
  }, [waitingForStripe, polls, load]);

  const handleRefresh = () => {
    setPolls(0);
    void load();
  };

  const handlePortal = async () => {
    setPending(true);
    setActionError(null);
    try {
      window.location.assign(await createPortalUrl());
    } catch (error) {
      setActionError(
        errorMessage(
          error,
          "The billing portal is unavailable. Please try again."
        )
      );
      setPending(false);
    }
  };

  const handleCancellation = async (cancel: boolean) => {
    setPending(true);
    setActionError(null);
    try {
      const updated = cancel
        ? await cancelSubscription()
        : await restoreSubscription();
      setState({ error: null, organizationId, subscription: updated });
    } catch (error) {
      setActionError(
        errorMessage(error, "We couldn’t change your subscription. Try again.")
      );
    }
    setPending(false);
  };

  if (!state || state.organizationId !== organizationId) {
    return (
      <FootballLoader
        label="Checking your club subscription"
        variant="inline"
      />
    );
  }
  if (state.error !== null) {
    return (
      <div role="alert" className="space-y-4">
        <p>{state.error}</p>
        <Button variant="outline" onClick={handleRefresh}>
          Try again
        </Button>
      </div>
    );
  }

  let card = (
    <PlanCard
      interval={interval}
      disabled={returningFromCheckout}
      onIntervalChange={setInterval}
      onContinue={() => {
        setCheckingOut(true);
      }}
    />
  );
  if (subscription !== null) {
    card = (
      <ManageCard
        subscription={subscription}
        pending={pending}
        onPortal={() => {
          void handlePortal();
        }}
        onCancellation={(cancel) => {
          void handleCancellation(cancel);
        }}
      />
    );
  } else if (checkingOut) {
    card = (
      <CheckoutCard
        interval={interval}
        onBack={() => {
          setCheckingOut(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {returningFromCheckout && subscription === null ? (
        <output className="bg-muted block space-y-3 rounded-lg p-4 text-sm">
          <p>
            We’re waiting for Stripe to confirm your subscription. Don’t start
            another checkout while confirmation is pending.
          </p>
          {waitingForStripe ? null : (
            <Button variant="outline" onClick={handleRefresh}>
              Check payment status
            </Button>
          )}
        </output>
      ) : null}
      {actionError === null ? null : (
        <p role="alert" className="text-destructive">
          {actionError}
        </p>
      )}
      {card}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {CLUB_PLAN.processingNotice} This page manages the club’s Huddlekit
        subscription. Member collections use your club’s separate Stripe Connect
        account.
      </p>
    </div>
  );
}

export function ClubBilling() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: club, isPending: clubPending } =
    authClient.useActiveOrganization();
  const { data: member, isPending: memberPending } =
    authClient.useActiveMember();
  if (sessionPending || clubPending || memberPending) {
    return <FootballLoader label="Opening club billing" variant="page" />;
  }
  if (!session) {
    return (
      <main className="mx-auto max-w-xl space-y-5 p-8">
        <h1 className="text-2xl font-semibold">
          Sign in to manage club billing
        </h1>
        <Button asChild>
          <Link href="/login?next=%2Fsettings%2Fbilling">Sign in</Link>
        </Button>
      </main>
    );
  }
  if (!club) {
    return (
      <main className="mx-auto max-w-xl space-y-5 p-8">
        <h1 className="text-2xl font-semibold">
          Create or choose your club first
        </h1>
        <p>Billing belongs to a club, not an individual account.</p>
        <Button asChild>
          <Link href="/">Go to club setup</Link>
        </Button>
      </main>
    );
  }
  const canManage =
    member?.organizationId === club.id &&
    member.role
      .split(",")
      .some((role) => role.trim() === "owner" || role.trim() === "admin");
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Logo />
        <Link
          className="inline-flex items-center gap-2 text-sm"
          href={`/${club.slug}/dashboard`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {club.name}
        </Link>
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">
          Settings / Billing · {club.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Your club’s Huddlekit subscription
        </h1>
      </div>
      {canManage ? (
        <BillingDetails key={club.id} organizationId={club.id} />
      ) : (
        <Card>
          <CardHeader>
            <ShieldCheck aria-hidden="true" className="mb-3 size-6" />
            <CardTitle>Billing is managed by your club</CardTitle>
            <CardDescription>
              Only the club’s owners and admins can view or change its
              subscription. You don’t need to buy a personal subscription.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <p className="text-muted-foreground text-sm">
        Need help?{" "}
        <a
          className="underline underline-offset-4"
          href="mailto:support@huddlekit.com"
        >
          support@huddlekit.com
        </a>
      </p>
    </main>
  );
}
