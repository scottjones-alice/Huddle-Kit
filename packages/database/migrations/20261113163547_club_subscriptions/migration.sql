CREATE TABLE "club_subscriptions" (
	"billing_interval" text NOT NULL,
	"cancel_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"status" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubSubscriptions_status_chk" CHECK ("status" in ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid')),
	CONSTRAINT "clubSubscriptions_billingInterval_chk" CHECK ("billing_interval" in ('monthly', 'yearly')),
	CONSTRAINT "clubSubscriptions_stripeSubscriptionId_chk" CHECK ("stripe_subscription_id" like 'sub\_%'),
	CONSTRAINT "clubSubscriptions_stripeCustomerId_chk" CHECK ("stripe_customer_id" like 'cus\_%')
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "stripeEvents_id_chk" CHECK ("id" like 'evt\_%')
);
--> statement-breakpoint
DROP TABLE "subscriptions";--> statement-breakpoint
CREATE UNIQUE INDEX "club_subscriptions_stripeSubscriptionId_uidx" ON "club_subscriptions" ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "club_subscriptions_organizationId_idx" ON "club_subscriptions" ("organization_id");--> statement-breakpoint
ALTER TABLE "club_subscriptions" ADD CONSTRAINT "club_subscriptions_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;