/**
 * The kinds of consent. Kept in its own file because both `consents` and
 * `consent_documents` use them, and those files import each other's tables.
 */

export const CONSENT_TYPES = [
  "photo_video",
  "medical_treatment",
  "travel",
  "data_sharing",
  "social_media",
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
