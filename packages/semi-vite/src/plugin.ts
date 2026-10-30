import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { normalizePath, type Plugin, type Rolldown } from 'vite';
import { commentOutCssImports, compileSemiScss, replaceVariableValues, resolveFoundationFromNode } from '@fibrae/semi-theme-shared';
import type { SemiVitePluginOptions } from './types';

const SEMI_CSS_RE = /@fibrae[\\/]+semi-(ui-react|ui-vue|ui-solid|ai-react|ai-vue|ai-solid|icons-core|icons-vue|foundation|ai-foundation)[\\/]+dist[\\/]+.+\.css(\?.*)?$/;
// The Svelte packages ship `.svelte` sources, whose `<script>` imports the stylesheets
const SEMI_JS_RE = /@fibrae[\\/]+semi-(?:(ui-react|ui-vue|ui-solid|ai-react|ai-vue|ai-solid|icons-react|icons-vue|icons-solid)[\\/]+dist[\\/]+.+\.jsx?|(ui|ai|icons)-svelte[\\/]+dist[\\/]+.+\.(svelte|js))(\?.*)?$/;
const SEMI_ENV_JS_RE = /@fibrae[\\/]+semi-[^\\/]+[\\/]+.+env\.jsx?(\?.*)?$/;
// Node cannot load the `.css` imports in Semi's JS, so server environments bundle these packages. Not anchored at the
// start: Nuxt dev's vite-node matches absolute paths. Foundation stays external unless `prefixCls` is set, and the Solid
// packages are left to vite-plugin-solid: pulling them into the server transform breaks SolidStart
const SEMI_NO_EXTERNAL_RE = /@fibrae\/semi-(ui|ai|icons|illustrations)-(react|vue)(\/|$)/;
// Foundation holds BASE_CLASS_PREFIX, which `prefixCls` rewrites in the module itself: left external, Node would load the
// original and the server's class names would differ from the client bundle's
const SEMI_FOUNDATION_RE = /@fibrae\/semi-(ai-)?foundation(\/|$)/;
const SEMI_REACT_DIST_RE = /@fibrae[\\/]+semi-(ui|ai)-react[\\/]+dist[\\/]/;
const SOLID_PACKAGES = ['@fibrae/semi-ui-solid', '@fibrae/semi-ai-solid'];
const FOUNDATION_NAME_RE = /^@fibrae\/semi-(ai-)?foundation$/;

function tryResolve(require: NodeJS.Require, id: string) {
    try {
        return require.resolve(id);
    } catch {
        return undefined;
    }
}

function dependencyNames(packageJson: string) {
    const { dependencies = {} } = JSON.parse(readFileSync(packageJson, 'utf-8')) as { dependencies?: Record<string, string> };
    return Object.keys(dependencies);
}

// Looked up the way Vite resolves `optimizeDeps.include` chains, through `node_modules` only: `require` also searches
// NODE_PATH, which pnpm's bin shims point at the hoisted `.pnpm/node_modules`, so it finds packages Vite cannot. The
// `package.json` need not be exported, so it is found on disk instead of resolved. Known limit: symlinks are always
// followed and Yarn PnP is not searched; handle `resolve.preserveSymlinks` and PnP if a supported host needs them
function findPackageJson(dir: string, name: string): string | undefined {
    const packageJson = path.join(dir, 'node_modules', name, 'package.json');
    if (existsSync(packageJson)) {
        return realpathSync(packageJson);
    }
    const parent = path.dirname(dir);
    return parent === dir ? undefined : findPackageJson(parent, name);
}

function exportedSubpaths(packageJson: string, dependency: string) {
    const { exports = {} } = JSON.parse(readFileSync(packageJson, 'utf-8')) as { exports?: Record<string, unknown> };
    return Object.keys(exports)
        .filter((key) => key.startsWith('./') && !key.includes('*') && key !== './package.json')
        .map((key) => `${dependency}/${key.slice(2)}`);
}

// vite-plugin-solid keeps the Solid packages out of the dev pre-bundle, so foundation's dependencies reach the browser
// unconverted and the CommonJS among them (style-to-js and the like) fails to import; name them through the Solid package.
// Every foundation a Solid package depends on gets a chain from it: with pnpm an app that installs only ai-solid cannot
// resolve ui-solid, so foundation is reachable there only through ai-solid
function solidOptimizeDepsInclude(root: string) {
    return SOLID_PACKAGES.flatMap((solid) => {
        const solidPackageJson = findPackageJson(root, solid);
        if (!solidPackageJson) {
            return [];
        }
        return dependencyNames(solidPackageJson)
            .filter((name) => FOUNDATION_NAME_RE.test(name))
            .flatMap((foundation) => {
                const foundationPackageJson = findPackageJson(path.dirname(solidPackageJson), foundation);
                if (!foundationPackageJson) {
                    throw new Error(`[semi] cannot find ${foundation}, a dependency of ${solid}, in the node_modules above ${solidPackageJson}`);
                }
                const foundationDir = path.dirname(foundationPackageJson);
                const fromFoundation = createRequire(foundationPackageJson);
                // A package without a root entry (`@tiptap/pm`) is listed by its exported subpaths: left out, ai-foundation's
                // own `@tiptap/pm/state` would load unbundled next to the copy inlined into the `@tiptap/core` pre-bundle, and
                // ProseMirror rejects plugins from two instances. Wildcard subpaths (Semi's own foundation) cannot be listed.
                // Subpaths are not resolved through `require`: an `import`-only subpath would be dropped and the duplicate return
                return dependencyNames(foundationPackageJson)
                    .flatMap((dependency) => {
                        const dependencyPackageJson = findPackageJson(foundationDir, dependency);
                        if (!dependencyPackageJson) {
                            return [];
                        }
                        return tryResolve(fromFoundation, dependency) ? [dependency] : exportedSubpaths(dependencyPackageJson, dependency);
                    })
                    .map((dependency) => `${solid} > ${foundation} > ${dependency}`);
            });
    });
}

