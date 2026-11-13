import { files, people, personFiles } from "@alice/database";
import type {
  Database,
  FileKind,
  FileStatus,
  PersonFilePurpose,
} from "@alice/database";
import { and, asc, eq, inArray } from "drizzle-orm";

import { forbidden, invalid, notFound } from "@/lib/app-error";
import type { Caller } from "@/services/access";
import {
  assertCanEdit,
  assertCanSee,
  editablePersonIds,
} from "@/services/people";

/** Photos only for the picture roles; everything else is a document. */
const PICTURE_PURPOSES: readonly PersonFilePurpose[] = ["avatar", "cover"];
const DOCUMENT_KINDS: ReadonlySet<FileKind> = new Set(["sensitive", "other"]);

const isPicture = (purpose: PersonFilePurpose): boolean =>
  PICTURE_PURPOSES.includes(purpose);

/** Just what the attach rules need to know about the uploaded file. */
export interface UploadedFile {
  id: string;
  kind: FileKind;
  status: FileStatus;
  uploadedBy: string | null;
}

const canEditPerson = async (
  db: Database,
  caller: Caller,
  personId: string
): Promise<boolean> => {
  const editable = await editablePersonIds(db, caller);
  return editable === null || editable.includes(personId);
};

/**
 * The files on a person's record. Anyone who may see the person sees their
 * photo and cover. Documents can hold personal data about a child, so only
 * people who may also edit the person (a club admin, themselves, a parent) see
 * them. Files still uploading or that failed are left out.
 */
export const listPersonFiles = async (
  db: Database,
  caller: Caller,
  personId: string
) => {
  await assertCanSee(db, caller, personId);
  const mayOpenDocuments = await canEditPerson(db, caller, personId);
  return await db
    .select({ file: files, link: personFiles })
    .from(personFiles)
    .innerJoin(files, eq(files.id, personFiles.fileId))
    .where(
      and(
        eq(personFiles.organizationId, caller.organizationId),
        eq(personFiles.personId, personId),
        eq(files.status, "uploaded"),
        mayOpenDocuments
          ? undefined
          : inArray(personFiles.purpose, [...PICTURE_PURPOSES])
      )
    )
    .orderBy(asc(personFiles.createdAt));
};

/**
 * Attaches an uploaded file to a person. A new photo or cover replaces the old
 * one, and the ids of the replaced files come back so the caller can delete
 * their bytes from storage.
 */
export const attachPersonFile = async (
  db: Database,
  caller: Caller,
  personId: string,
  file: UploadedFile,
  purpose: PersonFilePurpose
) => {
  await assertCanEdit(db, caller, personId);

  const [person] = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        eq(people.organizationId, caller.organizationId),
        eq(people.id, personId)
      )
    );
  if (person === undefined) {
    throw notFound("Person");
  }

  if (file.status !== "uploaded") {
    throw invalid("The file has not finished uploading");
  }
  if (
    isPicture(purpose) ? file.kind !== "photo" : !DOCUMENT_KINDS.has(file.kind)
  ) {
    throw invalid(
      isPicture(purpose)
        ? "A photo or cover must be uploaded as a photo"
        : "A document must be uploaded as sensitive or other"
    );
  }
  // Without this, anyone could attach a file a colleague uploaded for something else.
  if (file.uploadedBy !== caller.userId && !caller.isManager) {
    throw forbidden("You can only attach files you uploaded yourself");
  }

  return await db.transaction(async (tx) => {
    const replaced = isPicture(purpose)
      ? await tx
          .delete(personFiles)
          .where(
            and(
              eq(personFiles.organizationId, caller.organizationId),
              eq(personFiles.personId, personId),
              eq(personFiles.purpose, purpose)
            )
          )
          .returning({ fileId: personFiles.fileId })
      : [];
    const [link] = await tx
      .insert(personFiles)
      .values({
        createdBy: caller.userId,
        fileId: file.id,
        organizationId: caller.organizationId,
        personId,
        purpose,
      })
      .returning();
    if (link === undefined) {
      throw invalid("The file could not be attached");
    }
    return { link, replacedFileIds: replaced.map((row) => row.fileId) };
  });
};

/**
 * Which file is each person's profile photo, for a page of people that the
 * caller can already see. People with no photo are left out of the map.
 */
export const avatarFileIds = async (
  db: Database,
  organizationId: string,
  personIds: string[]
): Promise<Map<string, string>> => {
  if (personIds.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({ fileId: personFiles.fileId, personId: personFiles.personId })
    .from(personFiles)
    .where(
      and(
        eq(personFiles.organizationId, organizationId),
        eq(personFiles.purpose, "avatar"),
        inArray(personFiles.personId, personIds)
      )
    );
  return new Map(rows.map((row) => [row.personId, row.fileId]));
};

/** Finds a link on this person so it can be removed, or says there is none. */
export const findPersonFileLink = async (
  db: Database,
  caller: Caller,
  personId: string,
  linkId: string
): Promise<{ fileId: string }> => {
  await assertCanEdit(db, caller, personId);
  const [link] = await db
    .select({ fileId: personFiles.fileId })
    .from(personFiles)
    .where(
      and(
        eq(personFiles.organizationId, caller.organizationId),
        eq(personFiles.personId, personId),
        eq(personFiles.id, linkId)
      )
    );
  if (link === undefined) {
    throw notFound("File");
  }
  return link;
};
