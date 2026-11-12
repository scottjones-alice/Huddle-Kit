import { describe, expect, it } from "vitest";
import { z } from "zod";

import configureOpenAPI from "@/lib/configure-open-api";
import { createRouter } from "@/lib/create-app";
import { allRouteConfigs } from "@/routes/route-configs";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch"] as const;

const parameterSchema = z.object({
  description: z.string().optional(),
  name: z.string(),
});
const operationSchema = z.object({
  operationId: z.string().optional(),
  parameters: z.array(parameterSchema).optional(),
  tags: z.array(z.string()).optional(),
});
const documentSchema = z.object({
  info: z.object({ description: z.string().optional() }),
  paths: z.record(z.string(), z.record(z.string(), z.unknown())),
  servers: z.array(z.object({ url: z.string() })).optional(),
  tags: z.array(z.object({ name: z.string() })).optional(),
});
type Document = z.infer<typeof documentSchema>;

const hasExample = (node: object): boolean =>
  "examples" in node || "example" in node;

/** Paths of every schema (a node with a `type`) that has no example. */
const missingExamples = (node: unknown, path: string): string[] => {
  if (Array.isArray(node)) {
    return node.flatMap((item, index) =>
      missingExamples(item, `${path}/${index}`)
    );
  }
  if (typeof node !== "object" || node === null) {
    return [];
  }
  const nested = Object.entries(node).flatMap(([key, value]) =>
    missingExamples(value, `${path}/${key}`)
  );
  // A property can itself be called "type" (a consent's type), so a schema's
  // `type` must be a name or a list of names, and not inside `properties` or an example.
  const isSchema =
    path.includes("/schema") &&
    "type" in node &&
    (typeof node.type === "string" || Array.isArray(node.type)) &&
    !path.includes("/examples/") &&
    !path.endsWith("/properties");
  return isSchema && !hasExample(node) ? [path, ...nested] : nested;
};

const fetchDocument = async (): Promise<Document> => {
  const app = createRouter();
  configureOpenAPI(app, "/api/v1");
  for (const route of allRouteConfigs) {
    app.openAPIRegistry.registerPath(route);
  }
  const response = await app.request("/api/v1/doc");
  return documentSchema.parse(await response.json());
};

describe("generated OpenAPI document", () => {
  it("describes the API and names a server", async () => {
    const document = await fetchDocument();

    expect((document.info.description ?? "").length).toBeGreaterThan(0);
    expect(document.servers?.length).toBeGreaterThan(0);
  });

  it("shows a sample value for every schema", async () => {
    const document = await fetchDocument();

    expect(missingExamples(document.paths, "paths")).toStrictEqual([]);
  });

  it("gives every operation an id, described parameters and a declared tag", async () => {
    const document = await fetchDocument();
    const declared = new Set((document.tags ?? []).map((tag) => tag.name));
    const problems: string[] = [];
    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of HTTP_METHODS) {
        const parsed = operationSchema.safeParse(item[method]);
        if (parsed.success) {
          const operation = parsed.data;
          if ((operation.operationId ?? "") === "") {
            problems.push(`${method} ${path} has no operationId`);
          }
          for (const parameter of operation.parameters ?? []) {
            if ((parameter.description ?? "") === "") {
              problems.push(
                `${method} ${path} parameter ${parameter.name} has no description`
              );
            }
          }
          for (const tag of operation.tags ?? []) {
            if (!declared.has(tag)) {
              problems.push(`${method} ${path} uses undeclared tag ${tag}`);
            }
          }
        }
      }
    }

    expect(problems).toStrictEqual([]);
  });
});