/**
 * Create a Vite plugin that replaces Semi's selector prefix, controls the `@layer semi` wrapper,
 * and optionally omits CSS imports inside Semi packages.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import semiTheming from '@fibrae/semi-vite-plugin';
 *
 * export default defineConfig({
 *     plugins: [
 *         semiTheming({
 *             prefixCls: 'my-semi',
 *         }),
 *     ],
 * });
 * ```
 */
export default function semiTheming(options: SemiVitePluginOptions = {}): Plugin[] {
    let root = process.cwd();
    const { prefixCls, omitCss } = options;

    const theme: Plugin = {
        name: 'semi-theme',
        enforce: 'pre',

        configResolved(config) {
            root = config.root;
        },

        config(userConfig) {
            // Dev serves the `.vite/deps` pre-bundle, which skips `transform`, so register with the optimizer too
            const plugins: Rolldown.Plugin[] = [];
            if (prefixCls) {
                plugins.push({
                    name: 'semi-theme:prefix-env',
                    transform: (code, id) => (SEMI_ENV_JS_RE.test(normalizePath(id)) ? replaceVariableValues(code, { BASE_CLASS_PREFIX: prefixCls }) : null),
                });
            }
            if (omitCss) {
                plugins.push({
                    name: 'semi-theme:omit-css',
                    transform: (code, id) => (SEMI_JS_RE.test(normalizePath(id)) ? commentOutCssImports(code) : null),
                });
            }
            const include = solidOptimizeDepsInclude(userConfig.root ? path.resolve(userConfig.root) : process.cwd());
            // Semi's React packages mark their modules 'use client'; bundlers outside Next warn about the directive on
            // every module unless @vitejs/plugin-react (which silences it the same way) is installed
            const userOnLog = userConfig.build?.rolldownOptions?.onLog;
            const onLog: NonNullable<Rolldown.RolldownOptions['onLog']> = (level, log, defaultHandler) => {
                if (log.code === 'MODULE_LEVEL_DIRECTIVE' && SEMI_REACT_DIST_RE.test(normalizePath(log.id ?? '')) && log.message.includes('use client')) {
                    return;
                }
                (userOnLog ?? defaultHandler)(level, log, defaultHandler);
            };
            return { build: { rolldownOptions: { onLog } }, optimizeDeps: { include, rolldownOptions: { plugins } } };
        },

        // Per environment, as the legacy `ssr.noExternal` reaches only the one named `ssr`, missing React Router's
        // serverBundles (`ssrBundle_*`). The hook runs before Vite fills in `consumer`, which Nuxt leaves unset, so apply
        // Vite's own default here
        configEnvironment: {
            // After vite-plugin-solid, whatever the plugin order: in dev it lists foundation (a dependency of the Solid
            // packages without a `solid` export condition) in `resolve.external`, which Vite checks before `noExternal`.
            // Merging cannot remove an array entry, so the list is edited in place
            order: 'post',
            handler(name, config) {
                if ((config.consumer ?? (name === 'client' ? 'client' : 'server')) !== 'server') {
                    return undefined;
                }
                if (!prefixCls) {
                    return { resolve: { noExternal: [SEMI_NO_EXTERNAL_RE] } };
                }
                const { resolve } = config;
                if (Array.isArray(resolve?.external)) {
                    resolve.external = resolve.external.filter((id) => !SEMI_FOUNDATION_RE.test(id));
                }
                return { resolve: { noExternal: [SEMI_NO_EXTERNAL_RE, SEMI_FOUNDATION_RE] } };
            },
        },

        async load(id) {
            const filePath = normalizePath(id.split('?')[0]);
            if (!SEMI_CSS_RE.test(filePath)) {
                return null;
            }

            const scssFilePath = filePath.replace(/\.css$/, '.scss');
            if (!existsSync(scssFilePath)) {
                return null;
            }

            const { css, loadedFiles } = compileSemiScss(scssFilePath, {
                prefixCls,
                cssLayer: options.cssLayer,
                resolveFoundation: (subpath, fromDir) => resolveFoundationFromNode(subpath, fromDir, root),
            });
            for (const file of loadedFiles) {
                this.addWatchFile(file);
            }
            return css;
        },

        transform(code, id) {
            const filePath = normalizePath(id.split('?')[0]);

            let next = code;
            if (omitCss && SEMI_JS_RE.test(filePath)) {
                next = commentOutCssImports(next);
            }
            if (prefixCls && SEMI_ENV_JS_RE.test(filePath)) {
                next = replaceVariableValues(next, { BASE_CLASS_PREFIX: prefixCls });
            }
            return next === code ? null : { code: next, map: null };
        },
    };

    return [theme];
}
