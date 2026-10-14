import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "out"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // Keep export JSON is validated by hand in src/keep/ingest.ts.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
