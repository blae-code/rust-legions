import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
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
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    // react-three-fiber renders three.js objects as intrinsic JSX elements
    // (<mesh>, <meshStandardMaterial metalness .../>, <bufferGeometry args .../>).
    // Their props are three.js object properties, not DOM attributes, so
    // `react/no-unknown-property` produces only false positives here. It stays
    // strict for real DOM everywhere else. R3F usage is fully contained to these
    // paths (verified: no bare three.js primitives live outside them) — if a new
    // 3D file appears, add it here.
    files: [
      "src/components/hexmap3d/**/*.{js,jsx}",
      "src/components/starmap/**/*.{js,jsx}",
      "src/components/game/macro/**/*.{js,jsx}",
      "src/pages/StarMap.jsx",
    ],
    rules: {
      "react/no-unknown-property": "off",
    },
  },
];
