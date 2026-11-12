// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Events extends APIResource {
  /**
   * Everyone in the club can see the calendar, soonest first.
   *
   * @param {EventListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventListResponse>} The events.
   *
   * @example
   * ```ts
   * const event = await client.events.list({
   *   limit: 50,
   *   offset: 0,
   * });
   * ```
   */
  list(
    query: EventListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<EventListResponse> {
    return this._client.get('/api/v1/events', { query, ...options });
  }

  /**
   * Adds a training, match or other event. Coaches can add events for their own teams; club admins can add any, including club-wide ones.
   *
   * @param {EventCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventCreateResponse>} The new event.
   *
   * @example
   * ```ts
   * const event = await client.events.create({
   *   description: 'string',
   *   endsAt: '2026-01-15T09:30:00.000Z',
   *   kind: 'training',
   *   match: { competition: 'string', homeAway: 'home', opponentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
   *   meetAt: '2026-01-15T09:30:00.000Z',
   *   startsAt: '2026-01-15T09:30:00.000Z',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   title: 'string',
   *   venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  create(body: EventCreateParams, options?: RequestOptions): APIPromise<EventCreateResponse> {
    return this._client.post('/api/v1/events', { body, ...options });
  }

  /**
   * Get an event
   *
   * @param {string} id - The event's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventRetrieveResponse>} The event.
   *
   * @example
   * ```ts
   * const event = await client.events.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<EventRetrieveResponse> {
    return this._client.get(__scalarPath`/api/v1/events/${id}`, options);
  }

  /**
   * Changes the time or place, cancels or postpones, or records the result. Events are never deleted.
   *
   * @param {string} id - The event's id.
   * @param {EventUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventUpdateResponse>} The updated event.
   *
   * @example
   * ```ts
   * const event = await client.events.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   cancellationReason: 'string',
   *   description: 'string',
   *   endsAt: '2026-01-15T09:30:00.000Z',
   *   match: {
   *     competition: 'string',
   *     homeAway: 'home',
   *     opponentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *     goalsAgainst: 1,
   *     goalsFor: 1,
   *   },
   *   meetAt: '2026-01-15T09:30:00.000Z',
   *   startsAt: '2026-01-15T09:30:00.000Z',
   *   status: 'scheduled',
   *   title: 'string',
   *   venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  update(id: string, body: EventUpdateParams, options?: RequestOptions): APIPromise<EventUpdateResponse> {
    return this._client.patch(__scalarPath`/api/v1/events/${id}`, { body, ...options });
  }

  /**
   * Says whether someone can make it. You can answer for yourself and your children; club admins can answer for anyone. Answering again changes the answer.
   *
   * @param {string} id - The event's id.
   * @param {EventSetAvailabilityParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventSetAvailabilityResponse>} The saved answer.
   *
   * @example
   * ```ts
   * const event = await client.events.setAvailability('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   note: 'string',
   *   personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   status: 'available',
   * });
   * ```
   */
  setAvailability(
    id: string,
    body: EventSetAvailabilityParams,
    options?: RequestOptions,
  ): APIPromise<EventSetAvailabilityResponse> {
    return this._client.put(__scalarPath`/api/v1/events/${id}/availability`, { body, ...options });
  }

  /**
   * The team's coaches see every answer. Everyone else sees their own and their children's.
   *
   * @param {string} id - The event's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventListAvailabilityResponse>} The answers.
   *
   * @example
   * ```ts
   * const event = await client.events.listAvailability('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listAvailability(id: string, options?: RequestOptions): APIPromise<EventListAvailabilityResponse> {
    return this._client.get(__scalarPath`/api/v1/events/${id}/availability`, options);
  }

  /**
   * Records who turned up. Coaches of the team and club admins only. Saving a person again changes their earlier mark.
   *
   * @param {string} id - The event's id.
   * @param {EventRecordAttendanceParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventRecordAttendanceResponse>} Everyone marked so far.
   *
   * @example
   * ```ts
   * const event = await client.events.recordAttendance('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   records: [{ note: 'string', personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', status: 'present' }],
   * });
   * ```
   */
  recordAttendance(
    id: string,
    body: EventRecordAttendanceParams,
    options?: RequestOptions,
  ): APIPromise<EventRecordAttendanceResponse> {
    return this._client.put(__scalarPath`/api/v1/events/${id}/attendance`, { body, ...options });
  }

  /**
   * Coaches of the team and club admins only.
   *
   * @param {string} id - The event's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventListAttendanceResponse>} Everyone marked.
   *
   * @example
   * ```ts
   * const event = await client.events.listAttendance('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listAttendance(id: string, options?: RequestOptions): APIPromise<EventListAttendanceResponse> {
    return this._client.get(__scalarPath`/api/v1/events/${id}/attendance`, options);
  }

  /**
   * Picks the match squad. Sending the list again replaces the earlier pick. Coaches of the team and club admins only.
   *
   * @param {string} id - The match's id.
   * @param {EventSetSquadParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventSetSquadResponse>} The squad.
   *
   * @example
   * ```ts
   * const event = await client.events.setSquad('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   squad: [
   *     {
   *       goals: 1,
   *       minutesPlayed: 1,
   *       personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *       position: 'string',
   *       role: 'starter',
   *       shirtNumber: 1,
   *     },
   *   ],
   * });
   * ```
   */
  setSquad(
    id: string,
    body: EventSetSquadParams,
    options?: RequestOptions,
  ): APIPromise<EventSetSquadResponse> {
    return this._client.put(__scalarPath`/api/v1/events/${id}/squad`, { body, ...options });
  }

  /**
   * See the squad
   *
   * @param {string} id - The match's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventListSquadResponse>} The squad.
   *
   * @example
   * ```ts
   * const event = await client.events.listSquad('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listSquad(id: string, options?: RequestOptions): APIPromise<EventListSquadResponse> {
    return this._client.get(__scalarPath`/api/v1/events/${id}/squad`, options);
  }

  /**
   * Repeating sessions, such as training every Tuesday.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventListSeriesResponse>} The series.
   *
   * @example
   * ```ts
   * const event = await client.events.listSeries();
   * ```
   */
  listSeries(options?: RequestOptions): APIPromise<EventListSeriesResponse> {
    return this._client.get('/api/v1/event-series', options);
  }

  /**
   * Creates a repeating weekly event and makes its first events. Coaches for their own teams; club admins for any.
   *
   * @param {EventCreateSeriesParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventCreateSeriesResponse>} The series and how many events it made.
   *
   * @example
   * ```ts
   * const event = await client.events.createSeries({
   *   description: 'string',
   *   durationMinutes: 5,
   *   endsOn: '2026-01-15',
   *   generateUntil: '2026-01-15',
   *   intervalWeeks: 1,
   *   kind: 'training',
   *   meetMinutesBefore: 1,
   *   startTime: 'string',
   *   startsOn: '2026-01-15',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   timeZone: 'string',
   *   title: 'string',
   *   venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   weekday: 1,
   * });
   * ```
   */
  createSeries(
    body: EventCreateSeriesParams,
    options?: RequestOptions,
  ): APIPromise<EventCreateSeriesResponse> {
    return this._client.post('/api/v1/event-series', { body, ...options });
  }

  /**
   * Stops a series or sets when it ends. Events already made stay.
   *
   * @param {string} id - The series's id.
   * @param {EventUpdateSeriesParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventUpdateSeriesResponse>} The series.
   *
   * @example
   * ```ts
   * const event = await client.events.updateSeries('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   endsOn: '2026-01-15',
   *   isActive: true,
   * });
   * ```
   */
  updateSeries(
    id: string,
    body: EventUpdateSeriesParams,
    options?: RequestOptions,
  ): APIPromise<EventUpdateSeriesResponse> {
    return this._client.patch(__scalarPath`/api/v1/event-series/${id}`, { body, ...options });
  }

  /**
   * Makes the events for a series up to a date. Safe to repeat: events that exist are skipped.
   *
   * @param {string} id - The series's id.
   * @param {EventExtendSeriesParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<EventExtendSeriesResponse>} How many events were made.
   *
   * @example
   * ```ts
   * const event = await client.events.extendSeries('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   until: '2026-01-15',
   * });
   * ```
   */
  extendSeries(
    id: string,
    body: EventExtendSeriesParams,
    options?: RequestOptions,
  ): APIPromise<EventExtendSeriesResponse> {
    return this._client.post(__scalarPath`/api/v1/event-series/${id}/generate`, { body, ...options });
  }
}

