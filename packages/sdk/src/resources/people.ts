// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class People extends APIResource {
  /**
   * Club admins see everyone. A coach sees the people on the teams they coach. Anyone else sees only themselves and their own children.
   *
   * @param {PeopleListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleListResponse>} The people the caller may see, by last name.
   *
   * @example
   * ```ts
   * const people = await client.people.list({
   *   limit: 50,
   *   offset: 0,
   *   includeArchived: 'false',
   * });
   * ```
   */
  list(
    query: PeopleListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<PeopleListResponse> {
    return this._client.get('/api/v1/people', { query, ...options });
  }

  /**
   * Adds a person who does not have a login, such as a child or a coach who has not signed up. Club admins only.
   *
   * @param {PeopleCreatePersonParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleCreatePersonResponse>} The new person.
   *
   * @example
   * ```ts
   * const people = await client.people.createPerson({
   *   address: {
   *     city: 'string',
   *     countryCode: 'string',
   *     line1: 'string',
   *     line2: 'string',
   *     postalCode: 'string',
   *     region: 'string',
   *   },
   *   dateOfBirth: '2026-01-15',
   *   email: 'alex@example.com',
   *   firstName: 'string',
   *   lastName: 'string',
   *   phone: 'string',
   *   preferredName: 'string',
   * });
   * ```
   */
  createPerson(
    body: PeopleCreatePersonParams,
    options?: RequestOptions,
  ): APIPromise<PeopleCreatePersonResponse> {
    return this._client.post('/api/v1/people', { body, ...options });
  }

  /**
   * One person with their address, family links, player profile and team history. Medical and safeguarding information is separate.
   *
   * @param {string} id - The person's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleRetrievePersonResponse>} The person.
   *
   * @example
   * ```ts
   * const people = await client.people.retrievePerson('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retrievePerson(id: string, options?: RequestOptions): APIPromise<PeopleRetrievePersonResponse> {
    return this._client.get(__scalarPath`/api/v1/people/${id}`, options);
  }

  /**
   * Changes a person's details. You can change your own and your children's; club admins can change anyone's.
   *
   * @param {string} id - The person's id.
   * @param {PeopleUpdatePersonParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleUpdatePersonResponse>} The updated person.
   *
   * @example
   * ```ts
   * const people = await client.people.updatePerson('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   address: {
   *     city: 'string',
   *     countryCode: 'string',
   *     line1: 'string',
   *     line2: 'string',
   *     postalCode: 'string',
   *     region: 'string',
   *   },
   *   dateOfBirth: '2026-01-15',
   *   email: 'alex@example.com',
   *   firstName: 'string',
   *   lastName: 'string',
   *   phone: 'string',
   *   preferredName: 'string',
   *   isActive: true,
   * });
   * ```
   */
  updatePerson(
    id: string,
    body: PeopleUpdatePersonParams,
    options?: RequestOptions,
  ): APIPromise<PeopleUpdatePersonResponse> {
    return this._client.patch(__scalarPath`/api/v1/people/${id}`, { body, ...options });
  }

  /**
   * Records that an adult is a parent, guardian or carer of the person in the path. Saving the same link again updates its permissions. Club admins only.
   *
   * @param {string} id - The child's id.
   * @param {PeopleLinkParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleLinkResponse>} The link.
   *
   * @example
   * ```ts
   * const people = await client.people.link('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   canCollect: true,
   *   hasParentalResponsibility: true,
   *   isEmergencyContact: true,
   *   relatedPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   relationship: 'parent',
   * });
   * ```
   */
  link(id: string, body: PeopleLinkParams, options?: RequestOptions): APIPromise<PeopleLinkResponse> {
    return this._client.post(__scalarPath`/api/v1/people/${id}/relationships`, { body, ...options });
  }
}

export interface PeopleListParams {
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
   * Also return archived records.
   * @default false
   */
  includeArchived?: 'true' | 'false';
  /**
   * Part of a first name, last name or email.
   * @maxLength 100
   */
  search?: string;
}

export interface PeopleListResponse {
  people: Array<PeopleListResponse.People>;
}

export namespace PeopleListResponse {
  export interface People {
    /**
     * @format uuid
     */
    addressId: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date
     */
    dateOfBirth: string | null;
    /**
     * @format email
     */
    email: string | null;
    /**
     * @minLength 1
     */
    firstName: string;
    /**
     * @format uuid
     */
    id: string;
    isActive: boolean;
    /**
     * @minLength 1
     */
    lastName: string;
    /**
     * @format uuid
     */
    organizationId: string;
    phone: string | null;
    /**
     * @minLength 1
     */
    preferredName: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uuid
     */
    userId: string | null;
  }
}

export interface PeopleCreatePersonParams {
  /**
   * @minLength 1
   */
  firstName: string;
  /**
   * @minLength 1
   */
  lastName: string;
  address?: PeopleCreatePersonParams.Address | null;
  /**
   * @format date
   */
  dateOfBirth?: string | null;
  /**
   * @format email
   */
  email?: string | null;
  phone?: string | null;
  /**
   * @minLength 1
   */
  preferredName?: string | null;
}

