// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';
import { path as __scalarPath } from '../internal/utils/path';

export class Files extends APIResource {
  /**
   * Records a pending file and returns a presigned URL. The client PUTs the bytes there with exactly the returned uploadHeaders, then calls confirm. Sensitive files must declare checksumSha256 (SHA-256 as 64 lower-case hex characters).
   *
   * @param {FileCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileCreateResponse>} The pending file, where to upload it, and the headers the PUT must carry.
   *
   * @example
   * ```ts
   * const file = await client.files.create({
   *   checksumSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
   *   contentType: 'string',
   *   fileName: 'string',
   *   kind: 'photo',
   *   sizeBytes: 1,
   * });
   * ```
   */
  create(body: FileCreateParams, options?: RequestOptions): APIPromise<FileCreateResponse> {
    return this._client.post('/api/v1/files', { body, ...options });
  }

  /**
   * Uploaded files for the active organization, newest first.
   *
   * @param {FileListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileListResponse>} The organization's files.
   *
   * @example
   * ```ts
   * const file = await client.files.list();
   * ```
   */
  list(
    query: FileListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<FileListResponse> {
    return this._client.get('/api/v1/files', { query, ...options });
  }

  /**
   * Checks the object arrived with the declared size. Safe to call twice.
   *
   * @param {string} id - The file's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileConfirmResponse>} The uploaded file.
   *
   * @example
   * ```ts
   * const file = await client.files.confirm('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  confirm(id: string, options?: RequestOptions): APIPromise<FileConfirmResponse> {
    return this._client.post(__scalarPath`/api/v1/files/${id}/confirm`, options);
  }

  /**
   * Returns a presigned download URL and records who asked for it and when.
   *
   * @param {string} id - The file's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileListDownloadURLResponse>} A time-limited download URL.
   *
   * @example
   * ```ts
   * const file = await client.files.listDownloadURL('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listDownloadURL(id: string, options?: RequestOptions): APIPromise<FileListDownloadURLResponse> {
    return this._client.get(__scalarPath`/api/v1/files/${id}/url`, options);
  }

  /**
   * Who was given access to a file and when, newest first.
   *
   * @param {string} id - The file's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileListViewsResponse>} The file's views.
   *
   * @example
   * ```ts
   * const file = await client.files.listViews('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  listViews(id: string, options?: RequestOptions): APIPromise<FileListViewsResponse> {
    return this._client.get(__scalarPath`/api/v1/files/${id}/views`, options);
  }

  /**
   * Deletes the object, then the row.
   *
   * @param {string} id - The file's id.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns The file was deleted.
   *
   * @example
   * ```ts
   * await client.files.delete('3fa85f64-5717-4562-b3fc-2c963f66afa6');
   * ```
   */
  delete(id: string, options?: RequestOptions): APIPromise<void> {
    return this._client.delete(__scalarPath`/api/v1/files/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
  }
}

export interface FileCreateParams {
  /**
   * @minLength 1
   */
  contentType: string;
  /**
   * @minLength 1
   * @maxLength 255
   */
  fileName: string;
  kind: 'photo' | 'report' | 'sensitive' | 'other';
  /**
   * @exclusiveMinimum 0
   */
  sizeBytes: number;
  /**
   * @pattern ^[0-9a-f]{64}$
   */
  checksumSha256?: string | null;
}

export interface FileCreateResponse {
  file: FileCreateResponse.File;
  uploadHeaders: Record<string, string>;
  uploadUrl: string;
}

export namespace FileCreateResponse {
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
}

export interface FileListParams {
  /**
   * Only return files of this kind.
   */
  kind?: 'photo' | 'report' | 'sensitive' | 'other';
}

export interface FileListResponse {
  files: Array<FileListResponse.File>;
}

export namespace FileListResponse {
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
}

export interface FileConfirmResponse {
  file: FileConfirmResponse.File;
}

export namespace FileConfirmResponse {
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
}

export interface FileListDownloadURLResponse {
  url: string;
}

export interface FileListViewsResponse {
  views: Array<FileListViewsResponse.View>;
}

export namespace FileListViewsResponse {
  export interface View {
    /**
     * @format uuid
     */
    fileId: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format date-time
     */
    viewedAt: string;
    /**
     * @format uuid
     */
    viewedBy: string | null;
  }
}
export declare namespace Files {
  export {
    type FileCreateResponse as FileCreateResponse,
    type FileListResponse as FileListResponse,
    type FileConfirmResponse as FileConfirmResponse,
    type FileListDownloadURLResponse as FileListDownloadURLResponse,
    type FileListViewsResponse as FileListViewsResponse,
    type FileCreateParams as FileCreateParams,
    type FileListParams as FileListParams,
  };
}
