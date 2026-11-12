// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';

export class Club extends APIResource {
  /**
   * The club's name and address, legal and safeguarding details, default fees, social links and training times. Any club member can read it.
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ClubListResponse>} The club.
   *
   * @example
   * ```ts
   * const club = await client.club.list();
   * ```
   */
  list(options?: RequestOptions): APIPromise<ClubListResponse> {
    return this._client.get('/api/v1/club', options);
  }

  /**
   * Changes one section of the club: `club` (name, address, type), `location`, `governance` (legal and insurance), `schedule` (training times), `fees` or `social`. Send `{ step, data }`. Owners and admins only.
   *
   * @param {ClubSaveParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ClubSaveResponse>} The updated club.
   *
   * @example
   * ```ts
   * const club = await client.club.save({
   *   data: {
   *     affiliationNumber: 'string',
   *     clubType: 'grassroots',
   *     contactEmail: 'alex@example.com',
   *     contactPhone: 'string',
   *     countyFa: 'string',
   *     foundedYear: 1850,
   *     leagues: 'string',
   *     name: 'string',
   *     sections: ['mini-soccer'],
   *     slug: 'string',
   *     website: 'https://example.com',
   *   },
   *   step: 'club',
   * });
   * ```
   */
  save(body: ClubSaveParams, options?: RequestOptions): APIPromise<ClubSaveResponse> {
    return this._client.put('/api/v1/club', { body, ...options });
  }
}

export interface ClubListResponse {
  fees: ClubListResponse.Fees | null;
  organization: ClubListResponse.Organization;
  profile: ClubListResponse.Profile | null;
  settings: ClubListResponse.Settings | null;
  socialLinks: Array<ClubListResponse.SocialLink>;
  trainingSlots: Array<ClubListResponse.TrainingSlot>;
}

export namespace ClubListResponse {
  export interface Fees {
    absorbDirectDebitFee: boolean;
    frequency: 'monthly' | 'termly' | 'annually' | 'per-session';
    /**
     * @minimum -2147483648
     * @maximum 2147483647
     */
    joiningFeeMinor: number | null;
    /**
     * @minimum -2147483648
     * @maximum 2147483647
     */
    kitFeeMinor: number | null;
    lateReminders: boolean;
    /**
     * @minimum -2147483648
     * @maximum 2147483647
     */
    matchFeeMinor: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    siblingDiscount: boolean;
    /**
     * @minimum 0
     */
    subscriptionMinor: number;
    /**
     * @format date-time
     */
    updatedAt: string;
  }

  export interface Organization {
    /**
     * @format uuid
     */
    id: string;
    logo: string | null;
    name: string;
    slug: string;
  }

  export interface Profile {
    affiliationNumber: string | null;
    clubType: 'grassroots' | 'academy' | 'school-or-college' | 'community-or-charity' | 'other' | null;
    /**
     * @format uuid
     */
    constitutionFileId: string | null;
    copyParentsOnMessages: boolean;
    countyFa: string | null;
    /**
     * @minimum -32768
     * @maximum 32767
     */
    foundedYear: number | null;
    /**
     * @format uuid
     */
    insuranceCertificateFileId: string | null;
    insuranceExpiresOn: string | null;
    insurancePolicyNumber: string | null;
    insuranceProvider: string | null;
    leagues: string | null;
    legalStructure:
      | 'unincorporated-association'
      | 'cic'
      | 'registered-charity'
      | 'company-limited-by-guarantee'
      | 'company-limited-by-shares'
      | 'other'
      | null;
    noPrivateMessages: boolean;
    /**
     * @format uuid
     */
    organizationId: string;
    publishResults: boolean;
    registrationNumber: string | null;
    /**
     * @format uuid
     */
    safeguardingPolicyFileId: string | null;
    safeguardingPolicyReviewOn: string | null;
    /**
     * @minItems 1
     */
    sections: Array<'mini-soccer' | 'youth' | 'adult-men' | 'adult-women' | 'veterans' | 'disability'> | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    vatNumber: string | null;
    vatRegistered: boolean;
    welfareOfficerEmail: string | null;
    welfareOfficerName: string | null;
  }

  export interface Settings {
    /**
     * @format uuid
     */
    addressId: string | null;
    /**
     * @format email
     */
    contactEmail: string | null;
    contactPhone: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    homeVenueId: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @minLength 1
     */
    shortName: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uri
     */
    website: string | null;
  }

  export interface SocialLink {
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    platform: 'facebook' | 'instagram' | 'tiktok' | 'x';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uri
     */
    url: string;
  }

