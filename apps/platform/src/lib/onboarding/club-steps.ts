import { DAYS, TIME_SLOTS } from "@/components/onboarding/options";
import {
  allValues,
  isChecked,
  optionalInteger,
  optionalMinorUnits,
  optionalText,
  optionalUrl,
  text,
} from "@/lib/onboarding/form-data";

/** The club steps the API saves. The names match the API. */
export type ClubApiStep =
  | "club"
  | "fees"
  | "governance"
  | "location"
  | "schedule"
  | "social";

const DEFAULT_COUNTRY = "GB";

// The grid in the form is day by part of day, the API wants start and end times.
const SLOT_TIMES: Record<string, { endsAt: string; startsAt: string }> = {
  afternoon: { endsAt: "17:00", startsAt: "12:00" },
  evening: { endsAt: "21:00", startsAt: "17:00" },
  morning: { endsAt: "12:00", startsAt: "09:00" },
};

export const clubPayload = (data: FormData) => ({
  affiliationNumber: optionalText(data, "club-affiliation"),
  clubType: text(data, "club-type"),
  contactEmail: optionalText(data, "club-email"),
  contactPhone: optionalText(data, "club-phone"),
  countyFa: optionalText(data, "club-county-fa"),
  foundedYear: optionalInteger(data, "club-founded"),
  leagues: optionalText(data, "club-leagues"),
  name: text(data, "club-name"),
  sections: allValues(data, "club-sections"),
  slug: text(data, "club-slug"),
  website: optionalUrl(data, "club-website"),
});

/**
 * The API stores one address, the club's home ground. When the person added a
 * separate training ground we send that, otherwise the club address.
 */
export const locationPayload = (data: FormData) => {
  const venueName = text(data, "club-venue-name");
  const prefix = venueName.length > 0 ? "club-venue" : "club-hq";
  return {
    city: text(data, `${prefix}-city`),
    countryCode: DEFAULT_COUNTRY,
    line1: text(data, `${prefix}-line1`),
    line2: optionalText(data, `${prefix}-line2`),
    postalCode: optionalText(data, `${prefix}-postcode`),
    region: optionalText(data, `${prefix}-county`),
    venueName: venueName.length > 0 ? venueName : text(data, "club-name"),
  };
};

export const governancePayload = (data: FormData) => {
  const ownerIsWelfareOfficer = !(
    data.has("welfare-name") || data.has("welfare-email")
  );
  return {
    insuranceExpiresOn: optionalText(data, "insurance-expiry"),
    insurancePolicyNumber: optionalText(data, "insurance-policy-number"),
    insuranceProvider: optionalText(data, "insurance-provider"),
    legalStructure: text(data, "legal-structure"),
    registrationNumber: optionalText(data, "registration-number"),
    safeguardingPolicyReviewOn: optionalText(data, "policy-review-date"),
    vatNumber: optionalText(data, "vat-number"),
    vatRegistered: isChecked(data, "vat-registered"),
    welfareOfficerEmail: ownerIsWelfareOfficer
      ? null
      : optionalText(data, "welfare-email"),
    welfareOfficerName: ownerIsWelfareOfficer
      ? null
      : optionalText(data, "welfare-name"),
  };
};

export const schedulePayload = (data: FormData) => {
  const slots: { dayOfWeek: number; endsAt: string; startsAt: string }[] = [];
  for (const [dayIndex, day] of DAYS.entries()) {
    for (const slot of TIME_SLOTS) {
      const times = SLOT_TIMES[slot.value];
      const ticked = isChecked(
        data,
        `club-schedule-${day.value}-${slot.value}`
      );
      if (times !== undefined && ticked) {
        slots.push({ dayOfWeek: dayIndex + 1, ...times });
      }
    }
  }
  return { slots };
};

export const feesPayload = (data: FormData) => ({
  absorbDirectDebitFee: isChecked(data, "club-absorbs-dd-fee"),
  frequency: text(data, "fee-frequency"),
  joiningFeeMinor: optionalMinorUnits(data, "fee-joining"),
  kitFeeMinor: optionalMinorUnits(data, "fee-kit"),
  lateReminders: isChecked(data, "fee-late-reminders"),
  matchFeeMinor: optionalMinorUnits(data, "fee-match"),
  siblingDiscount: isChecked(data, "fee-sibling-discount"),
  subscriptionMinor: optionalMinorUnits(data, "fee-subscription") ?? 0,
});

const SOCIAL_BASE_URLS = {
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  x: "https://x.com/",
} as const;
type SocialPlatform = keyof typeof SOCIAL_BASE_URLS;
const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "x",
];

const LEADING_AT = /^@/u;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;
const LOOKS_LIKE_DOMAIN = /\.[a-z]{2,}\//iu;

/** A handle ("@club") or a pasted address becomes a full link. */
const socialUrl = (platform: SocialPlatform, value: string): string => {
  if (HAS_SCHEME.test(value)) {
    return value;
  }
  if (LOOKS_LIKE_DOMAIN.test(value)) {
    return `https://${value}`;
  }
  return `${SOCIAL_BASE_URLS[platform]}${value.replace(LEADING_AT, "")}`;
};

export const socialPayload = (data: FormData) => {
  const links: { platform: SocialPlatform; url: string }[] = [];
  for (const platform of SOCIAL_PLATFORMS) {
    const value = text(data, `club-${platform}`);
    if (value.length > 0) {
      links.push({ platform, url: socialUrl(platform, value) });
    }
  }
  return {
    copyParentsOnMessages: isChecked(data, "club-policy-copy-parents"),
    links,
    noPrivateMessages: isChecked(data, "club-policy-no-private-messages"),
    publishResults: isChecked(data, "club-policy-results"),
  };
};

export interface ClubSave {
  payload: Record<string, unknown>;
  step: ClubApiStep;
}

/**
 * What to save when the person continues from a wizard step. The club's phone,
 * email and website are asked on the location step but belong to the club
 * step, so continuing from there saves both.
 */
export const clubSavesForStep = (
  stepId: string,
  data: FormData
): ClubSave[] => {
  switch (stepId) {
    case "club": {
      return [{ payload: clubPayload(data), step: "club" }];
    }
    case "location": {
      return [
        { payload: clubPayload(data), step: "club" },
        { payload: locationPayload(data), step: "location" },
      ];
    }
    case "governance": {
      return [{ payload: governancePayload(data), step: "governance" }];
    }
    case "schedule": {
      return [{ payload: schedulePayload(data), step: "schedule" }];
    }
    case "fees": {
      return [{ payload: feesPayload(data), step: "fees" }];
    }
    case "social": {
      return [{ payload: socialPayload(data), step: "social" }];
    }
    default: {
      return [];
    }
  }
};
