import * as HttpStatusCodes from "stoker/http-status-codes";

import { storage } from "@/services/storage";
import type { AuthedRouteHandler } from "@/types";

import type {
  ConfirmRoute,
  CreateRoute,
  DownloadUrlRoute,
  ListRoute,
  RemoveRoute,
  ViewsRoute,
} from "./files.route";

/**
 * The storage package does not check who is calling, so every handler that
 * takes a file id first loads the file with `getOwnedFile`. A file in another
 * organization gets the same 404 as one that doesn't exist, so ids can't be
 * probed.
 *
 * Failures are thrown as StorageError and mapped to HTTP codes in lib/on-error.
 */
const loadOwnedFile = async (id: string, organizationId: string) =>
  await storage.getOwnedFile(id, organizationId);

export const create: AuthedRouteHandler<CreateRoute> = async (c) => {
  const body = c.req.valid("json");
  const result = await storage.createUpload({
    ...body,
    checksumSha256: body.checksumSha256 ?? undefined,
    organizationId: c.get("organizationId"),
    uploadedBy: c.get("userId"),
  });

  return c.json(result, HttpStatusCodes.CREATED);
};

export const confirm: AuthedRouteHandler<ConfirmRoute> = async (c) => {
  const { id } = c.req.valid("param");
  await loadOwnedFile(id, c.get("organizationId"));

  const file = await storage.confirmUpload(id);

  return c.json({ file }, HttpStatusCodes.OK);
};

export const list: AuthedRouteHandler<ListRoute> = async (c) => {
  const { kind } = c.req.valid("query");
  const files = await storage.list({
    kind,
    organizationId: c.get("organizationId"),
  });

  return c.json({ files }, HttpStatusCodes.OK);
};

export const downloadUrl: AuthedRouteHandler<DownloadUrlRoute> = async (c) => {
  const { id } = c.req.valid("param");
  await loadOwnedFile(id, c.get("organizationId"));

  const url = await storage.getDownloadUrl(id, c.get("userId"));

  return c.json({ url }, HttpStatusCodes.OK);
};

export const views: AuthedRouteHandler<ViewsRoute> = async (c) => {
  const { id } = c.req.valid("param");
  await loadOwnedFile(id, c.get("organizationId"));

  const fileViews = await storage.listViews(id);

  return c.json({ views: fileViews }, HttpStatusCodes.OK);
};

export const remove: AuthedRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  await loadOwnedFile(id, c.get("organizationId"));

  await storage.remove(id);

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
