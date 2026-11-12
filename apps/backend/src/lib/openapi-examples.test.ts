import { describe, expect, it } from "vitest";

import { addExamples } from "./openapi-examples";

const documentWith = (schema: unknown) => ({
  paths: {
    "/things": {
      get: {
        responses: {
          200: { content: { "application/json": { schema } } },
        },
      },
    },
  },
});

const examplesOf = (document: ReturnType<typeof documentWith>) =>
  document.paths["/things"].get.responses[200].content["application/json"]
    .schema;

describe(addExamples, () => {
  it("builds a sample from types, formats and enums", () => {
    const document = documentWith({
      properties: {
        createdAt: { format: "date-time", type: "string" },
        id: { format: "uuid", type: "string" },
        kind: { enum: ["a", "b"], type: "string" },
        notes: { anyOf: [{ type: "string" }, { type: "null" }] },
        size: { minimum: 5, type: "integer" },
      },
      type: "object",
    });
    addExamples(document);

    expect(examplesOf(document)).toMatchObject({
      examples: [
        {
          createdAt: "2026-01-15T09:30:00.000Z",
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          kind: "a",
          notes: "string",
          size: 5,
        },
      ],
    });
  });

  it("covers a record, such as the health checks map", () => {
    const document = documentWith({
      additionalProperties: {
        properties: { status: { enum: ["up", "down"], type: "string" } },
        type: "object",
      },
      type: "object",
    });
    addExamples(document);

    expect(examplesOf(document)).toMatchObject({
      examples: [{ key: { status: "up" } }],
    });
  });

  it("keeps an example that is already written", () => {
    const document = documentWith({ example: "mine", type: "string" });
    addExamples(document);

    expect(examplesOf(document)).toStrictEqual({
      example: "mine",
      type: "string",
    });
  });
});
