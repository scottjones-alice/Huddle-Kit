// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Safeguarding extends APIResource {
  /**
   * Who has been checked (DBS, safeguarding training, first aid, references) and when it runs out. Club admins and safeguarding staff can read this; only safeguarding staff can change it.
   *
   * @param {SafeguardingListChecksParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingListChecksResponse>} The checks, soonest to expire first.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.listChecks();
   * ```
   */
  listChecks(
    query: SafeguardingListChecksParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<SafeguardingListChecksResponse> {
    return this._client.get('/api/v1/safeguarding/checks', { query, ...options });
  }

  /**
   * Records that a check was done. Keep only the certificate number here and the scan in a file. Safeguarding staff only.
   *
   * @param {SafeguardingRecordCheckParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingRecordCheckResponse>} The recorded check.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.recordCheck({
   *   dbsLevel: 'basic',
   *   dbsUpdateService: true,
   *   expiresOn: '2026-01-15',
   *   fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   issuedOn: '2026-01-15',
   *   kind: 'dbs',
   *   personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   reference: 'string',
   * });
   * ```
   */
  recordCheck(
    body: SafeguardingRecordCheckParams,
    options?: RequestOptions,
  ): APIPromise<SafeguardingRecordCheckResponse> {
    return this._client.post('/api/v1/safeguarding/checks', { body, ...options });
  }

  /**
   * Marks a check valid, rejected or revoked, or corrects its dates. Checks are never deleted. Safeguarding staff only.
   *
   * @param {string} id - The check's id.
   * @param {SafeguardingUpdateCheckParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingUpdateCheckResponse>} The updated check.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.updateCheck('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   expiresOn: '2026-01-15',
   *   fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   issuedOn: '2026-01-15',
   *   reference: 'string',
   *   status: 'pending',
   * });
   * ```
   */
  updateCheck(
    id: string,
    body: SafeguardingUpdateCheckParams,
    options?: RequestOptions,
  ): APIPromise<SafeguardingUpdateCheckResponse> {
    return this._client.patch(__scalarPath`/api/v1/safeguarding/checks/${id}`, { body, ...options });
  }

  /**
   * Anyone in the club can raise a concern. Only its id comes back: what you wrote and what happens next is seen by safeguarding staff alone.
   *
   * @param {SafeguardingRaiseConcernParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingRaiseConcernResponse>} The concern was recorded.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.raiseConcern({
   *   details: 'string',
   *   severity: 'low',
   *   subjectPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   summary: 'string',
   * });
   * ```
   */
  raiseConcern(
    body: SafeguardingRaiseConcernParams,
    options?: RequestOptions,
  ): APIPromise<SafeguardingRaiseConcernResponse> {
    return this._client.post('/api/v1/safeguarding/concerns', { body, ...options });
  }

  /**
   * Safeguarding staff only. Shows the short summaries, never the full account. This is recorded in the audit log.
   *
   * @param {SafeguardingListConcernsParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingListConcernsResponse>} The concerns, newest first.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.listConcerns();
   * ```
   */
  listConcerns(
    query: SafeguardingListConcernsParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<SafeguardingListConcernsResponse> {
    return this._client.get('/api/v1/safeguarding/concerns', { query, ...options });
  }

  /**
   * One concern in full with its running log. Safeguarding staff only. Every read is recorded in the audit log.
   *
   * @param {string} id - The concern's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingRetrieveConcernResponse>} The concern and its notes.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.retrieveConcern('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retrieveConcern(id: string, options?: RequestOptions): APIPromise<SafeguardingRetrieveConcernResponse> {
    return this._client.get(__scalarPath`/api/v1/safeguarding/concerns/${id}`, options);
  }

  /**
   * Assigns, refers, changes the severity of, closes or reopens a concern. Closing needs a reason. A concern is never deleted.
   *
   * @param {string} id - The concern's id.
   * @param {SafeguardingUpdateConcernParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingUpdateConcernResponse>} The updated concern.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.updateConcern('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   assignedTo: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   closedReason: 'string',
   *   referredTo: 'string',
   *   severity: 'low',
   *   status: 'open',
   * });
   * ```
   */
  updateConcern(
    id: string,
    body: SafeguardingUpdateConcernParams,
    options?: RequestOptions,
  ): APIPromise<SafeguardingUpdateConcernResponse> {
    return this._client.patch(__scalarPath`/api/v1/safeguarding/concerns/${id}`, { body, ...options });
  }

  /**
   * Adds to the concern's running log. Notes cannot be edited or removed; to correct one, add another.
   *
   * @param {string} id - The concern's id.
   * @param {SafeguardingCreateConcernNoteParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SafeguardingCreateConcernNoteResponse>} The note.
   *
   * @example
   * ```ts
   * const safeguarding = await client.safeguarding.createConcernNote('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   body: 'string',
   * });
   * ```
   */
  createConcernNote(
    id: string,
    body: SafeguardingCreateConcernNoteParams,
    options?: RequestOptions,
  ): APIPromise<SafeguardingCreateConcernNoteResponse> {
    return this._client.post(__scalarPath`/api/v1/safeguarding/concerns/${id}/notes`, { body, ...options });
  }
}

export interface SafeguardingListChecksParams {
  /**
   * Only checks that run out on or before this date.
   * @format date
   */
  expiresBefore?: string;
  /**
   * Only this kind.
   */
  kind?: 'dbs' | 'safeguarding_training' | 'first_aid' | 'reference';
  /**
   * Only this person's checks.
   * @format uuid
   */
  personId?: string;
  /**
   * Only this status.
   */
  status?: 'pending' | 'valid' | 'rejected' | 'revoked';
}

export interface SafeguardingListChecksResponse {
  checks: Array<SafeguardingListChecksResponse.Check>;
}

export namespace SafeguardingListChecksResponse {
  export interface Check {
    /**
     * @format date-time
     */
    createdAt: string;
    dbsLevel: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred_list' | null;
    dbsUpdateService: boolean;
    /**
     * @format date
     */
    expiresOn: string | null;
    /**
     * @format uuid
     */
    fileId: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format date
     */
    issuedOn: string | null;
    kind: 'dbs' | 'safeguarding_training' | 'first_aid' | 'reference';
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    /**
     * @minLength 1
     */
    reference: string | null;
    status: 'pending' | 'valid' | 'rejected' | 'revoked';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format date-time
     */
    verifiedAt: string | null;
    /**
     * @format uuid
     */
    verifiedBy: string | null;
  }
}

export interface SafeguardingRecordCheckParams {
  kind: 'dbs' | 'safeguarding_training' | 'first_aid' | 'reference';
  /**
   * The adult the check is about.
   * @format uuid
   */
  personId: string;
  /**
   * DBS checks only.
   */
  dbsLevel?: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred_list' | null;
  /**
   * DBS checks only: on the DBS Update Service.
   */
  dbsUpdateService?: boolean;
  /**
   * @format date
   */
  expiresOn?: string | null;
  /**
   * The scanned certificate, uploaded as a file.
   * @format uuid
   */
  fileId?: string | null;
  /**
   * @format date
   */
  issuedOn?: string | null;
  /**
   * Certificate number or course reference. Not the certificate.
   * @maxLength 120
   */
  reference?: string | null;
}

export interface SafeguardingRecordCheckResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  dbsLevel: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred_list' | null;
  dbsUpdateService: boolean;
  /**
   * @format date
   */
  expiresOn: string | null;
  /**
   * @format uuid
   */
  fileId: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format date
   */
  issuedOn: string | null;
  kind: 'dbs' | 'safeguarding_training' | 'first_aid' | 'reference';
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @minLength 1
   */
  reference: string | null;
  status: 'pending' | 'valid' | 'rejected' | 'revoked';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format date-time
   */
  verifiedAt: string | null;
  /**
   * @format uuid
   */
  verifiedBy: string | null;
}

