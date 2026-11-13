export interface Option {
  value: string;
  label: string;
  description?: string;
}

const SLUG_PATTERN = /[^a-z0-9]+/gu;

const toOption = (label: string): Option => ({
  label,
  value: label.toLowerCase().replaceAll(SLUG_PATTERN, "-"),
});

const toOptions = (labels: readonly string[]): readonly Option[] =>
  labels.map(toOption);

export const GENDER_OPTIONS = toOptions([
  "Male",
  "Female",
  "Non-binary",
  "Prefer to self-describe",
  "Prefer not to say",
]);

export const ETHNICITY_OPTIONS = toOptions([
  "White: English, Welsh, Scottish, Northern Irish or British",
  "White: Irish",
  "White: Gypsy or Irish Traveller",
  "White: any other White background",
  "Mixed: White and Black Caribbean",
  "Mixed: White and Black African",
  "Mixed: White and Asian",
  "Mixed: any other Mixed background",
  "Asian: Indian",
  "Asian: Pakistani",
  "Asian: Bangladeshi",
  "Asian: Chinese",
  "Asian: any other Asian background",
  "Black: African",
  "Black: Caribbean",
  "Black: any other Black background",
  "Arab",
  "Any other ethnic group",
  "Prefer not to say",
]);

export const RELIGION_OPTIONS = toOptions([
  "No religion",
  "Christian",
  "Buddhist",
  "Hindu",
  "Jewish",
  "Muslim",
  "Sikh",
  "Any other religion or belief",
  "Prefer not to say",
]);

export const RELATIONSHIP_OPTIONS = toOptions([
  "Parent",
  "Guardian",
  "Partner or spouse",
  "Grandparent",
  "Sibling",
  "Friend",
  "Other",
]);

export const DBS_LEVEL_OPTIONS = toOptions([
  "Basic",
  "Standard",
  "Enhanced",
  "Enhanced with barred list check",
]);

export const STAFF_ROLE_OPTIONS = toOptions([
  "Head coach",
  "Assistant coach",
  "Manager",
  "Goalkeeper coach",
  "Physio or first aider",
  "Welfare officer",
  "Referee",
  "Treasurer or admin",
  "Volunteer",
  "Other",
]);

export const CLUB_ROLE_OPTIONS = toOptions([
  "Owner",
  "Chair",
  "Secretary",
  "Treasurer",
  "Director",
  "Head of youth",
  "Other",
]);

// Values match the club types the backend accepts.
export const CLUB_TYPE_OPTIONS: readonly Option[] = [
  { label: "Grassroots club", value: "grassroots" },
  { label: "Academy", value: "academy" },
  { label: "School or college team", value: "school-or-college" },
  { label: "Community or charity club", value: "community-or-charity" },
  { label: "Other", value: "other" },
];

export const CLUB_SECTION_OPTIONS: readonly Option[] = [
  {
    description: "Under 7s to under 10s",
    label: "Mini-soccer",
    value: "mini-soccer",
  },
  {
    description: "Under 11s to under 18s",
    label: "Youth football",
    value: "youth",
  },
  { label: "Adult men's", value: "adult-men" },
  { label: "Adult women's", value: "adult-women" },
  { label: "Veterans or walking football", value: "veterans" },
  { label: "Disability football", value: "disability" },
];

export const AGE_GROUP_OPTIONS = toOptions(
  Array.from({ length: 13 }, (_, index) => `Under ${index + 6}s`)
);

export const POSITION_OPTIONS = toOptions([
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
  "Not sure yet",
]);

export const PAYER_OPTIONS = toOptions([
  "Me",
  "The other parent or guardian",
  "Split between both of us",
  "The player pays themselves",
  "Club funded or sponsored",
]);

export const PAYMENT_METHOD_OPTIONS = toOptions([
  "Direct Debit",
  "Card",
  "Bank transfer",
  "Cash",
]);

export type MemberRole = "staff" | "player" | "parent";

// The three ways someone joins a club. The club picks one when it sends an
// invite, so invited people are never asked again.
export const MEMBER_ROLE_OPTIONS: readonly Option[] = [
  {
    description: "Coaches, managers, welfare officers and volunteers.",
    label: "Staff or coach",
    value: "staff",
  },
  {
    description: "Adult players aged 18 and over.",
    label: "Player",
    value: "player",
  },
  {
    description:
      "Register your children. You can also tell us if you play or help out.",
    label: "Parent or guardian",
    value: "parent",
  },
];

export function isMemberRole(value: string): value is MemberRole {
  return value === "staff" || value === "player" || value === "parent";
}

export const PLATFORM_OPTIONS = toOptions([
  "Facebook",
  "Instagram",
  "TikTok",
  "X",
]);

export const PICKUP_OPTIONS: readonly Option[] = [
  {
    description: "Only a parent or guardian can collect.",
    label: "Parent or guardian only",
    value: "guardian",
  },
  {
    description: "Anyone listed above can collect.",
    label: "Any approved adult",
    value: "approved",
  },
  {
    description: "For players aged 16 and over.",
    label: "Can make their own way home",
    value: "alone",
  },
];

export const DAYS: readonly Option[] = [
  { label: "Monday", value: "mon" },
  { label: "Tuesday", value: "tue" },
  { label: "Wednesday", value: "wed" },
  { label: "Thursday", value: "thu" },
  { label: "Friday", value: "fri" },
  { label: "Saturday", value: "sat" },
  { label: "Sunday", value: "sun" },
];

export const TIME_SLOTS: readonly Option[] = [
  { description: "Before 12pm", label: "Morning", value: "morning" },
  { description: "12pm to 5pm", label: "Afternoon", value: "afternoon" },
  { description: "After 5pm", label: "Evening", value: "evening" },
];

export const FREQUENCY_OPTIONS = toOptions([
  "Monthly",
  "Termly",
  "Annually",
  "Per session",
]);

export const PAYOUT_SCHEDULE_OPTIONS = toOptions([
  "Daily",
  "Weekly",
  "Monthly",
]);

export const QUALIFICATION_OPTIONS = toOptions([
  "FA Level 1 in coaching football",
  "FA Level 2 in coaching football",
  "FA Level 3 in coaching football",
  "UEFA C licence",
  "UEFA B licence",
  "UEFA A licence",
  "FA Goalkeeping licence",
  "FA Referee course",
  "Other",
]);

export const REFERENCE_RELATIONSHIP_OPTIONS = toOptions([
  "Employer",
  "Colleague",
  "Club official",
  "Teacher or tutor",
  "Other",
]);

export const KIT_SIZE_OPTIONS = toOptions([
  "Youth 5 to 6",
  "Youth 7 to 8",
  "Youth 9 to 10",
  "Youth 11 to 12",
  "Youth 13 to 14",
  "Adult XS",
  "Adult S",
  "Adult M",
  "Adult L",
  "Adult XL",
  "Adult XXL",
]);

export const NOTIFICATION_CHANNEL_OPTIONS = toOptions([
  "Email",
  "Push notifications",
  "Text message",
]);

// Values match the legal structures the backend accepts.
export const LEGAL_STRUCTURE_OPTIONS: readonly Option[] = [
  { label: "Unincorporated association", value: "unincorporated-association" },
  { label: "Community interest company (CIC)", value: "cic" },
  { label: "Registered charity", value: "registered-charity" },
  {
    label: "Company limited by guarantee",
    value: "company-limited-by-guarantee",
  },
  { label: "Company limited by shares", value: "company-limited-by-shares" },
  { label: "Other", value: "other" },
];