export namespace PeopleCreatePersonParams {
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

export interface PeopleCreatePersonResponse {
  /**
   * @format uuid
   */
  addressId: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date
   */
  dateOfBirth: string | null;
  /**
   * @format email
   */
  email: string | null;
  /**
   * @minLength 1
   */
  firstName: string;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minLength 1
   */
  lastName: string;
  /**
   * @format uuid
   */
  organizationId: string;
  phone: string | null;
  /**
   * @minLength 1
   */
  preferredName: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  userId: string | null;
}

export interface PeopleRetrievePersonResponse {
  address: PeopleRetrievePersonResponse.Address | null;
  memberships: Array<PeopleRetrievePersonResponse.Membership>;
  person: PeopleRetrievePersonResponse.Person;
  playerProfile: PeopleRetrievePersonResponse.PlayerProfile | null;
  relationships: Array<PeopleRetrievePersonResponse.Relationship>;
}

export namespace PeopleRetrievePersonResponse {
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

  export interface Membership {
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

  export interface Person {
    /**
     * @format uuid
     */
    addressId: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date
     */
    dateOfBirth: string | null;
    /**
     * @format email
     */
    email: string | null;
    /**
     * @minLength 1
     */
    firstName: string;
    /**
     * @format uuid
     */
    id: string;
    isActive: boolean;
    /**
     * @minLength 1
     */
    lastName: string;
    /**
     * @format uuid
     */
    organizationId: string;
    phone: string | null;
    /**
     * @minLength 1
     */
    preferredName: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uuid
     */
    userId: string | null;
  }

  export interface PlayerProfile {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @minimum 50
     * @maximum 250
     */
    heightCm: number | null;
    notes: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    preferredFoot: 'left' | 'right' | 'both' | null;
    primaryPosition: string | null;
    secondaryPosition: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }

  export interface Relationship {
    canCollect: boolean;
    /**
     * @format date-time
     */
    createdAt: string;
    hasParentalResponsibility: boolean;
    /**
     * @format uuid
     */
    id: string;
    isEmergencyContact: boolean;
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
    relatedPersonId: string;
    relationship: 'parent' | 'guardian' | 'carer' | 'grandparent' | 'other';
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface PeopleUpdatePersonParams {
  address?: PeopleUpdatePersonParams.Address | null;
  /**
   * @format date
   */
  dateOfBirth?: string | null;
  /**
   * @format email
   */
  email?: string | null;
  /**
   * @minLength 1
   */
  firstName?: string;
  /**
   * @minLength 1
   */
  lastName?: string;
  phone?: string | null;
  /**
   * @minLength 1
   */
  preferredName?: string | null;
  /**
   * false archives the person, true brings them back. People are never deleted, so their history is kept. Club admins only.
   */
  isActive?: boolean;
}

export namespace PeopleUpdatePersonParams {
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

export interface PeopleUpdatePersonResponse {
  /**
   * @format uuid
   */
  addressId: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date
   */
  dateOfBirth: string | null;
  /**
   * @format email
   */
  email: string | null;
  /**
   * @minLength 1
   */
  firstName: string;
  /**
   * @format uuid
   */
  id: string;
  isActive: boolean;
  /**
   * @minLength 1
   */
  lastName: string;
  /**
   * @format uuid
   */
  organizationId: string;
  phone: string | null;
  /**
   * @minLength 1
   */
  preferredName: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  userId: string | null;
}

export interface PeopleLinkParams {
  /**
   * The adult. The person in the path is the child.
   * @format uuid
   */
  relatedPersonId: string;
  relationship: 'parent' | 'guardian' | 'carer' | 'grandparent' | 'other';
  /**
   * May collect the child from sessions.
   */
  canCollect?: boolean;
  hasParentalResponsibility?: boolean;
  isEmergencyContact?: boolean;
}

export interface PeopleLinkResponse {
  canCollect: boolean;
  /**
   * @format date-time
   */
  createdAt: string;
  hasParentalResponsibility: boolean;
  /**
   * @format uuid
   */
  id: string;
  isEmergencyContact: boolean;
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
  relatedPersonId: string;
  relationship: 'parent' | 'guardian' | 'carer' | 'grandparent' | 'other';
  /**
   * @format date-time
   */
  updatedAt: string;
}
export declare namespace People {
  export {
    type PeopleListResponse as PeopleListResponse,
    type PeopleCreatePersonResponse as PeopleCreatePersonResponse,
    type PeopleRetrievePersonResponse as PeopleRetrievePersonResponse,
    type PeopleUpdatePersonResponse as PeopleUpdatePersonResponse,
    type PeopleLinkResponse as PeopleLinkResponse,
    type PeopleListParams as PeopleListParams,
    type PeopleCreatePersonParams as PeopleCreatePersonParams,
    type PeopleUpdatePersonParams as PeopleUpdatePersonParams,
    type PeopleLinkParams as PeopleLinkParams,
  };
}
