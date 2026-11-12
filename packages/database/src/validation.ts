/**
 * Zod schemas for our own tables, derived from the Drizzle schema with
 * `drizzle-orm/zod`. This is the only place table shapes are turned into
 * validators: do not hand-write zod objects that mirror a table, because they
 * drift from the database. Import these instead.
 *
 * Authentication tables (users, sessions, accounts, verifications,
 * organizations, members, invitations) are deliberately NOT here. Better Auth
 * owns and validates them.
 *
 * - `*SelectSchema`: a row as read from the database. Validate API responses.
 * - `*InsertSchema`: a row to create. Validate API requests.
 * - `*UpdateSchema`: a partial row to change. Validate API requests.
 *
 * Refinements only add rules the column types can't express (enum values,
 * non-negative sizes). When you add a table, add its three schemas and an
 * entry in `tableSchemas`; `tests/validation.test.ts` fails if you forget.
 */

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import { z } from "zod";

import {
  CLUB_SECTIONS,
  CLUB_TYPES,
  FEE_FREQUENCIES,
  LEGAL_STRUCTURES,
  SOCIAL_PLATFORMS,
  clubFeeSettings,
  clubProfiles,
  clubSocialLinks,
  clubTrainingSlots,
} from "./schema/club/club-profile";
import { clubSettings } from "./schema/club/club-settings";
import { opponents } from "./schema/club/opponents";
import { PITCH_FORMATS, PITCH_SURFACES, pitches } from "./schema/club/pitches";
import { VENUE_KINDS, venues } from "./schema/club/venues";
import { announcements } from "./schema/communications/announcements";
import {
  NOTIFICATION_KINDS,
  notifications,
} from "./schema/communications/notifications";
import {
  FILE_KINDS,
  FILE_STATUSES,
  fileViews,
  files,
} from "./schema/files/files";
import {
  STRIPE_CAPABILITY_STATUSES,
  clubStripeAccounts,
} from "./schema/finance/club-stripe-accounts";
import { CHARGE_STATUSES, feeCharges } from "./schema/finance/fee-charges";
import { fees } from "./schema/finance/fees";
import { PAYMENT_METHODS, payments } from "./schema/finance/payments";
import {
  ATTENDANCE_STATUSES,
  eventAttendance,
} from "./schema/football/event-attendance";
import {
  AVAILABILITY_STATUSES,
  eventAvailability,
} from "./schema/football/event-availability";
import { EVENT_KINDS } from "./schema/football/event-kinds";
import { eventSeries } from "./schema/football/event-series";
import { EVENT_STATUSES, events } from "./schema/football/events";
import {
  HOME_AWAY_VALUES,
  matchDetails,
} from "./schema/football/match-details";
import { SQUAD_ROLES, matchSquad } from "./schema/football/match-squad";
import {
  REGISTRATION_STATUSES,
  registrations,
} from "./schema/football/registrations";
import { seasons } from "./schema/football/seasons";
import {
  TEAM_MEMBER_ROLES,
  teamMemberships,
} from "./schema/football/team-memberships";
import { teams } from "./schema/football/teams";
import { auditEvents } from "./schema/governance/audit-events";
import { consents } from "./schema/governance/consent";
import { consentDocuments } from "./schema/governance/consent-documents";
import { CONSENT_TYPES } from "./schema/governance/consent-types";
import { roleAssignmentTeams } from "./schema/governance/role-assignment-teams";
import {
  ROLE_ASSIGNMENT_ROLES,
  ROLE_ASSIGNMENT_SCOPES,
  roleAssignments,
} from "./schema/governance/role-assignments";
import {
  ONBOARDING_FLOWS,
  onboardingDrafts,
} from "./schema/onboarding/onboarding-drafts";
import {
  ONBOARDING_STEPS,
  ORGANIZATION_ONBOARDING_STEPS,
  USER_ONBOARDING_STEPS,
  onboardingSteps,
} from "./schema/onboarding/onboarding-steps";
import { addresses } from "./schema/people/addresses";
import { ALLERGY_SEVERITIES, allergies } from "./schema/people/allergies";
import {
  MEDICAL_RECORD_KINDS,
  medicalRecords,
} from "./schema/people/medical-records";
import {
  AVAILABILITY_SLOTS,
  PAYERS,
  PAYMENT_METHODS_PREFERRED,
  PICKUP_RULES,
  memberBillingPreferences,
  personAvailability,
  personDemographics,
  personKit,
} from "./schema/people/member-profile";
import { people } from "./schema/people/people";
import {
  IDENTIFIER_TYPES,
  personIdentifiers,
} from "./schema/people/person-identifiers";
import {
  PREFERRED_FEET,
  playerProfiles,
} from "./schema/people/player-profiles";
import {
  QUALIFICATION_KINDS,
  qualifications,
} from "./schema/people/qualifications";
import {
  RELATIONSHIP_KINDS,
  personRelationships,
} from "./schema/people/relationships";
import {
  DBS_LEVELS,
  SAFEGUARDING_CHECK_KINDS,
  SAFEGUARDING_CHECK_STATUSES,
  safeguardingChecks,
} from "./schema/safeguarding/checks";
import {
  CONCERN_SEVERITIES,
  CONCERN_STATUSES,
  safeguardingConcerns,
} from "./schema/safeguarding/concerns";
import { safeguardingNotes } from "./schema/safeguarding/notes";
import {
  INCIDENT_KINDS,
  INCIDENT_SEVERITIES,
  incidentReports,
} from "./schema/welfare/incident-reports";

// addresses -----------------------------------------------------------------

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/u;
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

const addressRefinements = {
  city: (schema: z.ZodString) => schema.trim().min(1),
  countryCode: (schema: z.ZodString) =>
    schema.regex(COUNTRY_CODE_PATTERN, "Use a 2-letter ISO country code"),
  latitude: (schema: z.ZodNumber) =>
    schema.min(-MAX_LATITUDE).max(MAX_LATITUDE),
  line1: (schema: z.ZodString) => schema.trim().min(1),
  longitude: (schema: z.ZodNumber) =>
    schema.min(-MAX_LONGITUDE).max(MAX_LONGITUDE),
};

export const addressSelectSchema = createSelectSchema(
  addresses,
  addressRefinements
);
export const addressInsertSchema = createInsertSchema(
  addresses,
  addressRefinements
);
export const addressUpdateSchema = createUpdateSchema(
  addresses,
  addressRefinements
);

// audit_events --------------------------------------------------------------

// "entity.verb", lower case with underscores: "person.read", "safeguarding_concern.update".
const AUDIT_ACTION_PATTERN = /^[a-z][a-z_]*\.[a-z][a-z_]*$/u;

const auditEventRefinements = {
  action: (schema: z.ZodString) =>
    schema.regex(AUDIT_ACTION_PATTERN, "Use the form entity.verb"),
  entityType: (schema: z.ZodString) => schema.trim().min(1),
};

export const auditEventSelectSchema = createSelectSchema(
  auditEvents,
  auditEventRefinements
);
export const auditEventInsertSchema = createInsertSchema(
  auditEvents,
  auditEventRefinements
);
// Present because every table has all three, but the database rejects updates to audit events.
export const auditEventUpdateSchema = createUpdateSchema(
  auditEvents,
  auditEventRefinements
);

// allergies -----------------------------------------------------------------

const allergyRefinements = {
  allergen: (schema: z.ZodString) => schema.trim().min(1),
  severity: () => z.enum(ALLERGY_SEVERITIES),
};

export const allergySelectSchema = createSelectSchema(
  allergies,
  allergyRefinements
);
export const allergyInsertSchema = createInsertSchema(
  allergies,
  allergyRefinements
);
export const allergyUpdateSchema = createUpdateSchema(
  allergies,
  allergyRefinements
);

// medical_records -----------------------------------------------------------

