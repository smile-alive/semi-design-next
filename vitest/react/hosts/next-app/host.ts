// Next.js 16 App Router host. The variants follow the target usage: `--webpack` needs no configuration, Turbopack and
// custom prefixes go through `semiNext()`. The app is plain JSX because Next type-checks the whole app at build time and
// a type error would hide the SSR failures this host exists to find. Host sources are strings; the runner writes them out.
import { allExports, idsStable, langIsolation, modalOpens, primaryButton, selectOpens, ssrText, tailwindCoexist, tailwindFirstPaint, toastShows, tooltipHover, tooltipOpen } from '../../../hosts/checks.ts';
import type { Files, Host, HostPage, PageCheck, ServerCheck, Variant } from '../../../hosts/types.ts';

// Set by `hydrated.jsx` once React has hydrated the page
const READY = 'body[data-hydrated]';
const LAZY_TIMEOUT = 30_000;
const SHEET_COMMAND = 'semi-build-scss --prefix my -o app/semi-my.css';

const layout = `export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
`;

const prefixedLayout = `import './semi-my.css';

${layout}`;

// The Tailwind page of the docs: the layer order comes first, and the root layout loads before every page
const tailwindLayout = `import './semi-layer.css';
import './tailwind.css';

${layout}`;

const tailwindFiles: Files = {
    'postcss.config.mjs': `export default {
    plugins: {
        '@tailwindcss/postcss': {},
    },
};
`,
    'app/semi-layer.css': '@layer theme, base, semi, components, utilities;\n',
    'app/tailwind.css': `@import 'tailwindcss';
@import '@fibrae/semi-ui-react/tailwind.css';

@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`,
    'app/layout.jsx': tailwindLayout,
    'app/tailwind/page.jsx': `import { Button } from '@fibrae/semi-ui-react';
import Hydrated from '../hydrated';

export default function Page() {
    return (
        <main>
            <Button id="tw-padding" className="p-0" theme="solid" type="primary">
                Tailwind padding
            </Button>
            <div id="tw-alpha" className="bg-semi-color-primary/50">
                alpha
            </div>
            <div theme-mode="dark">
                <div id="tw-dark" className="bg-white dark:bg-black">
                    dark
                </div>
            </div>
            <Hydrated />
        </main>
    );
}
`,
};

const allExportsPageSource = `'use client';

import * as SemiAI from '@fibrae/semi-ai-react';
import * as SemiUI from '@fibrae/semi-ui-react';
import Hydrated from '../hydrated';

export default function Page() {
    return (
        <main>
            <p id="all-exports">{Object.keys(SemiUI).length + Object.keys(SemiAI).length}</p>
            <Hydrated />
        </main>
    );
}
`;

const hydrated = `'use client';

import { useEffect } from 'react';

export default function Hydrated() {
    useEffect(() => {
        document.body.dataset.hydrated = '';
    }, []);
    return null;
}
`;

const demo = `'use client';

import { Button, DatePicker, Form, Input, Modal, Select, Table, TabPane, Tabs, Toast, Tooltip, Typography } from '@fibrae/semi-ui-react';
import { IconHome } from '@fibrae/semi-icons-react';
import { useState } from 'react';
import Hydrated from './hydrated';

const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age' },
];
const rows = [
    { key: '1', name: 'CellAlice', age: 31 },
    { key: '2', name: 'CellBob', age: 42 },
    { key: '3', name: 'CellCarol', age: 27 },
];
const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
];

export default function Demo() {
    const [modal, setModal] = useState(false);
    return (
        <div>
            <Typography.Title heading={3}>Semi Probe Title</Typography.Title>
            <Typography.Text>Semi probe text</Typography.Text>
            <IconHome id="probe-icon" />
            <Button id="probe-button" theme="solid" type="primary">
                Primary
            </Button>
            <Input id="probe-input" value="input-value-xyz" onChange={() => {}} />
            <Select id="probe-select" value="banana" optionList={options} style={{ width: 200 }} />
            <Tooltip content="closed tooltip content">
                <Button id="probe-tooltip-trigger">Hover me</Button>
            </Tooltip>
            <Tooltip content="always open tooltip" trigger="custom" visible>
                <span id="probe-tooltip-open">Open tooltip anchor</span>
            </Tooltip>
            <Button id="probe-modal-open" onClick={() => setModal(true)}>
                Open modal
            </Button>
            <Modal title="Probe modal" visible={modal} onCancel={() => setModal(false)} onOk={() => setModal(false)}>
                Probe modal body
            </Modal>
            <Button id="probe-toast" onClick={() => Toast.info('probe toast message')}>
                Toast
            </Button>
            <Table id="probe-table" columns={columns} dataSource={rows} pagination={false} />
            <Table id="probe-empty-table" columns={columns} dataSource={[]} pagination={false} />
            <DatePicker id="probe-date" value={new Date(2026, 9, 1)} />
            <Form id="probe-form" initValues={{ name: 'form-name', fruit: 'apple', agree: true }}>
                <Form.Input field="name" label="Name" />
                <Form.Select field="fruit" label="Fruit" optionList={options} style={{ width: 200 }} />
                <Form.Checkbox field="agree">Agree</Form.Checkbox>
            </Form>
            <Tabs id="probe-tabs">
                <TabPane tab="TabOne" itemKey="1">
                    Panel one
                </TabPane>
                <TabPane tab="TabTwo" itemKey="2">
                    Panel two
                </TabPane>
                <TabPane tab="TabThree" itemKey="3">
                    Panel three
                </TabPane>
            </Tabs>
            <Hydrated />
        </div>
    );
}
`;

