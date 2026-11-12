// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Venues extends APIResource {
  /**
   * The club's venues with their addresses, A to Z.
   *
   * @param {VenueListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueListResponse>} The venues.
   *
   * @example
   * ```ts
   * const venue = await client.venues.list({
   *   includeArchived: 'false',
   * });
   * ```
   */
  list(
    query: VenueListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<VenueListResponse> {
    return this._client.get('/api/v1/venues', { query, ...options });
  }

  /**
   * Adds a venue and its address. Owners and admins only.
   *
   * @param {VenueCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueCreateResponse>} The new venue.
   *
   * @example
   * ```ts
   * const venue = await client.venues.create({
   *   address: {
   *     city: 'string',
   *     countryCode: 'string',
   *     line1: 'string',
   *     line2: 'string',
   *     postalCode: 'string',
   *     region: 'string',
   *   },
   *   directions: 'string',
   *   kinds: ['training_ground'],
   *   name: 'string',
   *   what3words: 'string',
   * });
   * ```
   */
  create(body: VenueCreateParams, options?: RequestOptions): APIPromise<VenueCreateResponse> {
    return this._client.post('/api/v1/venues', { body, ...options });
  }

  /**
   * One venue with its address.
   *
   * @param {string} id - The venue's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueRetrieveResponse>} The venue.
   *
   * @example
   * ```ts
   * const venue = await client.venues.retrieve('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<VenueRetrieveResponse> {
    return this._client.get(__scalarPath`/api/v1/venues/${id}`, options);
  }

  /**
   * Changes a venue or its address. Send `isActive: false` to archive it: venues are never deleted, because old fixtures point at them. Owners and admins only.
   *
   * @param {string} id - The venue's id.
   * @param {VenueUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueUpdateResponse>} The updated venue.
   *
   * @example
   * ```ts
   * const venue = await client.venues.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   address: {
   *     city: 'string',
   *     countryCode: 'string',
   *     line1: 'string',
   *     line2: 'string',
   *     postalCode: 'string',
   *     region: 'string',
   *   },
   *   directions: 'string',
   *   kinds: ['training_ground'],
   *   name: 'string',
   *   what3words: 'string',
   *   isActive: true,
   * });
   * ```
   */
  update(id: string, body: VenueUpdateParams, options?: RequestOptions): APIPromise<VenueUpdateResponse> {
    return this._client.patch(__scalarPath`/api/v1/venues/${id}`, { body, ...options });
  }

  /**
   * Pitches in the club, A to Z, optionally for one venue.
   *
   * @param {VenueListPitchesParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueListPitchesResponse>} The pitches.
   *
   * @example
   * ```ts
   * const venue = await client.venues.listPitches({
   *   includeArchived: 'false',
   * });
   * ```
   */
  listPitches(
    query: VenueListPitchesParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<VenueListPitchesResponse> {
    return this._client.get('/api/v1/pitches', { query, ...options });
  }

  /**
   * Adds a pitch to a venue. Owners and admins only.
   *
   * @param {VenueCreatePitchParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueCreatePitchResponse>} The new pitch.
   *
   * @example
   * ```ts
   * const venue = await client.venues.createPitch({
   *   format: '5v5',
   *   name: 'string',
   *   surface: 'grass',
   *   venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  createPitch(body: VenueCreatePitchParams, options?: RequestOptions): APIPromise<VenueCreatePitchResponse> {
    return this._client.post('/api/v1/pitches', { body, ...options });
  }

  /**
   * Changes a pitch, or archives it with `isActive: false`. Owners and admins only.
   *
   * @param {string} id - The pitch's id.
   * @param {VenueUpdatePitchParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VenueUpdatePitchResponse>} The updated pitch.
   *
   * @example
   * ```ts
   * const venue = await client.venues.updatePitch('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   format: '5v5',
   *   name: 'string',
   *   surface: 'grass',
   *   isActive: true,
   * });
   * ```
   */
  updatePitch(
    id: string,
    body: VenueUpdatePitchParams,
    options?: RequestOptions,
  ): APIPromise<VenueUpdatePitchResponse> {
    return this._client.patch(__scalarPath`/api/v1/pitches/${id}`, { body, ...options });
  }
}

export interface VenueListParams {
  /**
   * Also return archived records.
   * @default false
   */
  includeArchived?: 'true' | 'false';
}

export interface VenueListResponse {
  venues: Array<VenueListResponse.Venue>;
}

export namespace VenueListResponse {
  export interface Venue {
    /**
     * @format uuid
     */
    addressId: string;
    /**
     * @format date-time
     */
    createdAt: string;
    directions: string | null;
    /**
     * @format uuid
     */
    id: string;
    isActive: boolean;
    /**
     * @minItems 1
     */
    kinds: Array<'training_ground' | 'classroom' | 'clubhouse' | 'match_venue'>;
    /**
     * @minLength 1
     */
    name: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @pattern ^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$
     */
    what3words: string | null;
    address: Venue.Address;
  }

  export namespace Venue {
    export interface Address {
      /**
       * @minLength 1
       */
      city: string;
      /**
       * @pattern ^[A-Z]{2}$
       */
      countryCode: string;
      /**
       * @format date-time
       */
      createdAt: string;
      /**
       * @format uuid
       */
      id: string;
      /**
       * @minimum -90
       * @maximum 90
       */
      latitude: number | null;
      /**
       * @minLength 1
       */
      line1: string;
      line2: string | null;
      /**
       * @minimum -180
       * @maximum 180
       */
      longitude: number | null;
      /**
       * @format uuid
       */
      organizationId: string;
      postalCode: string | null;
      region: string | null;
      /**
       * @format date-time
       */
      updatedAt: string;
    }
  }
}

export interface VenueCreateParams {
  address: VenueCreateParams.Address;
  /**
   * @minItems 1
   */
  kinds: Array<'training_ground' | 'classroom' | 'clubhouse' | 'match_venue'>;
  /**
   * @minLength 1
   */
  name: string;
  directions?: string | null;
  /**
   * @pattern ^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$
   */
  what3words?: string | null;
}

export namespace VenueCreateParams {
  export interface Address {
    /**
     * @minLength 1
     * @maxLength 200
     */
    city: string;
    /**
     * Two capital letters, for example GB.
     * @pattern ^[A-Z]{2}$
     */
    countryCode: string;
    /**
     * @minLength 1
     * @maxLength 200
     */
    line1: string;
    /**
     * @maxLength 200
     */
    line2?: string | null;
    /**
     * @maxLength 200
     */
    postalCode?: string | null;
    /**
     * @maxLength 200
     */
    region?: string | null;
  }
}

export interface VenueCreateResponse {
  /**
   * @format uuid
   */
  addressId: string;
  /**
   * @format date-time
   */
  createdAt: string;
  directions: string | null;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minItems 1
   */
  kinds: Array<'training_ground' | 'classroom' | 'clubhouse' | 'match_venue'>;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @pattern ^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$
   */
  what3words: string | null;
  address: VenueCreateResponse.Address;
}

export namespace VenueCreateResponse {
  export interface Address {
    /**
     * @minLength 1
     */
    city: string;
    /**
     * @pattern ^[A-Z]{2}$
     */
    countryCode: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum -90
     * @maximum 90
     */
    latitude: number | null;
    /**
     * @minLength 1
     */
    line1: string;
    line2: string | null;
    /**
     * @minimum -180
     * @maximum 180
     */
    longitude: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    postalCode: string | null;
    region: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface VenueRetrieveResponse {
  /**
   * @format uuid
   */
  addressId: string;
  /**
   * @format date-time
   */
  createdAt: string;
  directions: string | null;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minItems 1
   */
  kinds: Array<'training_ground' | 'classroom' | 'clubhouse' | 'match_venue'>;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @pattern ^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$
   */
  what3words: string | null;
  address: VenueRetrieveResponse.Address;
}

export namespace VenueRetrieveResponse {
  export interface Address {
    /**
     * @minLength 1
     */
    city: string;
    /**
     * @pattern ^[A-Z]{2}$
     */
    countryCode: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum -90
     * @maximum 90
     */
    latitude: number | null;
    /**
     * @minLength 1
     */
    line1: string;
    line2: string | null;
    /**
     * @minimum -180
     * @maximum 180
     */
    longitude: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    postalCode: string | null;
    region: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface VenueUpdateParams {
  address?: VenueUpdateParams.Address;
  directions?: string | null;
  /**
   * @minItems 1
   */
  kinds?: Array<'training_ground' | 'classroom' | 'clubhouse' | 'match_venue'>;
  /**
   * @minLength 1
   */
  name?: string;
  /**
   * @pattern ^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$
   */
  what3words?: string | null;
  /**
   * false archives the venue, true brings it back.
   */
  isActive?: boolean;
}

export namespace VenueUpdateParams {
  export interface Address {
    /**
     * @minLength 1
     * @maxLength 200
     */
    city: string;
    /**
     * Two capital letters, for example GB.
     * @pattern ^[A-Z]{2}$
     */
    countryCode: string;
    /**
     * @minLength 1
     * @maxLength 200
     */
    line1: string;
    /**
     * @maxLength 200
     */
    line2?: string | null;
    /**
     * @maxLength 200
     */
    postalCode?: string | null;
    /**
     * @maxLength 200
     */
    region?: string | null;
  }
}

export interface VenueUpdateResponse {
  /**
   * @format uuid
   */
  addressId: string;
  /**
   * @format date-time
   */
  createdAt: string;
  directions: string | null;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minItems 1
   */
  kinds: Array<'training_ground' | 'classroom' | 'clubhouse' | 'match_venue'>;
  /**
   * @minLength 1
   */
  name: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @pattern ^\p{Ll}+\.\p{Ll}+\.\p{Ll}+$
   */
  what3words: string | null;
  address: VenueUpdateResponse.Address;
}

export namespace VenueUpdateResponse {
  export interface Address {
    /**
     * @minLength 1
     */
    city: string;
    /**
     * @pattern ^[A-Z]{2}$
     */
    countryCode: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum -90
     * @maximum 90
     */
    latitude: number | null;
    /**
     * @minLength 1
     */
    line1: string;
    line2: string | null;
    /**
     * @minimum -180
     * @maximum 180
     */
    longitude: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    postalCode: string | null;
    region: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface VenueListPitchesParams {
  /**
   * Also return archived records.
   * @default false
   */
  includeArchived?: 'true' | 'false';
  /**
   * Only pitches at this venue.
   * @format uuid
   */
  venueId?: string;
}

export interface VenueListPitchesResponse {
  pitches: Array<VenueListPitchesResponse.Pitch>;
}

export namespace VenueListPitchesResponse {
  export interface Pitch {
    /**
     * @format date-time
     */
    createdAt: string;
    format: '5v5' | '7v7' | '9v9' | '11v11' | 'other';
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
    surface: 'grass' | '3g' | '4g' | 'astroturf' | 'indoor' | 'other';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uuid
     */
    venueId: string;
  }
}

export interface VenueCreatePitchParams {
  format: '5v5' | '7v7' | '9v9' | '11v11' | 'other';
  /**
   * @minLength 1
   */
  name: string;
  surface: 'grass' | '3g' | '4g' | 'astroturf' | 'indoor' | 'other';
  /**
   * The venue this pitch is at.
   * @format uuid
   */
  venueId: string;
}

export interface VenueCreatePitchResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  format: '5v5' | '7v7' | '9v9' | '11v11' | 'other';
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
  surface: 'grass' | '3g' | '4g' | 'astroturf' | 'indoor' | 'other';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  venueId: string;
}

export interface VenueUpdatePitchParams {
  format?: '5v5' | '7v7' | '9v9' | '11v11' | 'other';
  /**
   * @minLength 1
   */
  name?: string;
  surface?: 'grass' | '3g' | '4g' | 'astroturf' | 'indoor' | 'other';
  /**
   * false archives the pitch, true brings it back.
   */
  isActive?: boolean;
}

export interface VenueUpdatePitchResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  format: '5v5' | '7v7' | '9v9' | '11v11' | 'other';
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
  surface: 'grass' | '3g' | '4g' | 'astroturf' | 'indoor' | 'other';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  venueId: string;
}
export declare namespace Venues {
  export {
    type VenueListResponse as VenueListResponse,
    type VenueCreateResponse as VenueCreateResponse,
    type VenueRetrieveResponse as VenueRetrieveResponse,
    type VenueUpdateResponse as VenueUpdateResponse,
    type VenueListPitchesResponse as VenueListPitchesResponse,
    type VenueCreatePitchResponse as VenueCreatePitchResponse,
    type VenueUpdatePitchResponse as VenueUpdatePitchResponse,
    type VenueListParams as VenueListParams,
    type VenueCreateParams as VenueCreateParams,
    type VenueUpdateParams as VenueUpdateParams,
    type VenueListPitchesParams as VenueListPitchesParams,
    type VenueCreatePitchParams as VenueCreatePitchParams,
    type VenueUpdatePitchParams as VenueUpdatePitchParams,
  };
}
