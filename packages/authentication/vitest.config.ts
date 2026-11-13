import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The copied Better Auth organization plugin is reference material until
    // it is ported; its tests need Better Auth's internals and can't run here.
    exclude: [...configDefaults.exclude, "src/plugins/club/**"],
  },
});