const demoPageSource = `import Demo from '../semi-demo';

export default function Page() {
    return <Demo />;
}
`;

const streamPageSource = `import { Suspense } from 'react';
import Demo from '../semi-demo';

// Prerendering would resolve the Suspense boundary at build time, leaving nothing to stream
export const dynamic = 'force-dynamic';

async function Slow() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return <Demo />;
}

export default function Page() {
    return (
        <main>
            <p>stream shell</p>
            <Suspense fallback={<p>stream fallback</p>}>
                <Slow />
            </Suspense>
        </main>
    );
}
`;

const heavy = `'use client';

import { CodeHighlight, JsonViewer, MarkdownRender } from '@fibrae/semi-ui-react';
import { AIChatDialogue } from '@fibrae/semi-ai-react';
import Hydrated from './hydrated';

// Without a registered language highlight() returns '' and shiki never loads
CodeHighlight.register({ languages: [() => import('shiki/langs/javascript.mjs')] });

// data: avatars keep headless Chromium from logging failed network loads
const avatar = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const roleConfig = {
    user: { name: 'User', avatar },
    assistant: { name: 'Assistant', avatar },
};
const chats = [
    { id: 'c1', role: 'user', content: 'dialogue-user-msg', status: 'completed' },
    { id: 'c2', role: 'assistant', content: '## dialogue-heading\\n\\ndialogue-assistant-msg', status: 'completed' },
];
const jsonValue = JSON.stringify({ jsonProbeKey: 'json-probe-value', n: 1 }, null, 2);

export default function Heavy() {
    return (
        <div>
            <CodeHighlight id="probe-code" code={'const codeProbe = 42;\\n'} language="javascript" />
            <JsonViewer id="probe-json" value={jsonValue} width={400} height={120} />
            <MarkdownRender id="probe-md" format="md" raw={'# md-probe-heading\\n\\nmd-probe-text'} />
            <AIChatDialogue id="probe-dialogue" chats={chats} roleConfig={roleConfig} />
            <Hydrated />
        </div>
    );
}
`;

const heavyPageSource = `import Heavy from '../semi-heavy';

export default function Page() {
    return <Heavy />;
}
`;

const langDemo = `'use client';

import { ConfigProvider, DatePicker, Table } from '@fibrae/semi-ui-react';
import en_US from '@fibrae/semi-ui-react/locale/source/en_US';
import zh_CN from '@fibrae/semi-ui-react/locale/source/zh_CN';
import Hydrated from './hydrated';

const columns = [{ title: 'Name', dataIndex: 'name' }];

export default function LangDemo({ lang }) {
    return (
        <ConfigProvider locale={lang === 'zh' ? zh_CN : en_US}>
            <main data-lang={lang}>
                <Table columns={columns} dataSource={[]} pagination={false} />
                <DatePicker />
                <Hydrated />
            </main>
        </ConfigProvider>
    );
}
`;

const langPageSource = `import LangDemo from '../semi-lang';

export default async function Page({ searchParams }) {
    const { lang } = await searchParams;
    return <LangDemo lang={lang === 'zh' ? 'zh' : 'en'} />;
}
`;

