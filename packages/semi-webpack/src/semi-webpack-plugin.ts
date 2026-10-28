import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Compiler } from 'webpack';
import { assertNoStyleOptionsWithOmitCss } from '@fibrae/semi-theme-shared';
import { transformPath } from './utils';

const require = createRequire(import.meta.url);

function loaderPath(name: string) {
    return fileURLToPath(new URL(`./${name}.mjs`, import.meta.url));
}

export interface ExtractCssOptions {
    loader: string;
    loaderOptions?: any;
}
export interface SemiWebpackPluginOptions {
    cssLayer?: boolean;
    prefixCls?: string;
    omitCss?: boolean;
    extractCssOptions?: ExtractCssOptions;
    overrideStylesheetLoaders?: (loaders: any[]) => any[];
}

const SEMI_DIST_JS_RE = /@fibrae\/semi-(ui-react|ui-vue|ai-react|ai-vue|icons-react|icons-vue)\/dist\/.+\.js$/;
const SEMI_DIST_SCSS_RE = /@fibrae\/semi-(ui-react|ui-vue|ai-react|ai-vue|icons-core|icons-vue|foundation|ai-foundation)\/dist\/.+\.scss$/;

export default class SemiWebpackPlugin {
    options: SemiWebpackPluginOptions;

    constructor(options: SemiWebpackPluginOptions = {}) {
        assertNoStyleOptionsWithOmitCss(options);
        this.options = options;
    }

    #omitCss(module: any) {
        const compatiblePath = transformPath(module.resource);
        if (SEMI_DIST_JS_RE.test(compatiblePath)) {
            module.loaders = module.loaders || [];
            module.loaders.push({
                loader: loaderPath('semi-omit-css-loader'),
            });
        }
    }

    #customTheme(module: any) {
        const compatiblePath = transformPath(module.resource);
        if (SEMI_DIST_JS_RE.test(compatiblePath)) {
            module.loaders = module.loaders || [];
            module.loaders.push({
                loader: loaderPath('semi-source-suffix-loader'),
            });
        }
        if (SEMI_DIST_SCSS_RE.test(compatiblePath)) {
            if (!this.#hasSemiScssLoader(module.loaders)) {
                const scssLoader = {
                    loader: loaderPath('semi-scss-loader'),
                    options: {
                        cssLayer: this.options.cssLayer,
                        prefixCls: this.options.prefixCls,
                    },
                };
                const lastLoader = this.options.extractCssOptions
                    ? {
                          loader: this.options.extractCssOptions.loader,
                          options: this.options.extractCssOptions.loaderOptions || {},
                      }
                    : { loader: require.resolve('style-loader') };
                const loaderList: any[] = [lastLoader, { loader: require.resolve('css-loader'), options: { sourceMap: false } }, scssLoader];
                module.loaders = this.options.overrideStylesheetLoaders?.(loaderList) ?? loaderList;
            }
        }
    }

    #customPrefix(module: any, prefix: string) {
        const compatiblePath = transformPath(module.resource);
        if (/@fibrae\/semi-[^/]+\/.+env\.js$/.test(compatiblePath)) {
            module.loaders = module.loaders || [];
            module.loaders.push({
                loader: loaderPath('semi-prefix-loader'),
                options: {
                    replacers: {
                        BASE_CLASS_PREFIX: prefix,
                    },
                },
            });
        }
    }

    #hasSemiScssLoader(loaders: any[]) {
        return (loaders || []).some((loader) => /semi-scss-loader/.test(loader.loader));
    }

    apply(compiler: Compiler) {
        // compiler.webpack is the webpack instance running this build (Next.js bundles its own copy)
        compiler.hooks.compilation.tap('SemiPlugin', (compilation) => {
            compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap('SemiPlugin', (_, module) => {
                // The prefix lives in Semi's JS, so it is rewritten even with a prebuilt stylesheet
                if (this.options.prefixCls) {
                    this.#customPrefix(module, this.options.prefixCls);
                }
                if (this.options.omitCss) {
                    this.#omitCss(module);
                    return;
                }
                this.#customTheme(module);
            });
        });
    }
}
