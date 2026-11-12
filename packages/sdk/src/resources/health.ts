// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';

export class Health extends APIResource {
  /**
   * Checks every dependency (database, storage, email, worker, novu). Responds 503 when a critical one is down.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<HealthListAPIRootResponse>} The API is up. Status is ok or degraded.
   *
   * @example
   * ```ts
   * const health = await client.health.listAPIRoot();
   * ```
   */
  listAPIRoot(options?: RequestOptions): APIPromise<HealthListAPIRootResponse> {
    return this._client.get('/api/v1', options);
  }
}

export interface HealthListAPIRootResponse {
  checks: Record<string, HealthListAPIRootResponse.Checks>;
  name: string;
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  /**
   * @minimum 0
   */
  uptimeSeconds: number;
  version: string;
}

export namespace HealthListAPIRootResponse {
  export interface Checks {
    status: 'up' | 'down' | 'not_configured';
    error?: 'timeout' | 'unavailable';
    /**
     * @minimum 0
     */
    latencyMs?: number;
  }
}
export declare namespace Health {
  export { type HealthListAPIRootResponse as HealthListAPIRootResponse };
}
