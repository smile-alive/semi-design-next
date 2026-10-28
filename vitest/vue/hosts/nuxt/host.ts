// Nuxt 4 with `@fibrae/semi-nuxt`, written the way the getting-started page tells users to: the module and nothing
// else, no styles.css, no noExternal.
import assert from 'node:assert';
import { allExports, idsStable, langIsolation, modalOpens, primaryButton, selectOpens, ssrText, tailwindCoexist, tailwindFirstPaint, toastShows, tooltipHover, tooltipOpen } from '../../../hosts/checks.ts';
import type { Host, HostPage, PageCheck, ServerStep, Variant } from '../../../hosts/types.ts';

// Production HTML of the page below: about 16KB while component CSS is only linked, about 450KB with an explicit
// `inlineStyles: true` (nuxt/B4). The limit sits between the two and holds because semi-nuxt turns inlineStyles off
// unless the app sets it. The `inline-styles` variant sets it, which is the app's own choice, so it has no size limit.
const MAX_HTML_BYTES = 64 * 1024;

const htmlSize: PageCheck = {
    name: 'html-size',
    run: async ({ html }) => assert.ok(Buffer.byteLength(html) < MAX_HTML_BYTES, `server HTML is ${Buffer.byteLength(html)} bytes, limit ${MAX_HTML_BYTES}`),
};

function config(options: string, imports = '') {
    return `${imports}export default defineNuxtConfig({
    compatibilityDate: '2026-10-01',
    devtools: { enabled: false },
    telemetry: false,
    modules: ['@fibrae/semi-nuxt'],
${options}});
`;
}

const page = `<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import { IconHome } from '@fibrae/semi-icons-vue';
    import { Button, ConfigProvider, DatePicker, Form, FormCheckbox, FormInput, FormSelect, Input, Modal, Select, TabPane, Table, Tabs, Toast, Tooltip, TypographyText, TypographyTitle } from '@fibrae/semi-ui-vue';
    import en_US from '@fibrae/semi-ui-vue/locale/source/en_US';
    import zh_CN from '@fibrae/semi-ui-vue/locale/source/zh_CN';

    const route = useRoute();
    const lang = computed(() => (route.query.lang === 'zh' ? 'zh' : 'en'));
    const locale = computed(() => (lang.value === 'zh' ? zh_CN : en_US));

    const hydrated = ref(false);
    onMounted(() => {
        hydrated.value = true;
    });

    const inputValue = ref('probe-input-value');
    const selectValue = ref('b');
    const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
        { value: 'c', label: 'Option C' },
    ];
    const modalVisible = ref(false);
    const columns = [
        { title: 'Name', dataIndex: 'name' },
        { title: 'Age', dataIndex: 'age' },
    ];
    const data = [
        { key: '1', name: 'cell-alice', age: 31 },
        { key: '2', name: 'cell-bob', age: 32 },
        { key: '3', name: 'cell-carol', age: 33 },
    ];
    const date = new Date(2026, 9, 1);
</script>

<template>
    <ConfigProvider :locale="locale">
        <main>
            <span v-if="hydrated" data-hydrated hidden />
            <p>lang={{ lang }}</p>
            <TypographyTitle :heading="3">Probe title</TypographyTitle>
            <TypographyText>Probe text</TypographyText>
            <IconHome />
            <Button id="primary-button" type="primary" theme="solid">Primary button</Button>
            <Input v-model="inputValue" id="probe-input" />
            <Select v-model="selectValue" id="probe-select" :optionList="options" :style="{ width: '200px' }" />
            <Tooltip>
                <Button id="tooltip-trigger">Hover me</Button>
                <template #content>closed tooltip content</template>
            </Tooltip>
            <Tooltip :visible="true" trigger="custom">
                <Button id="tooltip-open-trigger">Always open</Button>
                <template #content>open tooltip content</template>
            </Tooltip>
            <Button id="open-modal" @click="modalVisible = true">Open modal</Button>
            <Modal v-model:visible="modalVisible" title="Probe modal">Probe modal body</Modal>
            <Table :columns="columns" :dataSource="data" :pagination="false" />
            <DatePicker :modelValue="date" />
            <Form>
                <FormInput field="name" label="Name" initValue="form-name" />
                <FormSelect field="role" label="Role" :optionList="options" />
                <FormCheckbox field="agree">Agree</FormCheckbox>
            </Form>
            <Tabs>
                <TabPane tab="Tab one" itemKey="1">Pane one</TabPane>
                <TabPane tab="Tab two" itemKey="2">Pane two</TabPane>
                <TabPane tab="Tab three" itemKey="3">Pane three</TabPane>
            </Tabs>
            <Button id="toast-button" @click="Toast.info('probe toast')">Toast</Button>
        </main>
    </ConfigProvider>
</template>
`;