export interface SafeguardingUpdateCheckParams {
  /**
   * @format date
   */
  expiresOn?: string | null;
  /**
   * @format uuid
   */
  fileId?: string | null;
  /**
   * @format date
   */
  issuedOn?: string | null;
  /**
   * @maxLength 120
   */
  reference?: string | null;
  /**
   * Deciding a check records who decided it and when.
   */
  status?: 'pending' | 'valid' | 'rejected' | 'revoked';
}

export interface SafeguardingUpdateCheckResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  dbsLevel: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred_list' | null;
  dbsUpdateService: boolean;
  /**
   * @format date
   */
  expiresOn: string | null;
  /**
   * @format uuid
   */
  fileId: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format date
   */
  issuedOn: string | null;
  kind: 'dbs' | 'safeguarding_training' | 'first_aid' | 'reference';
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @minLength 1
   */
  reference: string | null;
  status: 'pending' | 'valid' | 'rejected' | 'revoked';
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format date-time
   */
  verifiedAt: string | null;
  /**
   * @format uuid
   */
  verifiedBy: string | null;
}

export interface SafeguardingRaiseConcernParams {
  severity: 'low' | 'medium' | 'high' | 'immediate_risk';
  /**
   * Who the concern is about.
   * @format uuid
   */
  subjectPersonId: string;
  /**
   * One short line for the people handling it.
   * @minLength 1
   * @maxLength 300
   */
  summary: string;
  /**
   * The full account. Stored encrypted.
   * @maxLength 20000
   */
  details?: string | null;
}

export interface SafeguardingRaiseConcernResponse {
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format date-time
   */
  openedAt: string;
}

export interface SafeguardingListConcernsParams {
  /**
   * Only concerns given to this user.
   * @format uuid
   */
  assignedTo?: string;
  /**
   * Only this status.
   */
  status?: 'open' | 'under_review' | 'referred' | 'closed';
  /**
   * Only this person.
   * @format uuid
   */
  subjectPersonId?: string;
}

