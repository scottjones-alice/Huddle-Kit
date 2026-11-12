// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Messaging extends APIResource {
  /**
   * Posts from the club. You see club-wide posts and posts for teams you play for, coach, or have a child in. There is no private messaging: the club speaks to members through posts and notifications, which the club can see.
   *
   * @param {MessagingListAnnouncementsParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessagingListAnnouncementsResponse>} The posts, newest first.
   *
   * @example
   * ```ts
   * const messaging = await client.messaging.listAnnouncements({
   *   limit: 50,
   *   offset: 0,
   *   includeDrafts: 'false',
   * });
   * ```
   */
  listAnnouncements(
    query: MessagingListAnnouncementsParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<MessagingListAnnouncementsResponse> {
    return this._client.get('/api/v1/announcements', { query, ...options });
  }

  /**
   * Posts to the whole club (club admins) or to one team (its coaches). Everyone it is for gets a notification, unless it is saved as a draft.
   *
   * @param {MessagingCreateAnnouncementParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessagingCreateAnnouncementResponse>} The post and how many people were told.
   *
   * @example
   * ```ts
   * const messaging = await client.messaging.createAnnouncement({
   *   body: 'string',
   *   expiresAt: '2026-01-15T09:30:00.000Z',
   *   publish: true,
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   title: 'string',
   * });
   * ```
   */
  createAnnouncement(
    body: MessagingCreateAnnouncementParams,
    options?: RequestOptions,
  ): APIPromise<MessagingCreateAnnouncementResponse> {
    return this._client.post('/api/v1/announcements', { body, ...options });
  }

  /**
   * Edits a post, publishes a draft, or takes a post down by expiring it. Posts are never deleted.
   *
   * @param {string} id - The announcement's id.
   * @param {MessagingUpdateAnnouncementParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessagingUpdateAnnouncementResponse>} The post and how many people were told.
   *
   * @example
   * ```ts
   * const messaging = await client.messaging.updateAnnouncement('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   body: 'string',
   *   expiresAt: '2026-01-15T09:30:00.000Z',
   *   publish: true,
   *   title: 'string',
   * });
   * ```
   */
  updateAnnouncement(
    id: string,
    body: MessagingUpdateAnnouncementParams,
    options?: RequestOptions,
  ): APIPromise<MessagingUpdateAnnouncementResponse> {
    return this._client.patch(__scalarPath`/api/v1/announcements/${id}`, { body, ...options });
  }

  /**
   * The caller's own inbox in this club.
   *
   * @param {MessagingListNotificationsParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessagingListNotificationsResponse>} The notifications, newest first.
   *
   * @example
   * ```ts
   * const messaging = await client.messaging.listNotifications({
   *   limit: 50,
   *   offset: 0,
   *   unread: 'false',
   * });
   * ```
   */
  listNotifications(
    query: MessagingListNotificationsParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<MessagingListNotificationsResponse> {
    return this._client.get('/api/v1/notifications', { query, ...options });
  }

  /**
   * Mark all my notifications as read
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessagingMarkAllNotificationsReadResponse>} How many were marked as read.
   *
   * @example
   * ```ts
   * const messaging = await client.messaging.markAllNotificationsRead();
   * ```
   */
  markAllNotificationsRead(options?: RequestOptions): APIPromise<MessagingMarkAllNotificationsReadResponse> {
    return this._client.post('/api/v1/notifications/read', options);
  }

  /**
   * Mark a notification as read
   *
   * @param {string} id - The notification's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessagingMarkNotificationReadResponse>} The notification.
   *
   * @example
   * ```ts
   * const messaging = await client.messaging.markNotificationRead('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  markNotificationRead(
    id: string,
    options?: RequestOptions,
  ): APIPromise<MessagingMarkNotificationReadResponse> {
    return this._client.post(__scalarPath`/api/v1/notifications/${id}/read`, options);
  }
}

export interface MessagingListAnnouncementsParams {
  /**
   * How many to return (1 to 200).
   * @default 50
   * @minimum 1
   * @maximum 200
   */
  limit?: number;
  /**
   * How many to skip.
   * @default 0
   * @minimum 0
   */
  offset?: number | null;
  /**
   * Club admins only: also return drafts and expired posts.
   * @default false
   */
  includeDrafts?: 'true' | 'false';
}

export interface MessagingListAnnouncementsResponse {
  announcements: Array<MessagingListAnnouncementsResponse.Announcement>;
}

export namespace MessagingListAnnouncementsResponse {
  export interface Announcement {
    /**
     * @format uuid
     */
    authorUserId: string | null;
    /**
     * @minLength 1
     */
    body: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date-time
     */
    expiresAt: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    publishedAt: string | null;
    /**
     * @format uuid
     */
    teamId: string | null;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface MessagingCreateAnnouncementParams {
  /**
   * @minLength 1
   * @maxLength 5000
   */
  body: string;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string;
  /**
   * Stop showing it after this time.
   * @format date-time
   */
  expiresAt?: string | null;
  /**
   * false saves a draft that nobody is told about. Defaults to true.
   */
  publish?: boolean;
  /**
   * Leave out to post to the whole club. Club admins only.
   * @format uuid
   */
  teamId?: string | null;
}

export interface MessagingCreateAnnouncementResponse {
  announcement: MessagingCreateAnnouncementResponse.Announcement;
  /**
   * How many people were sent a notification.
   */
  notified: number;
}

export namespace MessagingCreateAnnouncementResponse {
  export interface Announcement {
    /**
     * @format uuid
     */
    authorUserId: string | null;
    /**
     * @minLength 1
     */
    body: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date-time
     */
    expiresAt: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    publishedAt: string | null;
    /**
     * @format uuid
     */
    teamId: string | null;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface MessagingUpdateAnnouncementParams {
  /**
   * @minLength 1
   * @maxLength 5000
   */
  body?: string;
  /**
   * Give it an expiry to take it down. Posts are never deleted.
   * @format date-time
   */
  expiresAt?: string | null;
  /**
   * true publishes a draft and tells people, once.
   */
  publish?: boolean;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string;
}

export interface MessagingUpdateAnnouncementResponse {
  announcement: MessagingUpdateAnnouncementResponse.Announcement;
  /**
   * How many people were sent a notification.
   */
  notified: number;
}

export namespace MessagingUpdateAnnouncementResponse {
  export interface Announcement {
    /**
     * @format uuid
     */
    authorUserId: string | null;
    /**
     * @minLength 1
     */
    body: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date-time
     */
    expiresAt: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    publishedAt: string | null;
    /**
     * @format uuid
     */
    teamId: string | null;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface MessagingListNotificationsParams {
  /**
   * How many to return (1 to 200).
   * @default 50
   * @minimum 1
   * @maximum 200
   */
  limit?: number;
  /**
   * How many to skip.
   * @default 0
   * @minimum 0
   */
  offset?: number | null;
  /**
   * Only unread.
   * @default false
   */
  unread?: 'true' | 'false';
}

export interface MessagingListNotificationsResponse {
  notifications: Array<MessagingListNotificationsResponse.Notification>;
}

export namespace MessagingListNotificationsResponse {
  export interface Notification {
    body: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    entityId: string | null;
    entityType: string | null;
    /**
     * @format uuid
     */
    id: string;
    kind:
      | 'announcement'
      | 'event_change'
      | 'event_reminder'
      | 'consent_request'
      | 'payment_reminder'
      | 'other';
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    readAt: string | null;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format uuid
     */
    userId: string;
  }
}

export interface MessagingMarkAllNotificationsReadResponse {
  updated: number;
}

export interface MessagingMarkNotificationReadResponse {
  body: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  entityId: string | null;
  entityType: string | null;
  /**
   * @format uuid
   */
  id: string;
  kind: 'announcement' | 'event_change' | 'event_reminder' | 'consent_request' | 'payment_reminder' | 'other';
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  readAt: string | null;
  /**
   * @minLength 1
   */
  title: string;
  /**
   * @format uuid
   */
  userId: string;
}
export declare namespace Messaging {
  export {
    type MessagingListAnnouncementsResponse as MessagingListAnnouncementsResponse,
    type MessagingCreateAnnouncementResponse as MessagingCreateAnnouncementResponse,
    type MessagingUpdateAnnouncementResponse as MessagingUpdateAnnouncementResponse,
    type MessagingListNotificationsResponse as MessagingListNotificationsResponse,
    type MessagingMarkAllNotificationsReadResponse as MessagingMarkAllNotificationsReadResponse,
    type MessagingMarkNotificationReadResponse as MessagingMarkNotificationReadResponse,
    type MessagingListAnnouncementsParams as MessagingListAnnouncementsParams,
    type MessagingCreateAnnouncementParams as MessagingCreateAnnouncementParams,
    type MessagingUpdateAnnouncementParams as MessagingUpdateAnnouncementParams,
    type MessagingListNotificationsParams as MessagingListNotificationsParams,
  };
}
