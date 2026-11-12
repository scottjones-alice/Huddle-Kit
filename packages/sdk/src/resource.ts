// File generated from our OpenAPI spec by Scalar. See README.md for details.

import type { HuddlekitAPI } from './client';

export abstract class APIResource {
  protected _client: HuddlekitAPI;

  constructor(client: HuddlekitAPI) {
    this._client = client;
  }
}
