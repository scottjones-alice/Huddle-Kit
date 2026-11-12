// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';

export class Reports extends APIResource {
  /**
   * Club admins only. Contains no safeguarding or health information.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ReportListClubSummaryResponse>} The summary.
   *
   * @example
   * ```ts
   * const report = await client.reports.listClubSummary();
   * ```
   */
  listClubSummary(options?: RequestOptions): APIPromise<ReportListClubSummaryResponse> {
    return this._client.get('/api/v1/reports/club-summary', options);
  }

  /**
   * Per fee: charged, paid, waived and outstanding. Club admins and the treasurer only.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ReportListFinanceSummaryResponse>} One row per fee.
   *
   * @example
   * ```ts
   * const report = await client.reports.listFinanceSummary();
   * ```
   */
  listFinanceSummary(options?: RequestOptions): APIPromise<ReportListFinanceSummaryResponse> {
    return this._client.get('/api/v1/reports/finance', options);
  }

  /**
   * How often each person turned up to a team's events. Coaches of the team and club admins only.
   *
   * @param {ReportListAttendanceSummaryParams} query - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ReportListAttendanceSummaryResponse>} One row per person.
   *
   * @example
   * ```ts
   * const report = await client.reports.listAttendanceSummary({
   *   teamId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
   * });
   * ```
   */
  listAttendanceSummary(
    query: ReportListAttendanceSummaryParams,
    options?: RequestOptions,
  ): APIPromise<ReportListAttendanceSummaryResponse> {
    return this._client.get('/api/v1/reports/attendance', { query, ...options });
  }
}

export interface ReportListClubSummaryResponse {
  activePeople: number;
  activeTeams: number;
  /**
   * Waiting for an admin to accept.
   */
  pendingRegistrations: number;
  /**
   * Scheduled and still to come.
   */
  upcomingEvents: number;
}

export interface ReportListFinanceSummaryResponse {
  fees: Array<ReportListFinanceSummaryResponse.Fee>;
}

export namespace ReportListFinanceSummaryResponse {
  export interface Fee {
    /**
     * Total charged, in pence or cents, not counting cancelled charges.
     */
    charged: number;
    /**
     * How many charges were made.
     */
    charges: number;
    currency: string;
    /**
     * @format uuid
     */
    feeId: string;
    name: string;
    /**
     * Still owed: charged, less waived, less paid.
     */
    outstanding: number;
    /**
     * Money received so far.
     */
    paid: number;
    /**
     * Written off for hardship.
     */
    waived: number;
  }
}

export interface ReportListAttendanceSummaryParams {
  /**
   * Only events at or after this.
   * @format date-time
   */
  from?: string;
  /**
   * The team.
   * @format uuid
   */
  teamId: string;
  /**
   * Only events before this.
   * @format date-time
   */
  to?: string;
}

export interface ReportListAttendanceSummaryResponse {
  people: Array<ReportListAttendanceSummaryResponse.People>;
}

export namespace ReportListAttendanceSummaryResponse {
  export interface People {
    absent: number;
    excused: number;
    firstName: string;
    lastName: string;
    late: number;
    /**
     * @format uuid
     */
    personId: string;
    present: number;
  }
}
export declare namespace Reports {
  export {
    type ReportListClubSummaryResponse as ReportListClubSummaryResponse,
    type ReportListFinanceSummaryResponse as ReportListFinanceSummaryResponse,
    type ReportListAttendanceSummaryResponse as ReportListAttendanceSummaryResponse,
    type ReportListAttendanceSummaryParams as ReportListAttendanceSummaryParams,
  };
}
