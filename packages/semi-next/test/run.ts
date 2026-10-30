#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs';
import SemiWebpackPlugin from '@fibrae/semi-webpack-plugin';
import semiNext from '../dist/index.mjs';

// semiNext returns an untyped Next config and semi-next has no webpack dependency, so stub the fields it touches
interface WebpackConfig {
    plugins: SemiWebpackPlugin[];
}

delete process.env.TURBOPACK;
let userWebpackCalled = false;
const svgRule = { loaders: ['svg-loader'], as: '*.js' };
const nextConfig = semiNext()({
    reactStrictMode: true,
    transpilePackages: ['my-lib', '@fibrae/semi-ui-react'],
    turbopack: { resolveAlias: { a: 'b' }, rules: { '*.svg': svgRule } },
    webpack(config: WebpackConfig) {
        userWebpackCalled = true;
        return config;
    },
});
assert.strictEqual(nextConfig.reactStrictMode, true, 'original next config fields should be kept');
assert.deepStrictEqual(nextConfig.transpilePackages, ['my-lib', '@fibrae/semi-ui-react', '@fibrae/semi-ai-react', '@fibrae/semi-icons-react', '@fibrae/semi-illustrations-react'], 'transpilePackages are merged without duplicates');

const { turbopack } = nextConfig;
assert.deepStrictEqual(turbopack.resolveAlias, { a: 'b' }, 'other turbopack fields should be kept');
assert.strictEqual(turbopack.rules['*.svg'], svgRule, 'user rules should be kept');
assert.deepStrictEqual(Object.keys(turbopack.rules), ['*.svg'], 'without omitCss or prefixCls no rule is added');

const config: WebpackConfig = { plugins: [] };
const result = nextConfig.webpack(config, { isServer: true });
assert.strictEqual(result, config, 'user webpack function result should be returned');
assert.ok(userWebpackCalled, 'user webpack function should be called');
assert.strictEqual(config.plugins.length, 0, 'without options Next loads the published .css and no plugin is added');

const omitted = semiNext({ omitCss: true, prefixCls: 'my' })();
const [omitRule, prefixRule] = omitted.turbopack.rules['*.js'];
assert.match('node_modules/@fibrae/semi-icons-react/dist/components/icon.js', omitRule.condition.path);
assert.doesNotMatch('node_modules/@fibrae/semi-foundation/dist/button/foundation.js', omitRule.condition.path, 'foundation JS imports no CSS');
assert.match('node_modules/@fibrae/semi-foundation/dist/base/env.js', prefixRule.condition.path);
assert.deepStrictEqual(prefixRule.loaders[0].options, { replacers: { BASE_CLASS_PREFIX: 'my' } });
for (const loader of [omitRule.loaders[0], prefixRule.loaders[0].loader]) {
    assert.ok(fs.existsSync(loader), `${loader} should be an absolute path to a published loader`);
}
const omitConfig: WebpackConfig = { plugins: [] };
omitted.webpack(omitConfig, { isServer: false });
assert.ok(omitConfig.plugins[0] instanceof SemiWebpackPlugin, 'omitCss adds the SemiWebpackPlugin');
assert.deepStrictEqual(omitConfig.plugins[0].options, { omitCss: true, prefixCls: 'my' }, 'options are forwarded');

assert.throws(() => semiNext({ prefixCls: 'custom' })(), /prefixCls needs omitCss: true/, 'prefixCls without omitCss fails at config time under either bundler');
assert.throws(() => semiNext({ omitCss: true, cssLayer: false })().webpack({ plugins: [] }, { isServer: false }), /cssLayer has no effect with omitCss/, 'style options with omitCss fail instead of being ignored');

assert.throws(() => semiNext({ omitCss: true })({ turbopack: { rules: { '*.js': svgRule } } }), /turbopack\.rules\["\*\.js"\] is set by semi-next/, 'a user rule on the same glob fails instead of being replaced');

process.env.TURBOPACK = 'auto';
assert.throws(() => semiNext({ cssLayer: false })(), /cssLayer only works with webpack/, 'webpack-only options fail under Turbopack');
assert.throws(() => semiNext({ extractCssOptions: { loader: 'x' } })(), /extractCssOptions only works with webpack/);
assert.throws(() => semiNext({ prefixCls: 'my' })(), /prefixCls needs omitCss: true/);
assert.doesNotThrow(() => semiNext({ prefixCls: 'my', omitCss: true })());
delete process.env.TURBOPACK;

console.log('All assertions passed');