const medicalRecordRefinements = {
  endedOn: () => z.iso.date(),
  kind: () => z.enum(MEDICAL_RECORD_KINDS),
  name: (schema: z.ZodString) => schema.trim().min(1),
  startedOn: () => z.iso.date(),
};

// The database also enforces this with a check constraint. An update may carry only one date.
const medicalRecordEndsOnOrAfterStart = (record: {
  endedOn?: string | null;
  startedOn?: string | null;
}) =>
  record.endedOn === undefined ||
  record.endedOn === null ||
  record.startedOn === undefined ||
  record.startedOn === null ||
  record.endedOn >= record.startedOn;
const medicalRecordDatesIssue = {
  message: "A record cannot end before it starts",
  path: ["endedOn"],
};

export const medicalRecordSelectSchema = createSelectSchema(
  medicalRecords,
  medicalRecordRefinements
);
export const medicalRecordInsertSchema = createInsertSchema(
  medicalRecords,
  medicalRecordRefinements
).refine(medicalRecordEndsOnOrAfterStart, medicalRecordDatesIssue);
export const medicalRecordUpdateSchema = createUpdateSchema(
  medicalRecords,
  medicalRecordRefinements
).refine(medicalRecordEndsOnOrAfterStart, medicalRecordDatesIssue);

// consents ------------------------------------------------------------------

const consentRefinements = {
  type: () => z.enum(CONSENT_TYPES),
};

// The database also enforces this with a check constraint. An update may carry only some dates.
const consentDatesInOrder = (consent: {
  expiresAt?: Date | null;
  grantedAt?: Date;
  withdrawnAt?: Date | null;
}) => {
  const { expiresAt, grantedAt, withdrawnAt } = consent;
  if (grantedAt === undefined) {
    return true;
  }
  const withdrawnInOrder =
    withdrawnAt === undefined ||
    withdrawnAt === null ||
    withdrawnAt >= grantedAt;
  const expiresInOrder =
    expiresAt === undefined || expiresAt === null || expiresAt > grantedAt;
  return withdrawnInOrder && expiresInOrder;
};
const consentDatesIssue = {
  message: "Withdrawal cannot precede the grant, and expiry must follow it",
};

export const consentSelectSchema = createSelectSchema(
  consents,
  consentRefinements
);
export const consentInsertSchema = createInsertSchema(
  consents,
  consentRefinements
).refine(consentDatesInOrder, consentDatesIssue);
export const consentUpdateSchema = createUpdateSchema(
  consents,
  consentRefinements
).refine(consentDatesInOrder, consentDatesIssue);

// incident_reports ----------------------------------------------------------

const incidentReportRefinements = {
  description: (schema: z.ZodString) => schema.trim().min(1),
  kind: () => z.enum(INCIDENT_KINDS),
  severity: () => z.enum(INCIDENT_SEVERITIES),
};

export const incidentReportSelectSchema = createSelectSchema(
  incidentReports,
  incidentReportRefinements
);
export const incidentReportInsertSchema = createInsertSchema(
  incidentReports,
  incidentReportRefinements
);
export const incidentReportUpdateSchema = createUpdateSchema(
  incidentReports,
  incidentReportRefinements
);

// safeguarding_checks -------------------------------------------------------

const safeguardingCheckRefinements = {
  dbsLevel: () => z.enum(DBS_LEVELS),
  expiresOn: () => z.iso.date(),
  issuedOn: () => z.iso.date(),
  kind: () => z.enum(SAFEGUARDING_CHECK_KINDS),
  reference: (schema: z.ZodString) => schema.trim().min(1),
  status: () => z.enum(SAFEGUARDING_CHECK_STATUSES),
};

// The database also enforces this with a check constraint. An update may carry only one date.
const checkExpiresOnOrAfterIssue = (safeguardingCheck: {
  expiresOn?: string | null;
  issuedOn?: string | null;
}) =>
  safeguardingCheck.expiresOn === undefined ||
  safeguardingCheck.expiresOn === null ||
  safeguardingCheck.issuedOn === undefined ||
  safeguardingCheck.issuedOn === null ||
  safeguardingCheck.expiresOn >= safeguardingCheck.issuedOn;
const checkDatesIssue = {
  message: "A check cannot expire before it was issued",
  path: ["expiresOn"],
};

export const safeguardingCheckSelectSchema = createSelectSchema(
  safeguardingChecks,
  safeguardingCheckRefinements
);
export const safeguardingCheckInsertSchema = createInsertSchema(
  safeguardingChecks,
  safeguardingCheckRefinements
).refine(checkExpiresOnOrAfterIssue, checkDatesIssue);
export const safeguardingCheckUpdateSchema = createUpdateSchema(
  safeguardingChecks,
  safeguardingCheckRefinements
).refine(checkExpiresOnOrAfterIssue, checkDatesIssue);

// safeguarding_concerns -----------------------------------------------------

const concernRefinements = {
  severity: () => z.enum(CONCERN_SEVERITIES),
  status: () => z.enum(CONCERN_STATUSES),
  summary: (schema: z.ZodString) => schema.trim().min(1),
};

// A concern is closed exactly when it has a closing time. The database enforces this too.
const insertedConcernClosedConsistently = (concern: {
  closedAt?: Date | null;
  status?: string;
}) =>
  ((concern.status ?? "open") === "closed") ===
  (concern.closedAt !== undefined && concern.closedAt !== null);
// An update may change only one of the two, so only judge it when it carries both.
const updatedConcernClosedConsistently = (concern: {
  closedAt?: Date | null;
  status?: string;
}) =>
  concern.status === undefined ||
  concern.closedAt === undefined ||
  (concern.status === "closed") === (concern.closedAt !== null);
const concernClosedIssue = {
  message: "A concern is closed exactly when it has a closing time",
  path: ["closedAt"],
};

export const safeguardingConcernSelectSchema = createSelectSchema(
  safeguardingConcerns,
  concernRefinements
);
export const safeguardingConcernInsertSchema = createInsertSchema(
  safeguardingConcerns,
  concernRefinements
).refine(insertedConcernClosedConsistently, concernClosedIssue);
export const safeguardingConcernUpdateSchema = createUpdateSchema(
  safeguardingConcerns,
  concernRefinements
).refine(updatedConcernClosedConsistently, concernClosedIssue);

// safeguarding_notes --------------------------------------------------------

const safeguardingNoteRefinements = {
  body: (schema: z.ZodString) => schema.trim().min(1),
};

export const safeguardingNoteSelectSchema = createSelectSchema(
  safeguardingNotes,
  safeguardingNoteRefinements
);
export const safeguardingNoteInsertSchema = createInsertSchema(
  safeguardingNotes,
  safeguardingNoteRefinements
);
// Present because every table has all three, but the database rejects updates to notes.
export const safeguardingNoteUpdateSchema = createUpdateSchema(
  safeguardingNotes,
  safeguardingNoteRefinements
);

// role_assignments ----------------------------------------------------------

// Only these roles can be limited to some teams. Keep in step with the
// roleAssignments_teamScope_chk check constraint.
const TEAM_SCOPED_ROLES: ReadonlySet<string> = new Set([
  "coach",
  "team_manager",
]);

const roleAssignmentRefinements = {
  role: () => z.enum(ROLE_ASSIGNMENT_ROLES),
  scope: () => z.enum(ROLE_ASSIGNMENT_SCOPES),
};

// The database also enforces both rules with check constraints. An update may carry only some fields.
const roleAssignmentRules = (assignment: {
  endsAt?: Date | null;
  role?: string;
  scope?: string;
  startsAt?: Date;
}) => {
  const scopeAllowed =
    assignment.scope !== "teams" ||
    assignment.role === undefined ||
    TEAM_SCOPED_ROLES.has(assignment.role);
  const datesInOrder =
    assignment.endsAt === undefined ||
    assignment.endsAt === null ||
    assignment.startsAt === undefined ||
    assignment.endsAt >= assignment.startsAt;
  return scopeAllowed && datesInOrder;
};
const roleAssignmentIssue = {
  message:
    "Only coaches and team managers can be limited to teams, and a role cannot end before it starts",
};

