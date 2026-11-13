import {
  allValues,
  isChecked,
  optionalInteger,
  optionalText,
  text,
} from "@/lib/onboarding/form-data";

/** One call to the API: which step to save and what to send. */
export type MemberStepName =
  | "address"
  | "availability"
  | "billing"
  | "children"
  | "dbs"
  | "details"
  | "emergency"
  | "permissions"
  | "role"
  | "safeguarding"
  | "safety"
  | "social"
  | "you";

export interface MemberSave {
  payload: Record<string, unknown>;
  step: MemberStepName;
}

/** The answers could not be turned into a save. `message` is ready to show. */
export interface MemberStepProblem {
  message: string;
}

export type MemberSavePlan =
  | { problem: MemberStepProblem }
  | { saves: MemberSave[] };

const COUNTRY_CODE = "GB";
const FIRST_DAY_OF_WEEK = 1;
const CHILD_NAME_FIELD = /^child-(?<id>\d+)-first-name$/u;
const ROW_PRIMARY_FIELD = /-(?<id>\d+)-primary$/u;

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const SLOTS = ["morning", "afternoon", "evening"] as const;
const SOCIAL_PLATFORMS = ["facebook", "instagram", "tiktok", "x"] as const;

// What the wizard's dropdowns say, as the API words them.
const RELATIONSHIPS: Record<string, string> = {
  grandparent: "grandparent",
  guardian: "guardian",
  parent: "parent",
};
const DBS_LEVELS: Record<string, string> = {
  basic: "basic",
  enhanced: "enhanced",
  "enhanced-with-barred-list-check": "enhanced_barred_list",
  standard: "standard",
};

const relationship = (value: string): string => RELATIONSHIPS[value] ?? "other";

/** "Alex Taylor" as a first and last name. A single word has no last name. */
const splitName = (full: string): { firstName: string; lastName: string } => {
  const [firstName = "", ...rest] = full.trim().split(/\s+/u);
  return { firstName, lastName: rest.join(" ") };
};

/** The row numbers of a repeatable list (emergency contacts and the like). */
export const rowIds = (data: FormData, idPrefix: string): string[] => {
  const ids: string[] = [];
  for (const key of data.keys()) {
    if (key.startsWith(`${idPrefix}-`)) {
      const match = ROW_PRIMARY_FIELD.exec(key.slice(idPrefix.length));
      if (match?.groups?.id !== undefined) {
        ids.push(match.groups.id);
      }
    }
  }
  return ids;
};

const kitFor = (data: FormData, prefix: string) => ({
  pickupRule: optionalText(data, `${prefix}-travel-pickup`),
  shirtName: optionalText(data, `${prefix}-shirt-name`),
  shirtSize: optionalText(data, `${prefix}-shirt-size`),
  shortsSize: optionalText(data, `${prefix}-shorts-size`),
  squadNumber: optionalInteger(data, `${prefix}-squad-number`),
});

const addressFor = (data: FormData, prefix: string) => ({
  city: text(data, `${prefix}-city`),
  countryCode: COUNTRY_CODE,
  line1: text(data, `${prefix}-line1`),
  line2: optionalText(data, `${prefix}-line2`),
  postalCode: optionalText(data, `${prefix}-postcode`),
  region: optionalText(data, `${prefix}-county`),
});

const detailsPayload = (data: FormData) => {
  const kit = kitFor(data, "player");
  return {
    additionalNeeds: optionalText(data, "me-additional-needs"),
    dateOfBirth: optionalText(data, "me-dob"),
    email: optionalText(data, "me-email"),
    ethnicity: optionalText(data, "me-ethnicity"),
    firstName: text(data, "me-first-name"),
    gender: optionalText(data, "me-gender"),
    kit: { ...kit, pickupRule: null },
    lastName: text(data, "me-last-name"),
    phone: optionalText(data, "me-phone"),
    position: optionalText(data, "player-position"),
    preferredName: null,
    religion: optionalText(data, "me-religion"),
  };
};

const contactsPayload = (data: FormData) =>
  rowIds(data, "me-emergency").map((id) => {
    const prefix = `me-emergency-${id}`;
    return {
      canCollect: false,
      ...splitName(text(data, `${prefix}-primary`)),
      phone: text(data, `${prefix}-secondary`),
      relationship: relationship(text(data, `${prefix}-select`)),
    };
  });

const safetyPayload = (data: FormData) => ({
  contacts: contactsPayload(data),
  emergencyTreatment: isChecked(data, "me-emergency-treatment"),
  medical: {
    allergies: [],
    conditions: optionalText(data, "me-conditions"),
    medication: optionalText(data, "me-medication"),
  },
});

