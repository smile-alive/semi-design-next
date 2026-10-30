import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileSemiScss } from '@fibrae/semi-theme-shared';
import { resolveFoundationPath, resolveIconPath } from './icons';

export interface Options {
    /** Directory holding semi-foundation's component folders and its theme/: the package's dist/ when installed. Defaults to this package's own dependency */
    foundationPath?: string;
    /** Directory holding semi-icons-core's styles/: the package's dist/ when installed. Defaults to this package's own dependency */
    iconPath?: string;
    outputPath: string;
    isMin?: boolean;
    prefixCls?: string;
    /** Wrap the CSS in `@layer semi`, as the theme plugins do (default) */
    cssLayer?: boolean;
}

// Every component's stylesheet, folders sorted by name: the cascade order the full stylesheet uses
function componentStylesheets(foundationPath: string, iconPath: string) {
    const fileOf: Record<string, string> = { _portal: 'portal.scss' };
    // theme/ is loaded through semi:theme, its tokens through the entry's semi:theme/global and semi:theme/animation
    const folders = [...new Set(fs.globSync('*/*.scss', { cwd: foundationPath, exclude: ['theme/**'] }).map((file) => path.dirname(file)))];
    return [
        ...folders.toSorted().map((folder) => path.join(foundationPath, folder, fileOf[folder] ?? `${folder}.scss`)),
        path.join(iconPath, 'styles', 'icons.scss'),
        // second stylesheets of a component folder
        path.join(foundationPath, 'button', 'icon-button.scss'),
        path.join(foundationPath, 'input', 'textarea.scss'),
    ];
}

export interface AiOptions extends Omit<Options, 'iconPath'> {
    /** Directory holding semi-ai-foundation's component folders: the package's dist/ when installed */
    aiFoundationPath: string;
}

function compileStylesheets({ foundationPath, isMin = false, prefixCls, cssLayer = true }: Omit<Options, 'iconPath' | 'outputPath' | 'foundationPath'> & { foundationPath: string }, header: string[], files: string[]) {
    const entry = ['@use "sass:meta";', ...header, ...files.map((file) => `@include meta.load-css("${pathToFileURL(file).href}");`)].join('\n');
    return compileSemiScss(
        path.join(foundationPath, 'semi.scss'),
        {
            prefixCls,
            resolveFoundation: (subpath) => path.join(foundationPath, `${subpath}.scss`),
            cssLayer,
            style: isMin ? 'compressed' : 'expanded',
            charset: false,
        },
        entry
    ).css;
}

/** Compiles all of Semi's styles into one stylesheet */
export function compileSemiCss({ iconPath = resolveIconPath(), foundationPath = resolveFoundationPath(), ...options }: Omit<Options, 'outputPath'>) {
    return compileStylesheets({ ...options, foundationPath }, ['@use "semi:theme/global";', '@use "semi:theme/animation";'], componentStylesheets(foundationPath, iconPath));
}

/**
 * Compiles the AI components' styles (semi-ai-foundation) into one stylesheet. It carries no tokens, so it is loaded
 * after the full stylesheet
 */
export function compileSemiAiCss({ aiFoundationPath, foundationPath = resolveFoundationPath(), ...options }: Omit<AiOptions, 'outputPath'>) {
    const folders = new Set(fs.globSync('*/*.scss', { cwd: aiFoundationPath }).map((file) => path.dirname(file)));
    return compileStylesheets(
        { ...options, foundationPath },
        [],
        [...folders].toSorted().map((folder) => path.join(aiFoundationPath, folder, `${folder}.scss`))
    );
}

// Font families get a `family-` infix: `font-*` utilities read both `--font-*` and `--font-weight-*`, so
// `font-semi-regular` would otherwise name both the regular family and the regular weight.
const TAILWIND_NAMESPACES: [prefix: string, namespace: string, suffix?: string][] = [
    ['--semi-color-', '--color-semi-color-'],
    ['--semi-border-radius-', '--radius-semi-'],
    ['--semi-shadow-', '--shadow-semi-'],
    ['--semi-transition_function-', '--ease-semi-'],
    ['--semi-spacing-', '--spacing-semi-'],
    ['--semi-font-size-', '--text-semi-'],
    ['--semi-line-height-', '--text-semi-', '--line-height'],
    ['--semi-font-weight-', '--font-weight-semi-'],
    ['--semi-font-family-', '--font-semi-family-'],
];

/**
 * Tailwind `@theme inline` mapping of Semi's tokens, read from the compiled theme so it cannot drift from `--semi-*`.
 * `inline` writes only `var(--semi-*)` references, so it follows `--semi-*` overrides and resolves per element (inside
 * an always-light/dark subtree too). Palette colors map to `--color-semi-<name>`; z-index, control height and border
 * width have no Tailwind namespace and are used as `z-(--semi-z-modal)`.
 */
export function compileTailwindTheme({ foundationPath }: Required<Pick<Options, 'foundationPath'>>) {
    const css = compileSemiScss(
        path.join(foundationPath, 'semi.scss'),
        {
            resolveFoundation: (subpath) => path.join(foundationPath, `${subpath}.scss`),
            cssLayer: false,
            charset: false,
        },
        '@use "semi:theme/global";\n@use "semi:theme/animation";'
    ).css;
    const mapped = new Map<string, string>();
    // Scan every block (mode-independent, light, dark, shared): a token sits in one of them or in both light and dark,
    // so repeats map to the same key. A value may span lines (the font stack)
    for (const [, name, value] of css.matchAll(/^\s*(--semi-[\w-]+):\s*([^;]+);\s*$/gm)) {
        // AI gradients cannot be a Tailwind color
        if (value.startsWith('linear-gradient') || value.includes('--semi-ai-general-')) {
            continue;
        }
        const rule = TAILWIND_NAMESPACES.find(([prefix]) => name.startsWith(prefix));
        if (rule) {
            if (name.startsWith('--semi-color-') && !/^(#|var\(--semi-|rgba?\()/.test(value)) {
                throw new Error(`[semi] cannot map ${name}: unexpected color value "${value}"`);
            }
            mapped.set(rule[1] + name.slice(rule[0].length) + (rule[2] ?? ''), name);
        } else if (/^#[\da-f]+$/i.test(value)) {
            // Palette: `--semi-blue-5` -> `--color-semi-blue-5`
            mapped.set(`--color-${name.slice(2)}`, name);
        }
    }
    const lines = [...mapped].map(([key, name]) => `    ${key}: var(${name});`);
    return `/* Generated by @fibrae/semi-scss-compile from the Semi theme; do not edit */\n@theme inline {\n${lines.join('\n')}\n}\n`;
}

function write(outputPath: string, css: string) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, css);
}

export function compile({ outputPath, ...options }: Options) {
    write(outputPath, compileSemiCss(options));
}

export function compileAi({ outputPath, ...options }: AiOptions) {
    write(outputPath, compileSemiAiCss(options));
}
