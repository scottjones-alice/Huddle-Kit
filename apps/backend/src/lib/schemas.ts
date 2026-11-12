import { z } from "@hono/zod-openapi";

const MAX_TEXT = 200;
const COUNTRY_CODE = /^[A-Z]{2}$/u;

/** A postal address as people type it. */
export const addressInputSchema = z.object({
  city: z.string().trim().min(1).max(MAX_TEXT),
  countryCode: z
    .string()
    .regex(COUNTRY_CODE)
    .describe("Two capital letters, for example GB."),
  line1: z.string().trim().min(1).max(MAX_TEXT),
  line2: z.string().trim().max(MAX_TEXT).nullish(),
  postalCode: z.string().trim().max(MAX_TEXT).nullish(),
  region: z.string().trim().max(MAX_TEXT).nullish(),
});

/** The text of a query-string flag such as ?includeArchived=true. */
export const isTrue = (value: string): boolean => value === "true";
