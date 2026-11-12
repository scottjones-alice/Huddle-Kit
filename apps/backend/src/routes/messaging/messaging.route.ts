import {
  announcementSelectSchema,
  notificationSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  idParams,
  invalidBody,
  notFoundBody,
  pageQuery,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Messaging"];

const when = z.iso.datetime({ offset: true });

const announcementBody = z.object({
  body: z.string().trim().min(1).max(5000),
  expiresAt: when.nullish().describe("Stop showing it after this time."),
  publish: z
    .boolean()
    .optional()
    .describe(
      "false saves a draft that nobody is told about. Defaults to true."
    ),
  teamId: z
    .uuid()
    .nullish()
    .describe("Leave out to post to the whole club. Club admins only."),
  title: z.string().trim().min(1).max(200),
});

const announcementChanges = z.object({
  body: z.string().trim().min(1).max(5000).optional(),
  expiresAt: when
    .nullish()
    .describe("Give it an expiry to take it down. Posts are never deleted."),
  publish: z
    .boolean()
    .optional()
    .describe("true publishes a draft and tells people, once."),
  title: z.string().trim().min(1).max(200).optional(),
});

const announcementResult = z.object({
  announcement: announcementSelectSchema,
  notified: z
    .number()
    .int()
    .describe("How many people were sent a notification."),
});

const announcementQuery = pageQuery.extend({
  includeDrafts: z
    .enum(["true", "false"])
    .default("false")
    .describe("Club admins only: also return drafts and expired posts."),
});

const inboxQuery = pageQuery.extend({
  unread: z.enum(["true", "false"]).default("false").describe("Only unread."),
});

export const listAnnouncements = createRoute({
  description:
    "Posts from the club. You see club-wide posts and posts for teams you play for, coach, or have a child in. There is no private messaging: the club speaks to members through posts and notifications, which the club can see.",
  method: "get",
  operationId: "listAnnouncements",
  path: "/announcements",
  request: { query: announcementQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ announcements: z.array(announcementSelectSchema) }),
      "The posts, newest first."
    ),
    ...sessionErrors,
  },
  summary: "List announcements",
  tags: TAGS,
});

export const createAnnouncement = createRoute({
  description:
    "Posts to the whole club (club admins) or to one team (its coaches). Everyone it is for gets a notification, unless it is saved as a draft.",
  method: "post",
  operationId: "createAnnouncement",
  path: "/announcements",
  request: { body: jsonContentRequired(announcementBody, "The post.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      announcementResult,
      "The post and how many people were told."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("team"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Post an announcement",
  tags: TAGS,
});

export const updateAnnouncement = createRoute({
  description:
    "Edits a post, publishes a draft, or takes a post down by expiring it. Posts are never deleted.",
  method: "patch",
  operationId: "updateAnnouncement",
  path: "/announcements/{id}",
  request: {
    body: jsonContentRequired(announcementChanges, "The fields to change."),
    params: idParams("announcement"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      announcementResult,
      "The post and how many people were told."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("announcement"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change, publish or take down an announcement",
  tags: TAGS,
});

export const listNotifications = createRoute({
  description: "The caller's own inbox in this club.",
  method: "get",
  operationId: "listNotifications",
  path: "/notifications",
  request: { query: inboxQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ notifications: z.array(notificationSelectSchema) }),
      "The notifications, newest first."
    ),
    ...sessionErrors,
  },
  summary: "List my notifications",
  tags: TAGS,
});

export const markAllRead = createRoute({
  method: "post",
  operationId: "markAllNotificationsRead",
  path: "/notifications/read",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ updated: z.number().int() }),
      "How many were marked as read."
    ),
    ...sessionErrors,
  },
  summary: "Mark all my notifications as read",
  tags: TAGS,
});

export const markRead = createRoute({
  method: "post",
  operationId: "markNotificationRead",
  path: "/notifications/{id}/read",
  request: { params: idParams("notification") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      notificationSelectSchema,
      "The notification."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("notification"),
    ...sessionErrors,
  },
  summary: "Mark a notification as read",
  tags: TAGS,
});

export type ListAnnouncementsRoute = typeof listAnnouncements;
export type CreateAnnouncementRoute = typeof createAnnouncement;
export type UpdateAnnouncementRoute = typeof updateAnnouncement;
export type ListNotificationsRoute = typeof listNotifications;
export type MarkAllReadRoute = typeof markAllRead;
export type MarkReadRoute = typeof markRead;
