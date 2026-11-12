import { describe, expect, it, vi } from "vitest";

import { createDatabase } from "../src/index";

describe("@alice/database", () => {
  it("creates a Drizzle database instance", () => {
    const db = createDatabase({
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    expect(db).toBeDefined();
    expect(db).toHaveProperty("query");
  });

  it("accepts database logging configuration", () => {
    const db = createDatabase({
      logger: true,
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    expect(db).toBeDefined();
  });

  it("hands a failed idle connection to onPoolError instead of crashing", () => {
    const onPoolError = vi.fn<(error: Error) => void>();

    const db = createDatabase({
      onPoolError,
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    const failure = new Error("terminating connection");

    db.$client.emit("error", failure);

    expect(onPoolError).toHaveBeenCalledWith(failure);
  });

  it("survives a failed idle connection when no onPoolError is given", () => {
    const db = createDatabase({
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    expect(() =>
      db.$client.emit("error", new Error("terminating connection"))
    ).not.toThrow();
  });

  it("applies safe pool limits by default", () => {
    const db = createDatabase({
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    expect(db.$client.options).toMatchObject({
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30_000,
      max: 10,
      statement_timeout: 15_000,
    });
  });

  it("lets the app override the pool limits", () => {
    const db = createDatabase({
      pool: { max: 3, statementTimeoutMs: 2000 },
      url: "postgresql://postgres:password@localhost:5432/test",
    });

    expect(db.$client.options).toMatchObject({
      max: 3,
      statement_timeout: 2000,
    });
  });
});