// Kept off the home page: the namespace imports pull in every component, which would bury what the home page measures
const exportsPage = `<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import * as ai from '@fibrae/semi-ai-vue';
    import * as ui from '@fibrae/semi-ui-vue';

    const count = Object.keys(ui).length + Object.keys(ai).length;
    const hydrated = ref(false);
    onMounted(() => {
        hydrated.value = true;
    });
</script>

<template>
    <main>
        <span v-if="hydrated" data-hydrated hidden />
        <p id="export-count">{{ count }}</p>
    </main>
</template>
`;

const tailwindPage = `<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { Button } from '@fibrae/semi-ui-vue';

    const hydrated = ref(false);
    onMounted(() => {
        hydrated.value = true;
    });
</script>

<template>
    <main>
        <span v-if="hydrated" data-hydrated hidden />
        <Button id="tw-padding" class="p-0" type="primary" theme="solid">Tailwind padding</Button>
        <div id="tw-alpha" class="bg-semi-color-primary/50">Tailwind alpha</div>
        <div theme-mode="dark">
            <div id="tw-dark" class="bg-white dark:bg-black">Tailwind dark</div>
        </div>
    </main>
</template>
`;

// The Tailwind page of the docs, Nuxt section: the layer order sits in the Tailwind entry itself, because Nuxt's dev SSR
// links a separate semi-layer.css after tailwind.css, which leaves Semi above the utilities until hydration
function tailwindFiles(options = '') {
    return {
        'nuxt.config.ts': config(`    css: ['~/assets/css/tailwind.css'],\n    vite: { plugins: [tailwindcss()] },\n${options}`, "import tailwindcss from '@tailwindcss/vite';\n\n"),
        'app/assets/css/tailwind.css': "@layer theme, base, semi, components, utilities;\n\n@import 'tailwindcss';\n@import '@fibrae/semi-ui-vue/tailwind.css';\n\n@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));\n",
        'app/pages/tailwind.vue': tailwindPage,
    };
}
const tailwindDeps = { tailwindcss: '4.3.3', '@tailwindcss/vite': '4.3.3' };

function homePage(extra: PageCheck[] = [], prefixCls?: string): HostPage {
    return {
        name: 'home',
        path: '/',
        ready: '[data-hydrated]',
        // idsStable stays ahead of the checks that open overlays
        checks: [
            ssrText('ssr-input', ['probe-input-value']),
            ssrText('ssr-table', ['cell-alice', 'cell-bob', 'cell-carol']),
            ssrText('ssr-datepicker', ['2026-10-01']),
            primaryButton('#primary-button', prefixCls),
            tooltipOpen('open tooltip content'),
            idsStable(),
            selectOpens('#probe-select', 'Option C'),
            tooltipHover('#tooltip-trigger', 'closed tooltip content'),
            modalOpens('#open-modal', 'Probe modal body'),
            toastShows('#toast-button', 'probe toast'),
            ...extra,
        ],
    };
}