  export interface TrainingSlot {
    /**
     * @minimum 1
     * @maximum 7
     */
    dayOfWeek: number;
    endsAt: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    startsAt: string;
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

export type ClubSaveParams =
  | ClubSaveParams.Variant0
  | ClubSaveParams.Variant1
  | ClubSaveParams.Variant2
  | ClubSaveParams.Variant3
  | ClubSaveParams.Variant4
  | ClubSaveParams.Variant5;

export declare namespace ClubSaveParams {
  export interface Variant0 {
    data: Variant0.Data;
    step: 'club';
  }

  export namespace Variant0 {
    export interface Data {
      clubType: 'grassroots' | 'academy' | 'school-or-college' | 'community-or-charity' | 'other';
      /**
       * @minLength 1
       * @maxLength 200
       */
      name: string;
      /**
       * @minItems 1
       */
      sections: Array<'mini-soccer' | 'youth' | 'adult-men' | 'adult-women' | 'veterans' | 'disability'>;
      /**
       * @minLength 2
       * @maxLength 60
       * @pattern ^[a-z0-9]+(?:-[a-z0-9]+)*$
       */
      slug: string;
      /**
       * @maxLength 200
       */
      affiliationNumber?: string | null;
      /**
       * @format email
       */
      contactEmail?: string | null;
      /**
       * @maxLength 200
       */
      contactPhone?: string | null;
      /**
       * @maxLength 200
       */
      countyFa?: string | null;
      /**
       * @minimum 1850
       * @maximum 2026
       */
      foundedYear?: number | null;
      /**
       * @maxLength 200
       */
      leagues?: string | null;
      /**
       * @format uri
       * @maxLength 500
       */
      website?: string | null;
    }
  }

  export interface Variant1 {
    data: Variant1.Data;
    step: 'fees';
  }

  export namespace Variant1 {
    export interface Data {
      absorbDirectDebitFee: boolean;
      frequency: 'monthly' | 'termly' | 'annually' | 'per-session';
      lateReminders: boolean;
      siblingDiscount: boolean;
      /**
       * @minimum 0
       * @maximum 10000000
       */
      subscriptionMinor: number;
      /**
       * @minimum 0
       * @maximum 10000000
       */
      joiningFeeMinor?: number | null;
      /**
       * @minimum 0
       * @maximum 10000000
       */
      kitFeeMinor?: number | null;
      /**
       * @minimum 0
       * @maximum 10000000
       */
      matchFeeMinor?: number | null;
    }
  }

  export interface Variant2 {
    data: Variant2.Data;
    step: 'governance';
  }

  export namespace Variant2 {
    export interface Data {
      legalStructure:
        | 'unincorporated-association'
        | 'cic'
        | 'registered-charity'
        | 'company-limited-by-guarantee'
        | 'company-limited-by-shares'
        | 'other';
      vatRegistered: boolean;
      /**
       * @format uuid
       */
      constitutionFileId?: string | null;
      /**
       * @format uuid
       */
      insuranceCertificateFileId?: string | null;
      /**
       * @format date
       */
      insuranceExpiresOn?: string | null;
      /**
       * @maxLength 200
       */
      insurancePolicyNumber?: string | null;
      /**
       * @maxLength 200
       */
      insuranceProvider?: string | null;
      /**
       * @maxLength 200
       */
      registrationNumber?: string | null;
      /**
       * @format uuid
       */
      safeguardingPolicyFileId?: string | null;
      /**
       * @format date
       */
      safeguardingPolicyReviewOn?: string | null;
      /**
       * @maxLength 200
       */
      vatNumber?: string | null;
      /**
       * @format email
       */
      welfareOfficerEmail?: string | null;
      /**
       * @maxLength 200
       */
      welfareOfficerName?: string | null;
    }
  }

  export interface Variant3 {
    data: Variant3.Data;
    step: 'location';
  }

  export namespace Variant3 {
    export interface Data {
      /**
       * @minLength 1
       * @maxLength 200
       */
      city: string;
      /**
       * @pattern ^[A-Z]{2}$
       */
      countryCode: string;
      /**
       * @minLength 1
       * @maxLength 200
       */
      line1: string;
      /**
       * @minLength 1
       * @maxLength 200
       */
      venueName: string;
      /**
       * @maxLength 200
       */
      directions?: string | null;
      /**
       * @maxLength 200
       */
      line2?: string | null;
      /**
       * @maxLength 200
       */
      postalCode?: string | null;
      /**
       * @maxLength 200
       */
      region?: string | null;
    }
  }

  export interface Variant4 {
    data: Variant4.Data;
    step: 'schedule';
  }

  export namespace Variant4 {
    export interface Data {
      /**
       * @maxItems 28
       */
      slots: Array<Data.Slot>;
    }

