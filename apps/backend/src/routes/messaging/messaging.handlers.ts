import {
  announcementSelectSchema,
  notificationSelectSchema,
} from "@alice/database/validation";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { db } from "@/services/database";
import {
  createAnnouncement as createAnnouncementRow,
  listAnnouncements as listAnnouncementRows,
  listNotifications as listNotificationRows,
  markAllRead as markAllReadRows,
  markRead as markReadRow,
  updateAnnouncement as updateAnnouncementRow,
} from "@/services/messaging";
import type { AuthedRouteHandler } from "@/types";

import type {
  CreateAnnouncementRoute,
  ListAnnouncementsRoute,
  ListNotificationsRoute,
  MarkAllReadRoute,
  MarkReadRoute,
  UpdateAnnouncementRoute,
} from "./messaging.route";

const toDate = (value: string | null | undefined): Date | null | undefined =>
  value === null || value === undefined ? value : new Date(value);

export const listAnnouncements: AuthedRouteHandler<
  ListAnnouncementsRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { includeDrafts, limit, offset } = c.req.valid("query");
  const rows = await listAnnouncementRows(db, caller, {
    includeDrafts: isTrue(includeDrafts),
    limit,
    offset,
  });
  return c.json(
    { announcements: announcementSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const createAnnouncement: AuthedRouteHandler<
  CreateAnnouncementRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { expiresAt, ...rest } = c.req.valid("json");
  const result = await createAnnouncementRow(db, caller, {
    ...rest,
    expiresAt: toDate(expiresAt),
  });
  return c.json(
    {
      announcement: announcementSelectSchema.parse(result.announcement),
      notified: result.notified,
    },
    HttpStatusCodes.CREATED
  );
};

export const updateAnnouncement: AuthedRouteHandler<
  UpdateAnnouncementRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const { expiresAt, ...rest } = c.req.valid("json");
  const result = await updateAnnouncementRow(db, caller, id, {
    ...rest,
    ...(expiresAt === undefined
      ? {}
      : { expiresAt: toDate(expiresAt) ?? null }),
  });
  return c.json(
    {
      announcement: announcementSelectSchema.parse(result.announcement),
      notified: result.notified,
    },
    HttpStatusCodes.OK
  );
};

export const listNotifications: AuthedRouteHandler<
  ListNotificationsRoute
> = async (c) => {
  const caller = await callerOf(c);
  const { limit, offset, unread } = c.req.valid("query");
  const rows = await listNotificationRows(db, caller, {
    limit,
    offset,
    unreadOnly: isTrue(unread),
  });
  return c.json(
    { notifications: notificationSelectSchema.array().parse(rows) },
    HttpStatusCodes.OK
  );
};

export const markAllRead: AuthedRouteHandler<MarkAllReadRoute> = async (c) => {
  const caller = await callerOf(c);
  return c.json(await markAllReadRows(db, caller), HttpStatusCodes.OK);
};

export const markRead: AuthedRouteHandler<MarkReadRoute> = async (c) => {
  const caller = await callerOf(c);
  const { id } = c.req.valid("param");
  const row = await markReadRow(db, caller, id);
  return c.json(notificationSelectSchema.parse(row), HttpStatusCodes.OK);
};