export interface EventListParams {
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
   * Only events that start at or after this.
   * @format date-time
   */
  from?: string;
  /**
   * Only this kind of event.
   */
  kind?: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * Only this status.
   */
  status?: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
  /**
   * Only this team's events.
   * @format uuid
   */
  teamId?: string;
  /**
   * Only events that start before this.
   * @format date-time
   */
  to?: string;
}

export interface EventListResponse {
  events: Array<EventListResponse.Event>;
}

export namespace EventListResponse {
  export interface Event {
    /**
     * @minLength 1
     */
    cancellationReason: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    createdByUserId: string | null;
    description: string | null;
    /**
     * @format date-time
     */
    endsAt: string;
    /**
     * @format uuid
     */
    id: string;
    kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
    /**
     * @format date-time
     */
    meetAt: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    seriesId: string | null;
    /**
     * @format date-time
     */
    seriesOccurrenceStartsAt: string | null;
    /**
     * @format date-time
     */
    startsAt: string;
    status: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
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
    /**
     * @format uuid
     */
    venueId: string | null;
  }
}

export interface EventCreateParams {
  /**
   * @format date-time
   */
  endsAt: string;
  kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * @format date-time
   */
  startsAt: string;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string;
  /**
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Only for a match.
   */
  match?: EventCreateParams.Match;
  /**
   * When to arrive, if earlier than the start.
   * @format date-time
   */
  meetAt?: string | null;
  /**
   * Leave out for a club-wide event. Club admins only.
   * @format uuid
   */
  teamId?: string | null;
  /**
   * @format uuid
   */
  venueId?: string | null;
}

