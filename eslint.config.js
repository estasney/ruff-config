import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";

export default tseslint.config(
    {ignores: ["dist/**"]},

    js.configs.recommended,

    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            react.configs.flat.recommended,
            react.configs.flat["jsx-runtime"],
            reactHooks.configs.flat.recommended,
        ],
    },

    {
        files: ["**/*.js"],
        extends: [tseslint.configs.disableTypeChecked],
    },

    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            globals: {...globals.browser},
            parserOptions: {
                project: [
                    "./tsconfig.app.json",
                    "./tsconfig.node.json",
                ],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "react-refresh": reactRefresh,
        },
        settings: {
            react: {version: "detect"},
        },
        linterOptions: {
            reportUnusedDisableDirectives: "error",
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {argsIgnorePattern: "^_", varsIgnorePattern: "^_"},
            ],
            "@typescript-eslint/ban-ts-comment": [
                "error",
                {
                    "ts-expect-error": "allow-with-description",
                    "ts-ignore": true,
                    "ts-nocheck": true,
                    "ts-check": false,
                },
            ],

            "no-unused-expressions": "off",
            "@typescript-eslint/no-unused-expressions": [
                "error",
                {allowShortCircuit: true, allowTernary: true},
            ],
            "no-console": "warn",
            "react/prop-types": "off",
            "react/self-closing-comp": "error",
            "react/jsx-boolean-value": ["error", "never"],
            "react/jsx-no-useless-fragment": "warn",
            "react/jsx-key": "error",
            "react/jsx-no-target-blank": "off",
            "react/no-array-index-key": "error",
            "react/no-unstable-nested-components": "error",
            "react/jsx-no-leaked-render": "error",
            "react/jsx-no-constructed-context-values": "error",
            "react/jsx-no-bind": "error",
            "react/no-danger": "error",
            "react/void-dom-elements-no-children": "warn",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": ["error"],

        },
    },

    {
        files: ["plugins/**/*.ts"],
        languageOptions: {globals: {...globals.node}},
        rules: [
            {
                "no-console": "off"
            }
        ]
    },

    eslintConfigPrettier,
);
