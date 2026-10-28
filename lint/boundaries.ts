import type { OxlintOverride } from 'vite-plus/lint';
import type { FrameworkLint } from './framework.ts';

type ImportPattern = { group: string[]; message: string };
type RestrictedImports = ['error', { patterns: ImportPattern[] }];

// A relative path into another Semi package reaches its source, not what consumers install
const noRelativeSemiPackage: ImportPattern = {
    group: ['../**/semi-*/**'],
    message: 'Import another Semi package by its name (@fibrae/semi-*), not by a relative path.',
};

function withSubpaths(specifiers: string[]) {
    return specifiers.flatMap((specifier) => [specifier, `${specifier}/**`]);
}

function restrictedImports(patterns: ImportPattern[], ownPackage?: string): RestrictedImports {
    return [
        'error',
        {
            patterns: [
                ...patterns,
                ...(ownPackage
                    ? [
                          {
                              group: [`@fibrae/${ownPackage}`, `@fibrae/${ownPackage}/**`],
                              message: 'Import modules of the same package by relative path.',
                          },
                      ]
                    : []),
                noRelativeSemiPackage,
            ],
        },
    ];
}

// Tests import what they test by package name (resolved to source by semiSourceAliases), not `../../`
function packageBoundary(pkg: string, patterns: ImportPattern[]): OxlintOverride[] {
    return [
        { files: [`packages/${pkg}/**`], rules: { 'no-restricted-imports': restrictedImports(patterns, pkg) } },
        { files: [`packages/${pkg}/**/__tests__/**`], rules: { 'no-restricted-imports': restrictedImports(patterns) } },
    ];
}

// Foundations come last so their boundary holds for framework-named files inside; Motion stays out (presets only)
export function boundaryOverrides(frameworks: FrameworkLint[]): OxlintOverride[] {
    const frameworkImports = withSubpaths(frameworks.flatMap((framework) => framework.imports));
    return [
        // Scripts and test tooling may import package source by relative path
        {
            files: ['**/*'],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: frameworkImports,
                                message: 'Framework-free code must not import a framework. Code written for one lives in its packages or is named <framework>.* or *.<framework>.*.',
                            },
                        ],
                    },
                ],
            },
        },
        ...frameworks.flatMap((framework) => {
            const patterns = frameworks
                .filter((other) => other !== framework)
                .map((other) => ({
                    group: withSubpaths(other.imports),
                    message: `${framework.name} code must not depend on ${other.name}.`,
                }));
            return [{ files: framework.files, rules: { 'no-restricted-imports': restrictedImports(patterns) } }, ...framework.packages.flatMap((pkg) => packageBoundary(pkg, patterns))];
        }),
        ...packageBoundary('semi-foundation', [
            {
                group: [...frameworkImports, ...withSubpaths(['motion', '@fibrae/semi-ai-foundation'])],
                message: 'semi-foundation must not depend on a framework, on Motion or on the AI packages.',
            },
        ]),
        // The AI foundation builds on semi-foundation
        ...packageBoundary('semi-ai-foundation', [
            {
                group: [...frameworkImports, ...withSubpaths(['motion'])],
                message: 'semi-ai-foundation must not depend on a framework or on Motion.',
            },
        ]),
    ];
}