const dbsPayload = (data: FormData) => {
  const level = DBS_LEVELS[text(data, "me-dbs-level")];
  const [badge] = rowIds(data, "me-badge");
  const badgeTitle =
    badge === undefined ? "" : text(data, `me-badge-${badge}-select`);
  return {
    coaching:
      badge === undefined || badgeTitle.length === 0
        ? null
        : {
            awardedBy: null,
            expiresOn: optionalText(data, `me-badge-${badge}-secondary`),
            issuedOn: null,
            title: badgeTitle,
          },
    dbs:
      level === undefined
        ? null
        : {
            expiresOn: null,
            fileId: null,
            issuedOn: optionalText(data, "me-dbs-issued"),
            level,
            onUpdateService: isChecked(data, "me-dbs-update-service"),
            reference: optionalText(data, "me-dbs-number"),
          },
    firstAidExpiresOn: optionalText(data, "me-first-aid-expiry"),
    safeguardingTrainingExpiresOn: optionalText(data, "me-safeguarding-expiry"),
  };
};

const availabilityPayload = (data: FormData) => {
  const slots: { dayOfWeek: number; slot: string }[] = [];
  for (const [dayIndex, day] of DAYS.entries()) {
    for (const slot of SLOTS) {
      if (isChecked(data, `me-availability-${day}-${slot}`)) {
        slots.push({ dayOfWeek: dayIndex + FIRST_DAY_OF_WEEK, slot });
      }
    }
  }
  return { notes: optionalText(data, "me-availability-notes"), slots };
};

/** The consents a set of consent switches stands for. Prefix is e.g. `me-media`. */
const consentsFor = (data: FormData, media: string, travel?: string) => ({
  dataSharing: isChecked(data, `${media}-press`),
  photoVideo:
    isChecked(data, `${media}-photos`) || isChecked(data, `${media}-videos`),
  socialMedia: allValues(data, `${media}-platforms`).length > 0,
  ...(travel === undefined
    ? {}
    : {
        travel: ["away-fixtures", "other-parents", "minibus", "overnight"].some(
          (name) => isChecked(data, `${travel}-${name}`)
        ),
      }),
});

const otherGuardianFor = (data: FormData, prefix: string) => {
  if (!isChecked(data, `${prefix}-has-guardian`)) {
    return null;
  }
  return {
    email: optionalText(data, `${prefix}-guardian-email`),
    ...splitName(text(data, `${prefix}-guardian-name`)),
    hasParentalResponsibility: isChecked(
      data,
      `${prefix}-guardian-responsibility`
    ),
    isEmergencyContact: isChecked(data, `${prefix}-guardian-emergency`),
    phone: optionalText(data, `${prefix}-guardian-phone`),
    relationship: relationship(text(data, `${prefix}-guardian-relationship`)),
  };
};

/** The ids the wizard gave each child, in the order they were added. */
const childIds = (data: FormData): string[] => {
  const ids: string[] = [];
  for (const key of data.keys()) {
    const match = CHILD_NAME_FIELD.exec(key);
    if (match?.groups?.id !== undefined) {
      ids.push(match.groups.id);
    }
  }
  return ids;
};

const childPayload = (data: FormData, id: string) => {
  const prefix = `child-${id}`;
  const kit = kitFor(data, prefix);
  return {
    consents: {
      ...consentsFor(data, `${prefix}-media`, `${prefix}-travel`),
      medicalTreatment: isChecked(data, `${prefix}-emergency-treatment`),
    },
    dateOfBirth: text(data, `${prefix}-dob`),
    firstName: text(data, `${prefix}-first-name`),
    kit,
    lastName: text(data, `${prefix}-last-name`),
    medical: {
      allergies: [],
      conditions: optionalText(data, `${prefix}-conditions`),
      medication: optionalText(data, `${prefix}-medication`),
    },
    otherGuardian: otherGuardianFor(data, prefix),
    position: optionalText(data, `${prefix}-position`),
  };
};

const billingPayload = (data: FormData) => {
  const secondPayerName = optionalText(data, "second-payer-name");
  const isParent = data.get("role") === "parent" || secondPayerName !== null;
  const secondPayerEmail = optionalText(data, "second-payer-email");
  let payer = "player";
  if (isParent) {
    payer = secondPayerName === null ? "me" : "split";
  }
  return {
    billingEmail: optionalText(data, "billing-email"),
    method: optionalText(data, "billing-method"),
    payer,
    secondPayerEmail,
    secondPayerName,
    sendReminders: true,
  };
};

const socialPayload = (data: FormData) => {
  const links: { handle: string; platform: string }[] = [];
  for (const platform of SOCIAL_PLATFORMS) {
    const handle = text(data, `me-${platform}`);
    if (handle.length > 0) {
      links.push({ handle, platform });
    }
  }
  return {
    consents: {
      ...consentsFor(data, "me-media"),
      medicalTreatment: isChecked(data, "me-emergency-treatment"),
    },
    links,
  };
};

