const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

/**
 * The Postgres error code, wherever the driver or the query builder put it.
 * Drizzle wraps driver errors, so the code may be on `cause`.
 */
const codeOf = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "cause" in error ? codeOf(error.cause) : undefined;
};

/** A row with the same unique value already exists. */
export const isUniqueViolation = (error: unknown): boolean =>
  codeOf(error) === UNIQUE_VIOLATION;

/** The row points at something that does not exist (or is in another club). */
export const isForeignKeyViolation = (error: unknown): boolean =>
  codeOf(error) === FOREIGN_KEY_VIOLATION;

const CHECK_VIOLATION = "23514";

/** A value broke a rule the database enforces, such as a date order or a range. */
export const isCheckViolation = (error: unknown): boolean =>
  codeOf(error) === CHECK_VIOLATION;
