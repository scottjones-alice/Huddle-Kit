import { RELATIONSHIP_KINDS } from "@alice/database";
import {
  addressSelectSchema,
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

export const listPeople = createRoute({
  description:
    "Club admins see everyone. A coach sees the people on the teams they coach. Anyone else sees only themselves and their own children.",
  method: "get",
  operationId: "listPeople",
  path: "/people",
  request: { query: listQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ people: z.array(personSelectSchema) }),
      "The people the caller may see, by last name."
    ),
    ...sessionErrors,
  },
  summary: "List people",
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

export type ListPeopleRoute = typeof listPeople;
export type CreatePersonRoute = typeof createPerson;
export type GetPersonRoute = typeof getPerson;
export type UpdatePersonRoute = typeof updatePerson;
export type LinkPeopleRoute = typeof linkPeople;
