// SolidStart 2 host as the getting-started page prescribes: `solidStart(), nitro(), semi({ omitCss: true })` with
// `styles.css` imported once. The dev server leaves CSS imported inside node_modules out of the server HTML unless
// `solidStart({ css: { filter } })` lets it in, which is why the page prefers the whole-package stylesheet.
import { allExports, idsStable, langIsolation, modalOpens, primaryButton, selectOpens, ssrText, tailwindCoexist, tailwindFirstPaint, toastShows, tooltipHover, tooltipOpen } from '../../../hosts/checks.ts';
import type { Files, Host, HostPage, PageCheck, ServerCheck, ServerStep, Variant } from '../../../hosts/types.ts';

const LAZY_TIMEOUT = 30_000;

// The root component runs onMount only once hydration has reached it, so the attribute marks a hydrated page
const hydrated = 'body[data-hydrated]';

// Dynamic imports (lottie-web, @mdx-js/mdx, shiki, tiptap) finish after hydration; wait for their output
function appears(name: string, selector: string): PageCheck {
    return {
        name,
        run: async ({ page }) => {
            await page.locator(selector).first().waitFor({ state: 'attached', timeout: LAZY_TIMEOUT });
        },
    };
}

const home: HostPage = {
    name: 'home',
    path: '/',
    ready: hydrated,
    checks: [ssrText('ssr-input', ['InputValueABC']), ssrText('ssr-typography', ['SemiTitle', 'SemiText']), ssrText('ssr-table', ['CellAlice', 'CellBob', 'CellCarol']), ssrText('ssr-datepicker', ['2026-10-01']), idsStable(), primaryButton('#btn-primary')],
};

// idsStable() comes first: the checks after it open overlays that add ids of their own
const interact: HostPage = {
    name: 'interact',
    path: '/interact',
    ready: hydrated,
    checks: [idsStable(), primaryButton('#btn-primary'), tooltipOpen('TipOpen'), selectOpens('.semi-select', 'OptA'), tooltipHover('#tip-trigger', 'TipClosed'), modalOpens('#open-modal', 'ModalBody'), toastShows('#toast-btn', 'ToastHello')],
};

const lazy: HostPage = {
    name: 'lazy',
    path: '/lazy',
    ready: hydrated,
    checks: [appears('lottie', '#lottie-box svg'), appears('markdown', '#md-box h1:has-text("MdTitle")'), appears('mdx', '#mdx-box b:has-text("MdxBold")'), appears('code-highlight', '#code-box pre.shiki'), appears('ai-chat-input', '#ai-box [contenteditable="true"]')],
};

const exportsPage: HostPage = {
    name: 'all-exports',
    path: '/all-exports',
    ready: hydrated,
    checks: [allExports('#all-exports')],
};

// The message is rendered by MarkdownRender, whose foundation imports CommonJS (style-to-js) through hast-util-to-jsx-runtime
const chat: HostPage = {
    name: 'chat',
    path: '/',
    ready: hydrated,
    checks: [appears('markdown', '#chat-box p:has-text("AssistantSays")')],
};

// The server HTML is checked directly: Solid's hydration keeps the server's attributes without comparing them, so a
// server rendering `semi-` raises no hydration warning
const prefixed: HostPage = {
    name: 'prefix',
    path: '/prefix',
    ready: hydrated,
    checks: [ssrText('ssr-prefix', ['my-button']), idsStable(), primaryButton('#btn-primary', 'my')],
};

const tailwind: HostPage = {
    name: 'tailwind',
    path: '/tailwind',
    ready: hydrated,
    checks: [tailwindCoexist(), tailwindFirstPaint()],
};

const lang: ServerCheck = langIsolation('/', { en: 'No Result', zh: '暂无数据' });

const UI = '@fibrae/semi-ui-solid';
const AI = '@fibrae/semi-ai-solid';

