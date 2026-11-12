// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Payments extends APIResource {
  /**
   * Whether the club can take card payments from its members. Reads the live status from Stripe.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PaymentListConnectAccountResponse>} The club's card payment status.
   *
   * @example
   * ```ts
   * const payment = await client.payments.listConnectAccount();
   * ```
   */
  listConnectAccount(options?: RequestOptions): APIPromise<PaymentListConnectAccountResponse> {
    return this._client.get('/api/v1/payments/connect/account', options);
  }

  /**
   * Creates the club's Stripe account the first time, then returns a single-use Stripe-hosted onboarding link. Call again for a fresh link.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PaymentStartConnectOnboardingResponse>} Where to send the user to set up card payments.
   *
   * @example
   * ```ts
   * const payment = await client.payments.startConnectOnboarding();
   * ```
   */
  startConnectOnboarding(options?: RequestOptions): APIPromise<PaymentStartConnectOnboardingResponse> {
    return this._client.post('/api/v1/payments/connect/onboarding', options);
  }

  /**
   * Returns a Stripe Checkout page for the amount still owed on a fee charge. The money goes to the club's own Stripe account.
   *
   * @param {string} id - The fee charge's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PaymentCreateChargeCheckoutResponse>} Where to send the payer.
   *
   * @example
   * ```ts
   * const payment = await client.payments.createChargeCheckout('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  createChargeCheckout(
    id: string,
    options?: RequestOptions,
  ): APIPromise<PaymentCreateChargeCheckoutResponse> {
    return this._client.post(__scalarPath`/api/v1/payments/connect/charges/${id}/checkout`, options);
  }
}

export interface PaymentListConnectAccountResponse {
  status: 'not_connected' | 'pending' | 'active' | 'restricted' | 'unsupported';
}

export interface PaymentStartConnectOnboardingResponse {
  /**
   * @format uri
   */
  url: string;
}

export interface PaymentCreateChargeCheckoutResponse {
  /**
   * @format uri
   */
  url: string;
}
export declare namespace Payments {
  export {
    type PaymentListConnectAccountResponse as PaymentListConnectAccountResponse,
    type PaymentStartConnectOnboardingResponse as PaymentStartConnectOnboardingResponse,
    type PaymentCreateChargeCheckoutResponse as PaymentCreateChargeCheckoutResponse,
  };
}
