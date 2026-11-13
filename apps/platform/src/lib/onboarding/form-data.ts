/** Small readers for turning a submitted wizard form into typed values. */

const PENCE_PER_POUND = 100;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;

/** A text field, trimmed. Empty or missing is an empty string. */
export const text = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
};

/** A text field, or null when empty, which is how the API says "not given". */
export const optionalText = (data: FormData, name: string): string | null => {
  const value = text(data, name);
  return value.length === 0 ? null : value;
};

/** Whether a checkbox or switch with this name is on. Unticked boxes are not submitted. */
export const isChecked = (data: FormData, name: string): boolean =>
  data.get(name) !== null;

/** Every ticked value for a group of checkboxes that share a name. */
export const allValues = (data: FormData, name: string): string[] =>
  data
    .getAll(name)
    .filter((value): value is string => typeof value === "string");

/** A whole number field, or null when empty or not a number. */
export const optionalInteger = (
  data: FormData,
  name: string
): number | null => {
  const value = text(data, name);
  if (value.length === 0) {
    return null;
  }
  const parsed = Math.trunc(Number(value));
  return Number.isNaN(parsed) ? null : parsed;
};

/** Pounds typed by a person ("12.50") as whole pence, or null when empty. */
export const optionalMinorUnits = (
  data: FormData,
  name: string
): number | null => {
  const value = text(data, name);
  if (value.length === 0) {
    return null;
  }
  const pounds = Number(value);
  return Number.isFinite(pounds) ? Math.round(pounds * PENCE_PER_POUND) : null;
};

/** Adds https:// to "www.club.co.uk" so it is a full address. Empty stays null. */
export const optionalUrl = (data: FormData, name: string): string | null => {
  const value = optionalText(data, name);
  if (value === null) {
    return null;
  }
  return HAS_SCHEME.test(value) ? value : `https://${value}`;
};
