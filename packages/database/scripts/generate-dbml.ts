import { writeFileSync } from "node:fs";

import { is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";

import * as schema from "../src/schema/index";

// Paste the generated file into https://dbdiagram.io to see the diagram.
const OUTPUT_FILE = "./schema.dbml";

const exports: unknown[] = Object.values(schema);
const tables = exports.filter((value): value is PgTable => is(value, PgTable));

const quote = (name: string): string => `"${name}"`;

const tableName = (table: PgTable): string => {
  const { name, schema: schemaName } = getTableConfig(table);
  const hasSchema = schemaName !== undefined && schemaName !== "";
  return hasSchema ? `${quote(schemaName)}.${quote(name)}` : quote(name);
};

const renderTable = (table: PgTable): string => {
  const { columns, foreignKeys } = getTableConfig(table);

  const lines = columns.map((column) => {
    const settings: string[] = [];
    if (column.primary) {
      settings.push("pk");
    }
    if (column.notNull && !column.primary) {
      settings.push("not null");
    }
    if (column.isUnique) {
      settings.push("unique");
    }
    const suffix = settings.length > 0 ? ` [${settings.join(", ")}]` : "";
    return `  ${quote(column.name)} ${column.getSQLType().replaceAll(" ", "_")}${suffix}`;
  });

  const references = foreignKeys.map((foreignKey) => {
    const {
      columns: from,
      foreignColumns: to,
      foreignTable,
    } = foreignKey.reference();
    const fromNames = from.map((column) => quote(column.name)).join(", ");
    const toNames = to.map((column) => quote(column.name)).join(", ");
    return `Ref: ${tableName(table)}.(${fromNames}) > ${tableName(foreignTable)}.(${toNames})`;
  });

  return [`Table ${tableName(table)} {`, ...lines, "}", ...references].join(
    "\n"
  );
};

writeFileSync(OUTPUT_FILE, `${tables.map(renderTable).join("\n\n")}\n`);
