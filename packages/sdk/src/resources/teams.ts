// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Teams extends APIResource {
  /**
   * The club's seasons, newest first.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamListSeasonsResponse>} The seasons.
   *
   * @example
   * ```ts
   * const team = await client.teams.listSeasons();
   * ```
   */
  listSeasons(options?: RequestOptions): APIPromise<TeamListSeasonsResponse> {
    return this._client.get('/api/v1/seasons', options);
  }

  /**
   * Starts a season. Club admins only.
   *
   * @param {TeamCreateSeasonParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamCreateSeasonResponse>} The season.
   *
   * @example
   * ```ts
   * const team = await client.teams.createSeason({
   *   endsOn: '2026-01-15',
   *   isCurrent: true,
   *   name: 'string',
   *   startsOn: '2026-01-15',
   * });
   * ```
   */
  createSeason(body: TeamCreateSeasonParams, options?: RequestOptions): APIPromise<TeamCreateSeasonResponse> {
    return this._client.post('/api/v1/seasons', { body, ...options });
  }

  /**
   * Changes a season, or makes it the current one. Club admins only.
   *
   * @param {string} id - The season's id.
   * @param {TeamUpdateSeasonParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamUpdateSeasonResponse>} The season.
   *
   * @example
   * ```ts
   * const team = await client.teams.updateSeason('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   endsOn: '2026-01-15',
   *   isCurrent: true,
   *   name: 'string',
   *   startsOn: '2026-01-15',
   * });
   * ```
   */
  updateSeason(
    id: string,
    body: TeamUpdateSeasonParams,
    options?: RequestOptions,
  ): APIPromise<TeamUpdateSeasonResponse> {
    return this._client.patch(__scalarPath`/api/v1/seasons/${id}`, { body, ...options });
  }

  /**
   * The club's teams, optionally for one season.
   *
   * @param {TeamListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamListResponse>} The teams.
   *
   * @example
   * ```ts
   * const team = await client.teams.list({
   *   includeArchived: 'false',
   * });
   * ```
   */
  list(
    query: TeamListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<TeamListResponse> {
    return this._client.get('/api/v1/teams', { query, ...options });
  }

  /**
   * Adds a team to a season. Club admins only.
   *
   * @param {TeamCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamCreateResponse>} The team.
   *
   * @example
   * ```ts
   * const team = await client.teams.create({
   *   ageGroup: 4,
   *   name: 'string',
   *   seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   trainingVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  create(body: TeamCreateParams, options?: RequestOptions): APIPromise<TeamCreateResponse> {
    return this._client.post('/api/v1/teams', { body, ...options });
  }

  /**
   * One team. The roster is a separate call.
   *
   * @param {string} id - The team's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamRetrieveResponse>} The team.
   *
   * @example
   * ```ts
   * const team = await client.teams.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<TeamRetrieveResponse> {
    return this._client.get(__scalarPath`/api/v1/teams/${id}`, options);
  }

  /**
   * Changes a team, or archives it with `isActive: false`. Club admins only.
   *
   * @param {string} id - The team's id.
   * @param {TeamUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamUpdateResponse>} The team.
   *
   * @example
   * ```ts
   * const team = await client.teams.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   ageGroup: 4,
   *   name: 'string',
   *   seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   trainingVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   isActive: true,
   * });
   * ```
   */
  update(id: string, body: TeamUpdateParams, options?: RequestOptions): APIPromise<TeamUpdateResponse> {
    return this._client.patch(__scalarPath`/api/v1/teams/${id}`, { body, ...options });
  }

  /**
   * Who is on the team now. Club admins and the team's coaches see everyone. A player, or the parent of a player, on the team sees it too. Anyone else gets a 404.
   *
   * @param {string} id - The team's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamListRosterResponse>} The current roster.
   *
   * @example
   * ```ts
   * const team = await client.teams.listRoster('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listRoster(id: string, options?: RequestOptions): APIPromise<TeamListRosterResponse> {
    return this._client.get(__scalarPath`/api/v1/teams/${id}/members`, options);
  }

  /**
   * Puts a person on a team as a player, coach, manager or volunteer. Club admins and the team's own coaches can do this.
   *
   * @param {string} id - The team's id.
   * @param {TeamCreateMemberParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamCreateMemberResponse>} The membership.
   *
   * @example
   * ```ts
   * const team = await client.teams.createMember('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   role: 'player',
   *   shirtNumber: 1,
   *   startsOn: '2026-01-15',
   * });
   * ```
   */
  createMember(
    id: string,
    body: TeamCreateMemberParams,
    options?: RequestOptions,
  ): APIPromise<TeamCreateMemberResponse> {
    return this._client.post(__scalarPath`/api/v1/teams/${id}/members`, { body, ...options });
  }

  /**
   * Takes someone off a team from today. The record stays as history of who played and when. Club admins and the team's own coaches can do this.
   *
   * @param {string} id - The membership's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<TeamEndMembershipResponse>} The ended membership.
   *
   * @example
   * ```ts
   * const team = await client.teams.endMembership('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  endMembership(id: string, options?: RequestOptions): APIPromise<TeamEndMembershipResponse> {
    return this._client.post(__scalarPath`/api/v1/team-memberships/${id}/end`, options);
  }
}

export interface TeamListSeasonsResponse {
  seasons: Array<TeamListSeasonsResponse.Season>;
}

export namespace TeamListSeasonsResponse {
  export interface Season {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date
     */
    endsOn: string;
    /**
     * @format uuid
     */
    id: string;
    isCurrent: boolean;
    /**
     * @minLength 1
     */
    name: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date
     */
    startsOn: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface TeamCreateSeasonParams {
  /**
   * @format date
   */
  endsOn: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * Making this season current makes the old one not current.
   */
  isCurrent?: boolean;
}

export interface TeamCreateSeasonResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date
   */
  endsOn: string;
  /**
   * @format uuid
   */
  id: string;
  isCurrent: boolean;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamUpdateSeasonParams {
  /**
   * @format date
   */
  endsOn?: string;
  isCurrent?: boolean;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  /**
   * @format date
   */
  startsOn?: string;
}

export interface TeamUpdateSeasonResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date
   */
  endsOn: string;
  /**
   * @format uuid
   */
  id: string;
  isCurrent: boolean;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamListParams {
  /**
   * Also return archived records.
   * @default false
   */
  includeArchived?: 'true' | 'false';
  /**
   * Only teams in this season.
   * @format uuid
   */
  seasonId?: string;
}

export interface TeamListResponse {
  teams: Array<TeamListResponse.Team>;
}

export namespace TeamListResponse {
  export interface Team {
    /**
     * @minimum 4
     * @maximum 99
     */
    ageGroup: number | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    isActive: boolean;
    /**
     * @minLength 1
     */
    name: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    seasonId: string;
    /**
     * @format uuid
     */
    trainingVenueId: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface TeamCreateParams {
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  seasonId: string;
  /**
   * Under-N, so 12 means U12. Leave out for open age.
   * @minimum 4
   * @maximum 99
   */
  ageGroup?: number | null;
  /**
   * @format uuid
   */
  trainingVenueId?: string | null;
}

export interface TeamCreateResponse {
  /**
   * @minimum 4
   * @maximum 99
   */
  ageGroup: number | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  seasonId: string;
  /**
   * @format uuid
   */
  trainingVenueId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamRetrieveResponse {
  /**
   * @minimum 4
   * @maximum 99
   */
  ageGroup: number | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  seasonId: string;
  /**
   * @format uuid
   */
  trainingVenueId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamUpdateParams {
  /**
   * Under-N, so 12 means U12. Leave out for open age.
   * @minimum 4
   * @maximum 99
   */
  ageGroup?: number | null;
  /**
   * @minLength 1
   */
  name?: string;
  /**
   * @format uuid
   */
  seasonId?: string;
  /**
   * @format uuid
   */
  trainingVenueId?: string | null;
  /**
   * false archives the team, true brings it back.
   */
  isActive?: boolean;
}

export interface TeamUpdateResponse {
  /**
   * @minimum 4
   * @maximum 99
   */
  ageGroup: number | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  seasonId: string;
  /**
   * @format uuid
   */
  trainingVenueId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamListRosterResponse {
  members: Array<TeamListRosterResponse.Member>;
}

export namespace TeamListRosterResponse {
  export interface Member {
    /**
     * @format date
     */
    endsOn: string | null;
    firstName: string;
    /**
     * The membership's id.
     * @format uuid
     */
    id: string;
    lastName: string;
    /**
     * @format uuid
     */
    personId: string;
    role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'volunteer';
    shirtNumber: number | null;
    /**
     * @format date
     */
    startsOn: string;
  }
}

export interface TeamCreateMemberParams {
  /**
   * @format uuid
   */
  personId: string;
  role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'volunteer';
  /**
   * @minimum 0
   * @maximum 999
   */
  shirtNumber?: number | null;
  /**
   * Defaults to today.
   * @format date
   */
  startsOn?: string;
}

export interface TeamCreateMemberResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date
   */
  endsOn: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'volunteer';
  /**
   * @minimum 0
   * @maximum 999
   */
  shirtNumber: number | null;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * @format uuid
   */
  teamId: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamEndMembershipResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date
   */
  endsOn: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'volunteer';
  /**
   * @minimum 0
   * @maximum 999
   */
  shirtNumber: number | null;
  /**
   * @format date
   */
  startsOn: string;
  /**
   * @format uuid
   */
  teamId: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}
export declare namespace Teams {
  export {
    type TeamListSeasonsResponse as TeamListSeasonsResponse,
    type TeamCreateSeasonResponse as TeamCreateSeasonResponse,
    type TeamUpdateSeasonResponse as TeamUpdateSeasonResponse,
    type TeamListResponse as TeamListResponse,
    type TeamCreateResponse as TeamCreateResponse,
    type TeamRetrieveResponse as TeamRetrieveResponse,
    type TeamUpdateResponse as TeamUpdateResponse,
    type TeamListRosterResponse as TeamListRosterResponse,
    type TeamCreateMemberResponse as TeamCreateMemberResponse,
    type TeamEndMembershipResponse as TeamEndMembershipResponse,
    type TeamCreateSeasonParams as TeamCreateSeasonParams,
    type TeamUpdateSeasonParams as TeamUpdateSeasonParams,
    type TeamListParams as TeamListParams,
    type TeamCreateParams as TeamCreateParams,
    type TeamUpdateParams as TeamUpdateParams,
    type TeamCreateMemberParams as TeamCreateMemberParams,
  };
}
