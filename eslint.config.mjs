import parser from "@typescript-eslint/parser";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: parser,
    },
  },

  // Config copied directly from eslint-plugin-unused-imports README
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