export const roleAssignmentSelectSchema = createSelectSchema(
  roleAssignments,
  roleAssignmentRefinements
);
export const roleAssignmentInsertSchema = createInsertSchema(
  roleAssignments,
  roleAssignmentRefinements
).refine(roleAssignmentRules, roleAssignmentIssue);
export const roleAssignmentUpdateSchema = createUpdateSchema(
  roleAssignments,
  roleAssignmentRefinements
).refine(roleAssignmentRules, roleAssignmentIssue);

// role_assignment_teams -----------------------------------------------------

export const roleAssignmentTeamSelectSchema =
  createSelectSchema(roleAssignmentTeams);
export const roleAssignmentTeamInsertSchema =
  createInsertSchema(roleAssignmentTeams);
export const roleAssignmentTeamUpdateSchema =
  createUpdateSchema(roleAssignmentTeams);

// seasons -------------------------------------------------------------------

const seasonRefinements = {
  endsOn: () => z.iso.date(),
  name: (schema: z.ZodString) => schema.trim().min(1),
  startsOn: () => z.iso.date(),
};

// The database also enforces this with a check constraint. An update may carry only one date.
const endsAfterStart = (season: { endsOn?: string; startsOn?: string }) =>
  season.startsOn === undefined ||
  season.endsOn === undefined ||
  season.endsOn > season.startsOn;
const endsAfterStartIssue = {
  message: "A season must end after it starts",
  path: ["endsOn"],
};

export const seasonSelectSchema = createSelectSchema(
  seasons,
  seasonRefinements
);
export const seasonInsertSchema = createInsertSchema(
  seasons,
  seasonRefinements
).refine(endsAfterStart, endsAfterStartIssue);
export const seasonUpdateSchema = createUpdateSchema(
  seasons,
  seasonRefinements
).refine(endsAfterStart, endsAfterStartIssue);

// teams ---------------------------------------------------------------------

const MIN_AGE_GROUP = 4;
const MAX_AGE_GROUP = 99;

const teamRefinements = {
  // Under-N: 12 means U12. Null (open age) is allowed by the column.
  ageGroup: (schema: z.ZodNumber) =>
    schema.int().min(MIN_AGE_GROUP).max(MAX_AGE_GROUP),
  name: (schema: z.ZodString) => schema.trim().min(1),
};

export const teamSelectSchema = createSelectSchema(teams, teamRefinements);
export const teamInsertSchema = createInsertSchema(teams, teamRefinements);
export const teamUpdateSchema = createUpdateSchema(teams, teamRefinements);

// team_memberships ----------------------------------------------------------

const MAX_SHIRT_NUMBER = 999;

const teamMembershipRefinements = {
  endsOn: () => z.iso.date(),
  role: () => z.enum(TEAM_MEMBER_ROLES),
  shirtNumber: (schema: z.ZodNumber) =>
    schema.int().min(0).max(MAX_SHIRT_NUMBER),
  startsOn: () => z.iso.date(),
};

// The database also enforces this with a check constraint. An update may carry only one date.
const membershipEndsOnOrAfterStart = (membership: {
  endsOn?: string | null;
  startsOn?: string;
}) =>
  membership.startsOn === undefined ||
  membership.endsOn === undefined ||
  membership.endsOn === null ||
  membership.endsOn >= membership.startsOn;
const membershipDatesIssue = {
  message: "A membership cannot end before it starts",
  path: ["endsOn"],
};

export const teamMembershipSelectSchema = createSelectSchema(
  teamMemberships,
  teamMembershipRefinements
);
export const teamMembershipInsertSchema = createInsertSchema(
  teamMemberships,
  teamMembershipRefinements
).refine(membershipEndsOnOrAfterStart, membershipDatesIssue);
export const teamMembershipUpdateSchema = createUpdateSchema(
  teamMemberships,
  teamMembershipRefinements
).refine(membershipEndsOnOrAfterStart, membershipDatesIssue);

// events --------------------------------------------------------------------

const eventRefinements = {
  cancellationReason: (schema: z.ZodString) => schema.trim().min(1),
  kind: () => z.enum(EVENT_KINDS),
  status: () => z.enum(EVENT_STATUSES),
  title: (schema: z.ZodString) => schema.trim().min(1),
};

// The database also enforces these with check constraints. An update may carry only some fields.
const eventEndsAfterStart = (event: { endsAt?: Date; startsAt?: Date }) =>
  event.startsAt === undefined ||
  event.endsAt === undefined ||
  event.endsAt > event.startsAt;
const eventDatesIssue = {
  message: "An event must end after it starts",
  path: ["endsAt"],
};
const eventMeetsBeforeStart = (event: {
  meetAt?: Date | null;
  startsAt?: Date;
}) =>
  event.startsAt === undefined ||
  event.meetAt === undefined ||
  event.meetAt === null ||
  event.meetAt <= event.startsAt;
const eventMeetIssue = {
  message: "Meeting time cannot be after the start",
  path: ["meetAt"],
};

export const eventSelectSchema = createSelectSchema(events, eventRefinements);
export const eventInsertSchema = createInsertSchema(events, eventRefinements)
  .refine(eventEndsAfterStart, eventDatesIssue)
  .refine(eventMeetsBeforeStart, eventMeetIssue);
export const eventUpdateSchema = createUpdateSchema(events, eventRefinements)
  .refine(eventEndsAfterStart, eventDatesIssue)
  .refine(eventMeetsBeforeStart, eventMeetIssue);

// event_series -------------------------------------------------------------

const MAX_INTERVAL_WEEKS = 52;
const MINUTES_PER_DAY = 1440;
const TIME_OF_DAY_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/u;

const isKnownTimeZone = (value: string) => {
  try {
    return (
      new Intl.DateTimeFormat("en", { timeZone: value }) instanceof
      Intl.DateTimeFormat
    );
  } catch {
    return false;
  }
};

const eventSeriesRefinements = {
  durationMinutes: (schema: z.ZodNumber) =>
    schema.int().min(1).max(MINUTES_PER_DAY),
  endsOn: () => z.iso.date(),
  generatedUntil: () => z.iso.date(),
  intervalWeeks: (schema: z.ZodNumber) =>
    schema.int().min(1).max(MAX_INTERVAL_WEEKS),
  kind: () => z.enum(EVENT_KINDS),
  meetMinutesBefore: (schema: z.ZodNumber) =>
    schema.int().min(0).max(MINUTES_PER_DAY),
  startTime: (schema: z.ZodString) => schema.regex(TIME_OF_DAY_PATTERN),
  startsOn: () => z.iso.date(),
  timeZone: (schema: z.ZodString) =>
    schema.trim().refine(isKnownTimeZone, "Unknown time zone"),
  title: (schema: z.ZodString) => schema.trim().min(1),
  weekday: (schema: z.ZodNumber) => schema.int().min(1).max(7),
};

// The database also enforces this with a check constraint. An update may carry only one date.
const seriesEndsOnOrAfterStart = (series: {
  endsOn?: string | null;
  startsOn?: string;
}) =>
  series.startsOn === undefined ||
  series.endsOn === undefined ||
  series.endsOn === null ||
  series.endsOn >= series.startsOn;
const seriesDatesIssue = {
  message: "A series cannot end before it starts",
  path: ["endsOn"],
};

export const eventSeriesSelectSchema = createSelectSchema(
  eventSeries,
  eventSeriesRefinements
);
export const eventSeriesInsertSchema = createInsertSchema(
  eventSeries,
  eventSeriesRefinements
).refine(seriesEndsOnOrAfterStart, seriesDatesIssue);
export const eventSeriesUpdateSchema = createUpdateSchema(
  eventSeries,
  eventSeriesRefinements
).refine(seriesEndsOnOrAfterStart, seriesDatesIssue);

// match_details -------------------------------------------------------------

