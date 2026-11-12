// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';
import { path as __scalarPath } from '../internal/utils/path';

export class Onboarding extends APIResource {
  /**
   * Onboarding progress for the signed-in user and active club.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OnboardingListResponse>} Progress.
   *
   * @example
   * ```ts
   * const onboarding = await client.onboarding.list();
   * ```
   */
  list(options?: RequestOptions): APIPromise<OnboardingListResponse> {
    return this._client.get('/api/v1/onboarding', options);
  }

  /**
   * Saves one people-wizard step for the signed-in person and their own children, and marks it done. `you`, `emergency` and `safeguarding` (the club founder's steps) save the same data as `details`, `safety` and `dbs`.
   *
   * @param {"role" | "details" | "address" | "safety" | "dbs" | "availability" | "children" | "permissions" | "billing" | "social" | "you" | "emergency" | "safeguarding"} step - Which member setup step to save.
   * @param {OnboardingSaveMemberStepParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OnboardingSaveMemberStepResponse>} Progress.
   *
   * @example
   * ```ts
   * const onboarding = await client.onboarding.saveMemberStep('role', {});
   * ```
   */
  saveMemberStep(
    step:
      | 'role'
      | 'details'
      | 'address'
      | 'safety'
      | 'dbs'
      | 'availability'
      | 'children'
      | 'permissions'
      | 'billing'
      | 'social'
      | 'you'
      | 'emergency'
      | 'safeguarding',
    body: OnboardingSaveMemberStepParams,
    options?: RequestOptions,
  ): APIPromise<OnboardingSaveMemberStepResponse> {
    return this._client.put(__scalarPath`/api/v1/onboarding/member/${step}`, { body, ...options });
  }

  /**
   * Saves one club wizard step (club, location, governance, schedule, fees or social) and marks it done. The body is that step's fields. Owners and admins only.
   *
   * @param {"club" | "location" | "governance" | "schedule" | "fees" | "social"} step - Which club setup step to save.
   * @param {OnboardingSaveClubStepParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OnboardingSaveClubStepResponse>} Progress.
   *
   * @example
   * ```ts
   * const onboarding = await client.onboarding.saveClubStep('club', {});
   * ```
   */
  saveClubStep(
    step: 'club' | 'location' | 'governance' | 'schedule' | 'fees' | 'social',
    body: OnboardingSaveClubStepParams,
    options?: RequestOptions,
  ): APIPromise<OnboardingSaveClubStepResponse> {
    return this._client.put(__scalarPath`/api/v1/onboarding/club/${step}`, { body, ...options });
  }

  /**
   * The saved draft for a flow, or 404 when there is none.
   *
   * @param {"club" | "people"} flow - Which wizard: the club one or the people one.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OnboardingRetrieveDraftResponse>} The draft.
   *
   * @example
   * ```ts
   * const onboarding = await client.onboarding.retrieveDraft('club');
   * ```
   */
  retrieveDraft(
    flow: 'club' | 'people',
    options?: RequestOptions,
  ): APIPromise<OnboardingRetrieveDraftResponse> {
    return this._client.get(__scalarPath`/api/v1/onboarding/draft/${flow}`, options);
  }

  /**
   * Saves the form so far, encrypted. Replaces any earlier draft for the flow.
   *
   * @param {"club" | "people"} flow - Which wizard: the club one or the people one.
   * @param {OnboardingSaveDraftParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<OnboardingSaveDraftResponse>} The saved draft.
   *
   * @example
   * ```ts
   * const onboarding = await client.onboarding.saveDraft('club', { data: { key: {} }, stepId: 'string' });
   * ```
   */
  saveDraft(
    flow: 'club' | 'people',
    body: OnboardingSaveDraftParams,
    options?: RequestOptions,
  ): APIPromise<OnboardingSaveDraftResponse> {
    return this._client.put(__scalarPath`/api/v1/onboarding/draft/${flow}`, { body, ...options });
  }

  /**
   * Call when a wizard is finished. Removes the saved draft, which also stops the 'finish your setup' reminder emails. The answers themselves were already saved step by step.
   *
   * @param {"club" | "people"} flow - Which wizard: the club one or the people one.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns The draft is gone.
   *
   * @example
   * ```ts
   * await client.onboarding.finishDraft('club');
   * ```
   */
  finishDraft(flow: 'club' | 'people', options?: RequestOptions): APIPromise<void> {
    return this._client.delete(__scalarPath`/api/v1/onboarding/draft/${flow}`, {
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
  }
}

export interface OnboardingListResponse {
  organization: OnboardingListResponse.Organization;
  user: OnboardingListResponse.User;
}

export namespace OnboardingListResponse {
  export interface Organization {
    completed: Array<string>;
    next: string | null;
    steps: Array<string>;
  }

  export interface User {
    completed: Array<string>;
    next: string | null;
    steps: Array<string>;
  }
}

export type OnboardingSaveMemberStepParams = Record<string, unknown>;

export interface OnboardingSaveMemberStepResponse {
  completed: Array<string>;
  next: string | null;
  steps: Array<string>;
}

export type OnboardingSaveClubStepParams = Record<string, unknown>;

export interface OnboardingSaveClubStepResponse {
  completed: Array<string>;
  next: string | null;
  steps: Array<string>;
}

export interface OnboardingRetrieveDraftResponse {
  data: Record<string, unknown>;
  /**
   * @minLength 1
   * @maxLength 64
   */
  stepId: string;
  updatedAt: string;
}

export interface OnboardingSaveDraftParams {
  data: Record<string, unknown>;
  /**
   * @minLength 1
   * @maxLength 64
   */
  stepId: string;
}

export interface OnboardingSaveDraftResponse {
  data: Record<string, unknown>;
  /**
   * @minLength 1
   * @maxLength 64
   */
  stepId: string;
  updatedAt: string;
}
export declare namespace Onboarding {
  export {
    type OnboardingListResponse as OnboardingListResponse,
    type OnboardingSaveMemberStepResponse as OnboardingSaveMemberStepResponse,
    type OnboardingSaveClubStepResponse as OnboardingSaveClubStepResponse,
    type OnboardingRetrieveDraftResponse as OnboardingRetrieveDraftResponse,
    type OnboardingSaveDraftResponse as OnboardingSaveDraftResponse,
    type OnboardingSaveMemberStepParams as OnboardingSaveMemberStepParams,
    type OnboardingSaveClubStepParams as OnboardingSaveClubStepParams,
    type OnboardingSaveDraftParams as OnboardingSaveDraftParams,
  };
}
