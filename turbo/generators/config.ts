import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import type { PlopTypes } from "@turbo/gen";

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setHelper("json", (value: unknown) => JSON.stringify(value));

  plop.setActionType("pnpmInstall", (_answers, _config, plopApi) => {
    const root = plopApi.getDestBasePath();
    execSync("pnpm install", { cwd: root, stdio: "inherit" });
    return "pnpm install";
  });

  plop.setGenerator("package", {
    actions: [
      ...[
        ["package.json", "package.json.hbs"],
        ["tsconfig.json", "tsconfig.json.hbs"],
        ["README.md", "README.md.hbs"],
        ["src/index.ts", "src/index.ts.hbs"],
        ["tests/index.test.ts", "tests/index.test.ts.hbs"],
      ].map(([file, template]) => ({
        path: `{{ turbo.paths.root }}/packages/{{ dashCase name }}/${file}`,
        templateFile: `templates/${template}`,
        type: "add",
      })),
      { type: "pnpmInstall" },
    ],
    description:
      "Creates a new @alice/<name> package in packages/ (package.json, tsconfig.json, README.md, src/index.ts, tests/index.test.ts)",
    prompts: [
      {
        message: "Package name (kebab-case, without the @alice/ scope):",
        name: "name",
        type: "input",
        validate: (input: string) => {
          if (!KEBAB_CASE.test(input)) {
            return "use kebab-case, e.g. my-package";
          }
          if (existsSync(path.join(process.cwd(), "packages", input))) {
            return `packages/${input} already exists`;
          }
          return true;
        },
      },
      {
        message: "One-line description:",
        name: "description",
        type: "input",
        validate: (input: string) =>
          input.trim() === "" ? "description is required" : true,
      },
    ],
  });
}
