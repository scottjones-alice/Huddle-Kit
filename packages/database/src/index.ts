/** Public entry point for @alice/database. */

export { createDatabase } from "./create-database";

export { recordAuditEvent } from "./audit";

export { createFieldEncryptor, keyFromBase64 } from "./field-encryption";

export type { FieldEncryptor, FieldEncryptorOptions } from "./field-encryption";

export { occurrencesBetween } from "./series";

export type { Occurrence, SeriesRule } from "./series";

export { generateSeriesEvents } from "./series-generation";

export type { GenerateSeriesResult } from "./series-generation";

export type {
  CreateDatabaseOptions,
  Database,
  PoolOptions,
} from "./create-database";

export {
  accounts,
  invitations,
  passkeys,
  members,
  organizations,
  sessions,
  subscriptions,
  users,
  verifications,
} from "./schema/authentication";

export {
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

export type {
  ClubSection,
  ClubType,
  FeeFrequency,
  LegalStructure,
  SocialPlatform,
} from "./schema/club/club-profile";

export { clubSettings } from "./schema/club/club-settings";

export {
  ONBOARDING_FLOWS,
  onboardingDrafts,
} from "./schema/onboarding/onboarding-drafts";

export type { OnboardingFlow } from "./schema/onboarding/onboarding-drafts";

export {
  ONBOARDING_STEPS,
  ORGANIZATION_ONBOARDING_STEPS,
  USER_ONBOARDING_STEPS,
  onboardingSteps,
} from "./schema/onboarding/onboarding-steps";

export type {
  OnboardingStep,
  OrganizationOnboardingStep,
  UserOnboardingStep,
} from "./schema/onboarding/onboarding-steps";

export { opponents } from "./schema/club/opponents";

export { VENUE_KINDS, venues } from "./schema/club/venues";

export type { VenueKind } from "./schema/club/venues";

export {
  FILE_KINDS,
  FILE_STATUSES,
  fileViews,
  files,
} from "./schema/files/files";

export type { FileKind, FileStatus } from "./schema/files/files";

export {
  ATTENDANCE_STATUSES,
  eventAttendance,
} from "./schema/football/event-attendance";

export type { AttendanceStatus } from "./schema/football/event-attendance";

export {
  AVAILABILITY_STATUSES,
  eventAvailability,
} from "./schema/football/event-availability";

export type { AvailabilityStatus } from "./schema/football/event-availability";

export { EVENT_KINDS } from "./schema/football/event-kinds";

export type { EventKind } from "./schema/football/event-kinds";

export { eventSeries } from "./schema/football/event-series";

export { EVENT_STATUSES, events } from "./schema/football/events";

export type { EventStatus } from "./schema/football/events";

export {
  HOME_AWAY_VALUES,
  matchDetails,
} from "./schema/football/match-details";

export type { HomeAway } from "./schema/football/match-details";

export { SQUAD_ROLES, matchSquad } from "./schema/football/match-squad";

export type { SquadRole } from "./schema/football/match-squad";

export { seasons } from "./schema/football/seasons";

export {
  TEAM_MEMBER_ROLES,
  teamMemberships,
} from "./schema/football/team-memberships";

export type { TeamMemberRole } from "./schema/football/team-memberships";

export { teams } from "./schema/football/teams";

export { auditEvents } from "./schema/governance/audit-events";

export { roleAssignmentTeams } from "./schema/governance/role-assignment-teams";

export {
  ROLE_ASSIGNMENT_ROLES,
  ROLE_ASSIGNMENT_SCOPES,
  TEAM_SCOPED_ROLES,
  roleAssignments,
} from "./schema/governance/role-assignments";

export type {
  RoleAssignmentRole,
  RoleAssignmentScope,
} from "./schema/governance/role-assignments";

export { consents } from "./schema/governance/consent";

export { consentDocuments } from "./schema/governance/consent-documents";

export { CONSENT_TYPES } from "./schema/governance/consent-types";

export type { ConsentType } from "./schema/governance/consent-types";

export { announcements } from "./schema/communications/announcements";

export {
  NOTIFICATION_KINDS,
  notifications,
} from "./schema/communications/notifications";

export type { NotificationKind } from "./schema/communications/notifications";

export {
  STRIPE_CAPABILITY_STATUSES,
  clubStripeAccounts,
} from "./schema/finance/club-stripe-accounts";

export type { StripeCapabilityStatus } from "./schema/finance/club-stripe-accounts";

export { CHARGE_STATUSES, feeCharges } from "./schema/finance/fee-charges";

export type { ChargeStatus } from "./schema/finance/fee-charges";

export { fees } from "./schema/finance/fees";

export { PAYMENT_METHODS, payments } from "./schema/finance/payments";

export type { PaymentMethod } from "./schema/finance/payments";

export {
  REGISTRATION_STATUSES,
  registrations,
} from "./schema/football/registrations";

export type { RegistrationStatus } from "./schema/football/registrations";

export { PITCH_FORMATS, PITCH_SURFACES, pitches } from "./schema/club/pitches";

export type { PitchFormat, PitchSurface } from "./schema/club/pitches";

export {
  IDENTIFIER_TYPES,
  personIdentifiers,
} from "./schema/people/person-identifiers";

export type { IdentifierType } from "./schema/people/person-identifiers";

export {
  PREFERRED_FEET,
  playerProfiles,
} from "./schema/people/player-profiles";

export type { PreferredFoot } from "./schema/people/player-profiles";

export {
  QUALIFICATION_KINDS,
  qualifications,
} from "./schema/people/qualifications";

export type { QualificationKind } from "./schema/people/qualifications";

export { ALLERGY_SEVERITIES, allergies } from "./schema/people/allergies";

export type { AllergySeverity } from "./schema/people/allergies";

export {
  MEDICAL_RECORD_KINDS,
  medicalRecords,
} from "./schema/people/medical-records";

export type { MedicalRecordKind } from "./schema/people/medical-records";

export {
  DBS_LEVELS,
  SAFEGUARDING_CHECK_KINDS,
  SAFEGUARDING_CHECK_STATUSES,
  safeguardingChecks,
} from "./schema/safeguarding/checks";

export type {
  DbsLevel,
  SafeguardingCheckKind,
  SafeguardingCheckStatus,
} from "./schema/safeguarding/checks";

export {
  CONCERN_SEVERITIES,
  CONCERN_STATUSES,
  safeguardingConcerns,
} from "./schema/safeguarding/concerns";

export type {
  ConcernSeverity,
  ConcernStatus,
} from "./schema/safeguarding/concerns";

export { safeguardingNotes } from "./schema/safeguarding/notes";

export {
  INCIDENT_KINDS,
  INCIDENT_SEVERITIES,
  incidentReports,
} from "./schema/welfare/incident-reports";

export type {
  IncidentKind,
  IncidentSeverity,
} from "./schema/welfare/incident-reports";

export { addresses } from "./schema/people/addresses";

export {
  AVAILABILITY_SLOTS,
  JOINING_ROLES,
  PAYERS,
  PAYMENT_METHODS_PREFERRED,
  PICKUP_RULES,
  memberBillingPreferences,
  memberJoiningRoles,
  personAvailability,
  personDemographics,
  personKit,
  personSocialLinks,
} from "./schema/people/member-profile";

export type {
  AvailabilitySlot,
  JoiningRole,
  Payer,
  PickupRule,
  PreferredPaymentMethod,
} from "./schema/people/member-profile";

export { people } from "./schema/people/people";

export {
  RELATIONSHIP_KINDS,
  personRelationships,
} from "./schema/people/relationships";

export type { RelationshipKind } from "./schema/people/relationships";

export { relations } from "./schema/relations";

export { completeOnboardingStep, getOnboardingProgress } from "./onboarding";

export type { OnboardingProgress, OnboardingSubject } from "./onboarding";
