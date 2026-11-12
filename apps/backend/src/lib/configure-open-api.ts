import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "@/types";

import packageJSON from "../../package.json" with { type: "json" };
import { addExamples } from "./openapi-examples";

const API_TITLE = "Huddlekit API";
const SESSION_COOKIE_SCHEME = "sessionCookie";
const SESSION_COOKIE_NAME = "better-auth.session_token";
const MAX_VISIBLE_REQUEST_BODY_PROPERTIES = 12;

export default function configureOpenAPI(app: AppOpenAPI, prefix = "") {
  app.openAPIRegistry.registerComponent(
    "securitySchemes",
    SESSION_COOKIE_SCHEME,
    {
      description: "Better Auth session cookie, set when signing in.",
      in: "cookie",
      name: SESSION_COOKIE_NAME,
      type: "apiKey",
    }
  );

  // Same as app.doc31(), plus a sample value on every schema (see openapi-examples).
  const documentConfig = {
    info: {
      description:
        "The Huddlekit backend: club and member onboarding, files, and payments. Calls are authenticated with the Better Auth session cookie unless an operation says otherwise.",
      title: API_TITLE,
      version: packageJSON.version,
    },
    openapi: "3.1.0" as const,
    security: [{ [SESSION_COOKIE_SCHEME]: [] }],
    // Relative on purpose: the same document works locally and when deployed,
    // because it resolves against the address it was fetched from.
    servers: [{ description: "This server", url: "/" }],
    tags: [
      {
        description: "Whether the API and its dependencies are up.",
        name: "Health",
      },
      {
        description: "Club and member setup wizards, and saved drafts.",
        name: "Onboarding",
      },
      {
        description: "The club's details, legal information and settings.",
        name: "Club",
      },
      { description: "Uploads, downloads and file views.", name: "Files" },
      {
        description: "Clubs the team plays against.",
        name: "Opponents",
      },
      {
        description: "Who holds which job in the club, and who has a login.",
        name: "Roles",
      },
      {
        description: "Venues and the pitches at them.",
        name: "Venues",
      },
      {
        description:
          "Members, children and guardians. Everyone sees their own family; admins see all.",
        name: "People",
      },
      {
        description: "Seasons, teams and who plays for them.",
        name: "Teams",
      },
      {
        description:
          "Training, matches and other events, who can make them, who turned up, and match squads.",
        name: "Events",
      },
      {
        description:
          "Fees, who owes what, and payments received. Money is in pence or cents. Admins and the treasurer manage it; members see their own family's.",
        name: "Fees",
      },
      {
        description:
          "Asking to join for a season, and a club admin accepting or placing them.",
        name: "Registrations",
      },
      {
        description:
          "Consent form wording, and what each person or parent has agreed to.",
        name: "Consents",
      },
      {
        description:
          "Checks on adults (DBS, training) and safeguarding concerns. Anyone can raise a concern; only safeguarding staff can read them. Every read and change is audited and nothing is deleted.",
        name: "Safeguarding",
      },
      {
        description:
          "Medical records, allergies, incident reports and coaching qualifications. Health information is private to the person, their parents, club admins and their coaches, and every read is audited.",
        name: "Welfare",
      },
      {
        description: "Stripe Connect payouts and fee checkout.",
        name: "Payments",
      },
    ],
  };

  app.get(`${prefix}/doc`, (c) =>
    c.json(addExamples(app.getOpenAPI31Document(documentConfig)))
  );

  app.get(
    `${prefix}/reference`,
    Scalar({
      defaultHttpClient: {
        clientKey: "fetch",
        targetKey: "js",
      },
      defaultOpenAllTags: true,
      defaultOpenFirstTag: true,
      documentDownloadType: "both",
      expandAllModelSections: true,
      expandAllParameters: true,
      expandAllResponses: true,
      hideClientButton: false,
      hideDarkModeToggle: true,
      hideModels: true,
      hideSearch: false,
      hideTestRequestButton: false,
      layout: "modern",
      maxVisibleRequestBodyProperties: MAX_VISIBLE_REQUEST_BODY_PROPERTIES,
      operationTitleSource: "summary",
      orderRequiredPropertiesFirst: true,
      orderSchemaPropertiesBy: "alpha",
      pageTitle: API_TITLE,
      persistAuth: false,
      showOperationId: true,
      showSidebar: true,
      theme: "bluePlanet",
      url: `${prefix}/doc`,
      withDefaultFonts: true,
    })
  );
}