// No 'use client' on this route: Semi's dist modules carry the directive, so compound parts are imported by name
const rscPageSource = `import { Button, Input, Tooltip, TypographyText, TypographyTitle } from '@fibrae/semi-ui-react';
import { IconHome } from '@fibrae/semi-icons-react';
import Hydrated from '../hydrated';

export default function Page() {
    return (
        <main>
            <TypographyTitle heading={3}>rsc title</TypographyTitle>
            <TypographyText>rsc text</TypographyText>
            <IconHome id="rsc-icon" />
            <Button id="rsc-button" theme="solid" type="primary">
                rsc button
            </Button>
            <Input id="rsc-input" defaultValue="rsc-input-value" />
            <Tooltip content="rsc tooltip content">
                <Button id="rsc-tooltip-trigger">rsc hover</Button>
            </Tooltip>
            <Hydrated />
        </main>
    );
}
`;

const configSource = (options: string) => `import semiNext from '@fibrae/semi-next';

export default semiNext(${options})({});
`;

// Each variant gets only the routes it checks: one failing route would otherwise fail every build
const demoRoute: Files = { 'app/semi-demo.jsx': demo, 'app/demo/page.jsx': demoPageSource };
const clientRoutes: Files = {
    ...demoRoute,
    'app/stream/page.jsx': streamPageSource,
    'app/semi-heavy.jsx': heavy,
    'app/heavy/page.jsx': heavyPageSource,
    'app/semi-lang.jsx': langDemo,
    'app/lang/page.jsx': langPageSource,
    'app/all-exports/page.jsx': allExportsPageSource,
};

function demoChecks(prefixCls?: string): PageCheck[] {
    return [
        ssrText('ssr-input', ['input-value-xyz']),
        ssrText('ssr-table', ['CellAlice', 'CellBob', 'CellCarol']),
        ssrText('ssr-date', ['2026-10-01']),
        idsStable(),
        primaryButton('#probe-button', prefixCls),
        tooltipOpen('always open tooltip'),
        selectOpens('#probe-select', 'Cherry'),
        tooltipHover('#probe-tooltip-trigger', 'closed tooltip content'),
        modalOpens('#probe-modal-open', 'Probe modal body'),
        toastShows('#probe-toast', 'probe toast message'),
    ];
}

// Heavy components finish after hydration: shiki, the JSON worker and the Markdown compiler load lazily
function visibleText(name: string, selector: string, ...texts: string[]): PageCheck {
    return {
        name,
        run: async ({ page }) => {
            await Promise.all(texts.map((text) => page.locator(selector).getByText(text).first().waitFor({ state: 'visible', timeout: LAZY_TIMEOUT })));
        },
    };
}

const codeHighlighted: PageCheck = {
    name: 'code-highlight',
    run: async ({ page }) => page.locator('#probe-code .shiki, #probe-code span[style]').first().waitFor({ state: 'attached', timeout: LAZY_TIMEOUT }),
};

const demoPage = (prefixCls?: string): HostPage => ({ name: 'demo', path: '/demo', ready: READY, checks: demoChecks(prefixCls) });

// The fallback is in the response only if the boundary really streamed
const streamPage: HostPage = { name: 'stream', path: '/stream', ready: READY, checks: [ssrText('streamed', ['stream shell', 'stream fallback']), ...demoChecks()] };

const heavyPage: HostPage = {
    name: 'heavy',
    path: '/heavy',
    ready: READY,
    checks: [
        ssrText('ssr-code', ['codeProbe']),
        // Only `format: 'md'` compiles on the server (A6); `mdx` stays a client-side compile
        ssrText('ssr-markdown', ['md-probe-text']),
        idsStable(),
        codeHighlighted,
        visibleText('json-viewer', '#probe-json', 'jsonProbeKey'),
        visibleText('markdown', '#probe-md h1', 'md-probe-heading'),
        visibleText('dialogue', '#probe-dialogue', 'dialogue-user-msg', 'dialogue-assistant-msg'),
    ],
};

// Not named `lang`: langIsolation() is the server check of that name and ids must be unique within a step
const localePage: HostPage = { name: 'locale', path: '/lang', ready: READY, checks: [ssrText('ssr-locale', ['No Result']), idsStable()] };

const rscPage: HostPage = {
    name: 'rsc',
    path: '/rsc',
    ready: READY,
    checks: [ssrText('ssr-rsc', ['rsc title', 'rsc text', 'rsc-input-value']), idsStable(), primaryButton('#rsc-button'), tooltipHover('#rsc-tooltip-trigger', 'rsc tooltip content')],
};

