import { conflict, invalid, notFound } from "@/lib/app-error";
import {
  isCheckViolation,
  isForeignKeyViolation,
  isUniqueViolation,
} from "@/lib/sql-errors";

export interface WriteMessages {
  /** A rule the database enforces was broken (a date order, a range). */
  invalid?: string;
  /** Something the row points at does not exist, or is in another club. */
  missing?: string;
  /** The same thing already exists. */
  taken?: string;
}

/**
 * Runs a database write and turns the three mistakes a caller can make into
 * clear answers: 409 (already exists), 404 (points at something missing) and
 * 422 (breaks a rule). Anything else is a real fault and is rethrown.
 */
export const guardWrite = async <T>(
  write: () => Promise<T>,
  messages: WriteMessages
): Promise<T> => {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(messages.taken ?? "That already exists");
    }
    if (isForeignKeyViolation(error)) {
      throw notFound(messages.missing ?? "Something you referred to");
    }
    if (isCheckViolation(error)) {
      throw invalid(messages.invalid ?? "Some values are out of range");
    }
    throw error;
  }
};