const matchDetailRefinements = {
  goalsAgainst: (schema: z.ZodNumber) => schema.int().min(0),
  goalsFor: (schema: z.ZodNumber) => schema.int().min(0),
  homeAway: () => z.enum(HOME_AWAY_VALUES),
};

// Both goals are set together, or neither is. On insert an omitted goal is null; an update may carry only one.
interface MatchScore {
  goalsAgainst?: number | null;
  goalsFor?: number | null;
}
const hasGoal = (goal: number | null | undefined) =>
  goal !== undefined && goal !== null;
const matchScoreIsCompleteOnInsert = (match: MatchScore) =>
  hasGoal(match.goalsFor) === hasGoal(match.goalsAgainst);
const matchScoreIsCompleteOnUpdate = (match: MatchScore) =>
  match.goalsFor === undefined ||
  match.goalsAgainst === undefined ||
  (match.goalsFor === null) === (match.goalsAgainst === null);
const matchScoreIssue = {
  message: "Set both goals or neither",
  path: ["goalsAgainst"],
};

export const matchDetailSelectSchema = createSelectSchema(
  matchDetails,
  matchDetailRefinements
);
export const matchDetailInsertSchema = createInsertSchema(
  matchDetails,
  matchDetailRefinements
).refine(matchScoreIsCompleteOnInsert, matchScoreIssue);
export const matchDetailUpdateSchema = createUpdateSchema(
  matchDetails,
  matchDetailRefinements
).refine(matchScoreIsCompleteOnUpdate, matchScoreIssue);

// event_availability --------------------------------------------------------

const eventAvailabilityRefinements = {
  status: () => z.enum(AVAILABILITY_STATUSES),
};

export const eventAvailabilitySelectSchema = createSelectSchema(
  eventAvailability,
  eventAvailabilityRefinements
);
export const eventAvailabilityInsertSchema = createInsertSchema(
  eventAvailability,
  eventAvailabilityRefinements
);
export const eventAvailabilityUpdateSchema = createUpdateSchema(
  eventAvailability,
  eventAvailabilityRefinements
);

// event_attendance ----------------------------------------------------------

const eventAttendanceRefinements = {
  status: () => z.enum(ATTENDANCE_STATUSES),
};

export const eventAttendanceSelectSchema = createSelectSchema(
  eventAttendance,
  eventAttendanceRefinements
);
export const eventAttendanceInsertSchema = createInsertSchema(
  eventAttendance,
  eventAttendanceRefinements
);
export const eventAttendanceUpdateSchema = createUpdateSchema(
  eventAttendance,
  eventAttendanceRefinements
);

// match_squad ---------------------------------------------------------------

const MAX_MINUTES_PLAYED = 200;

const matchSquadRefinements = {
  goals: (schema: z.ZodNumber) => schema.int().min(0),
  minutesPlayed: (schema: z.ZodNumber) =>
    schema.int().min(0).max(MAX_MINUTES_PLAYED),
  role: () => z.enum(SQUAD_ROLES),
  shirtNumber: (schema: z.ZodNumber) =>
    schema.int().min(0).max(MAX_SHIRT_NUMBER),
};

export const matchSquadSelectSchema = createSelectSchema(
  matchSquad,
  matchSquadRefinements
);
export const matchSquadInsertSchema = createInsertSchema(
  matchSquad,
  matchSquadRefinements
);
export const matchSquadUpdateSchema = createUpdateSchema(
  matchSquad,
  matchSquadRefinements
);

// consent_documents ---------------------------------------------------------

const consentDocumentRefinements = {
  body: (schema: z.ZodString) => schema.trim().min(1),
  title: (schema: z.ZodString) => schema.trim().min(1),
  type: () => z.enum(CONSENT_TYPES),
  version: (schema: z.ZodNumber) => schema.int().min(1),
};

export const consentDocumentSelectSchema = createSelectSchema(
  consentDocuments,
  consentDocumentRefinements
);
export const consentDocumentInsertSchema = createInsertSchema(
  consentDocuments,
  consentDocumentRefinements
);
export const consentDocumentUpdateSchema = createUpdateSchema(
  consentDocuments,
  consentDocumentRefinements
);

// player_profiles -----------------------------------------------------------

const MIN_HEIGHT_CM = 50;
const MAX_HEIGHT_CM = 250;

const playerProfileRefinements = {
  heightCm: (schema: z.ZodNumber) =>
    schema.int().min(MIN_HEIGHT_CM).max(MAX_HEIGHT_CM),
  preferredFoot: () => z.enum(PREFERRED_FEET),
};

export const playerProfileSelectSchema = createSelectSchema(
  playerProfiles,
  playerProfileRefinements
);
export const playerProfileInsertSchema = createInsertSchema(
  playerProfiles,
  playerProfileRefinements
);
export const playerProfileUpdateSchema = createUpdateSchema(
  playerProfiles,
  playerProfileRefinements
);

// person_identifiers --------------------------------------------------------

const personIdentifierRefinements = {
  type: () => z.enum(IDENTIFIER_TYPES),
  value: (schema: z.ZodString) => schema.trim().min(1),
};

export const personIdentifierSelectSchema = createSelectSchema(
  personIdentifiers,
  personIdentifierRefinements
);
export const personIdentifierInsertSchema = createInsertSchema(
  personIdentifiers,
  personIdentifierRefinements
);
export const personIdentifierUpdateSchema = createUpdateSchema(
  personIdentifiers,
  personIdentifierRefinements
);

// qualifications ------------------------------------------------------------

const qualificationRefinements = {
  expiresOn: () => z.iso.date(),
  issuedOn: () => z.iso.date(),
  kind: () => z.enum(QUALIFICATION_KINDS),
  title: (schema: z.ZodString) => schema.trim().min(1),
};

// The database also enforces this with a check constraint. An update may carry only one date.
const qualificationExpiresAfterIssue = (qualification: {
  expiresOn?: string | null;
  issuedOn?: string | null;
}) =>
  qualification.issuedOn === undefined ||
  qualification.issuedOn === null ||
  qualification.expiresOn === undefined ||
  qualification.expiresOn === null ||
  qualification.expiresOn >= qualification.issuedOn;
const qualificationDatesIssue = {
  message: "A qualification cannot expire before it was issued",
  path: ["expiresOn"],
};

export const qualificationSelectSchema = createSelectSchema(
  qualifications,
  qualificationRefinements
);
export const qualificationInsertSchema = createInsertSchema(
  qualifications,
  qualificationRefinements
).refine(qualificationExpiresAfterIssue, qualificationDatesIssue);
export const qualificationUpdateSchema = createUpdateSchema(
  qualifications,
  qualificationRefinements
).refine(qualificationExpiresAfterIssue, qualificationDatesIssue);

// pitches -------------------------------------------------------------------

const pitchRefinements = {
  format: () => z.enum(PITCH_FORMATS),
  name: (schema: z.ZodString) => schema.trim().min(1),
  surface: () => z.enum(PITCH_SURFACES),
};

export const pitchSelectSchema = createSelectSchema(pitches, pitchRefinements);
export const pitchInsertSchema = createInsertSchema(pitches, pitchRefinements);
export const pitchUpdateSchema = createUpdateSchema(pitches, pitchRefinements);

// registrations -------------------------------------------------------------

const registrationRefinements = {
  registeredOn: () => z.iso.date(),
  status: () => z.enum(REGISTRATION_STATUSES),
  withdrawnOn: () => z.iso.date(),
};

// The database also enforces this: a registration has a withdrawal date exactly when it is withdrawn.
const registrationInsertIsConsistent = (registration: {
  status?: string;
  withdrawnOn?: string | null;
}) =>
  ((registration.status ?? "pending") === "withdrawn") ===
  (registration.withdrawnOn !== undefined && registration.withdrawnOn !== null);
const registrationUpdateIsConsistent = (registration: {
  status?: string;
  withdrawnOn?: string | null;
}) =>
  registration.status === undefined ||
  registration.withdrawnOn === undefined ||
  (registration.status === "withdrawn") === (registration.withdrawnOn !== null);
