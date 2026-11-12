-- safeguarding_notes is an append-only record: reject any change to existing rows.
CREATE FUNCTION "safeguarding_notes_reject_change"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
	RAISE EXCEPTION 'safeguarding_notes is append-only: % is not allowed', TG_OP
		USING ERRCODE = 'integrity_constraint_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "safeguarding_notes_append_only_rows"
BEFORE UPDATE OR DELETE ON "safeguarding_notes"
FOR EACH ROW EXECUTE FUNCTION "safeguarding_notes_reject_change"();
--> statement-breakpoint
CREATE TRIGGER "safeguarding_notes_append_only_truncate"
BEFORE TRUNCATE ON "safeguarding_notes"
FOR EACH STATEMENT EXECUTE FUNCTION "safeguarding_notes_reject_change"();
