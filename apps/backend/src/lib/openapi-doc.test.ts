import { describe, expect, it } from "vitest";
import { z } from "zod";

import configureOpenAPI from "@/lib/configure-open-api";
import { createRouter } from "@/lib/create-app";
import * as files from "@/routes/files/files.route";
import * as onboarding from "@/routes/onboarding/onboarding.route";
import * as payments from "@/routes/payments/payments.route";
import { rootRoute } from "@/routes/root/root.route";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch"] as const;

const operationSchema = z.object({
  operationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
const documentSchema = z.object({
  info: z.object({ description: z.string().optional() }),
  paths: z.record(z.string(), z.record(z.string(), operationSchema)),
  servers: z.array(z.object({ url: z.string() })).optional(),
  tags: z.array(z.object({ name: z.string() })).optional(),
});
type Document = z.infer<typeof documentSchema>;

const fetchDocument = async (): Promise<Document> => {
  const app = createRouter();
  configureOpenAPI(app, "/api/v1");
  for (const route of [
    ...Object.values(files),
    ...Object.values(onboarding),
    ...Object.values(payments),
    rootRoute,
  ]) {
    if (typeof route === "object" && "method" in route) {
      app.openAPIRegistry.registerPath(route);
    }
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

  it("gives every operation an id and a tag that is declared globally", async () => {
    const document = await fetchDocument();
    const declared = new Set((document.tags ?? []).map((tag) => tag.name));
    const problems: string[] = [];
    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = item[method];
        if (operation !== undefined) {
          if ((operation.operationId ?? "") === "") {
            problems.push(`${method} ${path} has no operationId`);
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
