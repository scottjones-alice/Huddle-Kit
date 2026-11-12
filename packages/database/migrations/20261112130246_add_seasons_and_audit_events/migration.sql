CREATE TABLE "seasons" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ends_on" date NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"is_current" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_dates_chk" CHECK ("ends_on" > "starts_on")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"action" text NOT NULL,
	"actor_user_id" uuid,
	"entity_id" uuid,
	"entity_type" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"ip_address" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE INDEX "seasons_organizationId_idx" ON "seasons" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_organizationId_name_uidx" ON "seasons" ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_organizationId_current_uidx" ON "seasons" ("organization_id") WHERE "is_current";--> statement-breakpoint
CREATE INDEX "audit_events_actorUserId_occurredAt_idx" ON "audit_events" ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_organizationId_entity_idx" ON "audit_events" ("organization_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_events_organizationId_occurredAt_idx" ON "audit_events" ("organization_id","occurred_at");--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;