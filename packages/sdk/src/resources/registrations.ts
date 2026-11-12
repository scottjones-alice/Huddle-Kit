// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Registrations extends APIResource {
  /**
   * Club admins see everyone's registrations. Everyone else sees their own and their children's.
   *
   * @param {RegistrationListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RegistrationListResponse>} The registrations, newest first.
   *
   * @example
   * ```ts
   * const registration = await client.registrations.list({
   *   limit: 50,
   *   offset: 0,
   * });
   * ```
   */
  list(
    query: RegistrationListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<RegistrationListResponse> {
    return this._client.get('/api/v1/registrations', { query, ...options });
  }

  /**
   * Asks to join for a season. It waits as pending for a club admin to accept; if a club admin registers someone it starts active. Each person can register once per season.
   *
   * @param {RegistrationRegisterParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RegistrationRegisterResponse>} The registration.
   *
   * @example
   * ```ts
   * const registration = await client.registrations.register({
   *   notes: 'string',
   *   personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  register(
    body: RegistrationRegisterParams,
    options?: RequestOptions,
  ): APIPromise<RegistrationRegisterResponse> {
    return this._client.post('/api/v1/registrations', { body, ...options });
  }

  /**
   * Accepts, rejects, places or withdraws a registration. It is never deleted, so the history stays.
   *
   * @param {string} id - The registration's id.
   * @param {RegistrationUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RegistrationUpdateResponse>} The updated registration.
   *
   * @example
   * ```ts
   * const registration = await client.registrations.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   notes: 'string',
   *   status: 'active',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  update(
    id: string,
    body: RegistrationUpdateParams,
    options?: RequestOptions,
  ): APIPromise<RegistrationUpdateResponse> {
    return this._client.patch(__scalarPath`/api/v1/registrations/${id}`, { body, ...options });
  }
}

export interface RegistrationListParams {
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
   * Only this person.
   * @format uuid
   */
  personId?: string;
  /**
   * Only this season.
   * @format uuid
   */
  seasonId?: string;
  /**
   * Only this status.
   */
  status?: 'pending' | 'active' | 'withdrawn' | 'rejected';
  /**
   * Only this team.
   * @format uuid
   */
  teamId?: string;
}

export interface RegistrationListResponse {
  registrations: Array<RegistrationListResponse.Registration>;
}

export namespace RegistrationListResponse {
  export interface Registration {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    notes: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    /**
     * @format date
     */
    registeredOn: string;
    /**
     * @format uuid
     */
    seasonId: string;
    status: 'pending' | 'active' | 'withdrawn' | 'rejected';
    /**
     * @format uuid
     */
    teamId: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format date
     */
    withdrawnOn: string | null;
  }
}

export interface RegistrationRegisterParams {
  /**
   * Yourself or your child.
   * @format uuid
   */
  personId: string;
  /**
   * @format uuid
   */
  seasonId: string;
  /**
   * @maxLength 1000
   */
  notes?: string | null;
  /**
   * Club admins only: the team to place them in.
   * @format uuid
   */
  teamId?: string | null;
}

export interface RegistrationRegisterResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  id: string;
  notes: string | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @format date
   */
  registeredOn: string;
  /**
   * @format uuid
   */
  seasonId: string;
  status: 'pending' | 'active' | 'withdrawn' | 'rejected';
  /**
   * @format uuid
   */
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format date
   */
  withdrawnOn: string | null;
}

export interface RegistrationUpdateParams {
  /**
   * @maxLength 1000
   */
  notes?: string | null;
  /**
   * Admins can accept, reject or withdraw. The person or their parent can only withdraw.
   */
  status?: 'active' | 'rejected' | 'withdrawn';
  /**
   * Club admins only.
   * @format uuid
   */
  teamId?: string | null;
}

export interface RegistrationUpdateResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  id: string;
  notes: string | null;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @format date
   */
  registeredOn: string;
  /**
   * @format uuid
   */
  seasonId: string;
  status: 'pending' | 'active' | 'withdrawn' | 'rejected';
  /**
   * @format uuid
   */
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format date
   */
  withdrawnOn: string | null;
}
export declare namespace Registrations {
  export {
    type RegistrationListResponse as RegistrationListResponse,
    type RegistrationRegisterResponse as RegistrationRegisterResponse,
    type RegistrationUpdateResponse as RegistrationUpdateResponse,
    type RegistrationListParams as RegistrationListParams,
    type RegistrationRegisterParams as RegistrationRegisterParams,
    type RegistrationUpdateParams as RegistrationUpdateParams,
  };
}
