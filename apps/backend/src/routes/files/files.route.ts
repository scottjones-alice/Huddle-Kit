import {
  fileInsertSchema,
  fileSelectSchema,
  fileViewSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { IdUUIDParamsSchema } from "stoker/openapi/schemas";

const TAGS = ["Files"];
const MAX_FILE_NAME_LENGTH = 255;

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
});

// Derived from the table schema, so the rules can't drift from the database.
const createUploadBody = fileInsertSchema
  .pick({
    checksumSha256: true,
    contentType: true,
    fileName: true,
    kind: true,
    sizeBytes: true,
  })
  .extend({
    contentType: z.string().min(1),
    fileName: z.string().min(1).max(MAX_FILE_NAME_LENGTH),
    sizeBytes: z.number().int().positive(),
  });

const listQuery = z.object({ kind: fileSelectSchema.shape.kind.optional() });

const unauthorized = jsonContent(errorSchema, "No signed-in user.");
const noOrganization = jsonContent(errorSchema, "No active organization.");
const notFound = jsonContent(
  errorSchema,
  "No such file, or it belongs to another organization."
);
const conflict = jsonContent(
  errorSchema,
  "The file is not in the right state."
);
const unprocessable = jsonContent(errorSchema, "The request is not valid.");

export const create = createRoute({
  description:
    "Records a pending file and returns a presigned URL. The client PUTs the bytes there with exactly the returned uploadHeaders, then calls confirm. Sensitive files must declare checksumSha256 (SHA-256 as 64 lower-case hex characters).",
  method: "post",
  path: "/files",
  request: {
    body: jsonContentRequired(createUploadBody, "The file to upload."),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        file: fileSelectSchema,
        uploadHeaders: z.record(z.string(), z.string()),
        uploadUrl: z.string(),
      }),
      "The pending file, where to upload it, and the headers the PUT must carry."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: noOrganization,
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: unprocessable,
  },
  summary: "Start an upload",
  tags: TAGS,
});

export const confirm = createRoute({
  description:
    "Checks the object arrived with the declared size. Safe to call twice.",
  method: "post",
  path: "/files/{id}/confirm",
  request: { params: IdUUIDParamsSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ file: fileSelectSchema }),
      "The uploaded file."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: noOrganization,
    [HttpStatusCodes.NOT_FOUND]: notFound,
    [HttpStatusCodes.CONFLICT]: conflict,
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: unprocessable,
  },
  summary: "Confirm an upload",
  tags: TAGS,
});

export const list = createRoute({
  description: "Uploaded files for the active organization, newest first.",
  method: "get",
  path: "/files",
  request: { query: listQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ files: z.array(fileSelectSchema) }),
      "The organization's files."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: noOrganization,
  },
  summary: "List files",
  tags: TAGS,
});

export const downloadUrl = createRoute({
  description:
    "Returns a presigned download URL and records who asked for it and when.",
  method: "get",
  path: "/files/{id}/url",
  request: { params: IdUUIDParamsSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ url: z.string() }),
      "A time-limited download URL."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: noOrganization,
    [HttpStatusCodes.NOT_FOUND]: notFound,
    [HttpStatusCodes.CONFLICT]: conflict,
  },
  summary: "Get a download URL",
  tags: TAGS,
});

export const views = createRoute({
  description: "Who was given access to a file and when, newest first.",
  method: "get",
  path: "/files/{id}/views",
  request: { params: IdUUIDParamsSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ views: z.array(fileViewSelectSchema) }),
      "The file's views."
    ),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: noOrganization,
    [HttpStatusCodes.NOT_FOUND]: notFound,
  },
  summary: "List who viewed a file",
  tags: TAGS,
});

export const remove = createRoute({
  description: "Deletes the object, then the row.",
  method: "delete",
  path: "/files/{id}",
  request: { params: IdUUIDParamsSchema },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "The file was deleted." },
    [HttpStatusCodes.UNAUTHORIZED]: unauthorized,
    [HttpStatusCodes.FORBIDDEN]: noOrganization,
    [HttpStatusCodes.NOT_FOUND]: notFound,
  },
  summary: "Delete a file",
  tags: TAGS,
});

export type CreateRoute = typeof create;
export type ConfirmRoute = typeof confirm;
export type ListRoute = typeof list;
export type DownloadUrlRoute = typeof downloadUrl;
export type ViewsRoute = typeof views;
export type RemoveRoute = typeof remove;
