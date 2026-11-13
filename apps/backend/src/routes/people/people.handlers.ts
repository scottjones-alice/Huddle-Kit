import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { requireManager } from "@/services/access";
import { db } from "@/services/database";
import {
  createPerson as createPersonRow,
  findPersonForUser,
  getPersonDetail,
  linkPeople as linkPeopleRows,
  listPeople as listPeopleRows,
  updatePerson as updatePersonRow,
} from "@/services/people";
import {
  attachPersonFile as attachPersonFileRow,
  avatarFileIds,
  findPersonFileLink,
  listPersonFiles as listPersonFileRows,
} from "@/services/person-files";
import { storage } from "@/services/storage";
import type { AuthedRouteHandler } from "@/types";

import type {
  AttachPersonFileRoute,
  CreatePersonRoute,
  GetMyPersonRoute,
  GetPersonRoute,
  LinkPeopleRoute,
  ListPeopleRoute,
  ListPersonFilesRoute,
  RemovePersonFileRoute,
  UpdatePersonRoute,
} from "./people.route";

export const listPeople: AuthedRouteHandler<ListPeopleRoute> = async (c) => {
  const caller = await callerOf(c);
  const { includeArchived, limit, offset, search } = c.req.valid("query");
  const rows = await listPeopleRows(db, caller, {
    includeArchived: isTrue(includeArchived),
    limit,
    offset,
    search,
  });
  // Photos are shown to the whole club, so listing them is not logged as a view.
  const avatars = await avatarFileIds(
    db,
    caller.organizationId,
    rows.map((row) => row.id)
  );
  const people = await Promise.all(
    rows.map(async (row) => {
      const fileId = avatars.get(row.id);
      return {
        ...row,
        avatarUrl:
          fileId === undefined
            ? null
            : await storage
                .getDownloadUrl(fileId, caller.userId, { logView: false })
                .catch(() => null),
      };
    })
  );
  return c.json({ people }, HttpStatusCodes.OK);
};

export const getMyPerson: AuthedRouteHandler<GetMyPersonRoute> = async (c) => {
  const caller = await callerOf(c);
  const person = await findPersonForUser(db, caller);
  if (person === null) {
    return c.json({ person: null }, HttpStatusCodes.OK);
  }
  const avatars = await avatarFileIds(db, caller.organizationId, [person.id]);
  const fileId = avatars.get(person.id);
  const avatarUrl =
    fileId === undefined
      ? null
      : await storage
          .getDownloadUrl(fileId, caller.userId, { logView: false })
          .catch(() => null);
  return c.json(
    {
      person: {
        avatarUrl,
        firstName: person.firstName,
        id: person.id,
        lastName: person.lastName,
        preferredName: person.preferredName,
      },
    },
    HttpStatusCodes.OK
  );
};

export const createPerson: AuthedRouteHandler<CreatePersonRoute> = async (
  c
) => {
  requireManager(await callerOf(c));
  const person = await createPersonRow(
    db,
    c.get("organizationId"),
    c.req.valid("json")
  );
  return c.json(person, HttpStatusCodes.CREATED);
};

export const getPerson: AuthedRouteHandler<GetPersonRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  return c.json(await getPersonDetail(db, caller, id), HttpStatusCodes.OK);
};

export const updatePerson: AuthedRouteHandler<UpdatePersonRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const person = await updatePersonRow(db, caller, id, c.req.valid("json"));
  return c.json(person, HttpStatusCodes.OK);
};

export const linkPeople: AuthedRouteHandler<LinkPeopleRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  const row = await linkPeopleRows(
    db,
    c.get("organizationId"),
    id,
    c.req.valid("json")
  );
  return c.json(row, HttpStatusCodes.CREATED);
};

/** Photos and covers get a temporary link to show them; documents open on request. */
const urlFor = async (
  file: { id: string },
  purpose: string,
  userId: string
): Promise<string | null> =>
  purpose === "document" ? null : await storage.getDownloadUrl(file.id, userId);

export const listPersonFiles: AuthedRouteHandler<ListPersonFilesRoute> = async (
  c
) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const rows = await listPersonFileRows(db, caller, id);
  const withUrls = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      url: await urlFor(row.file, row.link.purpose, caller.userId),
    }))
  );
  return c.json({ files: withUrls }, HttpStatusCodes.OK);
};

export const attachPersonFile: AuthedRouteHandler<
  AttachPersonFileRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { fileId, purpose } = c.req.valid("json");
  const file = await storage.getOwnedFile(fileId, caller.organizationId);
  const { link, replacedFileIds } = await attachPersonFileRow(
    db,
    caller,
    id,
    file,
    purpose
  );
  // The replaced photo's link is already gone; this frees its bytes. If it
  // fails the file is only left orphaned, which is safe to clean up later.
  await Promise.allSettled(
    replacedFileIds.map(async (replaced) => {
      await storage.remove(replaced);
    })
  );
  return c.json(
    { file, link, url: await urlFor(file, purpose, caller.userId) },
    HttpStatusCodes.CREATED
  );
};

export const removePersonFile: AuthedRouteHandler<
  RemovePersonFileRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id, linkId } = c.req.valid("param");
  const { fileId } = await findPersonFileLink(db, caller, id, linkId);
  // Deleting the file also deletes the link, which points at it.
  await storage.remove(fileId);
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
