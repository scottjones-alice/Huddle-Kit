import { z } from "zod";

const PLACES_URL = "https://places.googleapis.com/v1";
const MAX_SUGGESTIONS = 5;

const suggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        placePrediction: z
          .object({
            placeId: z.string(),
            text: z.object({ text: z.string() }),
          })
          .optional(),
      })
    )
    .default([]),
});

const componentSchema = z.object({
  longText: z.string(),
  types: z.array(z.string()),
});

const placeSchema = z.object({
  addressComponents: z.array(componentSchema).default([]),
});

type Component = z.infer<typeof componentSchema>;

const part = (components: readonly Component[], type: string): string =>
  components.find((component) => component.types.includes(type))?.longText ??
  "";

const joined = (...values: string[]): string =>
  values.filter((value) => value.length > 0).join(" ");

/** UK address parts from Google's place components. */
export const addressFromComponents = (components: readonly Component[]) => {
  const street = joined(
    part(components, "street_number"),
    part(components, "route")
  );
  const building = joined(
    part(components, "subpremise"),
    part(components, "premise")
  );
  const hasBoth = building.length > 0 && street.length > 0;
  return {
    city: part(components, "postal_town") || part(components, "locality"),
    county: part(components, "administrative_area_level_2"),
    line1: hasBoth ? building : street,
    line2: hasBoth ? street : "",
    postcode: part(components, "postal_code"),
  };
};

/** Address suggestions for what was typed, limited to the UK. */
export const autocompleteAddresses = async (
  apiKey: string,
  input: string
): Promise<{ id: string; text: string }[]> => {
  const response = await fetch(`${PLACES_URL}/places:autocomplete`, {
    body: JSON.stringify({ includedRegionCodes: ["gb"], input }),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Places search failed (${response.status})`);
  }
  const parsed = suggestionsSchema.parse(await response.json());
  return parsed.suggestions
    .flatMap(({ placePrediction }) =>
      placePrediction === undefined
        ? []
        : [{ id: placePrediction.placeId, text: placePrediction.text.text }]
    )
    .slice(0, MAX_SUGGESTIONS);
};

/** The address parts of one place. */
export const placeAddress = async (apiKey: string, placeId: string) => {
  const response = await fetch(
    `${PLACES_URL}/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "addressComponents",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Places lookup failed (${response.status})`);
  }
  const place = placeSchema.parse(await response.json());
  return addressFromComponents(place.addressComponents);
};
