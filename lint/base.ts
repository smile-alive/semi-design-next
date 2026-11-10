import type { OxlintConfig, OxlintOverride } from 'vite-plus/lint';

export const baseLint = {
    plugins: ['typescript', 'unicorn', 'oxc', 'import', 'vitest'],
    // A prototype method passed as a value loses `this` (`this.#x` throws); also unhandled promises
    options: { typeAware: true },
    categories: {
        correctness: 'error',
    },
    rules: {
        // Still report; off until triaged
        'typescript/no-base-to-string': 'off',
        'typescript/no-redundant-type-constituents': 'off',
        'typescript/no-useless-default-assignment': 'off',
        'typescript/restrict-template-expressions': 'off',
        // Static methods never read `this`, so callers may destructure them
        'typescript/unbound-method': ['error', { ignoreStatic: true }],

        // Props are destructured to keep them out of rest props. Same as tsc's noUnusedParameters: a parameter a fixed
        // signature needs but the body ignores is named with a leading underscore
        'no-unused-vars': ['error', { ignoreRestSiblings: true, args: 'all', argsIgnorePattern: '^_', caughtErrors: 'none' }],
        'typescript/no-this-alias': 'off',
        // Other member order is checked by `pnpm lint:class-order`
        'grouped-accessor-pairs': 'error',
        'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'expect*', 'expect*.*'] }],
        'no-array-constructor': 'error',
        'no-var': 'error',
        'prefer-rest-params': 'error',
        'no-unneeded-ternary': 'error',
        'unicorn/prefer-logical-operator-over-ternary': 'error',
        'logical-assignment-operators': 'error',
        'prefer-exponentiation-operator': 'error',
        'unicorn/prefer-includes': 'error',
        'import/export': 'error',
        'import/no-duplicates': ['error', { preferInline: true }],
        // D4; locale files keep their language tag (`zh_CN.ts`)
        'unicorn/filename-case': ['error', { case: 'kebabCase', ignore: ['^[a-z]{2,3}_([A-Z]{2}|\\d{3})\\.ts$'] }],
    },
    ignorePatterns: ['**/*.d.ts'],
} satisfies OxlintConfig;

// For TypeScript sources; a framework whose files embed TypeScript (Vue SFCs) applies them to its own extension
export const typescriptRules = {
    'prefer-spread': 'error',
    'typescript/adjacent-overload-signatures': 'error',
    // Empty Props and State interfaces are public extension points kept as in the original Semi (F6)
    'typescript/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
    'typescript/no-unsafe-function-type': 'error',
    // Classes use JS `#` for private members and TS only for what JS lacks (`protected`, types);
    // `pnpm lint:private` rejects the `private` keyword, which this rule cannot express
    'typescript/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
    'typescript/parameter-properties': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-require-imports': 'error',
    // `typeof import()` stays allowed for vi.mock's importOriginal and for probing types an entry does not export
    'typescript/consistent-type-imports': ['error', { disallowTypeAnnotations: false, fixStyle: 'inline-type-imports' }],
} satisfies NonNullable<OxlintOverride['rules']>;

export const baseOverrides: OxlintOverride[] = [
    { files: ['**/*.ts', '**/*.tsx'], rules: typescriptRules },
    {
        // Both rules tell `null` from `undefined` and falsy values only under strictNullChecks, which D11 turns on per
        // package: list each package that turns it on. Options keep only rewrites with the same result: `||` and `&&` on a primitive or `any` also act on '', 0
        // and false; `x !== undefined ? x : y` keeps a `null` that `??` would replace; inside `Boolean()` `||` reads as
        // the truth test it is
        files: ['packages/semi-{ui,ai,icons}-{vue,solid,svelte}/src/**', 'packages/semi-icons-react/src/**', 'packages/shared/semi-{animation,icons-core,polyfill}/src/**', 'packages/plugins/semi-scss-compile/src/**', 'website/**'],
        rules: {
            'typescript/prefer-nullish-coalescing': ['error', { ignorePrimitives: true, ignoreTernaryTests: true, ignoreBooleanCoercion: true }],
            'typescript/prefer-optional-chain': ['error', { checkAny: false, checkUnknown: false, checkString: false, checkNumber: false, checkBoolean: false, checkBigInt: false }],
        },
    },
    // Astro components keep the PascalCase file names used in the Astro docs
    { files: ['**/*.astro'], rules: { 'unicorn/filename-case': 'off' } },
    {
        files: ['**/*.js'],
        rules: {
            // import/no-named-as-default stays off: coding-style requires `import clsx from 'clsx'`
            // (same function as the named export) and the rule has no allowlist
            'import/no-named-as-default-member': 'error',
        },
    },
];
