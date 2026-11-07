import fs from 'node:fs';
import path from 'node:path';
import type { OxlintOverride } from 'vite-plus/lint';
import type { FrameworkLint } from './framework.ts';

type ImportPattern = { group: string[]; message: string };
type RestrictedImports = ['error', { patterns: ImportPattern[] }];

const root = path.resolve(import.meta.dirname, '..');
// Package directory under packages/ (`react/ui`) to its npm name
const packageNames = new Map(fs.globSync('packages/*/*/package.json', { cwd: root }).map((file) => [path.dirname(file).slice('packages/'.length), (JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as { name: string }).name]));

// A relative path into another Semi package reaches its source, not what consumers install
const noRelativeSemiPackage: ImportPattern = {
    group: [...packageNames.keys()].map((dir) => `../**/${dir}/**`),
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
                              group: withSubpaths([ownPackage]),
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
function packageBoundary(dir: string, patterns: ImportPattern[]): OxlintOverride[] {
    const name = packageNames.get(dir);
    if (!name) throw new Error(`no package at packages/${dir}`);
    return [
        { files: [`packages/${dir}/**`], rules: { 'no-restricted-imports': restrictedImports(patterns, name) } },
        { files: [`packages/${dir}/**/__tests__/**`], rules: { 'no-restricted-imports': restrictedImports(patterns) } },
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
            return [{ files: framework.files, rules: { 'no-restricted-imports': restrictedImports(patterns) } }, ...framework.packages.flatMap((dir) => packageBoundary(dir, patterns))];
        }),
        ...packageBoundary('shared/foundation', [
            {
                group: [...frameworkImports, ...withSubpaths(['motion', '@fibrae/semi-ai-foundation'])],
                message: 'semi-foundation must not depend on a framework, on Motion or on the AI packages.',
            },
        ]),
        // The AI foundation builds on semi-foundation
        ...packageBoundary('shared/ai-foundation', [
            {
                group: [...frameworkImports, ...withSubpaths(['motion'])],
                message: 'semi-ai-foundation must not depend on a framework or on Motion.',
            },
        ]),
    ];
}