function viteConfig(plugins: string, imports = '') {
    return `import semi from '@fibrae/semi-vite-plugin';
import { solidStart } from '@solidjs/start/config';
${imports}import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [solidStart(), nitro(), ${plugins}],
});
`;
}

function app(stylesheets: string[]) {
    return `import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { onMount, Suspense } from 'solid-js';
${stylesheets.map((sheet) => `import '${sheet}';\n`).join('')}
export default function App() {
    return (
        <Router
            root={(props) => {
                onMount(() => document.body.setAttribute('data-hydrated', ''));
                return <Suspense>{props.children}</Suspense>;
            }}
        >
            <FileRoutes />
        </Router>
    );
}
`;
}

// Routes importing ui-solid, left out of the variant that installs only ai-solid: pnpm would not resolve the import there
const uiRoutes: Files = {
    'src/routes/index.tsx': `import { useSearchParams } from '@solidjs/router';
import en_US from '@fibrae/semi-ui-solid/locale/source/en_US';
import zh_CN from '@fibrae/semi-ui-solid/locale/source/zh_CN';
import { Button, ConfigProvider, DatePicker, Form, FormCheckbox, FormInput, FormSelect, Input, Pagination, Table, TabPane, Tabs, Typography } from '@fibrae/semi-ui-solid';

const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age' },
];
const data = [
    { key: '1', name: 'CellAlice', age: 31 },
    { key: '2', name: 'CellBob', age: 42 },
    { key: '3', name: 'CellCarol', age: 27 },
];

export default function Home() {
    const [params] = useSearchParams();
    const locale = () => (params.lang === 'zh' ? zh_CN : en_US);
    return (
        <ConfigProvider locale={locale()}>
            <main>
                <Typography.Title heading={3}>SemiTitle</Typography.Title>
                <Typography.Text>SemiText</Typography.Text>
                <Button id="btn-primary" theme="solid" type="primary">
                    Primary
                </Button>
                <Input value="InputValueABC" />
                <Table columns={columns} dataSource={data} pagination={false} />
                <Table columns={columns} dataSource={[]} pagination={false} />
                <DatePicker value={new Date(2026, 9, 1)} />
                <Form>
                    <FormInput field="name" label="Name" initValue="FormName" />
                    <FormSelect field="role" label="Role" initValue="admin">
                        <FormSelect.Option value="admin">Admin</FormSelect.Option>
                        <FormSelect.Option value="user">User</FormSelect.Option>
                    </FormSelect>
                    <FormCheckbox field="agree">Agree</FormCheckbox>
                </Form>
                <Tabs>
                    <TabPane tab="Tab1" itemKey="1">
                        Pane1
                    </TabPane>
                    <TabPane tab="Tab2" itemKey="2">
                        Pane2
                    </TabPane>
                </Tabs>
                <Pagination total={30} />
            </main>
        </ConfigProvider>
    );
}
`,
    'src/routes/interact.tsx': `import { createSignal } from 'solid-js';
import { Button, Modal, Select, Toast, Tooltip } from '@fibrae/semi-ui-solid';

export default function Interact() {
    const [visible, setVisible] = createSignal(false);
    return (
        <main>
            <Button id="btn-primary" theme="solid" type="primary">
                Primary
            </Button>
            <Select
                style={{ width: '200px' }}
                value="b"
                optionList={[
                    { value: 'a', label: 'OptA' },
                    { value: 'b', label: 'OptB' },
                ]}
            />
            <Tooltip content="TipClosed">
                <Button id="tip-trigger">Hover me</Button>
            </Tooltip>
            <Tooltip content="TipOpen" visible trigger="custom">
                <Button>Always</Button>
            </Tooltip>
            <Button id="open-modal" onClick={() => setVisible(true)}>
                Open Modal
            </Button>
            <Modal title="ModalTitle" visible={visible()} onCancel={() => setVisible(false)} onOk={() => setVisible(false)}>
                ModalBody
            </Modal>
            <Button id="toast-btn" onClick={() => Toast.info('ToastHello')}>
                Toast
            </Button>
        </main>
    );
}
`,
};

