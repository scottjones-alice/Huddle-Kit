-- consent_documents wording is fixed once published: a new version is a new row.
-- Only retired_at (and updated_at) may change.
CREATE FUNCTION "consent_documents_reject_edit"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
	IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
		OR NEW.type IS DISTINCT FROM OLD.type
		OR NEW.version IS DISTINCT FROM OLD.version
		OR NEW.title IS DISTINCT FROM OLD.title
		OR NEW.body IS DISTINCT FROM OLD.body
		OR NEW.published_at IS DISTINCT FROM OLD.published_at THEN
		RAISE EXCEPTION 'consent_documents wording is immutable: publish a new version instead'
			USING ERRCODE = 'integrity_constraint_violation';
	END IF;
	RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "consent_documents_immutable_rows"
BEFORE UPDATE ON "consent_documents"
FOR EACH ROW EXECUTE FUNCTION "consent_documents_reject_edit"();
