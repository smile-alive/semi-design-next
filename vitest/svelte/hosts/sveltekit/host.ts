// SvelteKit 3 app with adapter-node and the Semi plugin (`plugins: [sveltekit({ adapter }), semi()]`; Kit 3 takes its
// configuration through the plugin and rejects a svelte.config.js). SvelteKit's Vite plugin
// bundles the Svelte packages into the server build through their `svelte` export condition, and the per-component CSS
// they import reaches the server HTML. The `full-css` and `prefix` variants load one whole stylesheet with `omitCss`.
import fs from 'node:fs';
import path from 'node:path';
import { idsStable, primaryButton, ssrText, tailwindCoexist, tailwindFirstPaint } from '../../../hosts/checks.ts';
import type { BuildCheck, Files, Host, HostPage, ServerStep, Variant } from '../../../hosts/types.ts';

// The root layout runs onMount only once hydration has reached it, so the attribute marks a hydrated page
const hydrated = 'body[data-hydrated]';

const home: HostPage = {
    name: 'home',
    path: '/',
    ready: hydrated,
    checks: [ssrText('ssr-button', ['Primary']), ssrText('ssr-input', ['InputValueABC']), idsStable(), primaryButton('#btn-primary')],
};

// The server HTML is checked directly: a server rendering `semi-` next to a `my-` client would only show as a mismatch
const prefixed: HostPage = {
    name: 'home',
    path: '/',
    ready: hydrated,
    checks: [ssrText('ssr-prefix', ['my-button']), idsStable(), primaryButton('#btn-primary', 'my')],
};

const tailwind: HostPage = {
    name: 'home',
    path: '/',
    ready: hydrated,
    checks: [tailwindCoexist(), tailwindFirstPaint()],
};

// With `omitCss` the whole stylesheet (`sheet`, relative to the app) must be the only copy of the component rules in the
// client build: the component imports would add the same rules again
function cssOnce(selector: string, sheet: string): BuildCheck {
    return {
        name: 'css-once',
        run: async ({ appDir }) => {
            // The client build is minified and the sheet may not be
            const rules = (css: string) => css.match(new RegExp(`${selector.replaceAll('.', '\\.')}\\s*\\{`, 'g'))?.length ?? 0;
            const expected = rules(fs.readFileSync(path.join(appDir, sheet), 'utf-8'));
            const clientDir = path.join(appDir, '.svelte-kit/output/client');
            const actual = rules(
                fs
                    .globSync('**/*.css', { cwd: clientDir })
                    .map((file) => fs.readFileSync(path.join(clientDir, file), 'utf-8'))
                    .join('\n')
            );
            if (expected === 0 || actual !== expected) {
                throw new Error(`the client CSS has ${actual} ${selector} rules, ${sheet} has ${expected}`);
            }
        },
    };
}

function layout(stylesheets: string[]) {
    return `<script lang="ts">
    import { onMount } from 'svelte';
${stylesheets.map((sheet) => `    import '${sheet}';\n`).join('')}
    let { children } = $props();

    onMount(() => document.body.setAttribute('data-hydrated', ''));
</script>

{@render children()}
`;
}

const PAGE = `<script lang="ts">
    import { Button, Input, Switch } from '@fibrae/semi-ui-svelte';
</script>

<main>
    <Button id="btn-primary" theme="solid" type="primary">Primary</Button>
    <Switch aria-label="switch" />
    <Input value="InputValueABC" />
</main>
`;

const TAILWIND_PAGE = `<script lang="ts">
    import { Button } from '@fibrae/semi-ui-svelte';
</script>

<main>
    <Button id="tw-padding" class="p-0" theme="solid" type="primary">Padding</Button>
    <div id="tw-alpha" class="bg-semi-color-primary/50">Alpha</div>
    <div theme-mode="dark">
        <div id="tw-dark" class="bg-white dark:bg-black">Dark</div>
    </div>
</main>
`;

function viteConfig(plugins: string, imports = '') {
    return `import semi from '@fibrae/semi-vite-plugin';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
${imports}import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit({ adapter: adapter() }), ${plugins}],
});
`;
}

// `sheet` generates the `my`-prefixed stylesheet the app imports, the way a user runs it before dev and build
function variant(name: string, page: HostPage, { buildChecks, ...rest }: Pick<Variant, 'files' | 'deps'> & { buildChecks?: BuildCheck[] }, sheet = false): Variant {
    const prepared = (command: string[]) => (sheet ? ['sh', '-c', 'semi-build-scss --prefix my -o src/semi-my.css && exec "$@"', 'sh', ...command] : command);
    const server = (command: string[]): ServerStep => ({ command, pages: [page] });
    return {
        name,
        ...rest,
        dev: server(prepared(['vite', 'dev', '--port', '{port}', '--strictPort'])),
        build: { command: prepared(['vite', 'build']), checks: buildChecks },
        // adapter-node reads PORT
        prod: server(['node', 'build']),
    };
}

const files: Files = {
    'vite.config.ts': viteConfig('semi()'),
    'src/app.html': `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        %sveltekit.head%
    </head>
    <body>
        <div style="display: contents">%sveltekit.body%</div>
    </body>
</html>
`,
    'src/routes/+layout.svelte': layout([]),
    'src/routes/+page.svelte': PAGE,
};

export default {
    deps: {
        '@fibrae/semi-ui-svelte': '*',
        '@fibrae/semi-vite-plugin': '*',
        '@sveltejs/adapter-node': '6.0.0',
        '@sveltejs/kit': '3.1.0',
        '@sveltejs/vite-plugin-svelte': '7.3.1',
        svelte: '5.57.3',
        typescript: '6.0.3',
        vite: '8.3.5',
    },
    files,
    variants: [
        variant('default', home, {}),
        variant('full-css', home, {
            files: { 'vite.config.ts': viteConfig('semi({ omitCss: true })'), 'src/routes/+layout.svelte': layout(['@fibrae/semi-ui-svelte/styles.css']) },
            buildChecks: [cssOnce('.semi-button', 'node_modules/@fibrae/semi-ui-svelte/dist/styles.css')],
        }),
        // A custom prefix: no component CSS (`omitCss`), one stylesheet compiled with the same prefix
        variant(
            'prefix',
            prefixed,
            {
                deps: { '@fibrae/semi-scss-compile': '*' },
                files: { 'vite.config.ts': viteConfig("semi({ prefixCls: 'my', omitCss: true })"), 'src/routes/+layout.svelte': layout(['../semi-my.css']) },
                buildChecks: [cssOnce('.my-button', 'src/semi-my.css')],
            },
            true
        ),
        // The Tailwind page of the docs: the layer order comes before the Tailwind entry
        variant('tailwind', tailwind, {
            deps: { '@tailwindcss/vite': '4.3.3', tailwindcss: '4.3.3' },
            files: {
                'vite.config.ts': viteConfig('semi(), tailwindcss()', "import tailwindcss from '@tailwindcss/vite';\n"),
                'src/semi-layer.css': '@layer theme, base, semi, components, utilities;\n',
                'src/tailwind.css': `@import 'tailwindcss';
@import '@fibrae/semi-ui-svelte/tailwind.css';

@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`,
                'src/routes/+layout.svelte': layout(['../semi-layer.css', '../tailwind.css']),
                'src/routes/+page.svelte': TAILWIND_PAGE,
            },
        }),
    ],
    expectedFailures: [],
} satisfies Host;
