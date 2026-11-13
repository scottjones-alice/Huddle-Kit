import { z } from "zod";

import type { AddressValues } from "@/lib/address";

/** One line of an address search, as shown in the list of suggestions. */
export interface AddressSuggestion {
  id: string;
  text: string;
}

const suggestionsSchema = z.object({
  enabled: z.boolean(),
  suggestions: z.array(z.object({ id: z.string(), text: z.string() })),
});

const detailsSchema = z.object({
  address: z.object({
    city: z.string(),
    county: z.string(),
    line1: z.string(),
    line2: z.string(),
    postcode: z.string(),
  }),
});

export interface SuggestionResult {
  // False when no address search is set up, so the form hides the search box.
  enabled: boolean;
  suggestions: AddressSuggestion[];
}

const NOT_AVAILABLE: SuggestionResult = { enabled: false, suggestions: [] };

/** Addresses matching what was typed. Quietly empty when the search is not available. */
export const searchAddresses = async (
  query: string,
  signal?: AbortSignal
): Promise<SuggestionResult> => {
  try {
    const response = await fetch(
      `/api/address/search?q=${encodeURIComponent(query)}`,
      { signal }
    );
    if (!response.ok) {
      return NOT_AVAILABLE;
    }
    const parsed = suggestionsSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : NOT_AVAILABLE;
  } catch {
    return NOT_AVAILABLE;
  }
};

/** The address parts for a chosen suggestion, or null when they can't be found. */
export const addressForSuggestion = async (
  id: string
): Promise<Partial<AddressValues> | null> => {
  try {
    const response = await fetch(
      `/api/address/details?id=${encodeURIComponent(id)}`
    );
    if (!response.ok) {
      return null;
    }
    const parsed = detailsSchema.safeParse(await response.json());
    return parsed.success ? parsed.data.address : null;
  } catch {
    return null;
  }
};
