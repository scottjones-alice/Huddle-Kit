// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Opponents extends APIResource {
  /**
   * Clubs the team plays against, A to Z.
   *
   * @param {OpponentListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OpponentListResponse>} The opponents.
   *
   * @example
   * ```ts
   * const opponent = await client.opponents.list({
   *   includeArchived: 'false',
   * });
   * ```
   */
  list(
    query: OpponentListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<OpponentListResponse> {
    return this._client.get('/api/v1/opponents', { query, ...options });
  }

  /**
   * Adds an opposition club. Owners, admins and anyone with a coaching job can do this.
   *
   * @param {OpponentCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OpponentCreateResponse>} The new opponent.
   *
   * @example
   * ```ts
   * const opponent = await client.opponents.create({
   *   contactEmail: 'alex@example.com',
   *   contactPhone: 'string',
   *   homeVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   name: 'string',
   *   shortName: 'string',
   *   website: 'https://example.com',
   * });
   * ```
   */
  create(body: OpponentCreateParams, options?: RequestOptions): APIPromise<OpponentCreateResponse> {
    return this._client.post('/api/v1/opponents', { body, ...options });
  }

  /**
   * Changes an opponent, or archives it with `isActive: false`. Past fixtures keep pointing at it.
   *
   * @param {string} id - The opponent's id.
   * @param {OpponentUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OpponentUpdateResponse>} The updated opponent.
   *
   * @example
   * ```ts
   * const opponent = await client.opponents.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   contactEmail: 'alex@example.com',
   *   contactPhone: 'string',
   *   homeVenueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   name: 'string',
   *   shortName: 'string',
   *   website: 'https://example.com',
   *   isActive: true,
   * });
   * ```
   */
  update(
    id: string,
    body: OpponentUpdateParams,
    options?: RequestOptions,
  ): APIPromise<OpponentUpdateResponse> {
    return this._client.patch(__scalarPath`/api/v1/opponents/${id}`, { body, ...options });
  }
}

export interface OpponentListParams {
  /**
   * Also return archived records.
   * @default false
   */
  includeArchived?: 'true' | 'false';
}

export interface OpponentListResponse {
  opponents: Array<OpponentListResponse.Opponent>;
}

export namespace OpponentListResponse {
  export interface Opponent {
    /**
     * @format uuid
     */
    addressId: string | null;
    /**
     * @format email
     */
    contactEmail: string | null;
    contactPhone: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    homeVenueId: string | null;
    /**
     * @format uuid
     */
    id: string;
    isActive: boolean;
    /**
     * @format uuid
     */
    linkedOrganizationId: string | null;
    /**
     * @minLength 1
     */
    name: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @minLength 1
     */
    shortName: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uri
     */
    website: string | null;
  }
}

export interface OpponentCreateParams {
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format email
   */
  contactEmail?: string | null;
  contactPhone?: string | null;
  /**
   * @format uuid
   */
  homeVenueId?: string | null;
  /**
   * @minLength 1
   */
  shortName?: string | null;
  /**
   * @format uri
   */
  website?: string | null;
}

export interface OpponentCreateResponse {
  /**
   * @format uuid
   */
  addressId: string | null;
  /**
   * @format email
   */
  contactEmail: string | null;
  contactPhone: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  homeVenueId: string | null;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @format uuid
   */
  linkedOrganizationId: string | null;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @minLength 1
   */
  shortName: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uri
   */
  website: string | null;
}

export interface OpponentUpdateParams {
  /**
   * @format email
   */
  contactEmail?: string | null;
  contactPhone?: string | null;
  /**
   * @format uuid
   */
  homeVenueId?: string | null;
  /**
   * @minLength 1
   */
  name?: string;
  /**
   * @minLength 1
   */
  shortName?: string | null;
  /**
   * @format uri
   */
  website?: string | null;
  /**
   * false archives the opponent, true brings it back.
   */
  isActive?: boolean;
}

export interface OpponentUpdateResponse {
  /**
   * @format uuid
   */
  addressId: string | null;
  /**
   * @format email
   */
  contactEmail: string | null;
  contactPhone: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  homeVenueId: string | null;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @format uuid
   */
  linkedOrganizationId: string | null;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @minLength 1
   */
  shortName: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uri
   */
  website: string | null;
}
export declare namespace Opponents {
  export {
    type OpponentListResponse as OpponentListResponse,
    type OpponentCreateResponse as OpponentCreateResponse,
    type OpponentUpdateResponse as OpponentUpdateResponse,
    type OpponentListParams as OpponentListParams,
    type OpponentCreateParams as OpponentCreateParams,
    type OpponentUpdateParams as OpponentUpdateParams,
  };
}