// `sheet` generates the `my`-prefixed stylesheet the app imports, the way a user runs it before dev and build
function variant(name: string, pages: HostPage[], checks: ServerCheck[], extra: Pick<Variant, 'files' | 'deps'>, sheet = false): Variant {
    const prepared = (command: string[]) => (sheet ? ['sh', '-c', 'semi-build-scss --prefix my -o src/semi-my.css && exec "$@"', 'sh', ...command] : command);
    const server = (command: string[]): ServerStep => ({ command, pages, checks });
    return {
        name,
        ...extra,
        dev: server(prepared(['vite', 'dev', '--port', '{port}', '--strictPort'])),
        build: { command: prepared(['vite', 'build']) },
        // The Nitro server reads PORT and fails to start when the port is taken
        prod: server(['node', '.output/server/index.mjs']),
    };
}

export default {
    deps: {
        // A user installs the plugin as a devDependency; the runner writes everything as dependencies. Each variant adds
        // the Semi component packages it uses; foundation and icons come in through them
        '@fibrae/semi-vite-plugin': '*',
        '@solidjs/router': '1.0.0',
        '@solidjs/start': '2.1.0',
        nitro: '3.0.260903-beta',
        'solid-js': '1.9.17',
        vite: '8.3.5',
    },
    files: {
        'tsconfig.json': JSON.stringify({
            compilerOptions: { target: 'ESNext', module: 'ESNext', moduleResolution: 'bundler', jsx: 'preserve', jsxImportSource: 'solid-js', strict: true, noEmit: true, types: ['vite/client', '@solidjs/start/env'], isolatedModules: true, skipLibCheck: true },
        }),
        'vite.config.ts': viteConfig('semi({ omitCss: true })'),
        'src/entry-client.tsx': `// @refresh reload
import { mount, StartClient } from '@solidjs/start/client';

mount(() => <StartClient />, document.getElementById('app')!);
`,
        'src/entry-server.tsx': `// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';

export default createHandler(() => (
    <StartServer
        document={({ assets, children, scripts }) => (
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    {assets}
                </head>
                <body>
                    <div id="app">{children}</div>
                    {scripts}
                </body>
            </html>
        )}
    />
));
`,
    },
    variants: [
        variant('default', [home, interact], [lang], { deps: { [UI]: '*' }, files: { 'src/app.tsx': app([`${UI}/styles.css`]), ...uiRoutes } }),
        variant('lazy', [lazy, exportsPage], [], {
            deps: { [UI]: '*', [AI]: '*' },
            files: {
                'src/app.tsx': app([`${UI}/styles.css`, `${AI}/styles.css`]),
                ...uiRoutes,
                // Client-only on purpose: the page checks that dynamically imported dependencies load in the browser
                'src/routes/lazy.tsx': `import { clientOnly } from '@solidjs/start';

const LazyParts = clientOnly(() => import('../lazy-parts'));

export default function Lazy() {
    return (
        <main>
            <LazyParts />
        </main>
    );
}
`,
                // The grammar is inline because the app does not depend on shiki; the themes still come from its dynamic imports
                'src/lazy-parts.tsx': `import { AIChatInput } from '@fibrae/semi-ai-solid';
import { CodeHighlight, Lottie, MarkdownRender } from '@fibrae/semi-ui-solid';

const animationData = { v: '5.7.4', fr: 30, ip: 0, op: 30, w: 100, h: 100, layers: [] };
const probeGrammar = { name: 'probe', scopeName: 'source.probe', repository: {}, patterns: [{ name: 'keyword', match: '\\\\b(?:const)\\\\b' }] };

export default function LazyParts() {
    return (
        <>
            <div id="lottie-box">
                <Lottie params={{ animationData, loop: false, autoplay: false }} width="100px" height="100px" />
            </div>
            <div id="md-box">
                <MarkdownRender format="md" raw={'# MdTitle\\n\\n- MdItem'} />
            </div>
            <div id="mdx-box">
                <MarkdownRender format="mdx" raw={'# MdxTitle\\n\\n<b>MdxBold</b>'} />
            </div>
            <div id="code-box">
                <CodeHighlight code={'const answer = 42;'} language="probe" languages={[probeGrammar]} />
            </div>
            <div id="ai-box">
                <AIChatInput />
            </div>
        </>
    );
}
`,
                'src/routes/all-exports.tsx': `import * as SemiAI from '@fibrae/semi-ai-solid';
import * as SemiUI from '@fibrae/semi-ui-solid';

export default function AllExports() {
    return <p id="all-exports">{Object.keys(SemiUI).length + Object.keys(SemiAI).length}</p>;
}
`,
            },
        }),
        // An app that installs ai-solid alone reaches ui-solid and foundation only through it, which pnpm keeps out of
        // the app's own resolution
        variant('ai-only', [chat], [], {
            deps: { [AI]: '*' },
            files: {
                'src/app.tsx': app([`${AI}/styles.css`]),
                // Client-only: the page checks the browser's dependency pre-bundle, not server rendering
                'src/routes/index.tsx': `import { clientOnly } from '@solidjs/start';

const ChatParts = clientOnly(() => import('../chat-parts'));

export default function Home() {
    return (
        <main>
            <ChatParts />
        </main>
    );
}
`,
                'src/chat-parts.tsx': `import { Chat } from '@fibrae/semi-ai-solid';

const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
const chats = [
    { role: 'user', id: '1', content: 'UserSays' },
    { role: 'assistant', id: '2', content: 'AssistantSays' },
];

export default function ChatParts() {
    return (
        <div id="chat-box">
            <Chat chats={chats} roleConfig={roleConfig} />
        </div>
    );
}
`,
            },
        }),
        // A custom prefix: no component CSS (`omitCss`), one stylesheet compiled with the same prefix
        variant(
            'prefix',
            [prefixed],
            [],
            {
                deps: { [UI]: '*', '@fibrae/semi-scss-compile': '*' },
                files: {
                    'vite.config.ts': viteConfig("semi({ prefixCls: 'my', omitCss: true })"),
                    'src/app.tsx': app(['./semi-my.css']),
                    'src/routes/prefix.tsx': `import { Button } from '@fibrae/semi-ui-solid';

export default function Prefix() {
    return (
        <main>
            <Button id="btn-primary" theme="solid" type="primary">
                Primary
            </Button>
        </main>
    );
}
`,
                },
            },
            true
        ),
        // The Tailwind page of the docs: the layer order comes before the Tailwind entry and Semi's stylesheet
        variant('tailwind', [tailwind], [], {
            deps: { [UI]: '*', '@tailwindcss/vite': '4.3.3', tailwindcss: '4.3.3' },
            files: {
                'vite.config.ts': viteConfig('semi({ omitCss: true }), tailwindcss()', "import tailwindcss from '@tailwindcss/vite';\n"),
                'src/semi-layer.css': '@layer theme, base, semi, components, utilities;\n',
                'src/tailwind.css': `@import 'tailwindcss';
@import '@fibrae/semi-ui-solid/tailwind.css';

@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`,
                'src/app.tsx': app(['./semi-layer.css', './tailwind.css', `${UI}/styles.css`]),
                'src/routes/tailwind.tsx': `import { Button } from '@fibrae/semi-ui-solid';

export default function Tailwind() {
    return (
        <main>
            <Button id="tw-padding" class="p-0" theme="solid" type="primary">
                Tailwind padding
            </Button>
            <div id="tw-alpha" class="bg-semi-color-primary/50">
                alpha
            </div>
            <div theme-mode="dark">
                <div id="tw-dark" class="bg-white dark:bg-black">
                    dark
                </div>
            </div>
        </main>
    );
}
`,
            },
        }),
    ],
    expectedFailures: [],
} satisfies Host;
