// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Fees extends APIResource {
  /**
   * The club's fee schedule. Everyone in the club can see it.
   *
   * @param {FeeListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeListResponse>} The fees.
   *
   * @example
   * ```ts
   * const fee = await client.fees.list({
   *   includeArchived: 'false',
   * });
   * ```
   */
  list(query: FeeListParams | null | undefined = {}, options?: RequestOptions): APIPromise<FeeListResponse> {
    return this._client.get('/api/v1/fees', { query, ...options });
  }

  /**
   * Adds a fee, such as subs or kit. Club admins and the treasurer only. Nobody owes it until they are charged.
   *
   * @param {FeeCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeCreateResponse>} The new fee.
   *
   * @example
   * ```ts
   * const fee = await client.fees.create({
   *   amountMinor: 1,
   *   currency: 'string',
   *   description: 'string',
   *   dueOn: '2026-01-15',
   *   name: 'string',
   *   seasonId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  create(body: FeeCreateParams, options?: RequestOptions): APIPromise<FeeCreateResponse> {
    return this._client.post('/api/v1/fees', { body, ...options });
  }

  /**
   * Changes or archives a fee. Charges already made keep the amount they were made with.
   *
   * @param {string} id - The fee's id.
   * @param {FeeUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeUpdateResponse>} The updated fee.
   *
   * @example
   * ```ts
   * const fee = await client.fees.update('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   amountMinor: 1,
   *   currency: 'string',
   *   description: 'string',
   *   dueOn: '2026-01-15',
   *   name: 'string',
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   *   isActive: true,
   * });
   * ```
   */
  update(id: string, body: FeeUpdateParams, options?: RequestOptions): APIPromise<FeeUpdateResponse> {
    return this._client.patch(__scalarPath`/api/v1/fees/${id}`, { body, ...options });
  }

  /**
   * Charges people for this fee. Name the people, or leave them out to charge every player on the fee's team. Anyone already charged is skipped.
   *
   * @param {string} id - The fee's id.
   * @param {FeeChargePeopleParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeChargePeopleResponse>} How many new charges were made.
   *
   * @example
   * ```ts
   * const fee = await client.fees.chargePeople('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   personIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
   * });
   * ```
   */
  chargePeople(
    id: string,
    body: FeeChargePeopleParams,
    options?: RequestOptions,
  ): APIPromise<FeeChargePeopleResponse> {
    return this._client.post(__scalarPath`/api/v1/fees/${id}/charges`, { body, ...options });
  }

  /**
   * The treasurer and club admins see every charge. Everyone else sees their own and their children's.
   *
   * @param {FeeListChargesParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeListChargesResponse>} The charges, newest first.
   *
   * @example
   * ```ts
   * const fee = await client.fees.listCharges({
   *   limit: 50,
   *   offset: 0,
   * });
   * ```
   */
  listCharges(
    query: FeeListChargesParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<FeeListChargesResponse> {
    return this._client.get('/api/v1/charges', { query, ...options });
  }

  /**
   * List payments on a charge
   *
   * @param {string} id - The charge's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeListChargePaymentsResponse>} The payments so far.
   *
   * @example
   * ```ts
   * const fee = await client.fees.listChargePayments('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listChargePayments(id: string, options?: RequestOptions): APIPromise<FeeListChargePaymentsResponse> {
    return this._client.get(__scalarPath`/api/v1/charges/${id}/payments`, options);
  }

  /**
   * Records cash, a bank transfer or a cheque. Card payments are recorded by Stripe, not by hand. A payment that would pay too much is refused, and payments are never edited or deleted.
   *
   * @param {string} id - The charge's id.
   * @param {FeeRecordPaymentParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeRecordPaymentResponse>} The recorded payment.
   *
   * @example
   * ```ts
   * const fee = await client.fees.recordPayment('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   amountMinor: 1,
   *   method: 'cash',
   *   receivedAt: '2026-01-15T09:30:00.000Z',
   *   reference: 'string',
   * });
   * ```
   */
  recordPayment(
    id: string,
    body: FeeRecordPaymentParams,
    options?: RequestOptions,
  ): APIPromise<FeeRecordPaymentResponse> {
    return this._client.post(__scalarPath`/api/v1/charges/${id}/payments`, { body, ...options });
  }

  /**
   * Waives a charge for hardship (a reason is required) or cancels one made by mistake. The charge stays on record.
   *
   * @param {string} id - The charge's id.
   * @param {FeeCloseChargeParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FeeCloseChargeResponse>} The updated charge.
   *
   * @example
   * ```ts
   * const fee = await client.fees.closeCharge('3fa85f64-5717-4562-b3fc-2c963f66afa6', {
   *   reason: 'string',
   *   status: 'waived',
   * });
   * ```
   */
  closeCharge(
    id: string,
    body: FeeCloseChargeParams,
    options?: RequestOptions,
  ): APIPromise<FeeCloseChargeResponse> {
    return this._client.post(__scalarPath`/api/v1/charges/${id}/close`, { body, ...options });
  }
}

