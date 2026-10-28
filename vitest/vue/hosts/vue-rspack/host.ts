// Client-only Vue 3 on Rspack 2 with vue-loader. The getting-started page says Rspack needs a rule that treats `.css`
// imports as CSS (`type: 'css'`) and no Semi plugin for the default prefix.
import { modalOpens, primaryButton } from '../../../hosts/checks.ts';
import type { Host, ServerStep } from '../../../hosts/types.ts';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Semi host</title>
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
`;

// The feature flags are Vue's own requirement for bundlers using its esm-bundler build; without them Vue warns in dev
const RSPACK_CONFIG = `import { rspack } from '@rspack/core';
import { VueLoaderPlugin } from 'vue-loader';

export default {
    entry: './src/main.js',
    output: { filename: '[name].[contenthash].js', clean: true },
    resolve: { extensions: ['...', '.vue'] },
    module: {
        rules: [
            { test: /\\.vue$/, loader: 'vue-loader' },
            { test: /\\.s?css$/, type: 'css' },
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new rspack.HtmlRspackPlugin({ template: './index.html' }),
        new rspack.DefinePlugin({ __VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false }),
    ],
};
`;

const MAIN = `import '@fibrae/semi-ui-vue/tokens';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`;

// Appears only after mount: the server response is an empty #app
const APP = `<script setup>
    import { onMounted, ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    onMounted(() => {
        document.body.dataset.hydrated = '';
    });

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

const checks = [primaryButton('#primary-button'), modalOpens('#open-modal', 'Host modal body')];
const pages = [{ name: 'home', path: '/', ready: 'body[data-hydrated]', checks }];

// The Rspack dev server exits when an explicit port is taken
const dev: ServerStep = { command: ['rspack', 'serve', '--mode', 'development', '--port', '{port}'], pages };

// The built app is static files
const prod: ServerStep = { command: ['serve', 'dist', '--listen', '{port}', '--no-port-switching'], pages };

export default {
    deps: {
        '@rspack/core': '2.2.9',
        '@rspack/cli': '2.2.9',
        '@rspack/dev-server': '2.2.1',
        'vue-loader': '17.4.2',
        serve: '14.2.6',
        vue: '3.5.44',
        '@fibrae/semi-ui-vue': '*',
    },
    files: {
        'index.html': INDEX_HTML,
        'rspack.config.mjs': RSPACK_CONFIG,
        'src/main.js': MAIN,
        'src/App.vue': APP,
    },
    variants: [{ name: 'default', dev, build: { command: ['rspack', 'build', '--mode', 'production'] }, prod }],
    expectedFailures: [],
} satisfies Host;
