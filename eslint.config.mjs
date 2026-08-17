import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Deliberately leaner than the learner app's config. This codebase is plain
// JavaScript, so eslint-config-next/typescript is dropped, and it currently
// has no violations — so the rules the learner app had to downgrade to "warn"
// are left at their default severity here. Keep it that way.
const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "**/node_modules/**"]),
]);

export default eslintConfig;
