// ESLint flat config - improves compatibility with TypeScript ESM
import js from "@eslint/js";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginCypress from "eslint-plugin-cypress";
import eslintPluginJest from "eslint-plugin-jest";
import eslintPluginPreferArrow from "eslint-plugin-prefer-arrow";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Base JS/TS configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/*.d.ts",
      "**/*.md",
      ".reports/**/*",
      ".temp/**/*",
      "coverage/**/*",
      "dist/**/*",
      "docs/**/*",
      "node_modules/**/*",
      "tests/cypress/support/coverage.js", // Completely ignore this file
      ".config/test/coverage/lcov-report/**/*.js", // Ignore auto-generated coverage report files
    ],
  },

  // Special config for CJS files
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "writable",
      },
    },
  },

  // Specific configuration for the coverage.js file to avoid TypeScript parser errors
  {
    files: ["tests/cypress/support/coverage.js"],
    languageOptions: {
      // Use standard JavaScript parser instead of TypeScript
      parser: null, // Use ESLint's default parser for JavaScript
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        cy: true,
        Cypress: true,
        window: true,
      },
    },
    rules: {
      // Disable TypeScript-specific rules for this file
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-undef": "off", // Allow usage of Cypress globals
    },
  },

  // Source files configuration
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      import: eslintPluginImport,
      "prefer-arrow": eslintPluginPreferArrow,
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./.config/typescript/tsconfig.module.json",
        },
      },
      react: {
        version: "detect",
      },
    },
    rules: {
      // Disable TypeScript-specific rules that require type information
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/no-floating-promises": "off",

      // Basic TypeScript rules
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Import rules
      "import/order": ["error", { alphabetize: { order: "asc" } }],

      // Console/debugging rules
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "no-debugger": "warn",

      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      // "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Declaration files (.d.ts) - dedicated configuration
  {
    files: ["**/*.d.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // Disable rules that might cause issues with declaration files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },
  // Config files configuration
  {
    files: [".config/**/*.{ts,js,mjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Relaxed rules for config files
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  // Scripts files configuration
  {
    files: ["scripts/**/*.{ts,js,mjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Relaxed rules for script files
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "no-console": "off", // Allow console in scripts
    },
  },
  // Cypress tests configuration
  {
    files: ["tests/cypress/**/*.{ts,tsx,js,jsx}"],
    plugins: {
      cypress: eslintPluginCypress,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./.config/typescript/tsconfig.test.json"],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.cypress,
      },
    },
    rules: {
      // Relaxed rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  // Jest tests configuration
  {
    files: ["tests/jest/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./.config/typescript/tsconfig.test.json"],
      },
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      // Relaxed rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "no-control-regex": "off",

      // Jest specific rules
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/valid-expect": "error",
    },
  },
  // JavaScript files configuration
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Relaxed rules for JavaScript files
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  // Utils directory
  {
    files: ["utils/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Relaxed rules for utility scripts
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];
