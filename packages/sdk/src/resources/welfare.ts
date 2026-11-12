// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Welfare extends APIResource {
  /**
   * A person's medical records and allergies. Seen by the person, their parents, club admins and the coaches of their teams. Every read is recorded in the audit log.
   *
   * @param {string} id - The person's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareListHealthResponse>} Their health information.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.listHealth('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listHealth(id: string, options?: RequestOptions): APIPromise<WelfareListHealthResponse> {
    return this._client.get(__scalarPath`/api/v1/people/${id}/health`, options);
  }

  /**
   * Adds a condition, medication or disability. Only the person, their parents or a club admin can.
   *
   * @param {string} id - The person's id.
   * @param {WelfareCreateMedicalRecordParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareCreateMedicalRecordResponse>} The record.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.createMedicalRecord('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   details: 'string',
   *   emergencyNotes: 'string',
   *   endedOn: '2026-01-15',
   *   isEmergencyRelevant: true,
   *   kind: 'condition',
   *   name: 'string',
   *   startedOn: '2026-01-15',
   * });
   * ```
   */
  createMedicalRecord(
    id: string,
    body: WelfareCreateMedicalRecordParams,
    options?: RequestOptions,
  ): APIPromise<WelfareCreateMedicalRecordResponse> {
    return this._client.post(__scalarPath`/api/v1/people/${id}/medical-records`, { body, ...options });
  }

  /**
   * Changes a record. Set endedOn when it no longer applies rather than removing it.
   *
   * @param {string} id - The medical record's id.
   * @param {WelfareUpdateMedicalRecordParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareUpdateMedicalRecordResponse>} The updated record.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.updateMedicalRecord('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   details: 'string',
   *   emergencyNotes: 'string',
   *   endedOn: '2026-01-15',
   *   isEmergencyRelevant: true,
   *   kind: 'condition',
   *   name: 'string',
   *   startedOn: '2026-01-15',
   * });
   * ```
   */
  updateMedicalRecord(
    id: string,
    body: WelfareUpdateMedicalRecordParams,
    options?: RequestOptions,
  ): APIPromise<WelfareUpdateMedicalRecordResponse> {
    return this._client.patch(__scalarPath`/api/v1/medical-records/${id}`, { body, ...options });
  }

  /**
   * Add an allergy
   *
   * @param {string} id - The person's id.
   * @param {WelfareCreateAllergyParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareCreateAllergyResponse>} The allergy.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.createAllergy('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   allergen: 'string',
   *   reaction: 'string',
   *   severity: 'mild',
   *   treatment: 'string',
   * });
   * ```
   */
  createAllergy(
    id: string,
    body: WelfareCreateAllergyParams,
    options?: RequestOptions,
  ): APIPromise<WelfareCreateAllergyResponse> {
    return this._client.post(__scalarPath`/api/v1/people/${id}/allergies`, { body, ...options });
  }

  /**
   * Change or archive an allergy
   *
   * @param {string} id - The allergy's id.
   * @param {WelfareUpdateAllergyParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareUpdateAllergyResponse>} The allergy.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.updateAllergy('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   allergen: 'string',
   *   reaction: 'string',
   *   severity: 'mild',
   *   treatment: 'string',
   *   archived: true,
   * });
   * ```
   */
  updateAllergy(
    id: string,
    body: WelfareUpdateAllergyParams,
    options?: RequestOptions,
  ): APIPromise<WelfareUpdateAllergyResponse> {
    return this._client.patch(__scalarPath`/api/v1/allergies/${id}`, { body, ...options });
  }

  /**
   * Incident reports about people you can see: a parent sees their child's, a coach sees those on their teams, a club admin sees all.
   *
   * @param {WelfareListIncidentsParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareListIncidentsResponse>} The reports, newest first.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.listIncidents({
   *   limit: 50,
   *   offset: 0,
   * });
   * ```
   */
  listIncidents(
    query: WelfareListIncidentsParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<WelfareListIncidentsResponse> {
    return this._client.get('/api/v1/incidents', { query, ...options });
  }

  /**
   * Writes up an accident, injury, illness or welfare incident. Coaches and club admins only. Reports are never deleted.
   *
   * @param {WelfareCreateIncidentParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareCreateIncidentResponse>} The report.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.createIncident({
   *   actionTaken: 'string',
   *   description: 'string',
   *   firstAiderPersonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   followUpRequired: true,
   *   kind: 'injury',
   *   occurredAt: '2026-01-15T09:30:00.000Z',
   *   parentsNotifiedAt: '2026-01-15T09:30:00.000Z',
   *   personId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   severity: 'minor',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   venueId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  createIncident(
    body: WelfareCreateIncidentParams,
    options?: RequestOptions,
  ): APIPromise<WelfareCreateIncidentResponse> {
    return this._client.post('/api/v1/incidents', { body, ...options });
  }

  /**
   * Read an incident report
   *
   * @param {string} id - The incident report's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareRetrieveIncidentResponse>} The report.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.retrieveIncident('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  retrieveIncident(id: string, options?: RequestOptions): APIPromise<WelfareRetrieveIncidentResponse> {
    return this._client.get(__scalarPath`/api/v1/incidents/${id}`, options);
  }

  /**
   * Adds what was done, marks follow-up, or records when parents were told. Only the person who wrote it, or a club admin.
   *
   * @param {string} id - The incident report's id.
   * @param {WelfareUpdateIncidentParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareUpdateIncidentResponse>} The updated report.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.updateIncident('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   actionTaken: 'string',
   *   followUpRequired: true,
   *   parentsNotifiedAt: '2026-01-15T09:30:00.000Z',
   * });
   * ```
   */
  updateIncident(
    id: string,
    body: WelfareUpdateIncidentParams,
    options?: RequestOptions,
  ): APIPromise<WelfareUpdateIncidentResponse> {
    return this._client.patch(__scalarPath`/api/v1/incidents/${id}`, { body, ...options });
  }

  /**
   * List qualifications
   *
   * @param {string} id - The person's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareListQualificationsResponse>} Their coaching and refereeing qualifications.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.listQualifications('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listQualifications(id: string, options?: RequestOptions): APIPromise<WelfareListQualificationsResponse> {
    return this._client.get(__scalarPath`/api/v1/people/${id}/qualifications`, options);
  }

  /**
   * Adds a coaching or refereeing badge. DBS, safeguarding training and first aid are checks, kept under Safeguarding.
   *
   * @param {string} id - The person's id.
   * @param {WelfareCreateQualificationParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareCreateQualificationResponse>} The qualification.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.createQualification('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   awardedBy: 'string',
   *   expiresOn: '2026-01-15',
   *   fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   issuedOn: '2026-01-15',
   *   kind: 'coaching',
   *   reference: 'string',
   *   title: 'string',
   * });
   * ```
   */
  createQualification(
    id: string,
    body: WelfareCreateQualificationParams,
    options?: RequestOptions,
  ): APIPromise<WelfareCreateQualificationResponse> {
    return this._client.post(__scalarPath`/api/v1/people/${id}/qualifications`, { body, ...options });
  }

  /**
   * Change a qualification
   *
   * @param {string} id - The qualification's id.
   * @param {WelfareUpdateQualificationParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<WelfareUpdateQualificationResponse>} The updated qualification.
   *
   * @example
   * ```ts
   * const welfare = await client.welfare.updateQualification('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   awardedBy: 'string',
   *   expiresOn: '2026-01-15',
   *   fileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   issuedOn: '2026-01-15',
   *   kind: 'coaching',
   *   reference: 'string',
   *   title: 'string',
   * });
   * ```
   */
  updateQualification(
    id: string,
    body: WelfareUpdateQualificationParams,
    options?: RequestOptions,
  ): APIPromise<WelfareUpdateQualificationResponse> {
    return this._client.patch(__scalarPath`/api/v1/qualifications/${id}`, { body, ...options });
  }
}

