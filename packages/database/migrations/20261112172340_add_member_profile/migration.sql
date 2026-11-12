CREATE TABLE "member_billing_preferences" (
	"billing_email" text,
	"method" text,
	"organization_id" uuid NOT NULL,
	"payer" text,
	"person_id" uuid PRIMARY KEY,
	"second_payer_email" text,
	"second_payer_name" text,
	"send_reminders" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_billing_payer_chk" CHECK ("payer" in ('me', 'other-guardian', 'split', 'player', 'club-funded')),
	CONSTRAINT "member_billing_method_chk" CHECK ("method" in ('direct-debit', 'card', 'bank-transfer', 'cash'))
);
--> statement-breakpoint
CREATE TABLE "person_availability" (
	"day_of_week" smallint NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_availability_slot_chk" CHECK ("slot" in ('morning', 'afternoon', 'evening')),
	CONSTRAINT "person_availability_day_chk" CHECK ("day_of_week" between 1 and 7)
);
--> statement-breakpoint
CREATE TABLE "person_demographics" (
	"additional_needs" text,
	"ethnicity" text,
	"gender" text,
	"organization_id" uuid NOT NULL,
	"person_id" uuid PRIMARY KEY,
	"religion" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_kit" (
	"organization_id" uuid NOT NULL,
	"person_id" uuid PRIMARY KEY,
	"pickup_rule" text,
	"shirt_name" text,
	"shirt_size" text,
	"shorts_size" text,
	"squad_number" smallint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_kit_pickup_chk" CHECK ("pickup_rule" in ('guardian', 'approved', 'alone')),
	CONSTRAINT "person_kit_squadNumber_chk" CHECK ("squad_number" is null or "squad_number" between 1 and 99)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "person_availability_person_day_slot_uidx" ON "person_availability" ("person_id","day_of_week","slot");--> statement-breakpoint
CREATE INDEX "person_demographics_organizationId_idx" ON "person_demographics" ("organization_id");--> statement-breakpoint
ALTER TABLE "member_billing_preferences" ADD CONSTRAINT "member_billing_preferences_aOWMQCY5sb3I_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member_billing_preferences" ADD CONSTRAINT "member_billing_preferences_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_availability" ADD CONSTRAINT "person_availability_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_availability" ADD CONSTRAINT "person_availability_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_demographics" ADD CONSTRAINT "person_demographics_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_demographics" ADD CONSTRAINT "person_demographics_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_kit" ADD CONSTRAINT "person_kit_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "person_kit" ADD CONSTRAINT "person_kit_person_same_org_fkey" FOREIGN KEY ("organization_id","person_id") REFERENCES "people"("organization_id","id") ON DELETE CASCADE;