export interface FeeListParams {
  /**
   * Also return archived records.
   * @default false
   */
  includeArchived?: 'true' | 'false';
  /**
   * Only this season's fees.
   * @format uuid
   */
  seasonId?: string;
}

export interface FeeListResponse {
  fees: Array<FeeListResponse.Fee>;
}

export namespace FeeListResponse {
  export interface Fee {
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    amountMinor: number;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @pattern ^[A-Z]{3}$
     */
    currency: string;
    description: string | null;
    /**
     * @format date
     */
    dueOn: string | null;
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
    teamId: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
  }
}

export interface FeeCreateParams {
  /**
   * Whole pence or cents: 2500 is 25.00.
   * @minimum 0
   * @maximum 10000000
   */
  amountMinor: number;
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string;
  /**
   * @format uuid
   */
  seasonId: string;
  /**
   * Three capital letters, such as GBP. Defaults to GBP.
   * @pattern ^[A-Z]{3}$
   */
  currency?: string;
  /**
   * @maxLength 500
   */
  description?: string | null;
  /**
   * @format date
   */
  dueOn?: string | null;
  /**
   * Leave out to charge the whole club.
   * @format uuid
   */
  teamId?: string | null;
}

export interface FeeCreateResponse {
  /**
   * @minimum 0
   * @maximum 2147483647
   */
  amountMinor: number;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @pattern ^[A-Z]{3}$
   */
  currency: string;
  description: string | null;
  /**
   * @format date
   */
  dueOn: string | null;
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
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface FeeUpdateParams {
  /**
   * Whole pence or cents: 2500 is 25.00.
   * @minimum 0
   * @maximum 10000000
   */
  amountMinor?: number;
  /**
   * Three capital letters, such as GBP. Defaults to GBP.
   * @pattern ^[A-Z]{3}$
   */
  currency?: string;
  /**
   * @maxLength 500
   */
  description?: string | null;
  /**
   * @format date
   */
  dueOn?: string | null;
  /**
   * @minLength 1
   * @maxLength 120
   */
  name?: string;
  /**
   * Leave out to charge the whole club.
   * @format uuid
   */
  teamId?: string | null;
  /**
   * false archives the fee. Charges already made stay.
   */
  isActive?: boolean;
}

export interface FeeUpdateResponse {
  /**
   * @minimum 0
   * @maximum 2147483647
   */
  amountMinor: number;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @pattern ^[A-Z]{3}$
   */
  currency: string;
  description: string | null;
  /**
   * @format date
   */
  dueOn: string | null;
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
  teamId: string | null;
  /**
   * @format date-time
   */
  updatedAt: string;
}

export interface FeeChargePeopleParams {
  /**
   * @minItems 1
   * @maxItems 500
   */
  personIds?: Array<string>;
}

export interface FeeChargePeopleResponse {
  created: number;
}

export interface FeeListChargesParams {
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
   * Only charges for this fee.
   * @format uuid
   */
  feeId?: string;
  /**
   * Only this person's charges.
   * @format uuid
   */
  personId?: string;
  /**
   * Only this status.
   */
  status?: 'due' | 'paid' | 'waived' | 'cancelled';
}

export interface FeeListChargesResponse {
  charges: Array<FeeListChargesResponse.Charge>;
}

export namespace FeeListChargesResponse {
  export interface Charge {
    charge: Charge.Charge;
    /**
     * How much has been paid so far.
     */
    paidMinor: number;
  }

