// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Roles extends APIResource {
  /**
   * Everyone with a login to the club and their club role. Owners and admins only.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleListClubMembersResponse>} The club's logins.
   *
   * @example
   * ```ts
   * const role = await client.roles.listClubMembers();
   * ```
   */
  listClubMembers(options?: RequestOptions): APIPromise<RoleListClubMembersResponse> {
    return this._client.get('/api/v1/members', options);
  }

  /**
   * Jobs people hold in the club (coach, welfare officer, treasurer and so on). Ended jobs are kept as history and shown with `includeEnded=true`. Owners and admins only.
   *
   * @param {RoleListAssignmentsParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleListAssignmentsResponse>} The jobs.
   *
   * @example
   * ```ts
   * const role = await client.roles.listAssignments({
   *   includeEnded: 'false',
   * });
   * ```
   */
  listAssignments(
    query: RoleListAssignmentsParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<RoleListAssignmentsResponse> {
    return this._client.get('/api/v1/role-assignments', { query, ...options });
  }

  /**
   * Gives a club member a job. Coaching, team and volunteer jobs can be limited to teams; all other jobs apply to the whole club. Owners and admins only.
   *
   * @param {RoleGrantAssignmentParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleGrantAssignmentResponse>} The new job.
   *
   * @example
   * ```ts
   * const role = await client.roles.grantAssignment({
   *   role: 'admin',
   *   scope: 'organization',
   *   teamIds: [],
   *   userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  grantAssignment(
    body: RoleGrantAssignmentParams,
    options?: RequestOptions,
  ): APIPromise<RoleGrantAssignmentResponse> {
    return this._client.post('/api/v1/role-assignments', { body, ...options });
  }

  /**
   * Ends a job from now on. The record stays, so the club can show who held it and when. Owners and admins only.
   *
   * @param {string} id - The job's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleEndAssignmentResponse>} The ended job.
   *
   * @example
   * ```ts
   * const role = await client.roles.endAssignment('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  endAssignment(id: string, options?: RequestOptions): APIPromise<RoleEndAssignmentResponse> {
    return this._client.post(__scalarPath`/api/v1/role-assignments/${id}/end`, options);
  }
}

export interface RoleListClubMembersResponse {
  members: Array<RoleListClubMembersResponse.Member>;
}

export namespace RoleListClubMembersResponse {
  export interface Member {
    email: string;
    /**
     * @format date-time
     */
    joinedAt: string;
    /**
     * @format uuid
     */
    memberId: string;
    name: string;
    /**
     * The login role in the club: owner, admin or member.
     */
    role: string;
    /**
     * @format uuid
     */
    userId: string;
  }
}

export interface RoleListAssignmentsParams {
  /**
   * Also return jobs that have ended.
   * @default false
   */
  includeEnded?: 'true' | 'false';
}

export interface RoleListAssignmentsResponse {
  roleAssignments: Array<RoleListAssignmentsResponse.RoleAssignment>;
}

export namespace RoleListAssignmentsResponse {
  export interface RoleAssignment {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date-time
     */
    endsAt: string | null;
    /**
     * @format uuid
     */
    grantedBy: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    role:
      | 'admin'
      | 'secretary'
      | 'treasurer'
      | 'head_coach'
      | 'coach'
      | 'assistant_coach'
      | 'team_manager'
      | 'first_aider'
      | 'volunteer'
      | 'welfare_officer'
      | 'safeguarding_lead'
      | 'safeguarding_deputy';
    scope: 'organization' | 'teams';
    /**
     * @format date-time
     */
    startsAt: string;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uuid
     */
    userId: string;
    /**
     * The teams the job is limited to. Empty for a club-wide job.
     */
    teamIds: Array<string>;
  }
}

export interface RoleGrantAssignmentParams {
  /**
   * The job to give.
   */
  role:
    | 'admin'
    | 'secretary'
    | 'treasurer'
    | 'head_coach'
    | 'coach'
    | 'assistant_coach'
    | 'team_manager'
    | 'first_aider'
    | 'volunteer'
    | 'welfare_officer'
    | 'safeguarding_lead'
    | 'safeguarding_deputy';
  /**
   * `organization` for the whole club, or `teams` for named teams.
   */
  scope: 'organization' | 'teams';
  /**
   * The club member who gets the job.
   * @format uuid
   */
  userId: string;
  /**
   * Required when the scope is `teams`.
   * @default []
   * @maxItems 100
   */
  teamIds?: Array<string>;
}

export interface RoleGrantAssignmentResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date-time
   */
  endsAt: string | null;
  /**
   * @format uuid
   */
  grantedBy: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format uuid
   */
  organizationId: string;
  role:
    | 'admin'
    | 'secretary'
    | 'treasurer'
    | 'head_coach'
    | 'coach'
    | 'assistant_coach'
    | 'team_manager'
    | 'first_aider'
    | 'volunteer'
    | 'welfare_officer'
    | 'safeguarding_lead'
    | 'safeguarding_deputy';
  scope: 'organization' | 'teams';
  /**
   * @format date-time
   */
  startsAt: string;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  userId: string;
  /**
   * The teams the job is limited to. Empty for a club-wide job.
   */
  teamIds: Array<string>;
}

export interface RoleEndAssignmentResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date-time
   */
  endsAt: string | null;
  /**
   * @format uuid
   */
  grantedBy: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format uuid
   */
  organizationId: string;
  role:
    | 'admin'
    | 'secretary'
    | 'treasurer'
    | 'head_coach'
    | 'coach'
    | 'assistant_coach'
    | 'team_manager'
    | 'first_aider'
    | 'volunteer'
    | 'welfare_officer'
    | 'safeguarding_lead'
    | 'safeguarding_deputy';
  scope: 'organization' | 'teams';
  /**
   * @format date-time
   */
  startsAt: string;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  userId: string;
  /**
   * The teams the job is limited to. Empty for a club-wide job.
   */
  teamIds: Array<string>;
}
export declare namespace Roles {
  export {
    type RoleListClubMembersResponse as RoleListClubMembersResponse,
    type RoleListAssignmentsResponse as RoleListAssignmentsResponse,
    type RoleGrantAssignmentResponse as RoleGrantAssignmentResponse,
    type RoleEndAssignmentResponse as RoleEndAssignmentResponse,
    type RoleListAssignmentsParams as RoleListAssignmentsParams,
    type RoleGrantAssignmentParams as RoleGrantAssignmentParams,
  };
}
