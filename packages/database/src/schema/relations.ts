import { defineRelationsPart } from "drizzle-orm";

import { authRelations, verifications } from "./authentication";
import { clubProfileRelations } from "./club/club-profile";
import { clubSettingsRelations } from "./club/club-settings";
import { opponentRelations } from "./club/opponents";
import { pitchRelations } from "./club/pitches";
import { venueRelations } from "./club/venues";
import { announcementRelations } from "./communications/announcements";
import { notificationRelations } from "./communications/notifications";
import { storageRelations } from "./files/files";
import { clubStripeAccountRelations } from "./finance/club-stripe-accounts";
import { feeChargeRelations } from "./finance/fee-charges";
import { feeRelations } from "./finance/fees";
import { paymentRelations } from "./finance/payments";
import { eventAttendanceRelations } from "./football/event-attendance";
import { eventAvailabilityRelations } from "./football/event-availability";
import { eventSeriesRelations } from "./football/event-series";
import { eventRelations } from "./football/events";
import { matchDetailRelations } from "./football/match-details";
import { matchSquadRelations } from "./football/match-squad";
import { registrationRelations } from "./football/registrations";
import { seasonRelations } from "./football/seasons";
import { teamMembershipRelations } from "./football/team-memberships";
import { teamRelations } from "./football/teams";
import { auditEvents } from "./governance/audit-events";
import { consentRelations } from "./governance/consent";
import { consentDocumentRelations } from "./governance/consent-documents";
import { roleAssignmentRelations } from "./governance/role-assignment-teams";
import { onboardingDraftsRelations } from "./onboarding/onboarding-drafts";
import { onboardingStepsRelations } from "./onboarding/onboarding-steps";
import { addressRelations } from "./people/addresses";
import { allergyRelations } from "./people/allergies";
import { medicalRecordRelations } from "./people/medical-records";
import { peopleRelations } from "./people/people";
import { personIdentifierRelations } from "./people/person-identifiers";
import { playerProfileRelations } from "./people/player-profiles";
import { qualificationRelations } from "./people/qualifications";
import { personRelationshipRelations } from "./people/relationships";
import { safeguardingCheckRelations } from "./safeguarding/checks";
import { safeguardingConcernRelations } from "./safeguarding/concerns";
import { safeguardingNoteRelations } from "./safeguarding/notes";
import { incidentReportRelations } from "./welfare/incident-reports";

/**
 * Tables with no relations are skipped by the generated auth part, which would
 * leave them out of `db.query`. List them here so they stay queryable.
 */
const standaloneTables = defineRelationsPart(
  { auditEvents, verifications },
  () => ({ auditEvents: {}, verifications: {} })
);

/**
 * All relations for the database, passed to `drizzle()` in `createDatabase`.
 *
 * Each source (Better Auth's tables, Huddlekit's own) defines a relations part
 * with `defineRelationsPart`, and the parts are merged here. Parts are merged
 * per table, so a later part replaces an earlier one for the same table. Put
 * relations for a table in a single part.
 */
export const relations = {
  ...addressRelations,
  ...announcementRelations,
  ...clubStripeAccountRelations,
  ...consentDocumentRelations,
  ...feeChargeRelations,
  ...feeRelations,
  ...notificationRelations,
  ...clubProfileRelations,
  ...onboardingDraftsRelations,
  ...onboardingStepsRelations,
  ...paymentRelations,
  ...personIdentifierRelations,
  ...pitchRelations,
  ...playerProfileRelations,
  ...qualificationRelations,
  ...registrationRelations,
  ...allergyRelations,
  ...authRelations,
  ...clubSettingsRelations,
  ...consentRelations,
  ...eventAttendanceRelations,
  ...eventAvailabilityRelations,
  ...eventRelations,
  ...eventSeriesRelations,
  ...incidentReportRelations,
  ...matchDetailRelations,
  ...matchSquadRelations,
  ...medicalRecordRelations,
  ...opponentRelations,
  ...peopleRelations,
  ...personRelationshipRelations,
  ...roleAssignmentRelations,
  ...safeguardingCheckRelations,
  ...safeguardingConcernRelations,
  ...safeguardingNoteRelations,
  ...seasonRelations,
  ...storageRelations,
  ...teamMembershipRelations,
  ...teamRelations,
  ...venueRelations,
  ...standaloneTables,
};
