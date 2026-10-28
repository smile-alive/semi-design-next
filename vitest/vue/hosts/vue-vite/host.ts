// Client-only Vue 3 on Vite with @vitejs/plugin-vue, written the way the getting-started page tells users to: the Semi
// plugin for `vite build` (the `no-plugin` variant checks that the dev server works without it) and
// `@fibrae/semi-ui-vue/tokens` imported first. The `tailwind` variant follows the Tailwind page: `semi-layer.css`
// first, then `tailwind.css`.
import { modalOpens, primaryButton, tailwindCoexist } from '../../../hosts/checks.ts';
import type { Host, HostPage, PageCheck, ServerStep, Variant } from '../../../hosts/types.ts';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Semi host</title>
    </head>
    <body>
        <div id="app"></div>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
`;

function viteConfig(plugins: string, imports = '') {
    return `import vue from '@vitejs/plugin-vue';
${imports}import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [${plugins}],
});
`;
}

const MAIN_TOKENS = `import '@fibrae/semi-ui-vue/tokens';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`;

// Appears only after mount: the server response is an empty #app
const MOUNTED = `    import { onMounted } from 'vue';

    onMounted(() => {
        document.body.dataset.hydrated = '';
    });`;

const APP = `<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';
${MOUNTED}

    const visible = ref(false);
</script>

<template>
    <main>
        <Button id="primary-button" type="primary" theme="solid">Primary button</Button>
        <Button id="open-modal" @click="visible = true">Open modal</Button>
        <Modal v-model:visible="visible" title="Host modal">Host modal body</Modal>
    </main>
</template>
`;

const TAILWIND_MAIN = `import './semi-layer.css';
import './tailwind.css';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`;

const TAILWIND_APP = `<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';
${MOUNTED}
</script>

<template>
    <main>
        <Button id="tw-padding" type="primary" theme="solid" class="p-0">Padding</Button>
        <div id="tw-alpha" class="bg-semi-color-primary/50">Alpha</div>
        <div theme-mode="dark">
            <div id="tw-dark" class="bg-white dark:bg-black">Dark</div>
        </div>
    </main>
</template>
`;

const hydrated = 'body[data-hydrated]';

function page(checks: PageCheck[]): HostPage {
    return { name: 'home', path: '/', ready: hydrated, checks };
}

function dev(checks: PageCheck[]): ServerStep {
    // --strictPort: without it Vite moves to another port when this one is taken
    return { command: ['vite', '--port', '{port}', '--strictPort'], pages: [page(checks)] };
}

function prod(checks: PageCheck[]): ServerStep {
    return { command: ['vite', 'preview', '--port', '{port}', '--strictPort'], pages: [page(checks)] };
}

const build = { command: ['vite', 'build'] };

const defaultChecks = [primaryButton('#primary-button'), modalOpens('#open-modal', 'Host modal body')];
const tailwindChecks = [tailwindCoexist()];

const SEMI_IMPORT = "import semi from '@fibrae/semi-vite-plugin';\n";

const variants: Variant[] = [
    { name: 'default', dev: dev(defaultChecks), build, prod: prod(defaultChecks) },
    // The dev server works without the plugin; `vite build` does not
    { name: 'no-plugin', files: { 'vite.config.ts': viteConfig('vue()') }, dev: dev(defaultChecks) },
    {
        name: 'tailwind',
        files: {
            'vite.config.ts': viteConfig('vue(), semi(), tailwindcss()', `${SEMI_IMPORT}import tailwindcss from '@tailwindcss/vite';\n`),
            'src/main.ts': TAILWIND_MAIN,
            'src/App.vue': TAILWIND_APP,
            'src/semi-layer.css': '@layer theme, base, semi, components, utilities;\n',
            'src/tailwind.css': `@import 'tailwindcss';
@import '@fibrae/semi-ui-vue/tailwind.css';
@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`,
        },
        deps: { tailwindcss: '4.3.3', '@tailwindcss/vite': '4.3.3' },
        dev: dev(tailwindChecks),
        build,
        prod: prod(tailwindChecks),
    },
];

export default {
    deps: {
        vite: '8.3.5',
        '@vitejs/plugin-vue': '6.0.10',
        vue: '3.5.44',
        '@fibrae/semi-ui-vue': '*',
        '@fibrae/semi-vite-plugin': '*',
    },
    files: {
        'index.html': INDEX_HTML,
        'vite.config.ts': viteConfig('vue(), semi()', SEMI_IMPORT),
        'src/main.ts': MAIN_TOKENS,
        'src/App.vue': APP,
    },
    variants,
    expectedFailures: [],
} satisfies Host;
