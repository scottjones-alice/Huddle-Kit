/**
 * Ties a stored file (see `files`) to a person: their profile photo, their
 * cover image, or a document kept on their record such as a consent form or
 * a medical letter. The bytes live in the bucket; `files` says where, and this
 * table says whose.
 *
 * A person has at most one avatar and one cover. Putting in a new one replaces
 * the old link. A file belongs to one person, so removing the file removes the
 * link and removing the link leaves the file for the caller to delete.
 *
 * Documents can hold personal data about children. Keep them out of general
 * lists and views.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  timestamp,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { files } from "../files/files";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const PERSON_FILE_PURPOSES = ["avatar", "cover", "document"] as const;
export type PersonFilePurpose = (typeof PERSON_FILE_PURPOSES)[number];

export const personFiles = pgTable(
  "person_files",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Who attached it. Kept as history, cleared if that login is deleted.
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    purpose: text("purpose").$type<PersonFilePurpose>().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_files_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "person_files_purpose_chk",
      isOneOf(table.purpose, PERSON_FILE_PURPOSES)
    ),
    // A file is attached to one person, once.
    uniqueIndex("person_files_fileId_uidx").on(table.fileId),
    // One avatar and one cover each. Documents have no limit.
    uniqueIndex("person_files_person_single_uidx")
      .on(table.personId, table.purpose)
      .where(sql`${table.purpose} in ('avatar', 'cover')`),
    index("person_files_organizationId_idx").on(table.organizationId),
    index("person_files_personId_idx").on(table.personId),
    index("person_files_createdBy_idx").on(table.createdBy),
  ]
);

/** Only this table's own relations. Parts merge per table, so `people` and `files` keep theirs. */
export const personFileRelations = defineRelationsPart(
  { files, people, personFiles },
  (r) => ({
    personFiles: {
      file: r.one.files({
        from: r.personFiles.fileId,
        to: r.files.id,
      }),
      person: r.one.people({
        from: r.personFiles.personId,
        to: r.people.id,
      }),
    },
  })
);