export interface SafeguardingListConcernsResponse {
  concerns: Array<SafeguardingListConcernsResponse.Concern>;
}

export namespace SafeguardingListConcernsResponse {
  export interface Concern {
    /**
     * @format uuid
     */
    assignedTo: string | null;
    /**
     * @format date-time
     */
    closedAt: string | null;
    closedReason: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    details: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format date-time
     */
    openedAt: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    raisedBy: string | null;
    /**
     * @format date-time
     */
    referredAt: string | null;
    referredTo: string | null;
    severity: 'low' | 'medium' | 'high' | 'immediate_risk';
    status: 'open' | 'under_review' | 'referred' | 'closed';
    /**
     * @format uuid
     */
    subjectPersonId: string;
    /**
     * @minLength 1
     */
    summary: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface SafeguardingRetrieveConcernResponse {
  concern: SafeguardingRetrieveConcernResponse.Concern;
  notes: Array<SafeguardingRetrieveConcernResponse.Note>;
}

export namespace SafeguardingRetrieveConcernResponse {
  export interface Concern {
    /**
     * @format uuid
     */
    assignedTo: string | null;
    /**
     * @format date-time
     */
    closedAt: string | null;
    closedReason: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    details: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format date-time
     */
    openedAt: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    raisedBy: string | null;
    /**
     * @format date-time
     */
    referredAt: string | null;
    referredTo: string | null;
    severity: 'low' | 'medium' | 'high' | 'immediate_risk';
    status: 'open' | 'under_review' | 'referred' | 'closed';
    /**
     * @format uuid
     */
    subjectPersonId: string;
    /**
     * @minLength 1
     */
    summary: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }

  export interface Note {
    /**
     * @format uuid
     */
    authorUserId: string | null;
    /**
     * @minLength 1
     */
    body: string;
    /**
     * @format uuid
     */
    concernId: string;
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
  }
}

export interface SafeguardingUpdateConcernParams {
  /**
   * The lead handling it.
   * @format uuid
   */
  assignedTo?: string | null;
  /**
   * @maxLength 1000
   */
  closedReason?: string | null;
  /**
   * Who it was passed to, such as the LADO or the County FA.
   * @maxLength 200
   */
  referredTo?: string | null;
  severity?: 'low' | 'medium' | 'high' | 'immediate_risk';
  status?: 'open' | 'under_review' | 'referred' | 'closed';
}

export interface SafeguardingUpdateConcernResponse {
  /**
   * @format uuid
   */
  assignedTo: string | null;
  /**
   * @format date-time
   */
  closedAt: string | null;
  closedReason: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  details: string | null;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format date-time
   */
  openedAt: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  raisedBy: string | null;
  /**
   * @format date-time
   */
  referredAt: string | null;
  referredTo: string | null;
  severity: 'low' | 'medium' | 'high' | 'immediate_risk';
  status: 'open' | 'under_review' | 'referred' | 'closed';
  /**
   * @format uuid
   */
  subjectPersonId: string;
  /**
   * @minLength 1
   */
  summary: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface SafeguardingCreateConcernNoteParams {
  /**
   * What was done or decided. Stored encrypted.
   * @minLength 1
   * @maxLength 20000
   */
  body: string;
}

export interface SafeguardingCreateConcernNoteResponse {
  /**
   * @format uuid
   */
  authorUserId: string | null;
  /**
   * @minLength 1
   */
  body: string;
  /**
   * @format uuid
   */
  concernId: string;
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
}
export declare namespace Safeguarding {
  export {
    type SafeguardingListChecksResponse as SafeguardingListChecksResponse,
    type SafeguardingRecordCheckResponse as SafeguardingRecordCheckResponse,
    type SafeguardingUpdateCheckResponse as SafeguardingUpdateCheckResponse,
    type SafeguardingRaiseConcernResponse as SafeguardingRaiseConcernResponse,
    type SafeguardingListConcernsResponse as SafeguardingListConcernsResponse,
    type SafeguardingRetrieveConcernResponse as SafeguardingRetrieveConcernResponse,
    type SafeguardingUpdateConcernResponse as SafeguardingUpdateConcernResponse,
    type SafeguardingCreateConcernNoteResponse as SafeguardingCreateConcernNoteResponse,
    type SafeguardingListChecksParams as SafeguardingListChecksParams,
    type SafeguardingRecordCheckParams as SafeguardingRecordCheckParams,
    type SafeguardingUpdateCheckParams as SafeguardingUpdateCheckParams,
    type SafeguardingRaiseConcernParams as SafeguardingRaiseConcernParams,
    type SafeguardingListConcernsParams as SafeguardingListConcernsParams,
    type SafeguardingUpdateConcernParams as SafeguardingUpdateConcernParams,
    type SafeguardingCreateConcernNoteParams as SafeguardingCreateConcernNoteParams,
  };
}
