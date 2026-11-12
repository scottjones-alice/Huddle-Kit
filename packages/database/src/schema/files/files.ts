/**
 * Tables for files kept in object storage (S3). The bytes live in the bucket;
 * this table records who owns each object and where it is.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  check,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { isOneOf } from "../shared/constraints";

// "sensitive" is for scans of personal documents (consent forms, DBS and other
// certificates, safeguarding attachments). They need a checksum and are stored
// and served with stricter rules by the storage package.
export const FILE_KINDS = ["photo", "report", "sensitive", "other"] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export const FILE_STATUSES = ["pending", "uploaded", "failed"] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];

export const files = pgTable(
  "files",
  {
    bucket: text("bucket").notNull(),
    // SHA-256 of the bytes as 64 lower-case hex characters, to detect corruption or tampering. Null until known.
    checksumSha256: text("checksum_sha256"),
    contentType: text("content_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    etag: text("etag"),
    fileName: text("file_name").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    key: text("key").notNull(),
    kind: text("kind").$type<FileKind>().notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    status: text("status").$type<FileStatus>().default("pending").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // When the bytes were confirmed in the bucket. Null until then; `createdAt` is when the upload started.
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    check("files_kind_chk", isOneOf(table.kind, FILE_KINDS)),
    check("files_status_chk", isOneOf(table.status, FILE_STATUSES)),
    check("files_sizeBytes_chk", sql`${table.sizeBytes} >= 0`),
    check(
      "files_checksumSha256_chk",
      sql`${table.checksumSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "files_sensitiveChecksum_chk",
      sql`${table.kind} <> 'sensitive' or ${table.checksumSha256} is not null`
    ),
    uniqueIndex("files_bucket_key_uidx").on(table.bucket, table.key),
    index("files_organizationId_idx").on(table.organizationId),
    index("files_uploadedBy_idx").on(table.uploadedBy),
    index("files_organizationId_kind_idx").on(table.organizationId, table.kind),
  ]
);

/**
 * One row each time someone is given access to view a file (a download url was
 * issued). A presigned url cannot be tracked once handed out, so this records
 * who asked and when, not every byte read.
 */
export const fileViews = pgTable(
  "file_views",
  {
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    viewedBy: uuid("viewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("file_views_fileId_viewedAt_idx").on(table.fileId, table.viewedAt),
    index("file_views_viewedBy_idx").on(table.viewedBy),
  ]
);

/**
 * Only `files` and `file_views` get relations here. Parts merge per table, so adding `files`
 * to `organizations` or `users` would replace the auth part's relations for them.
 */
export const storageRelations = defineRelationsPart(
  { fileViews, files, organizations, users },
  (r) => ({
    fileViews: {
      file: r.one.files({
        from: r.fileViews.fileId,
        to: r.files.id,
      }),
      viewer: r.one.users({
        from: r.fileViews.viewedBy,
        to: r.users.id,
      }),
    },
    files: {
      organization: r.one.organizations({
        from: r.files.organizationId,
        to: r.organizations.id,
      }),
      uploader: r.one.users({
        from: r.files.uploadedBy,
        to: r.users.id,
      }),
      views: r.many.fileViews({
        from: r.files.id,
        to: r.fileViews.fileId,
      }),
    },
  })
);