const registrationIssue = {
  message: "A withdrawal date is needed exactly when the status is withdrawn",
  path: ["withdrawnOn"],
};

export const registrationSelectSchema = createSelectSchema(
  registrations,
  registrationRefinements
);
export const registrationInsertSchema = createInsertSchema(
  registrations,
  registrationRefinements
).refine(registrationInsertIsConsistent, registrationIssue);
export const registrationUpdateSchema = createUpdateSchema(
  registrations,
  registrationRefinements
).refine(registrationUpdateIsConsistent, registrationIssue);

// fees, fee_charges, payments -----------------------------------------------

const CURRENCY_PATTERN = /^[A-Z]{3}$/u;

const feeRefinements = {
  amountMinor: (schema: z.ZodNumber) => schema.int().min(0),
  currency: (schema: z.ZodString) => schema.regex(CURRENCY_PATTERN),
  dueOn: () => z.iso.date(),
  name: (schema: z.ZodString) => schema.trim().min(1),
};

export const feeSelectSchema = createSelectSchema(fees, feeRefinements);
export const feeInsertSchema = createInsertSchema(fees, feeRefinements);
export const feeUpdateSchema = createUpdateSchema(fees, feeRefinements);

const feeChargeRefinements = {
  amountMinor: (schema: z.ZodNumber) => schema.int().min(0),
  currency: (schema: z.ZodString) => schema.regex(CURRENCY_PATTERN),
  dueOn: () => z.iso.date(),
  status: () => z.enum(CHARGE_STATUSES),
};

// A waived charge needs a reason. An update that does not mention the reason is left to the database.
const waivedChargeHasReason = (charge: {
  status?: string;
  waivedReason?: string | null;
}) =>
  charge.status !== "waived" ||
  (charge.waivedReason !== undefined &&
    charge.waivedReason !== null &&
    charge.waivedReason.trim().length > 0);
const waivedChargeUpdateHasReason = (charge: {
  status?: string;
  waivedReason?: string | null;
}) =>
  charge.status !== "waived" ||
  charge.waivedReason === undefined ||
  waivedChargeHasReason(charge);
const waivedChargeIssue = {
  message: "A waived charge needs a reason",
  path: ["waivedReason"],
};

export const feeChargeSelectSchema = createSelectSchema(
  feeCharges,
  feeChargeRefinements
);
export const feeChargeInsertSchema = createInsertSchema(
  feeCharges,
  feeChargeRefinements
).refine(waivedChargeHasReason, waivedChargeIssue);
export const feeChargeUpdateSchema = createUpdateSchema(
  feeCharges,
  feeChargeRefinements
).refine(waivedChargeUpdateHasReason, waivedChargeIssue);

const paymentRefinements = {
  amountMinor: (schema: z.ZodNumber) => schema.int().min(1),
  currency: (schema: z.ZodString) => schema.regex(CURRENCY_PATTERN),
  method: () => z.enum(PAYMENT_METHODS),
};

export const paymentSelectSchema = createSelectSchema(
  payments,
  paymentRefinements
);
export const paymentInsertSchema = createInsertSchema(
  payments,
  paymentRefinements
);
export const paymentUpdateSchema = createUpdateSchema(
  payments,
  paymentRefinements
);

// club_stripe_accounts ------------------------------------------------------

const STRIPE_ACCOUNT_ID_PATTERN = /^acct_[A-Za-z0-9]+$/u;

const clubStripeAccountRefinements = {
  cardPaymentsStatus: () => z.enum(STRIPE_CAPABILITY_STATUSES),
  stripeAccountId: (schema: z.ZodString) =>
    schema.regex(
      STRIPE_ACCOUNT_ID_PATTERN,
      "Use a Stripe account id (acct_...)"
    ),
};

export const clubStripeAccountSelectSchema = createSelectSchema(
  clubStripeAccounts,
  clubStripeAccountRefinements
);
export const clubStripeAccountInsertSchema = createInsertSchema(
  clubStripeAccounts,
  clubStripeAccountRefinements
);
export const clubStripeAccountUpdateSchema = createUpdateSchema(
  clubStripeAccounts,
  clubStripeAccountRefinements
);

// announcements and notifications -------------------------------------------

const announcementRefinements = {
  body: (schema: z.ZodString) => schema.trim().min(1),
  title: (schema: z.ZodString) => schema.trim().min(1),
};

const announcementExpiresAfterPublish = (announcement: {
  expiresAt?: Date | null;
  publishedAt?: Date | null;
}) =>
  announcement.expiresAt === undefined ||
  announcement.expiresAt === null ||
  announcement.publishedAt === undefined ||
  announcement.publishedAt === null ||
  announcement.expiresAt > announcement.publishedAt;
const announcementIssue = {
  message: "An announcement must expire after it is published",
  path: ["expiresAt"],
};

export const announcementSelectSchema = createSelectSchema(
  announcements,
  announcementRefinements
);
export const announcementInsertSchema = createInsertSchema(
  announcements,
  announcementRefinements
).refine(announcementExpiresAfterPublish, announcementIssue);
export const announcementUpdateSchema = createUpdateSchema(
  announcements,
  announcementRefinements
).refine(announcementExpiresAfterPublish, announcementIssue);

const notificationRefinements = {
  kind: () => z.enum(NOTIFICATION_KINDS),
  title: (schema: z.ZodString) => schema.trim().min(1),
};

// Type and id say what the notification is about, so both are set or neither is.
const notificationEntityIsComplete = (notification: {
  entityId?: string | null;
  entityType?: string | null;
}) =>
  (notification.entityId === undefined || notification.entityId === null) ===
  (notification.entityType === undefined || notification.entityType === null);
const notificationIssue = {
  message: "Set both entityType and entityId, or neither",
  path: ["entityId"],
};

export const notificationSelectSchema = createSelectSchema(
  notifications,
  notificationRefinements
);
export const notificationInsertSchema = createInsertSchema(
  notifications,
  notificationRefinements
).refine(notificationEntityIsComplete, notificationIssue);
export const notificationUpdateSchema = createUpdateSchema(
  notifications,
  notificationRefinements
);

// person_relationships ------------------------------------------------------

const personRelationshipRefinements = {
  relationship: () => z.enum(RELATIONSHIP_KINDS),
};

// The database also enforces this with a check constraint. An update may carry only one id.
const notSelfRelated = (link: {
  personId?: string;
  relatedPersonId?: string;
}) =>
  link.personId === undefined ||
  link.relatedPersonId === undefined ||
  link.personId !== link.relatedPersonId;
const notSelfIssue = {
  message: "A person cannot be related to themselves",
  path: ["relatedPersonId"],
};

export const personRelationshipSelectSchema = createSelectSchema(
  personRelationships,
  personRelationshipRefinements
);
export const personRelationshipInsertSchema = createInsertSchema(
  personRelationships,
  personRelationshipRefinements
).refine(notSelfRelated, notSelfIssue);
export const personRelationshipUpdateSchema = createUpdateSchema(
  personRelationships,
  personRelationshipRefinements
).refine(notSelfRelated, notSelfIssue);

// club_settings -------------------------------------------------------------

const clubSettingsRefinements = {
  contactEmail: () => z.email(),
  shortName: (schema: z.ZodString) => schema.trim().min(1),
  website: () => z.url(),
};

export const clubSettingsSelectSchema = createSelectSchema(
  clubSettings,
  clubSettingsRefinements
);
export const clubSettingsInsertSchema = createInsertSchema(
  clubSettings,
  clubSettingsRefinements
);
export const clubSettingsUpdateSchema = createUpdateSchema(
  clubSettings,
  clubSettingsRefinements
);

// opponents -----------------------------------------------------------------

const opponentRefinements = {
  contactEmail: () => z.email(),
  name: (schema: z.ZodString) => schema.trim().min(1),
  shortName: (schema: z.ZodString) => schema.trim().min(1),
  website: () => z.url(),
};

