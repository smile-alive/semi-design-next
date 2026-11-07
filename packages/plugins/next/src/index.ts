import { createRequire } from 'node:module';
import SemiWebpackPlugin, { type SemiWebpackPluginOptions } from '@fibrae/semi-webpack-plugin';

export type SemiNextOptions = SemiWebpackPluginOptions;

const require = createRequire(import.meta.url);

// The Pages Router server loads node_modules with Node, which cannot import the `.css` in Semi's JS. foundation and
// icons-core are left out: they ship the stylesheets, but their JS imports none
const TRANSPILE_PACKAGES = ['@fibrae/semi-ui-react', '@fibrae/semi-ai-react', '@fibrae/semi-icons-react', '@fibrae/semi-illustrations-react'];

// Turbopack takes loaders by absolute path only
function loader(name: string) {
    return require.resolve(`@fibrae/semi-webpack-plugin/${name}`);
}

function turbopackRules({ omitCss, prefixCls }: SemiNextOptions) {
    const js = [];
    if (omitCss) {
        js.push({ condition: { path: /@fibrae\/semi-(ui|ai|icons)-react\/dist\// }, loaders: [loader('semi-omit-css-loader')] });
    }
    if (prefixCls) {
        js.push({ condition: { path: /@fibrae\/semi-[^/]+\/.+env\.js$/ }, loaders: [{ loader: loader('semi-prefix-loader'), options: { replacers: { BASE_CLASS_PREFIX: prefixCls } } }] });
    }
    return js.length > 0 ? { '*.js': js } : {};
}

// Turbopack compiles CSS itself, so the options that recompile Semi's SCSS cannot apply
function assertTurbopackOptions({ cssLayer, extractCssOptions, overrideStylesheetLoaders }: SemiNextOptions) {
    const webpackOnly = Object.entries({ cssLayer, extractCssOptions, overrideStylesheetLoaders }).find(([, value]) => value !== undefined);
    if (webpackOnly) {
        throw new Error(`semi-next: ${webpackOnly[0]} only works with webpack; run Next with --webpack or remove it`);
    }
}

export default function semiNext(options: SemiNextOptions = {}) {
    const { omitCss = false, ...restOptions } = options;
    return (nextConfig: any = {}) => {
        // Next 16 --webpack fails the build when SemiWebpackPlugin recompiles SCSS next to Next's own style rules, so a custom
        // prefix goes through the omitCss path only
        if (restOptions.prefixCls && !omitCss) {
            throw new Error('semi-next: prefixCls needs omitCss: true and a stylesheet built by semi-build-scss --prefix');
        }
        // Next sets TURBOPACK before it evaluates next.config: "auto" for the default bundler, "1" with --turbopack, unset with
        // --webpack and in next start. The turbopack key has no hook to validate later
        if (process.env.TURBOPACK) {
            assertTurbopackOptions({ omitCss, ...restOptions });
        }
        const userRules = nextConfig.turbopack?.rules ?? {};
        const semiRules = turbopackRules({ omitCss, ...restOptions });
        const clash = Object.keys(semiRules).find((glob) => Object.hasOwn(userRules, glob));
        if (clash) {
            throw new Error(`semi-next: turbopack.rules["${clash}"] is set by semi-next; match your files with another glob`);
        }
        return {
            ...nextConfig,
            transpilePackages: [...new Set([...(nextConfig.transpilePackages ?? []), ...TRANSPILE_PACKAGES])],
            // Next 16 exits under Turbopack when the config has a webpack key but no turbopack key
            turbopack: { ...nextConfig.turbopack, rules: { ...userRules, ...semiRules } },
            webpack(config: any, context: any) {
                // Without options the plugin would recompile Semi's SCSS through style-loader; Next loads the published .css itself
                if (omitCss || Object.keys(restOptions).length > 0) {
                    config.plugins.push(new SemiWebpackPlugin({ omitCss, ...restOptions }));
                }
                if (typeof nextConfig.webpack === 'function') {
                    return nextConfig.webpack(config, context);
                }
                return config;
            },
        };
    };
}