const needsFullName = (full: string): boolean =>
  splitName(full).lastName.length === 0;

/** Something a person must fix before this step can be saved, or null. */
const problemWith = (stepId: string, data: FormData): string | null => {
  if (stepId === "safety") {
    const incomplete = rowIds(data, "me-emergency").some((id) => {
      const name = text(data, `me-emergency-${id}-primary`);
      return name.length === 0 || needsFullName(name);
    });
    return incomplete
      ? "Enter a first and last name for each emergency contact."
      : null;
  }
  if (stepId === "children") {
    const incomplete = childIds(data).some(
      (id) =>
        text(data, `child-${id}-first-name`).length === 0 ||
        text(data, `child-${id}-last-name`).length === 0 ||
        text(data, `child-${id}-dob`).length === 0
    );
    return incomplete
      ? "Each child needs a first name, last name and date of birth."
      : null;
  }
  return null;
};

export interface MemberPlanOptions {
  /** True once the children have been saved. They are only created once. */
  childrenSaved: boolean;
}

/**
 * What to send for a step of the people wizard.
 *
 * Children are saved together with their photo, travel and chat choices, on the
 * "permissions" step, because the API gives each child an id only when it is
 * created. The "children" step itself only checks the answers.
 */
export const memberSavesForStep = (
  stepId: string,
  data: FormData,
  { childrenSaved }: MemberPlanOptions
): MemberSavePlan => {
  const message = problemWith(stepId, data);
  if (message !== null) {
    return { problem: { message } };
  }
  switch (stepId) {
    case "role": {
      return {
        saves: [{ payload: { role: text(data, "role") }, step: "role" }],
      };
    }
    case "details": {
      return { saves: [{ payload: detailsPayload(data), step: "details" }] };
    }
    case "address": {
      return {
        saves: [{ payload: addressFor(data, "me-home"), step: "address" }],
      };
    }
    case "safety": {
      // Extra needs live on the details record, so it is saved again here.
      return {
        saves: [
          { payload: detailsPayload(data), step: "details" },
          { payload: safetyPayload(data), step: "safety" },
        ],
      };
    }
    case "dbs": {
      return { saves: [{ payload: dbsPayload(data), step: "dbs" }] };
    }
    case "availability": {
      return {
        saves: [{ payload: availabilityPayload(data), step: "availability" }],
      };
    }
    case "permissions": {
      const saves: MemberSave[] = childrenSaved
        ? []
        : [
            {
              payload: {
                archiveChildIds: [],
                children: childIds(data).map((id) => childPayload(data, id)),
              },
              step: "children",
            },
          ];
      // The permissions step is saved empty so it is marked as done.
      saves.push({ payload: { children: [] }, step: "permissions" });
      return { saves };
    }
    case "billing": {
      return { saves: [{ payload: billingPayload(data), step: "billing" }] };
    }
    case "social": {
      return { saves: [{ payload: socialPayload(data), step: "social" }] };
    }
    default: {
      return { saves: [] };
    }
  }
};

/** Whether this step is the one that creates the children. */
export const createsChildren = (stepId: string): boolean =>
  stepId === "permissions";

const FOUNDER_STEPS: ReadonlySet<string> = new Set([
  "you",
  "emergency",
  "safeguarding",
]);

/** Whether a club wizard step is the founder's own details, saved as a member. */
export const isFounderStep = (stepId: string): boolean =>
  FOUNDER_STEPS.has(stepId);

/** The club wizard names the founder's fields `owner-...`; the people steps use `me-...`. */
const asMemberAnswers = (data: FormData): FormData => {
  const renamed = new FormData();
  for (const [key, value] of data.entries()) {
    renamed.append(key.replace(/^owner-/u, "me-"), value);
  }
  return renamed;
};

/** What to send for the founder's steps in the club wizard. */
export const founderSavesForStep = (
  stepId: string,
  data: FormData
): MemberSavePlan => {
  const answers = asMemberAnswers(data);
  switch (stepId) {
    case "you": {
      const saves: MemberSave[] = [
        { payload: detailsPayload(answers), step: "you" },
      ];
      if (text(answers, "me-home-line1").length > 0) {
        saves.push({
          payload: addressFor(answers, "me-home"),
          step: "address",
        });
      }
      return { saves };
    }
    case "emergency": {
      const message = problemWith("safety", answers);
      if (message !== null) {
        return { problem: { message } };
      }
      return {
        saves: [
          // Extra needs live on the details record, so it is saved again here.
          { payload: detailsPayload(answers), step: "you" },
          { payload: safetyPayload(answers), step: "emergency" },
        ],
      };
    }
    case "safeguarding": {
      return {
        saves: [{ payload: dbsPayload(answers), step: "safeguarding" }],
      };
    }
    default: {
      return { saves: [] };
    }
  }
};
