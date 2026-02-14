import js from '@eslint/js'

import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

import {defineConfig, globalIgnores} from 'eslint/config'
import reactDom from "eslint-plugin-react-dom";

import reactX from "eslint-plugin-react-x";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(['dist']),
    {
        base: './',
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,

        },

        plugins: {
            'react-hooks': reactHooks,
            'react-x': reactX,
            'react-dom': reactDom,
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            ...reactHooks.configs["recommended-latest"].rules,
            "react-refresh/only-export-components": [
                "warn",
                {allowConstantExport: true},
            ],
            ...reactX.configs["recommended-typescript"].rules,
            ...reactDom.configs.recommended.rules,

            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "@typescript-eslint/no-unused-expressions": [
                "error",
                {allowShortCircuit: true, allowTernary: true},
            ],
            "@typescript-eslint/ban-ts-comment": [
                "error",
                {"ts-ignore": "allow-with-description", "ts-expect-error": false},
            ],
        },
        settings: {
            "import/resolver": {
                typescript: true,
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: "error",
        },
    },
])
