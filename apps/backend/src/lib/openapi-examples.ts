/**
 * Fills in an `examples` entry on every schema in a generated OpenAPI document
 * that does not have one. SDK generators and API linters (Scalar, Spectral's
 * `oas3-missing-example` rule) expect each schema to show a sample value, and
 * writing one by hand for every field would drift from the real schemas.
 *
 * The values are plain placeholders built from the schema's type, format,
 * limits and enum, for example a UUID for `format: uuid`. Anything the schema
 * already documents (`example`, `examples`, `default`, `const`, `enum`) is kept.
 */

type Json = boolean | number | string | null | Json[] | { [key: string]: Json };
type JsonObject = Record<string, unknown>;

const SAMPLE_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const SAMPLE_DATE = "2026-01-15";
const SAMPLE_DATE_TIME = "2026-01-15T09:30:00.000Z";
const SAMPLE_TIME = "18:00:00";
const SAMPLE_EMAIL = "alex@example.com";
const SAMPLE_URL = "https://example.com";
const SAMPLE_TEXT = "string";

const STRING_SAMPLES: Record<string, string> = {
  date: SAMPLE_DATE,
  "date-time": SAMPLE_DATE_TIME,
  email: SAMPLE_EMAIL,
  time: SAMPLE_TIME,
  uri: SAMPLE_URL,
  url: SAMPLE_URL,
  uuid: SAMPLE_UUID,
};

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJson = (value: unknown): value is Json => value !== undefined;

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

/** The schema's type, ignoring "null" in `type: ["string", "null"]`. */
const typeOf = (schema: JsonObject): string | undefined => {
  const { type } = schema;
  if (Array.isArray(type)) {
    return type.find(
      (entry): entry is string => typeof entry === "string" && entry !== "null"
    );
  }
  return typeof type === "string" ? type : undefined;
};

const stringSample = (schema: JsonObject): string => {
  const { format } = schema;
  const sample =
    typeof format === "string"
      ? (STRING_SAMPLES[format] ?? SAMPLE_TEXT)
      : SAMPLE_TEXT;
  const maxLength = numberOr(schema.maxLength, sample.length);
  return sample.slice(0, Math.max(maxLength, 1));
};

const numberSample = (schema: JsonObject, isInteger: boolean): number => {
  const minimum = numberOr(schema.minimum, 0);
  const maximum = numberOr(schema.maximum, Number.POSITIVE_INFINITY);
  const sample = Math.min(Math.max(1, minimum), maximum);
  return isInteger ? Math.round(sample) : sample;
};

/** The first entry of a list, if it is a list holding a JSON value. */
const firstJson = (value: unknown): Json | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const first: unknown = value[0];
  return isJson(first) ? first : undefined;
};

/** A sample the schema already documents itself, if it has one. */
const documentedSample = (schema: JsonObject): Json | undefined => {
  const candidates: (Json | undefined)[] = [
    firstJson(schema.examples),
    isJson(schema.example) ? schema.example : undefined,
    isJson(schema.const) ? schema.const : undefined,
    isJson(schema.default) ? schema.default : undefined,
    firstJson(schema.enum),
  ];
  return candidates.find((candidate) => candidate !== undefined);
};

const SCALAR_SAMPLES: Record<string, (schema: JsonObject) => Json> = {
  boolean: () => true,
  integer: (schema) => numberSample(schema, true),
  number: (schema) => numberSample(schema, false),
  string: stringSample,
};

const exampleOf = (schema: unknown): Json => {
  if (!isObject(schema)) {
    return null;
  }
  const documented = documentedSample(schema);
  if (documented !== undefined) {
    return documented;
  }
  const choices: unknown = schema.anyOf ?? schema.oneOf;
  if (Array.isArray(choices)) {
    const firstReal: unknown = choices.find(
      (choice) => !(isObject(choice) && choice.type === "null")
    );
    return exampleOf(firstReal);
  }
  if (Array.isArray(schema.allOf)) {
    const parts: unknown[] = schema.allOf;
    const merged: Record<string, Json> = {};
    for (const part of parts) {
      const sample = exampleOf(part);
      if (isObject(sample) && !Array.isArray(sample)) {
        Object.assign(merged, sample);
      }
    }
    return merged;
  }
  const type = typeOf(schema);
  if (type === "array") {
    return [exampleOf(schema.items)];
  }
  const scalar = type === undefined ? undefined : SCALAR_SAMPLES[type];
  if (scalar !== undefined) {
    return scalar(schema);
  }
  if (isObject(schema.properties)) {
    return Object.fromEntries(
      Object.entries(schema.properties).map(([name, property]) => [
        name,
        exampleOf(property),
      ])
    );
  }
  if (isObject(schema.additionalProperties)) {
    return { key: exampleOf(schema.additionalProperties) };
  }
  return {};
};

/** Adds `examples` to this schema and every schema nested inside it. */
const fillSchema = (schema: unknown): void => {
  if (!isObject(schema) || typeof schema.$ref === "string") {
    return;
  }
  if (!("examples" in schema) && !("example" in schema)) {
    schema.examples = [exampleOf(schema)];
  }
  if (isObject(schema.properties)) {
    for (const property of Object.values(schema.properties)) {
      fillSchema(property);
    }
  }
  fillSchema(schema.items);
  fillSchema(schema.additionalProperties);
  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    const parts = schema[key];
    if (Array.isArray(parts)) {
      for (const part of parts) {
        fillSchema(part);
      }
    }
  }
};

const fillContent = (content: unknown): void => {
  if (!isObject(content)) {
    return;
  }
  for (const media of Object.values(content)) {
    if (isObject(media)) {
      fillSchema(media.schema);
    }
  }
};

const fillOperation = (operation: unknown): void => {
  if (!isObject(operation)) {
    return;
  }
  if (Array.isArray(operation.parameters)) {
    for (const parameter of operation.parameters) {
      if (isObject(parameter)) {
        fillSchema(parameter.schema);
      }
    }
  }
  if (isObject(operation.requestBody)) {
    fillContent(operation.requestBody.content);
  }
  if (isObject(operation.responses)) {
    for (const response of Object.values(operation.responses)) {
      if (isObject(response)) {
        fillContent(response.content);
      }
    }
  }
};

/** Mutates the document in place and returns it. */
export const addExamples = <T>(document: T): T => {
  if (!isObject(document)) {
    return document;
  }
  if (isObject(document.paths)) {
    for (const pathItem of Object.values(document.paths)) {
      if (isObject(pathItem)) {
        for (const operation of Object.values(pathItem)) {
          fillOperation(operation);
        }
      }
    }
  }
  if (isObject(document.components) && isObject(document.components.schemas)) {
    for (const schema of Object.values(document.components.schemas)) {
      fillSchema(schema);
    }
  }
  return document;
};
