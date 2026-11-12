CREATE TABLE "club_stripe_accounts" (
	"card_payments_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" uuid PRIMARY KEY,
	"stripe_account_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubStripeAccounts_cardPaymentsStatus_chk" CHECK ("card_payments_status" in ('active', 'pending', 'restricted', 'unsupported')),
	CONSTRAINT "clubStripeAccounts_stripeAccountId_chk" CHECK ("stripe_account_id" like 'acct\_%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "club_stripe_accounts_stripeAccountId_uidx" ON "club_stripe_accounts" ("stripe_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_card_reference_uidx" ON "payments" ("organization_id","reference") WHERE "method" = 'card' and "reference" is not null;--> statement-breakpoint
ALTER TABLE "club_stripe_accounts" ADD CONSTRAINT "club_stripe_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;