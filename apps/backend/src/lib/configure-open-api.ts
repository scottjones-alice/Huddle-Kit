import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "@/types";

import packageJSON from "../../package.json" with { type: "json" };

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

  app.doc31(`${prefix}/doc`, {
    info: {
      title: API_TITLE,
      version: packageJSON.version,
    },
    openapi: "3.1.0",
    security: [{ [SESSION_COOKIE_SCHEME]: [] }],
  });

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