export const opponentSelectSchema = createSelectSchema(
  opponents,
  opponentRefinements
);
export const opponentInsertSchema = createInsertSchema(
  opponents,
  opponentRefinements
);
export const opponentUpdateSchema = createUpdateSchema(
  opponents,
  opponentRefinements
);

// people --------------------------------------------------------------------

const personRefinements = {
  dateOfBirth: () =>
    z.iso
      .date()
      .refine((value) => value <= new Date().toISOString().slice(0, 10), {
        message: "Date of birth cannot be in the future",
      }),
  email: () => z.email(),
  firstName: (schema: z.ZodString) => schema.trim().min(1),
  lastName: (schema: z.ZodString) => schema.trim().min(1),
  preferredName: (schema: z.ZodString) => schema.trim().min(1),
};

export const personSelectSchema = createSelectSchema(people, personRefinements);
export const personInsertSchema = createInsertSchema(people, personRefinements);
export const personUpdateSchema = createUpdateSchema(people, personRefinements);

// venues --------------------------------------------------------------------

// word.word.word, lower case. \p{L} so non-English what3words languages pass.
// Only the what3words API can confirm the words exist.
const WHAT3WORDS_PATTERN = /^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$/u;

const venueRefinements = {
  kinds: () =>
    z
      .array(z.enum(VENUE_KINDS))
      .min(1)
      .refine((kinds) => new Set(kinds).size === kinds.length, {
        message: "Kinds must not repeat",
      }),
  name: (schema: z.ZodString) => schema.trim().min(1),
  what3words: (schema: z.ZodString) =>
    schema.regex(WHAT3WORDS_PATTERN, "Use the form word.word.word"),
};

export const venueSelectSchema = createSelectSchema(venues, venueRefinements);
export const venueInsertSchema = createInsertSchema(venues, venueRefinements);
export const venueUpdateSchema = createUpdateSchema(venues, venueRefinements);

// files ---------------------------------------------------------------------

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/u;

const fileRefinements = {
  checksumSha256: (schema: z.ZodString) =>
    schema.regex(SHA256_HEX_PATTERN, "Use 64 lower-case hex characters"),
  fileName: (schema: z.ZodString) => schema.min(1),
  kind: () => z.enum(FILE_KINDS),
  sizeBytes: (schema: z.ZodNumber) => schema.nonnegative(),
  status: () => z.enum(FILE_STATUSES),
};

export const fileSelectSchema = createSelectSchema(files, fileRefinements);
export const fileInsertSchema = createInsertSchema(files, fileRefinements);
export const fileUpdateSchema = createUpdateSchema(files, fileRefinements);

// file_views ----------------------------------------------------------------

export const fileViewSelectSchema = createSelectSchema(fileViews);
export const fileViewInsertSchema = createInsertSchema(fileViews);
export const fileViewUpdateSchema = createUpdateSchema(fileViews);

// club profile --------------------------------------------------------------

const clubProfileRefinements = {
  clubType: () => z.enum(CLUB_TYPES).nullable(),
  legalStructure: () => z.enum(LEGAL_STRUCTURES).nullable(),
  sections: () => z.array(z.enum(CLUB_SECTIONS)).min(1).nullable(),
};
export const clubProfileSelectSchema = createSelectSchema(
  clubProfiles,
  clubProfileRefinements
);
export const clubProfileInsertSchema = createInsertSchema(
  clubProfiles,
  clubProfileRefinements
);
export const clubProfileUpdateSchema = createUpdateSchema(
  clubProfiles,
  clubProfileRefinements
);

const clubFeeSettingRefinements = {
  frequency: () => z.enum(FEE_FREQUENCIES),
  subscriptionMinor: () => z.number().int().min(0),
};
export const clubFeeSettingSelectSchema = createSelectSchema(
  clubFeeSettings,
  clubFeeSettingRefinements
);
export const clubFeeSettingInsertSchema = createInsertSchema(
  clubFeeSettings,
  clubFeeSettingRefinements
);
export const clubFeeSettingUpdateSchema = createUpdateSchema(
  clubFeeSettings,
  clubFeeSettingRefinements
);

const clubSocialLinkRefinements = {
  platform: () => z.enum(SOCIAL_PLATFORMS),
  url: () => z.url(),
};
export const clubSocialLinkSelectSchema = createSelectSchema(
  clubSocialLinks,
  clubSocialLinkRefinements
);
export const clubSocialLinkInsertSchema = createInsertSchema(
  clubSocialLinks,
  clubSocialLinkRefinements
);
export const clubSocialLinkUpdateSchema = createUpdateSchema(
  clubSocialLinks,
  clubSocialLinkRefinements
);

const clubTrainingSlotRefinements = {
  dayOfWeek: () => z.number().int().min(1).max(7),
};
export const clubTrainingSlotSelectSchema = createSelectSchema(
  clubTrainingSlots,
  clubTrainingSlotRefinements
);
export const clubTrainingSlotInsertSchema = createInsertSchema(
  clubTrainingSlots,
  clubTrainingSlotRefinements
);
export const clubTrainingSlotUpdateSchema = createUpdateSchema(
  clubTrainingSlots,
  clubTrainingSlotRefinements
);

// member profile ------------------------------------------------------------

export const personDemographicSelectSchema =
  createSelectSchema(personDemographics);
export const personDemographicInsertSchema =
  createInsertSchema(personDemographics);
export const personDemographicUpdateSchema =
  createUpdateSchema(personDemographics);

const personAvailabilityRefinements = {
  dayOfWeek: () => z.number().int().min(1).max(7),
  slot: () => z.enum(AVAILABILITY_SLOTS),
};
export const personAvailabilitySelectSchema = createSelectSchema(
  personAvailability,
  personAvailabilityRefinements
);
export const personAvailabilityInsertSchema = createInsertSchema(
  personAvailability,
  personAvailabilityRefinements
);
export const personAvailabilityUpdateSchema = createUpdateSchema(
  personAvailability,
  personAvailabilityRefinements
);

const personKitRefinements = {
  pickupRule: () => z.enum(PICKUP_RULES).nullable(),
  squadNumber: () => z.number().int().min(1).max(99).nullable(),
};
export const personKitSelectSchema = createSelectSchema(
  personKit,
  personKitRefinements
);
export const personKitInsertSchema = createInsertSchema(
  personKit,
  personKitRefinements
);
export const personKitUpdateSchema = createUpdateSchema(
  personKit,
  personKitRefinements
);

const memberBillingRefinements = {
  method: () => z.enum(PAYMENT_METHODS_PREFERRED).nullable(),
  payer: () => z.enum(PAYERS).nullable(),
};
export const memberBillingSelectSchema = createSelectSchema(
  memberBillingPreferences,
  memberBillingRefinements
);
export const memberBillingInsertSchema = createInsertSchema(
  memberBillingPreferences,
  memberBillingRefinements
);
export const memberBillingUpdateSchema = createUpdateSchema(
  memberBillingPreferences,
  memberBillingRefinements
);

// Onboarding steps ------------------------------------------------------------

const onboardingDraftRefinements = { flow: () => z.enum(ONBOARDING_FLOWS) };
export const onboardingDraftSelectSchema = createSelectSchema(
  onboardingDrafts,
  onboardingDraftRefinements
);
export const onboardingDraftInsertSchema = createInsertSchema(
  onboardingDrafts,
  onboardingDraftRefinements
);
export const onboardingDraftUpdateSchema = createUpdateSchema(
  onboardingDrafts,
  onboardingDraftRefinements
);

const onboardingStepRefinements = { step: () => z.enum(ONBOARDING_STEPS) };

interface OnboardingStepSubject {
  organizationId?: string | null | undefined;
  step?: string | undefined;
  userId?: string | null | undefined;
}

const isStepIn = (steps: readonly string[], step: string | undefined) =>
  step !== undefined && steps.includes(step);

