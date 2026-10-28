#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadNuxt } from '@nuxt/kit';
import type { Plugin } from 'vite';
import semiNuxt from '../dist/module.mjs';

// loadNuxt resolves `nuxt` from cwd, so it must run from the package, not from a temp dir; build artifacts go to a temp dir
const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semi-nuxt-'));

function loadWithModule(overrides: Record<string, unknown>, cwd = path.join(import.meta.dirname, '..')) {
    return loadNuxt({ cwd, dotenv: { cwd: buildDir, fileName: [] }, overrides: { buildDir, modules: [semiNuxt], telemetry: false, ...overrides } });
}

async function viteConfigOf(semi: Record<string, unknown> | undefined, environments?: Record<string, unknown>) {
    const nuxt = await loadWithModule(semi ? { semi } : {});
    try {
        const ctx = { nuxt, config: { plugins: [] as Plugin[][], ...(environments && { environments }) } };
        await nuxt.callHook('vite:extend', ctx);
        return ctx.config.plugins.flat();
    } finally {
        await nuxt.close();
    }
}

const defaults = await viteConfigOf(undefined);
assert.ok(
    defaults.some((plugin) => plugin.name === 'semi-theme'),
    'the module registers the semi-vite plugin'
);

// With viteEnvironmentApi Nuxt scopes added plugins to its client/ssr environments instead of pushing them directly
const scoped = await viteConfigOf(undefined, { client: {}, ssr: {} });
const scopedTheme = scoped.find((plugin) => plugin.name === 'semi-theme');
assert.ok(scopedTheme, 'the plugin is registered under the environment API');
assert.ok(typeof scopedTheme.applyToEnvironment === 'function' && scopedTheme.applyToEnvironment.call({} as never, { name: 'ssr' } as never), 'the plugin applies to the ssr environment');

// Option forwarding is visible in the optimizer plugins semi-vite adds for dev pre-bundling
async function optimizerPlugins(plugins: Plugin[]) {
    const theme = plugins.find((plugin) => plugin.name === 'semi-theme');
    assert.ok(typeof theme?.config === 'function');
    const result = (await theme.config.call({} as never, {}, { command: 'serve', mode: 'development' })) as unknown as { optimizeDeps: { rolldownOptions: { plugins: { name: string }[] } } };
    return result.optimizeDeps.rolldownOptions.plugins.map((plugin) => plugin.name);
}
assert.deepStrictEqual(await optimizerPlugins(defaults), [], 'without options neither the prefix nor the omitCss pre-bundle plugin is added');
assert.deepStrictEqual(await optimizerPlugins(await viteConfigOf({ prefixCls: 'my', omitCss: true })), ['semi-theme:prefix-env', 'semi-theme:omit-css'], 'the `semi` config key reaches the plugin unchanged');

async function inlineStylesOf(overrides: Record<string, unknown>, cwd?: string) {
    const nuxt = await loadWithModule(overrides, cwd);
    try {
        return nuxt.options.features.inlineStyles;
    } finally {
        await nuxt.close();
    }
}
assert.strictEqual(await inlineStylesOf({}), false, 'without a user setting the module turns off inlined component styles');
assert.strictEqual(await inlineStylesOf({ features: { inlineStyles: true } }), true, 'a loadNuxt override keeps its inlineStyles');
assert.strictEqual(await inlineStylesOf({}, path.join(import.meta.dirname, 'inline-styles')), true, 'nuxt.config inlineStyles is kept');
assert.strictEqual(await inlineStylesOf({}, path.join(import.meta.dirname, 'inline-styles-rc')), true, '.nuxtrc inlineStyles is kept');
assert.strictEqual(await inlineStylesOf({ experimental: { inlineSSRStyles: true } }), true, 'the legacy inlineSSRStyles key is kept');
const inlineOwn = (id?: string) => !!id?.includes('/pages/');
assert.strictEqual(await inlineStylesOf({ experimental: { inlineSSRStyles: inlineOwn } }), inlineOwn, 'a legacy inlineSSRStyles function is kept');

fs.rmSync(buildDir, { recursive: true, force: true });
console.log('All assertions passed');
