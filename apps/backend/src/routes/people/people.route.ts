import {
  JOINING_ROLES,
  RELATIONSHIP_KINDS,
  ROLE_ASSIGNMENT_ROLES,
  TEAM_MEMBER_ROLES,
} from "@alice/database";
import {
  addressSelectSchema,
  fileSelectSchema,
  personFileSelectSchema,
  personInsertSchema,
  personRelationshipSelectSchema,
  personSelectSchema,
  playerProfileSelectSchema,
  teamMembershipSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  idParams,
  includeArchivedQuery,
  invalidBody,
  notFoundBody,
  pageQuery,
  sessionErrors,
} from "@/lib/route-kit";
import { addressInputSchema } from "@/lib/schemas";

const TAGS = ["People"];

const personBody = z.object({
  address: addressInputSchema.nullish(),
  dateOfBirth: personInsertSchema.shape.dateOfBirth,
  email: personInsertSchema.shape.email,
  firstName: personInsertSchema.shape.firstName,
  lastName: personInsertSchema.shape.lastName,
  phone: personInsertSchema.shape.phone,
  preferredName: personInsertSchema.shape.preferredName,
});

const personChanges = personBody.partial().extend({
  isActive: z
    .boolean()
    .optional()
    .describe(
      "false archives the person, true brings them back. People are never deleted, so their history is kept. Club admins only."
    ),
});

const personDetail = z.object({
  address: addressSelectSchema.nullable(),
  memberships: z.array(teamMembershipSelectSchema),
  person: personSelectSchema,
  playerProfile: playerProfileSelectSchema.nullable(),
  relationships: z.array(personRelationshipSelectSchema),
});

const personListItem = personSelectSchema.extend({
  avatarUrl: z
    .string()
    .nullable()
    .describe(
      "A temporary link to their profile photo, or null if they have none."
    ),
  joinedAs: z
    .enum(JOINING_ROLES)
    .nullable()
    .describe("What they said they were joining as: staff, player or parent."),
  roles: z
    .array(z.enum(ROLE_ASSIGNMENT_ROLES))
    .describe("Club jobs their login holds now, such as coach or treasurer."),
  teams: z
    .array(
      z.object({
        role: z.enum(TEAM_MEMBER_ROLES),
        teamId: z.uuid(),
        teamName: z.string(),
      })
    )
    .describe("Teams they are on now, and their role on each."),
});

const relationshipBody = z.object({
  canCollect: z
    .boolean()
    .optional()
    .describe("May collect the child from sessions."),
  hasParentalResponsibility: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
  relatedPersonId: z
    .uuid()
    .describe("The adult. The person in the path is the child."),
  relationship: z.enum(RELATIONSHIP_KINDS),
});

const listQuery = pageQuery.extend(includeArchivedQuery.shape).extend({
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .describe("Part of a first name, last name or email."),
});

const personFileItem = z.object({
  file: fileSelectSchema,
  link: personFileSelectSchema,
  url: z
    .string()
    .nullable()
    .describe(
      "A temporary link that shows a photo or cover. Null for documents, which open through GET /files/{id}/url."
    ),
});

const attachFileBody = z.object({
  fileId: z
    .uuid()
    .describe("A file you uploaded and confirmed with POST /files."),
  purpose: personFileSelectSchema.shape.purpose.describe(
    "avatar and cover need a photo; document needs a sensitive or other file. A new avatar or cover replaces the old one."
  ),
});

const personFileParams = z.object({
  id: z.uuid().describe("The person's id."),
  linkId: z.uuid().describe("The id of the link, not of the file."),
});

export const listPeople = createRoute({
  description:
    "Club admins see everyone. A coach sees the people on the teams they coach. Anyone else sees only themselves and their own children.",
  method: "get",
  operationId: "listPeople",
  path: "/people",
  request: { query: listQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ people: z.array(personListItem) }),
      "The people the caller may see, by last name."
    ),
    ...sessionErrors,
  },
  summary: "List people",
  tags: TAGS,
});

