// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';
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
   * Who the signed-in login is in this club: their name, photo and person id. Null when the login has no person here, for example a platform admin.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleRetrieveMyPersonResponse>} The signed-in person.
   *
   * @example
   * ```ts
   * const people = await client.people.retrieveMyPerson();
   * ```
   */
  retrieveMyPerson(options?: RequestOptions): APIPromise<PeopleRetrieveMyPersonResponse> {
    return this._client.get('/api/v1/people/me', options);
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

  /**
   * Anyone who can see the person sees their photo and cover. Documents can hold personal data about a child, so only club admins, the person and their parents see those.
   *
   * @param {string} id - The person's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleListPersonFilesResponse>} The photo, cover and documents the caller may see.
   *
   * @example
   * ```ts
   * const people = await client.people.listPersonFiles('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listPersonFiles(id: string, options?: RequestOptions): APIPromise<PeopleListPersonFilesResponse> {
    return this._client.get(__scalarPath`/api/v1/people/${id}/files`, options);
  }

  /**
   * Upload the file first with POST /files and confirm it, then attach it here. You can change your own and your children's; club admins can change anyone's.
   *
   * @param {string} id - The person's id.
   * @param {PeopleAttachPersonFileParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PeopleAttachPersonFileResponse>} The file, now on the person's record.
   *
   * @example
   * ```ts
   * const people = await client.people.attachPersonFile('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   purpose: 'avatar',
   * });
   * ```
   */
  attachPersonFile(
    id: string,
    body: PeopleAttachPersonFileParams,
    options?: RequestOptions,
  ): APIPromise<PeopleAttachPersonFileResponse> {
    return this._client.post(__scalarPath`/api/v1/people/${id}/files`, { body, ...options });
  }

  /**
   * Deletes the file from storage as well as taking it off the person's record.
   *
   * @param {string} linkId - The id of the link, not of the file.
   * @param {Object} params - Path parameters.
   * @param {string} params.id - The person's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns The file is gone.
   *
   * @example
   * ```ts
   * await client.people.removePersonFile('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  removePersonFile(linkId: string, params: { id: string }, options?: RequestOptions): APIPromise<void> {
    return this._client.delete(__scalarPath`/api/v1/people/${params.id}/files/${linkId}`, {
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
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
    /**
     * A temporary link to their profile photo, or null if they have none.
     */
    avatarUrl: string | null;
    /**
     * What they said they were joining as: staff, player or parent.
     */
    joinedAs: 'staff' | 'player' | 'parent' | null;
    /**
     * Club jobs their login holds now, such as coach or treasurer.
     */
    roles: Array<
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
      | 'safeguarding_deputy'
    >;
    /**
     * Teams they are on now, and their role on each.
     */
    teams: Array<{
      role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'volunteer';
      /**
       * @format uuid
       */
      teamId: string;
      teamName: string;
    }>;
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

export interface PeopleRetrieveMyPersonResponse {
  person: PeopleRetrieveMyPersonResponse.Person | null;
}

export namespace PeopleRetrieveMyPersonResponse {
  export interface Person {
    /**
     * A temporary link to their photo, or null.
     */
    avatarUrl: string | null;
    firstName: string;
    /**
     * @format uuid
     */
    id: string;
    lastName: string;
    preferredName: string | null;
  }
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
export interface PeopleAttachPersonFileParams {
  /**
   * A file you uploaded and confirmed with POST /files.
   * @format uuid
   */
  fileId: string;
  /**
   * avatar and cover need a photo; document needs a sensitive or other file. A new avatar or cover replaces the old one.
   */
  purpose: 'avatar' | 'cover' | 'document';
}

export interface PeopleAttachPersonFileResponse {
  file: PeopleAttachPersonFileResponse.File;
  link: PeopleAttachPersonFileResponse.Link;
  /**
   * A temporary link that shows a photo or cover. Null for documents, which open through GET /files/{id}/url.
   */
  url: string | null;
}

export namespace PeopleAttachPersonFileResponse {
  export interface File {
    bucket: string;
    /**
     * @pattern ^[0-9a-f]{64}$
     */
    checksumSha256: string | null;
    contentType: string;
    /**
     * @format date-time
     */
    createdAt: string;
    etag: string | null;
    /**
     * @minLength 1
     */
    fileName: string;
    /**
     * @format uuid
     */
    id: string;
    key: string;
    kind: 'photo' | 'report' | 'sensitive' | 'other';
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @minimum 0
     * @maximum 9007199254740991
     */
    sizeBytes: number;
    status: 'pending' | 'uploaded' | 'failed';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format date-time
     */
    uploadedAt: string | null;
    /**
     * @format uuid
     */
    uploadedBy: string | null;
  }

  export interface Link {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    createdBy: string | null;
    /**
     * @format uuid
     */
    fileId: string;
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
    purpose: 'avatar' | 'cover' | 'document';
  }
}

export interface PeopleListPersonFilesResponse {
  files: Array<PeopleAttachPersonFileResponse>;
}

export declare namespace People {
  export {
    type PeopleListResponse as PeopleListResponse,
    type PeopleCreatePersonResponse as PeopleCreatePersonResponse,
    type PeopleRetrieveMyPersonResponse as PeopleRetrieveMyPersonResponse,
    type PeopleRetrievePersonResponse as PeopleRetrievePersonResponse,
    type PeopleUpdatePersonResponse as PeopleUpdatePersonResponse,
    type PeopleLinkResponse as PeopleLinkResponse,
    type PeopleListPersonFilesResponse as PeopleListPersonFilesResponse,
    type PeopleAttachPersonFileResponse as PeopleAttachPersonFileResponse,
    type PeopleListParams as PeopleListParams,
    type PeopleCreatePersonParams as PeopleCreatePersonParams,
    type PeopleUpdatePersonParams as PeopleUpdatePersonParams,
    type PeopleLinkParams as PeopleLinkParams,
    type PeopleAttachPersonFileParams as PeopleAttachPersonFileParams,
  };
}
