// drizzle-kit reads the whole schema from this one entry point, so a barrel is the intent here.
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./authentication";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./club/club-profile";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./club/club-settings";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./club/opponents";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./club/pitches";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./club/venues";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./files/files";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/event-attendance";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/event-kinds";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/event-series";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/event-availability";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/events";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/match-details";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/match-squad";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/registrations";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/seasons";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/team-memberships";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./football/teams";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./governance/audit-events";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./communications/announcements";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./communications/notifications";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./finance/club-stripe-accounts";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./finance/fee-charges";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./finance/fees";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./finance/payments";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./governance/consent";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./governance/consent-documents";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./governance/consent-types";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./governance/role-assignment-teams";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./governance/role-assignments";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/addresses";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/allergies";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/medical-records";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/member-profile";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/people";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/person-identifiers";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/player-profiles";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/qualifications";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./onboarding/onboarding-drafts";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./onboarding/onboarding-steps";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./people/relationships";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./safeguarding/checks";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./safeguarding/concerns";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./safeguarding/notes";
// oxlint-disable-next-line oxc/no-barrel-file
export * from "./welfare/incident-reports";

export { relations } from "./relations";
