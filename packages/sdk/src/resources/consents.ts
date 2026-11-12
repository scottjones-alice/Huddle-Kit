// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Consents extends APIResource {
  /**
   * The wording of each consent form. Everyone in the club can read it.
   *
   * @param {ConsentListFormsParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ConsentListFormsResponse>} The forms, by type and newest version first.
   *
   * @example
   * ```ts
   * const consent = await client.consents.listForms({
   *   includeRetired: 'false',
   * });
   * ```
   */
  listForms(
    query: ConsentListFormsParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ConsentListFormsResponse> {
    return this._client.get('/api/v1/consent-forms', { query, ...options });
  }

  /**
   * Publishes new wording as the next version for its type. Old versions are never edited, so every consent shows exactly what was agreed. Club admins only.
   *
   * @param {ConsentPublishFormParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ConsentPublishFormResponse>} The new version.
   *
   * @example
   * ```ts
   * const consent = await client.consents.publishForm({ body: 'string', title: 'string', type: 'photo_video' });
   * ```
   */
  publishForm(
    body: ConsentPublishFormParams,
    options?: RequestOptions,
  ): APIPromise<ConsentPublishFormResponse> {
    return this._client.post('/api/v1/consent-forms', { body, ...options });
  }

  /**
   * Stops offering a version. Consents already given against it stay valid. Club admins only.
   *
   * @param {string} id - The consent form's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ConsentRetireFormResponse>} The retired version.
   *
   * @example
   * ```ts
   * const consent = await client.consents.retireForm('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retireForm(id: string, options?: RequestOptions): APIPromise<ConsentRetireFormResponse> {
    return this._client.post(__scalarPath`/api/v1/consent-forms/${id}/retire`, options);
  }

  /**
   * Everything a person has agreed to, including what was withdrawn. You can see it for anyone you can see.
   *
   * @param {string} id - The person's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ConsentListResponse>} The consents, newest first.
   *
   * @example
   * ```ts
   * const consent = await client.consents.list('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  list(id: string, options?: RequestOptions): APIPromise<ConsentListResponse> {
    return this._client.get(__scalarPath`/api/v1/people/${id}/consents`, options);
  }

  /**
   * Records that the person agreed. You can agree for yourself and your children, and a parent is recorded as the one who agreed for a child. Agreeing to the same thing twice is refused; withdraw first.
   *
   * @param {string} id - The person's id.
   * @param {ConsentGrantParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ConsentGrantResponse>} The consent.
   *
   * @example
   * ```ts
   * const consent = await client.consents.grant('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   documentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   expiresAt: '2026-01-15T09:30:00.000Z',
   *   notes: 'string',
   *   type: 'photo_video',
   * });
   * ```
   */
  grant(id: string, body: ConsentGrantParams, options?: RequestOptions): APIPromise<ConsentGrantResponse> {
    return this._client.post(__scalarPath`/api/v1/people/${id}/consents`, { body, ...options });
  }

  /**
   * Takes consent back. The record stays, with the date it stopped.
   *
   * @param {string} id - The consent's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ConsentWithdrawResponse>} The consent.
   *
   * @example
   * ```ts
   * const consent = await client.consents.withdraw('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  withdraw(id: string, options?: RequestOptions): APIPromise<ConsentWithdrawResponse> {
    return this._client.post(__scalarPath`/api/v1/consents/${id}/withdraw`, options);
  }
}

export interface ConsentListFormsParams {
  /**
   * Also return versions that are no longer offered.
   * @default false
   */
  includeRetired?: 'true' | 'false';
}

export interface ConsentListFormsResponse {
  forms: Array<ConsentListFormsResponse.Form>;
}

export namespace ConsentListFormsResponse {
  export interface Form {
    /**
     * @minLength 1
     */
    body: string;
    /**
     * @format date-time
     */
    createdAt: string;
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
    publishedAt: string;
    /**
     * @format date-time
     */
    retiredAt: string | null;
    /**
     * @minLength 1
     */
    title: string;
    type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @minimum 1
     * @maximum 2147483647
     */
    version: number;
  }
}

export interface ConsentPublishFormParams {
  /**
   * The full wording.
   * @minLength 1
   * @maxLength 20000
   */
  body: string;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string;
  type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
}

export interface ConsentPublishFormResponse {
  /**
   * @minLength 1
   */
  body: string;
  /**
   * @format date-time
   */
  createdAt: string;
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
  publishedAt: string;
  /**
   * @format date-time
   */
  retiredAt: string | null;
  /**
   * @minLength 1
   */
  title: string;
  type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @minimum 1
   * @maximum 2147483647
   */
  version: number;
}

export interface ConsentRetireFormResponse {
  /**
   * @minLength 1
   */
  body: string;
  /**
   * @format date-time
   */
  createdAt: string;
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
  publishedAt: string;
  /**
   * @format date-time
   */
  retiredAt: string | null;
  /**
   * @minLength 1
   */
  title: string;
  type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @minimum 1
   * @maximum 2147483647
   */
  version: number;
}

export interface ConsentListResponse {
  consents: Array<ConsentListResponse.Consent>;
}

export namespace ConsentListResponse {
  export interface Consent {
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    documentId: string | null;
    /**
     * @format date-time
     */
    expiresAt: string | null;
    /**
     * @format uuid
     */
    fileId: string | null;
    /**
     * @format date-time
     */
    grantedAt: string;
    /**
     * @format uuid
     */
    grantedByPersonId: string | null;
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
    type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format date-time
     */
    withdrawnAt: string | null;
  }
}

export interface ConsentGrantParams {
  type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
  /**
   * The form version they agreed to. Its type must match.
   * @format uuid
   */
  documentId?: string | null;
  /**
   * @format date-time
   */
  expiresAt?: string | null;
  /**
   * @maxLength 1000
   */
  notes?: string | null;
}

export interface ConsentGrantResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  documentId: string | null;
  /**
   * @format date-time
   */
  expiresAt: string | null;
  /**
   * @format uuid
   */
  fileId: string | null;
  /**
   * @format date-time
   */
  grantedAt: string;
  /**
   * @format uuid
   */
  grantedByPersonId: string | null;
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
  type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format date-time
   */
  withdrawnAt: string | null;
}

export interface ConsentWithdrawResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format uuid
   */
  documentId: string | null;
  /**
   * @format date-time
   */
  expiresAt: string | null;
  /**
   * @format uuid
   */
  fileId: string | null;
  /**
   * @format date-time
   */
  grantedAt: string;
  /**
   * @format uuid
   */
  grantedByPersonId: string | null;
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
  type: 'photo_video' | 'medical_treatment' | 'travel' | 'data_sharing' | 'social_media';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format date-time
   */
  withdrawnAt: string | null;
}
export declare namespace Consents {
  export {
    type ConsentListFormsResponse as ConsentListFormsResponse,
    type ConsentPublishFormResponse as ConsentPublishFormResponse,
    type ConsentRetireFormResponse as ConsentRetireFormResponse,
    type ConsentListResponse as ConsentListResponse,
    type ConsentGrantResponse as ConsentGrantResponse,
    type ConsentWithdrawResponse as ConsentWithdrawResponse,
    type ConsentListFormsParams as ConsentListFormsParams,
    type ConsentPublishFormParams as ConsentPublishFormParams,
    type ConsentGrantParams as ConsentGrantParams,
  };
}