export namespace EventCreateParams {
  export interface Match {
    homeAway: 'home' | 'away' | 'neutral';
    /**
     * @format uuid
     */
    opponentId: string;
    /**
     * @maxLength 120
     */
    competition?: string | null;
  }
}

export interface EventCreateResponse {
  /**
   * @minLength 1
   */
  cancellationReason: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  createdByUserId: string | null;
  description: string | null;
  /**
   * @format date-time
   */
  endsAt: string;
  /**
   * @format uuid
   */
  id: string;
  kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * @format date-time
   */
  meetAt: string | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  seriesId: string | null;
  /**
   * @format date-time
   */
  seriesOccurrenceStartsAt: string | null;
  /**
   * @format date-time
   */
  startsAt: string;
  status: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
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
  /**
   * @format uuid
   */
  venueId: string | null;
  match: EventCreateResponse.Match | null;
}

export namespace EventCreateResponse {
  export interface Match {
    competition: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goalsAgainst: number | null;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goalsFor: number | null;
    homeAway: 'home' | 'away' | 'neutral';
    /**
     * @format uuid
     */
    opponentId: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventRetrieveResponse {
  /**
   * @minLength 1
   */
  cancellationReason: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  createdByUserId: string | null;
  description: string | null;
  /**
   * @format date-time
   */
  endsAt: string;
  /**
   * @format uuid
   */
  id: string;
  kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * @format date-time
   */
  meetAt: string | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  seriesId: string | null;
  /**
   * @format date-time
   */
  seriesOccurrenceStartsAt: string | null;
  /**
   * @format date-time
   */
  startsAt: string;
  status: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
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
  /**
   * @format uuid
   */
  venueId: string | null;
  match: EventRetrieveResponse.Match | null;
}

export namespace EventRetrieveResponse {
  export interface Match {
    competition: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goalsAgainst: number | null;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goalsFor: number | null;
    homeAway: 'home' | 'away' | 'neutral';
    /**
     * @format uuid
     */
    opponentId: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventUpdateParams {
  /**
   * Why. Needed when the status becomes cancelled.
   * @minLength 1
   * @maxLength 500
   */
  cancellationReason?: string | null;
  /**
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * @format date-time
   */
  endsAt?: string;
  /**
   * Opponent and, once played, the score.
   */
  match?: EventUpdateParams.Match;
  /**
   * @format date-time
   */
  meetAt?: string | null;
  /**
   * @format date-time
   */
  startsAt?: string;
  /**
   * Events are never deleted. Cancel or postpone them and the record stays.
   */
  status?: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string;
  /**
   * @format uuid
   */
  venueId?: string | null;
}

export namespace EventUpdateParams {
  export interface Match {
    /**
     * @maxLength 120
     */
    competition?: string | null;
    homeAway?: 'home' | 'away' | 'neutral';
    /**
     * @format uuid
     */
    opponentId?: string;
    /**
     * @minimum 0
     * @maximum 99
     */
    goalsAgainst?: number | null;
    /**
     * @minimum 0
     * @maximum 99
     */
    goalsFor?: number | null;
  }
}

export interface EventUpdateResponse {
  /**
   * @minLength 1
   */
  cancellationReason: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  createdByUserId: string | null;
  description: string | null;
  /**
   * @format date-time
   */
  endsAt: string;
  /**
   * @format uuid
   */
  id: string;
  kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * @format date-time
   */
  meetAt: string | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  seriesId: string | null;
  /**
   * @format date-time
   */
  seriesOccurrenceStartsAt: string | null;
  /**
   * @format date-time
   */
  startsAt: string;
  status: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
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
  /**
   * @format uuid
   */
  venueId: string | null;
  match: EventUpdateResponse.Match | null;
}

export namespace EventUpdateResponse {
  export interface Match {
    competition: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goalsAgainst: number | null;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goalsFor: number | null;
    homeAway: 'home' | 'away' | 'neutral';
    /**
     * @format uuid
     */
    opponentId: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventSetAvailabilityParams {
  status: 'available' | 'unavailable' | 'maybe';
  /**
   * @maxLength 300
   */
  note?: string | null;
  /**
   * Who is answering. Defaults to the caller's own person.
   * @format uuid
   */
  personId?: string;
}

export interface EventSetAvailabilityResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  eventId: string;
  /**
   * @format uuid
   */
  id: string;
  note: string | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @format date-time
   */
  respondedAt: string;
  status: 'available' | 'unavailable' | 'maybe';
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface EventListAvailabilityResponse {
  availability: Array<EventListAvailabilityResponse.Availability>;
}

export namespace EventListAvailabilityResponse {
  export interface Availability {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @format uuid
     */
    id: string;
    note: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    /**
     * @format date-time
     */
    respondedAt: string;
    status: 'available' | 'unavailable' | 'maybe';
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventRecordAttendanceParams {
  /**
   * @minItems 1
   * @maxItems 200
   */
  records: Array<EventRecordAttendanceParams.Record>;
}

export namespace EventRecordAttendanceParams {
  export interface Record {
    /**
     * @format uuid
     */
    personId: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    /**
     * @maxLength 300
     */
    note?: string | null;
  }
}

export interface EventRecordAttendanceResponse {
  attendance: Array<EventRecordAttendanceResponse.Attendance>;
}

export namespace EventRecordAttendanceResponse {
  export interface Attendance {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @format uuid
     */
    id: string;
    note: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    /**
     * @format uuid
     */
    recordedByUserId: string | null;
    status: 'present' | 'late' | 'absent' | 'excused';
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventListAttendanceResponse {
  attendance: Array<EventListAttendanceResponse.Attendance>;
}

export namespace EventListAttendanceResponse {
  export interface Attendance {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @format uuid
     */
    id: string;
    note: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    /**
     * @format uuid
     */
    recordedByUserId: string | null;
    status: 'present' | 'late' | 'absent' | 'excused';
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventSetSquadParams {
  /**
   * @maxItems 60
   */
  squad: Array<EventSetSquadParams.Squad>;
}

export namespace EventSetSquadParams {
  export interface Squad {
    /**
     * @format uuid
     */
    personId: string;
    role: 'starter' | 'substitute';
    /**
     * @minimum 0
     * @maximum 99
     */
    goals?: number;
    /**
     * @minimum 0
     * @maximum 300
     */
    minutesPlayed?: number | null;
    /**
     * @maxLength 40
     */
    position?: string | null;
    /**
     * @minimum 0
     * @maximum 999
     */
    shirtNumber?: number | null;
  }
}

export interface EventSetSquadResponse {
  squad: Array<EventSetSquadResponse.Squad>;
}

export namespace EventSetSquadResponse {
  export interface Squad {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goals: number;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum 0
     * @maximum 200
     */
    minutesPlayed: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    position: string | null;
    role: 'starter' | 'substitute';
    /**
     * @minimum 0
     * @maximum 999
     */
    shirtNumber: number | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventListSquadResponse {
  squad: Array<EventListSquadResponse.Squad>;
}

export namespace EventListSquadResponse {
  export interface Squad {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    eventId: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    goals: number;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum 0
     * @maximum 200
     */
    minutesPlayed: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    position: string | null;
    role: 'starter' | 'substitute';
    /**
     * @minimum 0
     * @maximum 999
     */
    shirtNumber: number | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface EventListSeriesResponse {
  series: Array<EventListSeriesResponse.Series>;
}

export namespace EventListSeriesResponse {
  export interface Series {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    createdByUserId: string | null;
    description: string | null;
    /**
     * @minimum 1
     * @maximum 1440
     */
    durationMinutes: number;
    /**
     * @format date
     */
    endsOn: string | null;
    /**
     * @format date
     */
    generatedUntil: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum 1
     * @maximum 52
     */
    intervalWeeks: number;
    isActive: boolean;
    kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
    /**
     * @minimum 0
     * @maximum 1440
     */
    meetMinutesBefore: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @pattern ^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$
     */
    startTime: string;
    /**
     * @format date
     */
    startsOn: string;
    /**
     * @format uuid
     */
    teamId: string | null;
    timeZone: string;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uuid
     */
    venueId: string | null;
    /**
     * @minimum 1
     * @maximum 7
     */
    weekday: number;
  }
}

export interface EventCreateSeriesParams {
  /**
   * @minimum 5
   * @maximum 1440
   */
  durationMinutes: number;
  kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * Local time of day, like 18:30.
   * @pattern ^\d{2}:\d{2}(?<seconds>:\d{2})?$
   */
  startTime: string;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * For example Europe/London.
   * @minLength 1
   * @maxLength 64
   */
  timeZone: string;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string;
  /**
   * 1 is Monday, 7 is Sunday.
   * @minimum 1
   * @maximum 7
   */
  weekday: number;
  /**
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * @format date
   */
  endsOn?: string | null;
  /**
   * Make events up to this date. Defaults to 12 weeks ahead.
   * @format date
   */
  generateUntil?: string;
  /**
   * @minimum 1
   * @maximum 52
   */
  intervalWeeks?: number;
  /**
   * @minimum 0
   * @maximum 240
   */
  meetMinutesBefore?: number | null;
  /**
   * @format uuid
   */
  teamId?: string | null;
  /**
   * @format uuid
   */
  venueId?: string | null;
}

export interface EventCreateSeriesResponse {
  /**
   * How many events were made.
   */
  created: number;
  series: EventCreateSeriesResponse.Series;
}

export namespace EventCreateSeriesResponse {
  export interface Series {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    createdByUserId: string | null;
    description: string | null;
    /**
     * @minimum 1
     * @maximum 1440
     */
    durationMinutes: number;
    /**
     * @format date
     */
    endsOn: string | null;
    /**
     * @format date
     */
    generatedUntil: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum 1
     * @maximum 52
     */
    intervalWeeks: number;
    isActive: boolean;
    kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
    /**
     * @minimum 0
     * @maximum 1440
     */
    meetMinutesBefore: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @pattern ^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$
     */
    startTime: string;
    /**
     * @format date
     */
    startsOn: string;
    /**
     * @format uuid
     */
    teamId: string | null;
    timeZone: string;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uuid
     */
    venueId: string | null;
    /**
     * @minimum 1
     * @maximum 7
     */
    weekday: number;
  }
}

export interface EventUpdateSeriesParams {
  /**
   * @format date
   */
  endsOn?: string | null;
  /**
   * false stops the series. Events already made are kept.
   */
  isActive?: boolean;
}

export interface EventUpdateSeriesResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  createdByUserId: string | null;
  description: string | null;
  /**
   * @minimum 1
   * @maximum 1440
   */
  durationMinutes: number;
  /**
   * @format date
   */
  endsOn: string | null;
  /**
   * @format date
   */
  generatedUntil: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @minimum 1
   * @maximum 52
   */
  intervalWeeks: number;
  isActive: boolean;
  kind: 'training' | 'match' | 'social' | 'meeting' | 'other';
  /**
   * @minimum 0
   * @maximum 1440
   */
  meetMinutesBefore: number | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @pattern ^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$
   */
  startTime: string;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * @format uuid
   */
  teamId: string | null;
  timeZone: string;
  /**
   * @minLength 1
   */
  title: string;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  venueId: string | null;
  /**
   * @minimum 1
   * @maximum 7
   */
  weekday: number;
}

export interface EventExtendSeriesParams {
  /**
   * Make events up to this date.
   * @format date
   */
  until: string;
}

export interface EventExtendSeriesResponse {
  created: number;
}
export declare namespace Events {
  export {
    type EventListResponse as EventListResponse,
    type EventCreateResponse as EventCreateResponse,
    type EventRetrieveResponse as EventRetrieveResponse,
    type EventUpdateResponse as EventUpdateResponse,
    type EventSetAvailabilityResponse as EventSetAvailabilityResponse,
    type EventListAvailabilityResponse as EventListAvailabilityResponse,
    type EventRecordAttendanceResponse as EventRecordAttendanceResponse,
    type EventListAttendanceResponse as EventListAttendanceResponse,
    type EventSetSquadResponse as EventSetSquadResponse,
    type EventListSquadResponse as EventListSquadResponse,
    type EventListSeriesResponse as EventListSeriesResponse,
    type EventCreateSeriesResponse as EventCreateSeriesResponse,
    type EventUpdateSeriesResponse as EventUpdateSeriesResponse,
    type EventExtendSeriesResponse as EventExtendSeriesResponse,
    type EventListParams as EventListParams,
    type EventCreateParams as EventCreateParams,
    type EventUpdateParams as EventUpdateParams,
    type EventSetAvailabilityParams as EventSetAvailabilityParams,
    type EventRecordAttendanceParams as EventRecordAttendanceParams,
    type EventSetSquadParams as EventSetSquadParams,
    type EventCreateSeriesParams as EventCreateSeriesParams,
    type EventUpdateSeriesParams as EventUpdateSeriesParams,
    type EventExtendSeriesParams as EventExtendSeriesParams,
  };
}