// The page puts the DatePicker placeholder in the server HTML, which is what tells the two locales apart
const lang = langIsolation('/', { en: 'placeholder="Select date"', zh: 'placeholder="请选择日期"' });

const exportsPageChecks: HostPage = { name: 'exports', path: '/exports', ready: '[data-hydrated]', checks: [allExports('#export-count')] };
const tailwindPageChecks: HostPage = { name: 'tailwind', path: '/tailwind', ready: '[data-hydrated]', checks: [tailwindCoexist(), tailwindFirstPaint()] };

interface StepOptions {
    // Extra checks on the home page
    home?: PageCheck[];
    pages?: HostPage[];
    prefixCls?: string;
}

function dev({ home = [], pages = [], prefixCls }: StepOptions = {}): ServerStep {
    return {
        // --strictPort: without it the CLI moves to another port when this one is taken
        command: ['nuxt', 'dev', '--port', '{port}', '--strictPort'],
        pages: [homePage(home, prefixCls), ...pages],
        checks: [lang],
    };
}

function prod({ home = [], pages = [], prefixCls }: StepOptions = {}): ServerStep {
    // The Nitro server listens on exactly the PORT the runner sets and exits if it is taken
    return {
        command: ['node', '.output/server/index.mjs'],
        pages: [homePage(home, prefixCls), ...pages],
        checks: [lang],
    };
}

const build = {
    command: ['nuxt', 'build'],
};

const variants: Variant[] = [
    // inlineStyles only acts on the production render, so only prod checks the size
    {
        name: 'default',
        files: { 'app/pages/exports.vue': exportsPage },
        deps: { '@fibrae/semi-ai-vue': '*' },
        dev: dev({ pages: [exportsPageChecks] }),
        build,
        prod: prod({ home: [htmlSize], pages: [exportsPageChecks] }),
    },
    {
        name: 'vite-environment-api',
        files: { 'nuxt.config.ts': config('    experimental: { viteEnvironmentApi: true },\n') },
        dev: dev(),
        build,
        prod: prod(),
    },
    {
        // Dev is left out: inlineStyles only acts on the production render
        name: 'inline-styles',
        files: { 'nuxt.config.ts': config('    features: { inlineStyles: true },\n') },
        build,
        prod: prod(),
    },
    {
        name: 'prefix',
        files: { 'nuxt.config.ts': config("    semi: { prefixCls: 'my' },\n") },
        dev: dev({ prefixCls: 'my' }),
        build,
        prod: prod({ prefixCls: 'my' }),
    },
    {
        name: 'omit-css',
        files: { 'nuxt.config.ts': config("    semi: { omitCss: true },\n    css: ['@fibrae/semi-ui-vue/styles.css'],\n") },
        dev: dev(),
        build,
        prod: prod(),
    },
    {
        name: 'tailwind',
        files: tailwindFiles(),
        deps: tailwindDeps,
        dev: dev({ pages: [tailwindPageChecks] }),
        build,
        prod: prod({ pages: [tailwindPageChecks] }),
    },
    {
        // Inlining moves the layer order into a <style> ahead of the component <link>s, a different order to verify
        name: 'tailwind-inline-styles',
        files: tailwindFiles('    features: { inlineStyles: true },\n'),
        deps: tailwindDeps,
        build,
        prod: prod({ pages: [tailwindPageChecks] }),
    },
];

export default {
    deps: {
        nuxt: '4.6.2',
        vue: '3.5.44',
        'vue-router': '5.4.0',
        '@fibrae/semi-ui-vue': '*',
        '@fibrae/semi-icons-vue': '*',
        '@fibrae/semi-nuxt': '*',
    },
    files: {
        'nuxt.config.ts': config(''),
        'app/app.vue': '<template>\n    <NuxtPage />\n</template>\n',
        'app/pages/index.vue': page,
    },
    variants,
    expectedFailures: [],
} satisfies Host;