    export namespace Data {
      export interface Slot {
        /**
         * @minimum 1
         * @maximum 7
         */
        dayOfWeek: number;
        /**
         * @pattern ^(?:[01]\d|2[0-3]):[0-5]\d$
         */
        endsAt: string;
        /**
         * @pattern ^(?:[01]\d|2[0-3]):[0-5]\d$
         */
        startsAt: string;
      }
    }
  }

  export interface Variant5 {
    data: Variant5.Data;
    step: 'social';
  }

  export namespace Variant5 {
    export interface Data {
      copyParentsOnMessages: boolean;
      /**
       * @maxItems 4
       */
      links: Array<Data.Link>;
      noPrivateMessages: boolean;
      publishResults: boolean;
    }

    export namespace Data {
      export interface Link {
        platform: 'facebook' | 'instagram' | 'tiktok' | 'x';
        /**
         * @format uri
         * @maxLength 500
         */
        url: string;
      }
    }
  }
}

export interface ClubSaveResponse {
  fees: ClubSaveResponse.Fees | null;
  organization: ClubSaveResponse.Organization;
  profile: ClubSaveResponse.Profile | null;
  settings: ClubSaveResponse.Settings | null;
  socialLinks: Array<ClubSaveResponse.SocialLink>;
  trainingSlots: Array<ClubSaveResponse.TrainingSlot>;
}

export namespace ClubSaveResponse {
  export interface Fees {
    absorbDirectDebitFee: boolean;
    frequency: 'monthly' | 'termly' | 'annually' | 'per-session';
    /**
     * @minimum -2147483648
     * @maximum 2147483647
     */
    joiningFeeMinor: number | null;
    /**
     * @minimum -2147483648
     * @maximum 2147483647
     */
    kitFeeMinor: number | null;
    lateReminders: boolean;
    /**
     * @minimum -2147483648
     * @maximum 2147483647
     */
    matchFeeMinor: number | null;
    /**
     * @format uuid
     */
    organizationId: string;
    siblingDiscount: boolean;
    /**
     * @minimum 0
     */
    subscriptionMinor: number;
    /**
     * @format date-time
     */
    updatedAt: string;
  }

  export interface Organization {
    /**
     * @format uuid
     */
    id: string;
    logo: string | null;
    name: string;
    slug: string;
  }

  export interface Profile {
    affiliationNumber: string | null;
    clubType: 'grassroots' | 'academy' | 'school-or-college' | 'community-or-charity' | 'other' | null;
    /**
     * @format uuid
     */
    constitutionFileId: string | null;
    copyParentsOnMessages: boolean;
    countyFa: string | null;
    /**
     * @minimum -32768
     * @maximum 32767
     */
    foundedYear: number | null;
    /**
     * @format uuid
     */
    insuranceCertificateFileId: string | null;
    insuranceExpiresOn: string | null;
    insurancePolicyNumber: string | null;
    insuranceProvider: string | null;
    leagues: string | null;
    legalStructure:
      | 'unincorporated-association'
      | 'cic'
      | 'registered-charity'
      | 'company-limited-by-guarantee'
      | 'company-limited-by-shares'
      | 'other'
      | null;
    noPrivateMessages: boolean;
    /**
     * @format uuid
     */
    organizationId: string;
    publishResults: boolean;
    registrationNumber: string | null;
    /**
     * @format uuid
     */
    safeguardingPolicyFileId: string | null;
    safeguardingPolicyReviewOn: string | null;
    /**
     * @minItems 1
     */
    sections: Array<'mini-soccer' | 'youth' | 'adult-men' | 'adult-women' | 'veterans' | 'disability'> | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    vatNumber: string | null;
    vatRegistered: boolean;
    welfareOfficerEmail: string | null;
    welfareOfficerName: string | null;
  }

  export interface Settings {
    /**
     * @format uuid
     */
    addressId: string | null;
    /**
     * @format email
     */
    contactEmail: string | null;
    contactPhone: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    homeVenueId: string | null;
    /**
     * @format uuid
     */
    organizationId: string;
    /**
     * @minLength 1
     */
    shortName: string | null;
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uri
     */
    website: string | null;
  }

  export interface SocialLink {
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    platform: 'facebook' | 'instagram' | 'tiktok' | 'x';
    /**
     * @format date-time
     */
    updatedAt: string;
    /**
     * @format uri
     */
    url: string;
  }

  export interface TrainingSlot {
    /**
     * @minimum 1
     * @maximum 7
     */
    dayOfWeek: number;
    endsAt: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    organizationId: string;
    startsAt: string;
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
export declare namespace Club {
  export {
    type ClubListResponse as ClubListResponse,
    type ClubSaveResponse as ClubSaveResponse,
    type ClubSaveParams as ClubSaveParams,
  };
}