/**
 * A step belongs to one person or one club, never both, and its name must be
 * one that kind of subject can finish. The database enforces the same rule.
 */
const stepMatchesSubject = ({
  organizationId,
  step,
  userId,
}: OnboardingStepSubject) => {
  const hasUser = userId !== undefined && userId !== null;
  const hasOrganization =
    organizationId !== undefined && organizationId !== null;

  if (hasUser === hasOrganization) {
    return false;
  }
  return hasUser
    ? isStepIn(USER_ONBOARDING_STEPS, step)
    : isStepIn(ORGANIZATION_ONBOARDING_STEPS, step);
};
const stepSubjectIssue = {
  message:
    "A step belongs to either a user or an organization, and must be one of that kind's steps",
  path: ["step"],
};

export const onboardingStepSelectSchema = createSelectSchema(
  onboardingSteps,
  onboardingStepRefinements
);
export const onboardingStepInsertSchema = createInsertSchema(
  onboardingSteps,
  onboardingStepRefinements
).refine(stepMatchesSubject, stepSubjectIssue);
export const onboardingStepUpdateSchema = createUpdateSchema(
  onboardingSteps,
  onboardingStepRefinements
);

// Row types -----------------------------------------------------------------

export type AddressRecord = z.infer<typeof addressSelectSchema>;
export type NewAddressRecord = z.infer<typeof addressInsertSchema>;
export type AuditEventRecord = z.infer<typeof auditEventSelectSchema>;
export type NewAuditEventRecord = z.infer<typeof auditEventInsertSchema>;
export type SeasonRecord = z.infer<typeof seasonSelectSchema>;
export type NewSeasonRecord = z.infer<typeof seasonInsertSchema>;
export type AllergyRecord = z.infer<typeof allergySelectSchema>;
export type NewAllergyRecord = z.infer<typeof allergyInsertSchema>;
export type MedicalRecord = z.infer<typeof medicalRecordSelectSchema>;
export type NewMedicalRecord = z.infer<typeof medicalRecordInsertSchema>;
export type ConsentRecord = z.infer<typeof consentSelectSchema>;
export type NewConsentRecord = z.infer<typeof consentInsertSchema>;
export type IncidentReportRecord = z.infer<typeof incidentReportSelectSchema>;
export type NewIncidentReportRecord = z.infer<
  typeof incidentReportInsertSchema
>;
export type SafeguardingCheckRecord = z.infer<
  typeof safeguardingCheckSelectSchema
>;
export type NewSafeguardingCheckRecord = z.infer<
  typeof safeguardingCheckInsertSchema
>;
export type SafeguardingConcernRecord = z.infer<
  typeof safeguardingConcernSelectSchema
>;
export type NewSafeguardingConcernRecord = z.infer<
  typeof safeguardingConcernInsertSchema
>;
export type SafeguardingNoteRecord = z.infer<
  typeof safeguardingNoteSelectSchema
>;
export type NewSafeguardingNoteRecord = z.infer<
  typeof safeguardingNoteInsertSchema
>;
export type RoleAssignmentRecord = z.infer<typeof roleAssignmentSelectSchema>;
export type NewRoleAssignmentRecord = z.infer<
  typeof roleAssignmentInsertSchema
>;
export type RoleAssignmentTeamRecord = z.infer<
  typeof roleAssignmentTeamSelectSchema
>;
export type NewRoleAssignmentTeamRecord = z.infer<
  typeof roleAssignmentTeamInsertSchema
>;
export type EventRecord = z.infer<typeof eventSelectSchema>;
export type NewEventRecord = z.infer<typeof eventInsertSchema>;
export type EventSeriesRecord = z.infer<typeof eventSeriesSelectSchema>;
export type NewEventSeriesRecord = z.infer<typeof eventSeriesInsertSchema>;
export type MatchDetailRecord = z.infer<typeof matchDetailSelectSchema>;
export type NewMatchDetailRecord = z.infer<typeof matchDetailInsertSchema>;
export type EventAvailabilityRecord = z.infer<
  typeof eventAvailabilitySelectSchema
>;
export type NewEventAvailabilityRecord = z.infer<
  typeof eventAvailabilityInsertSchema
>;
export type EventAttendanceRecord = z.infer<typeof eventAttendanceSelectSchema>;
export type NewEventAttendanceRecord = z.infer<
  typeof eventAttendanceInsertSchema
>;
export type MatchSquadRecord = z.infer<typeof matchSquadSelectSchema>;
export type NewMatchSquadRecord = z.infer<typeof matchSquadInsertSchema>;
export type ConsentDocumentRecord = z.infer<typeof consentDocumentSelectSchema>;
export type NewConsentDocumentRecord = z.infer<
  typeof consentDocumentInsertSchema
>;
export type PlayerProfileRecord = z.infer<typeof playerProfileSelectSchema>;
export type NewPlayerProfileRecord = z.infer<typeof playerProfileInsertSchema>;
export type PersonIdentifierRecord = z.infer<
  typeof personIdentifierSelectSchema
>;
export type NewPersonIdentifierRecord = z.infer<
  typeof personIdentifierInsertSchema
>;
export type QualificationRecord = z.infer<typeof qualificationSelectSchema>;
export type NewQualificationRecord = z.infer<typeof qualificationInsertSchema>;
export type PitchRecord = z.infer<typeof pitchSelectSchema>;
export type NewPitchRecord = z.infer<typeof pitchInsertSchema>;
export type RegistrationRecord = z.infer<typeof registrationSelectSchema>;
export type NewRegistrationRecord = z.infer<typeof registrationInsertSchema>;
export type FeeRecord = z.infer<typeof feeSelectSchema>;
export type NewFeeRecord = z.infer<typeof feeInsertSchema>;
export type FeeChargeRecord = z.infer<typeof feeChargeSelectSchema>;
export type NewFeeChargeRecord = z.infer<typeof feeChargeInsertSchema>;
export type ClubStripeAccountRecord = z.infer<
  typeof clubStripeAccountSelectSchema
>;
export type NewClubStripeAccountRecord = z.infer<
  typeof clubStripeAccountInsertSchema
>;
export type PaymentRecord = z.infer<typeof paymentSelectSchema>;
export type NewPaymentRecord = z.infer<typeof paymentInsertSchema>;
export type AnnouncementRecord = z.infer<typeof announcementSelectSchema>;
export type NewAnnouncementRecord = z.infer<typeof announcementInsertSchema>;
export type NotificationRecord = z.infer<typeof notificationSelectSchema>;
export type NewNotificationRecord = z.infer<typeof notificationInsertSchema>;
export type TeamRecord = z.infer<typeof teamSelectSchema>;
export type NewTeamRecord = z.infer<typeof teamInsertSchema>;
export type TeamMembershipRecord = z.infer<typeof teamMembershipSelectSchema>;
export type NewTeamMembershipRecord = z.infer<
  typeof teamMembershipInsertSchema
>;
export type PersonRelationshipRecord = z.infer<
  typeof personRelationshipSelectSchema
>;
export type NewPersonRelationshipRecord = z.infer<
  typeof personRelationshipInsertSchema
>;
export type ClubSettingsRecord = z.infer<typeof clubSettingsSelectSchema>;
export type NewClubSettingsRecord = z.infer<typeof clubSettingsInsertSchema>;
export type OpponentRecord = z.infer<typeof opponentSelectSchema>;
export type NewOpponentRecord = z.infer<typeof opponentInsertSchema>;
export type PersonRecord = z.infer<typeof personSelectSchema>;
export type NewPersonRecord = z.infer<typeof personInsertSchema>;
export type VenueRecord = z.infer<typeof venueSelectSchema>;
export type NewVenueRecord = z.infer<typeof venueInsertSchema>;
export type FileRecord = z.infer<typeof fileSelectSchema>;
export type NewFileRecord = z.infer<typeof fileInsertSchema>;
export type OnboardingStepRecord = z.infer<typeof onboardingStepSelectSchema>;
export type NewOnboardingStepRecord = z.infer<
  typeof onboardingStepInsertSchema