export const getMyPerson = createRoute({
  description:
    "Who the signed-in login is in this club: their name, photo and person id. Null when the login has no person here, for example a platform admin.",
  method: "get",
  operationId: "getMyPerson",
  path: "/people/me",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        person: personSelectSchema
          .pick({
            firstName: true,
            id: true,
            lastName: true,
            preferredName: true,
          })
          .extend({
            avatarUrl: z
              .string()
              .nullable()
              .describe("A temporary link to their photo, or null."),
          })
          .nullable(),
      }),
      "The signed-in person."
    ),
    ...sessionErrors,
  },
  summary: "Get the signed-in person",
  tags: TAGS,
});

export const createPerson = createRoute({
  description:
    "Adds a person who does not have a login, such as a child or a coach who has not signed up. Club admins only.",
  method: "post",
  operationId: "createPerson",
  path: "/people",
  request: { body: jsonContentRequired(personBody, "The person.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      personSelectSchema,
      "The new person."
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add a person",
  tags: TAGS,
});

export const getPerson = createRoute({
  description:
    "One person with their address, family links, player profile and team history. Medical and safeguarding information is separate.",
  method: "get",
  operationId: "getPerson",
  path: "/people/{id}",
  request: { params: idParams("person") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(personDetail, "The person."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    ...sessionErrors,
  },
  summary: "Get a person",
  tags: TAGS,
});

export const updatePerson = createRoute({
  description:
    "Changes a person's details. You can change your own and your children's; club admins can change anyone's.",
  method: "patch",
  operationId: "updatePerson",
  path: "/people/{id}",
  request: {
    body: jsonContentRequired(personChanges, "The fields to change."),
    params: idParams("person"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      personSelectSchema,
      "The updated person."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or archive a person",
  tags: TAGS,
});

export const linkPeople = createRoute({
  description:
    "Records that an adult is a parent, guardian or carer of the person in the path. Saving the same link again updates its permissions. Club admins only.",
  method: "post",
  operationId: "linkPeople",
  path: "/people/{id}/relationships",
  request: {
    body: jsonContentRequired(relationshipBody, "The adult and the link."),
    params: idParams("child"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      personRelationshipSelectSchema,
      "The link."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Link a parent or guardian",
  tags: TAGS,
});

export const listPersonFiles = createRoute({
  description:
    "Anyone who can see the person sees their photo and cover. Documents can hold personal data about a child, so only club admins, the person and their parents see those.",
  method: "get",
  operationId: "listPersonFiles",
  path: "/people/{id}/files",
  request: { params: idParams("person") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ files: z.array(personFileItem) }),
      "The photo, cover and documents the caller may see."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person"),
    ...sessionErrors,
  },
  summary: "List a person's files",
  tags: TAGS,
});

export const attachPersonFile = createRoute({
  description:
    "Upload the file first with POST /files and confirm it, then attach it here. You can change your own and your children's; club admins can change anyone's.",
  method: "post",
  operationId: "attachPersonFile",
  path: "/people/{id}/files",
  request: {
    body: jsonContentRequired(attachFileBody, "The file and what it is for."),
    params: idParams("person"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      personFileItem,
      "The file, now on the person's record."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person or file"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Attach a file to a person",
  tags: TAGS,
});

export const removePersonFile = createRoute({
  description:
    "Deletes the file from storage as well as taking it off the person's record.",
  method: "delete",
  operationId: "removePersonFile",
  path: "/people/{id}/files/{linkId}",
  request: { params: personFileParams },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "The file is gone." },
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("file"),
    ...sessionErrors,
  },
  summary: "Remove a file from a person",
  tags: TAGS,
});

export type ListPeopleRoute = typeof listPeople;
export type GetMyPersonRoute = typeof getMyPerson;
export type ListPersonFilesRoute = typeof listPersonFiles;
export type AttachPersonFileRoute = typeof attachPersonFile;
export type RemovePersonFileRoute = typeof removePersonFile;
export type CreatePersonRoute = typeof createPerson;
export type GetPersonRoute = typeof getPerson;
export type UpdatePersonRoute = typeof updatePerson;
export type LinkPeopleRoute = typeof linkPeople;