export interface WelfareListHealthResponse {
  allergies: Array<WelfareListHealthResponse.Allergy>;
  medicalRecords: Array<WelfareListHealthResponse.MedicalRecord>;
}

export namespace WelfareListHealthResponse {
  export interface Allergy {
    /**
     * @minLength 1
     */
    allergen: string;
    /**
     * @format date-time
     */
    archivedAt: string | null;
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
     * @format uuid
     */
    personId: string;
    reaction: string | null;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    treatment: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }

  export interface MedicalRecord {
    /**
     * @format date-time
     */
    createdAt: string;
    details: string | null;
    emergencyNotes: string | null;
    /**
     * @format date
     */
    endedOn: string | null;
    /**
     * @format uuid
     */
    id: string;
    isEmergencyRelevant: boolean;
    kind: 'condition' | 'medication' | 'disability' | 'other';
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
    personId: string;
    /**
     * @format date
     */
    startedOn: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface WelfareCreateMedicalRecordParams {
  kind: 'condition' | 'medication' | 'disability' | 'other';
  /**
   * @minLength 1
   * @maxLength 150
   */
  name: string;
  /**
   * @maxLength 2000
   */
  details?: string | null;
  /**
   * What a first aider should do.
   * @maxLength 1000
   */
  emergencyNotes?: string | null;
  /**
   * Set when it no longer applies.
   * @format date
   */
  endedOn?: string | null;
  /**
   * Show to whoever is first on the scene.
   */
  isEmergencyRelevant?: boolean;
  /**
   * @format date
   */
  startedOn?: string | null;
}

export interface WelfareCreateMedicalRecordResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  details: string | null;
  emergencyNotes: string | null;
  /**
   * @format date
   */
  endedOn: string | null;
  /**
   * @format uuid
   */
  id: string;
  isEmergencyRelevant: boolean;
  kind: 'condition' | 'medication' | 'disability' | 'other';
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
  personId: string;
  /**
   * @format date
   */
  startedOn: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface WelfareUpdateMedicalRecordParams {
  /**
   * @maxLength 2000
   */
  details?: string | null;
  /**
   * What a first aider should do.
   * @maxLength 1000
   */
  emergencyNotes?: string | null;
  /**
   * Set when it no longer applies.
   * @format date
   */
  endedOn?: string | null;
  /**
   * Show to whoever is first on the scene.
   */
  isEmergencyRelevant?: boolean;
  kind?: 'condition' | 'medication' | 'disability' | 'other';
  /**
   * @minLength 1
   * @maxLength 150
   */
  name?: string;
  /**
   * @format date
   */
  startedOn?: string | null;
}

export interface WelfareUpdateMedicalRecordResponse {
  /**
   * @format date-time
   */
  createdAt: string;
  details: string | null;
  emergencyNotes: string | null;
  /**
   * @format date
   */
  endedOn: string | null;
  /**
   * @format uuid
   */
  id: string;
  isEmergencyRelevant: boolean;
  kind: 'condition' | 'medication' | 'disability' | 'other';
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
  personId: string;
  /**
   * @format date
   */
  startedOn: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface WelfareCreateAllergyParams {
  /**
   * @minLength 1
   * @maxLength 100
   */
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  /**
   * @maxLength 300
   */
  reaction?: string | null;
  /**
   * @maxLength 500
   */
  treatment?: string | null;
}

export interface WelfareCreateAllergyResponse {
  /**
   * @minLength 1
   */
  allergen: string;
  /**
   * @format date-time
   */
  archivedAt: string | null;
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
   * @format uuid
   */
  personId: string;
  reaction: string | null;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  treatment: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface WelfareUpdateAllergyParams {
  /**
   * @minLength 1
   * @maxLength 100
   */
  allergen?: string;
  /**
   * @maxLength 300
   */
  reaction?: string | null;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  /**
   * @maxLength 500
   */
  treatment?: string | null;
  /**
   * true when it no longer applies. It stays in the history.
   */
  archived?: boolean;
}

export interface WelfareUpdateAllergyResponse {
  /**
   * @minLength 1
   */
  allergen: string;
  /**
   * @format date-time
   */
  archivedAt: string | null;
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
   * @format uuid
   */
  personId: string;
  reaction: string | null;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  treatment: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface WelfareListIncidentsParams {
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
   * Only incidents at or after this.
   * @format date-time
   */
  from?: string;
  /**
   * Only this person.
   * @format uuid
   */
  personId?: string;
  /**
   * Only this team.
   * @format uuid
   */
  teamId?: string;
  /**
   * Only incidents before this.
   * @format date-time
   */
  to?: string;
}

export interface WelfareListIncidentsResponse {
  incidents: Array<WelfareListIncidentsResponse.Incident>;
}

export namespace WelfareListIncidentsResponse {
  export interface Incident {
    actionTaken: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @minLength 1
     */
    description: string;
    /**
     * @format uuid
     */
    firstAiderPersonId: string | null;
    followUpRequired: boolean;
    /**
     * @format uuid
     */
    id: string;
    kind: 'injury' | 'illness' | 'accident' | 'behaviour' | 'near_miss' | 'other';
    /**
     * @format date-time
     */
    occurredAt: string;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    parentsNotifiedAt: string | null;
    /**
     * @format uuid
     */
    personId: string;
    /**
     * @format uuid
     */
    reportedBy: string | null;
    severity: 'minor' | 'moderate' | 'serious';
    /**
     * @format uuid
     */
    teamId: string | null;
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

export interface WelfareCreateIncidentParams {
  /**
   * @minLength 1
   * @maxLength 4000
   */
  description: string;
  kind: 'injury' | 'illness' | 'accident' | 'behaviour' | 'near_miss' | 'other';
  /**
   * @format date-time
   */
  occurredAt: string;
  /**
   * Who it happened to.
   * @format uuid
   */
  personId: string;
  severity: 'minor' | 'moderate' | 'serious';
  /**
   * @maxLength 1000
   */
  actionTaken?: string | null;
  /**
   * @format uuid
   */
  firstAiderPersonId?: string | null;
  followUpRequired?: boolean;
  /**
   * @format date-time
   */
  parentsNotifiedAt?: string | null;
  /**
   * @format uuid
   */
  teamId?: string | null;
  /**
   * @format uuid
   */
  venueId?: string | null;
}

export interface WelfareCreateIncidentResponse {
  actionTaken: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @minLength 1
   */
  description: string;
  /**
   * @format uuid
   */
  firstAiderPersonId: string | null;
  followUpRequired: boolean;
  /**
   * @format uuid
   */
  id: string;
  kind: 'injury' | 'illness' | 'accident' | 'behaviour' | 'near_miss' | 'other';
  /**
   * @format date-time
   */
  occurredAt: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  parentsNotifiedAt: string | null;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @format uuid
   */
  reportedBy: string | null;
  severity: 'minor' | 'moderate' | 'serious';
  /**
   * @format uuid
   */
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  venueId: string | null;
}

export interface WelfareRetrieveIncidentResponse {
  actionTaken: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @minLength 1
   */
  description: string;
  /**
   * @format uuid
   */
  firstAiderPersonId: string | null;
  followUpRequired: boolean;
  /**
   * @format uuid
   */
  id: string;
  kind: 'injury' | 'illness' | 'accident' | 'behaviour' | 'near_miss' | 'other';
  /**
   * @format date-time
   */
  occurredAt: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  parentsNotifiedAt: string | null;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @format uuid
   */
  reportedBy: string | null;
  severity: 'minor' | 'moderate' | 'serious';
  /**
   * @format uuid
   */
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  venueId: string | null;
}

export interface WelfareUpdateIncidentParams {
  /**
   * @maxLength 1000
   */
  actionTaken?: string | null;
  followUpRequired?: boolean;
  /**
   * @format date-time
   */
  parentsNotifiedAt?: string | null;
}

export interface WelfareUpdateIncidentResponse {
  actionTaken: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @minLength 1
   */
  description: string;
  /**
   * @format uuid
   */
  firstAiderPersonId: string | null;
  followUpRequired: boolean;
  /**
   * @format uuid
   */
  id: string;
  kind: 'injury' | 'illness' | 'accident' | 'behaviour' | 'near_miss' | 'other';
  /**
   * @format date-time
   */
  occurredAt: string;
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  parentsNotifiedAt: string | null;
  /**
   * @format uuid
   */
  personId: string;
  /**
   * @format uuid
   */
  reportedBy: string | null;
  severity: 'minor' | 'moderate' | 'serious';
  /**
   * @format uuid
   */
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
  /**
   * @format uuid
   */
  venueId: string | null;
}

export interface WelfareListQualificationsResponse {
  qualifications: Array<WelfareListQualificationsResponse.Qualification>;
}

export namespace WelfareListQualificationsResponse {
  export interface Qualification {
    awardedBy: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
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
    kind: 'coaching' | 'refereeing' | 'first_aid' | 'other';
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format uuid
     */
    personId: string;
    reference: string | null;
    /**
     * @minLength 1
     */
    title: string;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface WelfareCreateQualificationParams {
  kind: 'coaching' | 'refereeing' | 'first_aid' | 'other';
  /**
   * @minLength 1
   * @maxLength 150
   */
  title: string;
  /**
   * @maxLength 120
   */
  awardedBy?: string | null;
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
}

export interface WelfareCreateQualificationResponse {
  awardedBy: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
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
  kind: 'coaching' | 'refereeing' | 'first_aid' | 'other';
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  reference: string | null;
  /**
   * @minLength 1
   */
  title: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface WelfareUpdateQualificationParams {
  /**
   * @maxLength 120
   */
  awardedBy?: string | null;
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
  kind?: 'coaching' | 'refereeing' | 'first_aid' | 'other';
  /**
   * @maxLength 120
   */
  reference?: string | null;
  /**
   * @minLength 1
   * @maxLength 150
   */
  title?: string;
}

export interface WelfareUpdateQualificationResponse {
  awardedBy: string | null;
  /**
   * @format date-time
   */
  createdAt: string;
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
  kind: 'coaching' | 'refereeing' | 'first_aid' | 'other';
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format uuid
   */
  personId: string;
  reference: string | null;
  /**
   * @minLength 1
   */
  title: string;
  /**
   * @format date-time
   */
  updatedAt: string;
}
export declare namespace Welfare {
  export {
    type WelfareListHealthResponse as WelfareListHealthResponse,
    type WelfareCreateMedicalRecordResponse as WelfareCreateMedicalRecordResponse,
    type WelfareUpdateMedicalRecordResponse as WelfareUpdateMedicalRecordResponse,
    type WelfareCreateAllergyResponse as WelfareCreateAllergyResponse,
    type WelfareUpdateAllergyResponse as WelfareUpdateAllergyResponse,
    type WelfareListIncidentsResponse as WelfareListIncidentsResponse,
    type WelfareCreateIncidentResponse as WelfareCreateIncidentResponse,
    type WelfareRetrieveIncidentResponse as WelfareRetrieveIncidentResponse,
    type WelfareUpdateIncidentResponse as WelfareUpdateIncidentResponse,
    type WelfareListQualificationsResponse as WelfareListQualificationsResponse,
    type WelfareCreateQualificationResponse as WelfareCreateQualificationResponse,
    type WelfareUpdateQualificationResponse as WelfareUpdateQualificationResponse,
    type WelfareCreateMedicalRecordParams as WelfareCreateMedicalRecordParams,
    type WelfareUpdateMedicalRecordParams as WelfareUpdateMedicalRecordParams,
    type WelfareCreateAllergyParams as WelfareCreateAllergyParams,
    type WelfareUpdateAllergyParams as WelfareUpdateAllergyParams,
    type WelfareListIncidentsParams as WelfareListIncidentsParams,
    type WelfareCreateIncidentParams as WelfareCreateIncidentParams,
    type WelfareUpdateIncidentParams as WelfareUpdateIncidentParams,
    type WelfareCreateQualificationParams as WelfareCreateQualificationParams,
    type WelfareUpdateQualificationParams as WelfareUpdateQualificationParams,
  };
}
