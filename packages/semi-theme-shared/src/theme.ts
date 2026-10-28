import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as sass from 'sass';

export interface SemiScssOptions {
    prefixCls?: string;
    /**
     * Locates `@fibrae/semi-foundation/<subpath>.scss` from the requesting stylesheet's directory; `fromDir` is
     * undefined for loads without a containing file (`semi:theme`), which the caller resolves from its app root
     */
    resolveFoundation: (subpath: string, fromDir?: string) => string | undefined;
}

/**
 * Sass importers for Semi's stylesheets. They serve:
 * - `semi:theme`: the variables and mixins of semi-foundation's `theme/index.scss`, with `$prefix` set to `prefixCls`.
 * - `semi:theme/global`, `semi:theme/animation`: the global tokens (CSS output) of semi-foundation's `theme/`.
 * - `semi:foundation/<subpath>`: any semi-foundation stylesheet.
 */
export function semiImporters({ prefixCls = 'semi', resolveFoundation }: SemiScssOptions): (sass.Importer<'sync'> | sass.FileImporter<'sync'>)[] {
    // The prefix is spliced into Sass strings and selectors; an invalid one gives an untraceable syntax error
    if (!/^[a-zA-Z][\w-]*$/.test(prefixCls)) {
        throw new Error(`[semi] prefixCls ${JSON.stringify(prefixCls)} is not a valid class name prefix`);
    }
    const resolve = (subpath: string, fromDir?: string) => {
        const file = resolveFoundation(subpath, fromDir);
        if (!file) {
            throw new Error(`[semi] cannot resolve @fibrae/semi-foundation/${subpath}.scss from ${fromDir ?? 'the app root'}`);
        }
        return pathToFileURL(file);
    };
    return [
        {
            canonicalize: (url) => (url === 'semi:theme' ? new URL(url) : null),
            load() {
                const index = resolve('theme/index', undefined).href;
                // The `as *` load rewrites the theme's own $prefix, so every `semi:theme` user reads the configured one
                return {
                    contents: `@forward "${index}";\n@use "${index}" as *;\n$prefix: '${prefixCls}';\n`,
                    syntax: 'scss',
                };
            },
        },
        {
            findFileUrl(url, context) {
                const subpath = url.startsWith('semi:foundation/') ? url.slice('semi:foundation/'.length) : /^semi:theme\/(global|animation)$/.test(url) ? url.slice('semi:'.length) : undefined;
                if (subpath === undefined) {
                    return null;
                }
                return resolve(subpath, context.containingUrl?.protocol === 'file:' ? path.dirname(fileURLToPath(context.containingUrl)) : undefined);
            },
        },
    ];
}

/** Puts Semi's CSS in the `semi` cascade layer so unlayered app styles win without !important */
export function wrapInSemiLayer(css: string) {
    // @charset must stay first; compressed output uses a BOM instead, which inside the layer breaks the first selector
    const charset = css.match(/^(@charset "UTF-8";\n|﻿)/)?.[0] ?? '';
    return `${charset}@layer semi{${css.slice(charset.length)}}`;
}

export interface CompileSemiScssOptions extends SemiScssOptions {
    cssLayer?: boolean;
    style?: sass.OutputStyle;
    charset?: boolean;
    /** Defaults to every deprecation the installed Sass warns about */
    fatalDeprecations?: sass.DeprecationOrId[];
}

// Warnings scroll past in build logs; failing is the only way deprecated constructs get fixed before Sass removes them
const activeDeprecations = Object.values(sass.deprecations).filter((d) => d.status === 'active');

/** Compiles one Semi stylesheet (a file, or `source` read as that file) against the theme */
export function compileSemiScss(file: string, { cssLayer = true, style, charset, fatalDeprecations = activeDeprecations, ...options }: CompileSemiScssOptions, source?: string) {
    // quietDeps keeps importer-served (theme) deprecations from being fatal or repeated per component; safe because the
    // tests compile the theme entries directly and still fail there
    const sassOptions = {
        importers: semiImporters(options),
        style,
        charset,
        fatalDeprecations,
        quietDeps: true,
    };
    const result = source === undefined ? sass.compile(file, sassOptions) : sass.compileString(source, { ...sassOptions, url: pathToFileURL(file) });
    return {
        css: cssLayer ? wrapInSemiLayer(result.css) : result.css,
        loadedFiles: result.loadedUrls.filter((url) => url.protocol === 'file:').map((url) => fileURLToPath(url)),
    };
}

function resolveFrom(dir: string, request: string) {
    try {
        return createRequire(path.join(dir, 'noop.js')).resolve(request);
    } catch {
        return undefined;
    }
}

/**
 * `resolveFoundation` through Node resolution for installed Semi packages: from the stylesheet's directory, then the
 * app root, each directly and then through the UI packages. semi-icons-core does not depend on semi-foundation, and an
 * isolated node_modules hides it from the root.
 */
export function resolveFoundationFromNode(subpath: string, fromDir: string | undefined, rootDir: string): string | undefined {
    const request = `@fibrae/semi-foundation/${subpath}.scss`;
    for (const dir of fromDir ? [fromDir, rootDir] : [rootDir]) {
        const file = resolveFrom(dir, request);
        if (file) {
            return file;
        }
        for (const uiPackage of ['semi-ui-react', 'semi-ui-vue']) {
            const semiUi = resolveFrom(dir, `@fibrae/${uiPackage}/package.json`);
            const uiFile = semiUi && resolveFrom(path.dirname(semiUi), request);
            if (uiFile) {
                return uiFile;
            }
        }
    }
    return undefined;
}

export interface SemiScssLoaderOptions {
    prefixCls?: string;
    cssLayer?: boolean;
}

/** webpack/rspack loader compiling Semi's own stylesheets against the theme, in place of sass-loader */
export function semiScssLoader(
    this: {
        getOptions(): SemiScssLoaderOptions;
        resourcePath: string;
        context: string;
        rootContext: string;
        addDependency(file: string): void;
    },
    source: string
) {
    const { css, loadedFiles } = compileSemiScss(
        this.resourcePath,
        {
            ...this.getOptions(),
            resolveFoundation: (subpath, fromDir) => resolveFoundationFromNode(subpath, fromDir, this.rootContext),
        },
        source
    );
    for (const file of loadedFiles) {
        this.addDependency(file);
    }
    return css;
}

// omitCss leaves prebuilt CSS untouched, so the plugins skip compiling; prefixCls still rewrites Semi's JS
const STYLE_OPTIONS = ['cssLayer'] as const;

/** Fails loud on plugin options that `omitCss` would otherwise ignore silently */
export function assertNoStyleOptionsWithOmitCss(
    options: Partial<Record<(typeof STYLE_OPTIONS)[number], unknown>> & {
        omitCss?: boolean;
    }
) {
    if (!options.omitCss) {
        return;
    }
    const ignored = STYLE_OPTIONS.filter((key) => options[key] !== undefined);
    if (ignored.length) {
        throw new Error(`[semi] ${ignored.join(', ')} has no effect with omitCss: Semi's CSS is not recompiled, so load a stylesheet built with these options (e.g. by @fibrae/semi-scss-compile) and drop them here`);
    }
}