const allExportsPage: HostPage = { name: 'all-exports', path: '/all-exports', ready: READY, checks: [allExports('#all-exports')] };

const tailwindPage: HostPage = { name: 'tailwind', path: '/tailwind', ready: READY, checks: [tailwindCoexist(), tailwindFirstPaint()] };

const clientPages = [demoPage(), streamPage, heavyPage, localePage, allExportsPage];

const langChecks: ServerCheck[] = [langIsolation('/lang', { en: 'No Result', zh: '暂无数据' })];

const tailwindDeps = { '@tailwindcss/postcss': '4.3.3', tailwindcss: '4.3.3' };

interface VariantOptions {
    files: Files;
    deps?: Record<string, string>;
    // `next dev` and `next build` use Turbopack unless told otherwise
    webpack: boolean;
    // Generates the `my`-prefixed stylesheet the layout imports, the way a user runs it before dev and build
    sheet?: boolean;
    pages: HostPage[];
    serverChecks?: ServerCheck[];
}

function variant(name: string, { files, deps, webpack, sheet = false, pages, serverChecks }: VariantOptions): Variant {
    const bundler = webpack ? ['--webpack'] : [];
    const prepared = (command: string[]) => (sheet ? ['sh', '-c', `${SHEET_COMMAND} && exec "$@"`, 'sh', ...command] : command);
    return {
        name,
        files,
        deps,
        env: { NEXT_TELEMETRY_DISABLED: '1' },
        dev: { command: prepared(['next', 'dev', ...bundler, '--port', '{port}']), pages, checks: serverChecks },
        build: { command: prepared(['next', 'build', ...bundler]) },
        prod: { command: ['next', 'start', '--port', '{port}'], pages, checks: serverChecks },
    };
}

export default {
    deps: {
        '@fibrae/semi-ai-react': '*',
        '@fibrae/semi-icons-react': '*',
        '@fibrae/semi-next': '*',
        '@fibrae/semi-scss-compile': '*',
        '@fibrae/semi-ui-react': '*',
        next: '16.4.3',
        react: '19.3.1',
        'react-dom': '19.3.1',
        // CodeHighlight takes its languages from the app, which must import them from shiki
        shiki: '4.5.0',
    },
    files: {
        'app/layout.jsx': layout,
        'app/hydrated.jsx': hydrated,
    },
    variants: [
        // Section 0 of the SSR plan: App Router under --webpack needs no configuration at all
        variant('webpack', { files: clientRoutes, webpack: true, pages: clientPages, serverChecks: langChecks }),
        variant('turbopack', {
            files: { ...clientRoutes, 'next.config.mjs': configSource('') },
            webpack: false,
            pages: clientPages,
            serverChecks: langChecks,
        }),
        // The demo route shows the other components keep their styles under Preflight, and gives the build popover CSS
        variant('tailwind', { files: { ...demoRoute, ...tailwindFiles }, deps: tailwindDeps, webpack: true, pages: [demoPage(), tailwindPage] }),
        variant('tailwind-turbopack', {
            files: { ...demoRoute, ...tailwindFiles, 'next.config.mjs': configSource('') },
            deps: tailwindDeps,
            webpack: false,
            pages: [demoPage(), tailwindPage],
        }),
        // A custom prefix under Turbopack: no component CSS (`omitCss`), one stylesheet compiled with the same prefix
        variant('prefix', {
            files: { ...demoRoute, 'app/layout.jsx': prefixedLayout, 'next.config.mjs': configSource("{ prefixCls: 'my', omitCss: true }") },
            webpack: false,
            sheet: true,
            pages: [demoPage('my')],
        }),
        // Server Components on their own: every module of the app is built, so a route that cannot build must not share
        // an app with the other variants
        variant('rsc', { files: { 'app/rsc/page.jsx': rscPageSource }, webpack: true, pages: [rscPage] }),
    ],
    expectedFailures: [
        // Dev only, prod passes: the Server Component's <Button> reaches the browser's Tooltip as a lazy RSC element, which
        // isValidElement() rejects, so the client wraps it in a span the server did not render. The runner keeps only the
        // first 400 characters of a console message, which end before React's markup diff, so the evidence is the generic
        // message; the page has one Tooltip, the only known cause
        { check: 'rsc/dev/rsc/console', issue: 'Tooltip（及 Popover、Dropdown）', evidence: "Hydration failed because the server rendered HTML didn't match the client" },
    ],
} satisfies Host;