>;
export type FileViewRecord = z.infer<typeof fileViewSelectSchema>;
export type NewFileViewRecord = z.infer<typeof fileViewInsertSchema>;

/**
 * Every non-auth table's schemas, keyed by SQL table name. Used by the
 * completeness test, and handy for generic code (for example a CRUD helper).
 */
export const tableSchemas = {
  addresses: {
    insert: addressInsertSchema,
    select: addressSelectSchema,
    update: addressUpdateSchema,
  },
  allergies: {
    insert: allergyInsertSchema,
    select: allergySelectSchema,
    update: allergyUpdateSchema,
  },
  announcements: {
    insert: announcementInsertSchema,
    select: announcementSelectSchema,
    update: announcementUpdateSchema,
  },
  audit_events: {
    insert: auditEventInsertSchema,
    select: auditEventSelectSchema,
    update: auditEventUpdateSchema,
  },
  club_fee_settings: {
    insert: clubFeeSettingInsertSchema,
    select: clubFeeSettingSelectSchema,
    update: clubFeeSettingUpdateSchema,
  },
  club_profiles: {
    insert: clubProfileInsertSchema,
    select: clubProfileSelectSchema,
    update: clubProfileUpdateSchema,
  },
  club_settings: {
    insert: clubSettingsInsertSchema,
    select: clubSettingsSelectSchema,
    update: clubSettingsUpdateSchema,
  },
  club_social_links: {
    insert: clubSocialLinkInsertSchema,
    select: clubSocialLinkSelectSchema,
    update: clubSocialLinkUpdateSchema,
  },
  club_stripe_accounts: {
    insert: clubStripeAccountInsertSchema,
    select: clubStripeAccountSelectSchema,
    update: clubStripeAccountUpdateSchema,
  },
  club_training_slots: {
    insert: clubTrainingSlotInsertSchema,
    select: clubTrainingSlotSelectSchema,
    update: clubTrainingSlotUpdateSchema,
  },
  consent_documents: {
    insert: consentDocumentInsertSchema,
    select: consentDocumentSelectSchema,
    update: consentDocumentUpdateSchema,
  },
  consents: {
    insert: consentInsertSchema,
    select: consentSelectSchema,
    update: consentUpdateSchema,
  },
  event_attendance: {
    insert: eventAttendanceInsertSchema,
    select: eventAttendanceSelectSchema,
    update: eventAttendanceUpdateSchema,
  },
  event_availability: {
    insert: eventAvailabilityInsertSchema,
    select: eventAvailabilitySelectSchema,
    update: eventAvailabilityUpdateSchema,
  },
  event_series: {
    insert: eventSeriesInsertSchema,
    select: eventSeriesSelectSchema,
    update: eventSeriesUpdateSchema,
  },
  events: {
    insert: eventInsertSchema,
    select: eventSelectSchema,
    update: eventUpdateSchema,
  },
  fee_charges: {
    insert: feeChargeInsertSchema,
    select: feeChargeSelectSchema,
    update: feeChargeUpdateSchema,
  },
  fees: {
    insert: feeInsertSchema,
    select: feeSelectSchema,
    update: feeUpdateSchema,
  },
  file_views: {
    insert: fileViewInsertSchema,
    select: fileViewSelectSchema,
    update: fileViewUpdateSchema,
  },
  files: {
    insert: fileInsertSchema,
    select: fileSelectSchema,
    update: fileUpdateSchema,
  },
  incident_reports: {
    insert: incidentReportInsertSchema,
    select: incidentReportSelectSchema,
    update: incidentReportUpdateSchema,
  },
  match_details: {
    insert: matchDetailInsertSchema,
    select: matchDetailSelectSchema,
    update: matchDetailUpdateSchema,
  },
  match_squad: {
    insert: matchSquadInsertSchema,
    select: matchSquadSelectSchema,
    update: matchSquadUpdateSchema,
  },
  medical_records: {
    insert: medicalRecordInsertSchema,
    select: medicalRecordSelectSchema,
    update: medicalRecordUpdateSchema,
  },
  member_billing_preferences: {
    insert: memberBillingInsertSchema,
    select: memberBillingSelectSchema,
    update: memberBillingUpdateSchema,
  },
  notifications: {
    insert: notificationInsertSchema,
    select: notificationSelectSchema,
    update: notificationUpdateSchema,
  },
  onboarding_drafts: {
    insert: onboardingDraftInsertSchema,
    select: onboardingDraftSelectSchema,
    update: onboardingDraftUpdateSchema,
  },
  onboarding_steps: {
    insert: onboardingStepInsertSchema,
    select: onboardingStepSelectSchema,
    update: onboardingStepUpdateSchema,
  },
  opponents: {
    insert: opponentInsertSchema,
    select: opponentSelectSchema,
    update: opponentUpdateSchema,
  },
  payments: {
    insert: paymentInsertSchema,
    select: paymentSelectSchema,
    update: paymentUpdateSchema,
  },
  people: {
    insert: personInsertSchema,
    select: personSelectSchema,
    update: personUpdateSchema,
  },
  person_availability: {
    insert: personAvailabilityInsertSchema,
    select: personAvailabilitySelectSchema,
    update: personAvailabilityUpdateSchema,
  },
  person_demographics: {
    insert: personDemographicInsertSchema,
    select: personDemographicSelectSchema,
    update: personDemographicUpdateSchema,
  },
  person_identifiers: {
    insert: personIdentifierInsertSchema,
    select: personIdentifierSelectSchema,
    update: personIdentifierUpdateSchema,
  },
  person_kit: {
    insert: personKitInsertSchema,
    select: personKitSelectSchema,
    update: personKitUpdateSchema,
  },
  person_relationships: {
    insert: personRelationshipInsertSchema,
    select: personRelationshipSelectSchema,
    update: personRelationshipUpdateSchema,
  },
  pitches: {
    insert: pitchInsertSchema,
    select: pitchSelectSchema,
    update: pitchUpdateSchema,
  },
  player_profiles: {
    insert: playerProfileInsertSchema,
    select: playerProfileSelectSchema,
    update: playerProfileUpdateSchema,
  },
  qualifications: {
    insert: qualificationInsertSchema,
    select: qualificationSelectSchema,
    update: qualificationUpdateSchema,
  },
  registrations: {
    insert: registrationInsertSchema,
    select: registrationSelectSchema,
    update: registrationUpdateSchema,
  },
  role_assignment_teams: {
    insert: roleAssignmentTeamInsertSchema,
    select: roleAssignmentTeamSelectSchema,
    update: roleAssignmentTeamUpdateSchema,
  },
  role_assignments: {
    insert: roleAssignmentInsertSchema,
    select: roleAssignmentSelectSchema,
    update: roleAssignmentUpdateSchema,
  },
  safeguarding_checks: {
    insert: safeguardingCheckInsertSchema,
    select: safeguardingCheckSelectSchema,
    update: safeguardingCheckUpdateSchema,
  },
  safeguarding_concerns: {
    insert: safeguardingConcernInsertSchema,
    select: safeguardingConcernSelectSchema,
    update: safeguardingConcernUpdateSchema,
  },
  safeguarding_notes: {
    insert: safeguardingNoteInsertSchema,
    select: safeguardingNoteSelectSchema,
    update: safeguardingNoteUpdateSchema,
  },
  seasons: {
    insert: seasonInsertSchema,
    select: seasonSelectSchema,
    update: seasonUpdateSchema,
  },
  team_memberships: {
    insert: teamMembershipInsertSchema,
    select: teamMembershipSelectSchema,
    update: teamMembershipUpdateSchema,
  },
  teams: {
    insert: teamInsertSchema,
    select: teamSelectSchema,
    update: teamUpdateSchema,
  },
  venues: {
    insert: venueInsertSchema,
    select: venueSelectSchema,
    update: venueUpdateSchema,
  },
} as const;
