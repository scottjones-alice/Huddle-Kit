-- audit_events is an append-only trail: reject any change to existing rows.
CREATE FUNCTION "audit_events_reject_change"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
	RAISE EXCEPTION 'audit_events is append-only: % is not allowed', TG_OP
		USING ERRCODE = 'integrity_constraint_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "audit_events_append_only_rows"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "audit_events_reject_change"();
--> statement-breakpoint
CREATE TRIGGER "audit_events_append_only_truncate"
BEFORE TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION "audit_events_reject_change"();