  export namespace Charge {
    export interface Charge {
      /**
       * @minimum 0
       * @maximum 2147483647
       */
      amountMinor: number;
      /**
       * @format date-time
       */
      createdAt: string;
      /**
       * @pattern ^[A-Z]{3}$
       */
      currency: string;
      /**
       * @format date
       */
      dueOn: string | null;
      /**
       * @format uuid
       */
      feeId: string;
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
      status: 'due' | 'paid' | 'waived' | 'cancelled';
      /**
       * @format date-time
       */
      updatedAt: string;
      waivedReason: string | null;
    }
  }
}

export interface FeeListChargePaymentsResponse {
  payments: Array<FeeListChargePaymentsResponse.Payment>;
}

export namespace FeeListChargePaymentsResponse {
  export interface Payment {
    /**
     * @minimum 1
     * @maximum 2147483647
     */
    amountMinor: number;
    /**
     * @format uuid
     */
    chargeId: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @pattern ^[A-Z]{3}$
     */
    currency: string;
    /**
     * @format uuid
     */
    id: string;
    method: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @format date-time
     */
    receivedAt: string;
    /**
     * @format uuid
     */
    recordedByUserId: string | null;
    reference: string | null;
  }
}

export interface FeeRecordPaymentParams {
  /**
   * Whole pence or cents: 2500 is 25.00.
   * @minimum 1
   * @maximum 10000000
   */
  amountMinor: number;
  method: 'cash' | 'bank_transfer' | 'cheque' | 'other';
  /**
   * @format date-time
   */
  receivedAt?: string;
  /**
   * @maxLength 120
   */
  reference?: string | null;
}

export interface FeeRecordPaymentResponse {
  /**
   * @minimum 1
   * @maximum 2147483647
   */
  amountMinor: number;
  /**
   * @format uuid
   */
  chargeId: string;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @pattern ^[A-Z]{3}$
   */
  currency: string;
  /**
   * @format uuid
   */
  id: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
  /**
   * @format uuid
   */
  organizationId: string;
  /**
   * @format date-time
   */
  receivedAt: string;
  /**
   * @format uuid
   */
  recordedByUserId: string | null;
  reference: string | null;
}

export interface FeeCloseChargeParams {
  status: 'waived' | 'cancelled';
  /**
   * @maxLength 500
   */
  reason?: string;
}

export interface FeeCloseChargeResponse {
  /**
   * @minimum 0
   * @maximum 2147483647
   */
  amountMinor: number;
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @pattern ^[A-Z]{3}$
   */
  currency: string;
  /**
   * @format date
   */
  dueOn: string | null;
  /**
   * @format uuid
   */
  feeId: string;
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
  status: 'due' | 'paid' | 'waived' | 'cancelled';
  /**
   * @format date-time
   */
  updatedAt: string;
  waivedReason: string | null;
}
export declare namespace Fees {
  export {
    type FeeListResponse as FeeListResponse,
    type FeeCreateResponse as FeeCreateResponse,
    type FeeUpdateResponse as FeeUpdateResponse,
    type FeeChargePeopleResponse as FeeChargePeopleResponse,
    type FeeListChargesResponse as FeeListChargesResponse,
    type FeeListChargePaymentsResponse as FeeListChargePaymentsResponse,
    type FeeRecordPaymentResponse as FeeRecordPaymentResponse,
    type FeeCloseChargeResponse as FeeCloseChargeResponse,
    type FeeListParams as FeeListParams,
    type FeeCreateParams as FeeCreateParams,
    type FeeUpdateParams as FeeUpdateParams,
    type FeeChargePeopleParams as FeeChargePeopleParams,
    type FeeListChargesParams as FeeListChargesParams,
    type FeeRecordPaymentParams as FeeRecordPaymentParams,
    type FeeCloseChargeParams as FeeCloseChargeParams,
  };
}
