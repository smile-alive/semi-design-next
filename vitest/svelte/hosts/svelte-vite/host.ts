// Client-only Svelte app on Vite with vite-plugin-svelte and the Semi plugin (`plugins: [svelte(), semi()]`).
// vite-plugin-svelte resolves the Svelte packages' `svelte` export condition and compiles their `.svelte` sources with
// the app. The `tailwind` variant follows the Tailwind page.
import { primaryButton, tailwindCoexist } from '../../../hosts/checks.ts';
import type { Host, HostPage, ServerStep, Variant } from '../../../hosts/types.ts';

// Set from onMount, so it exists only once the app is running in the browser
const mounted = 'body[data-hydrated]';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
`;

function entry(stylesheets: string[]) {
    return `${stylesheets.map((sheet) => `import '${sheet}';\n`).join('')}import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('root')! });
`;
}

const BASIC_APP = `<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Switch } from '@fibrae/semi-ui-svelte';

    onMount(() => document.body.setAttribute('data-hydrated', ''));
</script>

<main>
    <Button id="btn-primary" theme="solid" type="primary">Primary</Button>
    <Switch aria-label="switch" />
</main>
`;

const TAILWIND_APP = `<script lang="ts">
    import { onMount } from 'svelte';
    import { Button } from '@fibrae/semi-ui-svelte';

    onMount(() => document.body.setAttribute('data-hydrated', ''));
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
import { svelte } from '@sveltejs/vite-plugin-svelte';
${imports}import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [svelte(), ${plugins}],
});
`;
}

const basic: HostPage = {
    name: 'home',
    path: '/',
    ready: mounted,
    checks: [primaryButton('#btn-primary')],
};

const tailwind: HostPage = {
    name: 'home',
    path: '/',
    ready: mounted,
    checks: [tailwindCoexist()],
};

function variant(name: string, page: HostPage, extra?: Pick<Variant, 'files' | 'deps'>): Variant {
    const server = (command: string[]): ServerStep => ({ command, pages: [page] });
    return {
        name,
        ...extra,
        dev: server(['vite', '--port', '{port}', '--strictPort']),
        build: { command: ['vite', 'build'] },
        prod: server(['vite', 'preview', '--port', '{port}', '--strictPort']),
    };
}

export default {
    deps: {
        '@fibrae/semi-ui-svelte': '*',
        '@fibrae/semi-vite-plugin': '*',
        '@sveltejs/vite-plugin-svelte': '7.3.1',
        svelte: '5.57.3',
        vite: '8.3.5',
    },
    files: {
        'index.html': INDEX_HTML,
        'vite.config.ts': viteConfig('semi()'),
        'src/main.ts': entry([]),
        'src/App.svelte': BASIC_APP,
    },
    variants: [
        variant('default', basic),
        variant('tailwind', tailwind, {
            deps: { '@tailwindcss/vite': '4.3.3', tailwindcss: '4.3.3' },
            files: {
                'vite.config.ts': viteConfig('semi(), tailwindcss()', "import tailwindcss from '@tailwindcss/vite';\n"),
                'src/semi-layer.css': '@layer theme, base, semi, components, utilities;\n',
                'src/tailwind.css': `@import 'tailwindcss';
@import '@fibrae/semi-ui-svelte/tailwind.css';
@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`,
                'src/main.ts': entry(['./semi-layer.css', './tailwind.css']),
                'src/App.svelte': TAILWIND_APP,
            },
        }),
    ],
    expectedFailures: [],
} satisfies Host;
