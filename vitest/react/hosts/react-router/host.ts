// React Router 8 framework mode with the Semi Vite plugin (`plugins: [semi(), reactRouter()]`), plus the RSC mode.
import { allExports, idsStable, langIsolation, modalOpens, primaryButton, selectOpens, ssrText, tailwindCoexist, tailwindFirstPaint, toastShows, tooltipHover, tooltipOpen } from '../../../hosts/checks.ts';
import type { Host, HostPage, PageCheck, ServerStep } from '../../../hosts/types.ts';

// Appears only after hydration: the effect never runs on the server
const HYDRATED = `'use client';

import { useEffect } from 'react';

export function Hydrated() {
    useEffect(() => {
        document.body.dataset.hydrated = '';
    }, []);
    return null;
}
`;

const SEMI_PAGE = `import { useState } from 'react';
import {
    Button,
    ConfigProvider,
    DatePicker,
    Form,
    Input,
    Modal,
    Select,
    Table,
    TabPane,
    Tabs,
    Toast,
    Tooltip,
    Typography,
    type ConfigProviderProps,
} from '@fibrae/semi-ui-react';
import { IconHome } from '@fibrae/semi-icons-react';

const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age' },
];
const data = [
    { key: '1', name: 'CellAlice', age: 31 },
    { key: '2', name: 'CellBob', age: 42 },
    { key: '3', name: 'CellCarol', age: 27 },
];
const options = [
    { value: 'a', label: 'OptA' },
    { value: 'b', label: 'OptB' },
    { value: 'c', label: 'OptC' },
];

export function SemiPage({ locale }: { locale: ConfigProviderProps['locale'] }) {
    const [text, setText] = useState('InputValueProbe');
    const [modal, setModal] = useState(false);
    return (
        <ConfigProvider locale={locale}>
            <Typography.Title heading={3}>ProbeTitle</Typography.Title>
            <Typography.Text>ProbeText</Typography.Text>
            <IconHome id="icon-home" />
            <div>
                <Button id="btn-primary" type="primary" theme="solid">
                    Primary
                </Button>
                <Button id="btn-toast" onClick={() => Toast.info('ToastShown')}>
                    Toast
                </Button>
                <Button id="btn-modal" onClick={() => setModal(true)}>
                    Open Modal
                </Button>
            </div>
            <Input id="input-probe" value={text} onChange={setText} style={{ width: 240 }} />
            <Select id="select-probe" defaultValue="b" optionList={options} style={{ width: 200 }} />
            <Tooltip content="TooltipHover">
                <span id="tooltip-trigger">hover me</span>
            </Tooltip>
            <Tooltip content="TooltipOpenByDefault" visible trigger="custom">
                <span id="tooltip-open">always</span>
            </Tooltip>
            <Modal title="ModalTitle" visible={modal} onCancel={() => setModal(false)} onOk={() => setModal(false)}>
                ModalBody
            </Modal>
            <Table columns={columns} dataSource={data} pagination={false} />
            <DatePicker defaultValue={new Date(2026, 9, 1)} />
            <Form initValues={{ name: 'FormName', fruit: 'a', agree: true }}>
                <Form.Input field="name" label="Name" />
                <Form.Select field="fruit" label="Fruit" optionList={options} style={{ width: 200 }} />
                <Form.Checkbox field="agree">Agree</Form.Checkbox>
            </Form>
            <Tabs>
                <TabPane tab="Tab1" itemKey="1">
                    Pane1
                </TabPane>
                <TabPane tab="Tab2" itemKey="2">
                    Pane2
                </TabPane>
                <TabPane tab="Tab3" itemKey="3">
                    Pane3
                </TabPane>
            </Tabs>
        </ConfigProvider>
    );
}
`;

const HOME = `import en_US from '@fibrae/semi-ui-react/locale/source/en_US';
import { SemiPage } from '../semi-page';

export default function Home() {
    return <SemiPage locale={en_US} />;
}
`;

const LANG = `import en_US from '@fibrae/semi-ui-react/locale/source/en_US';
import zh_CN from '@fibrae/semi-ui-react/locale/source/zh_CN';
import { useLoaderData } from 'react-router';
import { SemiPage } from '../semi-page';

export function loader({ request }: { request: Request }) {
    return { lang: new URL(request.url).searchParams.get('lang') === 'zh' ? 'zh' : 'en' };
}

export default function Lang() {
    const { lang } = useLoaderData<typeof loader>();
    return (
        <div data-lang={lang}>
            <SemiPage locale={lang === 'zh' ? zh_CN : en_US} />
        </div>
    );
}
`;

// A variant registers only the extra routes it checks, so the other variants never build them
function routes(...extra: string[]) {
    return `import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [${["index('routes/home.tsx')", "route('lang', 'routes/lang.tsx')", ...extra].join(', ')}] satisfies RouteConfig;
`;
}

const ALL_EXPORTS = `import * as SemiAI from '@fibrae/semi-ai-react';
import * as SemiUI from '@fibrae/semi-ui-react';

export default function AllExports() {
    return <p id="all-exports">{Object.keys(SemiUI).length + Object.keys(SemiAI).length}</p>;
}
`;

const TAILWIND_PAGE = `import { Button } from '@fibrae/semi-ui-react';

export default function Tailwind() {
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
        </main>
    );
}
`;

const TAILWIND_CSS = `@import 'tailwindcss';
@import '@fibrae/semi-ui-react/tailwind.css';

@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`;

const TAILWIND_VITE_CONFIG = `import { reactRouter } from '@react-router/dev/vite';
import semi from '@fibrae/semi-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [tailwindcss(), semi(), reactRouter()],
});
`;

// Layout is shared by both apps; the RSC app has no Scripts because the framework injects its own bootstrap
function root({ appPath, scripts, css = [] }: { appPath: string; scripts: boolean; css?: string[] }) {
    return `${css.map((file) => `import '${file}';\n`).join('')}import type { ReactNode } from 'react';
import { Links, Meta, Outlet, ${scripts ? 'Scripts, ' : ''}ScrollRestoration } from 'react-router';
import { Hydrated } from '${appPath}/hydrated';

export function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <Hydrated />
                <ScrollRestoration />
${scripts ? '                <Scripts />\n' : ''}            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}
`;
}

function viteConfig(semiOptions = '') {
    return `import { reactRouter } from '@react-router/dev/vite';
import semi from '@fibrae/semi-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [semi(${semiOptions}), reactRouter()],
});
`;
}

const SERVER_BUNDLES_CONFIG = `import type { Config } from '@react-router/dev/config';

export default { serverBundles: () => 'main' } satisfies Config;
`;

const RSC_CONFIG = `import type { Config } from '@react-router/dev/config';

export default { appDirectory: 'app-rsc' } satisfies Config;
`;

const RSC_VITE_CONFIG = `import { unstable_reactRouterRSC as reactRouterRSC } from '@react-router/dev/vite';
import semi from '@fibrae/semi-vite-plugin';
import rsc from '@vitejs/plugin-rsc';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [semi(), reactRouterRSC(), rsc()],
});
`;

const RSC_ROUTES = `import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/client-default.tsx'),
    route('server-wrapped', 'routes/server-wrapped.tsx'),
    route('server-direct', 'routes/server-direct.tsx'),
] satisfies RouteConfig;
`;

// A route module with a default export is a client component route
const RSC_CLIENT_DEFAULT = `import en_US from '@fibrae/semi-ui-react/locale/source/en_US';
import { SemiPage } from '../../app/semi-page';

export default function ClientDefault() {
    return <SemiPage locale={en_US} />;
}
`;

const RSC_SEMI_CLIENT = `'use client';

import en_US from '@fibrae/semi-ui-react/locale/source/en_US';
import { SemiPage } from '../app/semi-page';

export function SemiPageClient() {
    return <SemiPage locale={en_US} />;
}
`;

const RSC_SERVER_WRAPPED = `import { SemiPageClient } from '../semi-client';

export function ServerComponent() {
    return <SemiPageClient />;
}
`;

// Semi imported straight into a Server Component, as the published package is meant to be used
const RSC_SERVER_DIRECT = `import { Button } from '@fibrae/semi-ui-react';

export function ServerComponent() {
    return (
        <Button id="btn-primary" type="primary" theme="solid">
            ServerDirectButton
        </Button>
    );
}
`;

// With omitCss, dev must not load per-component CSS next to the whole-package styles.css
const noComponentCss: PageCheck = {
    name: 'no-component-css',
    run: async ({ page }) => {
        const ids = await page.evaluate<string[]>("[...document.querySelectorAll('style[data-vite-dev-id]')].map((style) => style.getAttribute('data-vite-dev-id'))");
        const component = ids.filter((id) => id.includes('/dist/') && !id.endsWith('/styles.css'));
        if (component.length > 0) {
            throw new Error(`${component.length} component stylesheets loaded in dev, such as ${component[0]}`);
        }
    },
};

function semiPageChecks(prefixCls = 'semi', extra: PageCheck[] = []): PageCheck[] {
    return [
        ssrText('ssr-input', ['InputValueProbe']),
        ssrText('ssr-table', ['CellAlice', 'CellBob', 'CellCarol']),
        ssrText('ssr-date', ['2026-10-01']),
        // Before the checks that open overlays, which add ids of their own
        idsStable(),
        primaryButton('#btn-primary', prefixCls),
        tooltipOpen('TooltipOpenByDefault'),
        selectOpens('#select-probe', 'OptC'),
        tooltipHover('#tooltip-trigger', 'TooltipHover'),
        modalOpens('#btn-modal', 'ModalTitle'),
        toastShows('#btn-toast', 'ToastShown'),
        ...extra,
    ];
}

function page(name: string, path: string, checks: PageCheck[]): HostPage {
    return { name, path, ready: 'body[data-hydrated]', checks };
}

const lang = langIsolation('/lang', { en: 'placeholder="Select date"', zh: 'placeholder="请选择日期"' });
const DEV_COMMAND = ['react-router', 'dev', '--port', '{port}', '--strictPort'];
const BUILD = { command: ['react-router', 'build'] };

function dev(pages: HostPage[], withLang = true): ServerStep {
    return { command: DEV_COMMAND, pages, checks: withLang ? [lang] : [] };
}

function prod(pages: HostPage[], { withLang = true, entry = 'build/server/index.js' } = {}): ServerStep {
    return { command: ['react-router-serve', entry], pages, checks: withLang ? [lang] : [] };
}

const defaultPages = [page('home', '/', semiPageChecks()), page('all-exports', '/all-exports', [allExports('#all-exports')])];

// Home shows the other components keep their styles under Preflight
const tailwindPages = [page('home', '/', semiPageChecks()), page('tailwind', '/tailwind', [tailwindCoexist(), tailwindFirstPaint()])];

const rscPages = [page('home', '/', semiPageChecks()), page('server-wrapped', '/server-wrapped', semiPageChecks()), page('server-direct', '/server-direct', [ssrText('ssr-button', ['ServerDirectButton']), primaryButton('#btn-primary')])];

export default {
    deps: {
        '@fibrae/semi-ai-react': '*',
        '@fibrae/semi-icons-react': '*',
        '@fibrae/semi-ui-react': '*',
        '@fibrae/semi-vite-plugin': '*',
        '@react-router/dev': '8.5.0',
        '@react-router/node': '8.5.0',
        '@react-router/serve': '8.5.0',
        isbot: '5.2.2',
        react: '19.3.1',
        'react-dom': '19.3.1',
        'react-router': '8.5.0',
        vite: '8.3.5',
    },
    files: {
        'vite.config.ts': viteConfig(),
        'app/hydrated.tsx': HYDRATED,
        'app/semi-page.tsx': SEMI_PAGE,
        'app/root.tsx': root({ appPath: '.', scripts: true }),
        'app/routes.ts': routes(),
        'app/routes/home.tsx': HOME,
        'app/routes/lang.tsx': LANG,
    },
    variants: [
        {
            name: 'default',
            files: { 'app/routes.ts': routes("route('all-exports', 'routes/all-exports.tsx')"), 'app/routes/all-exports.tsx': ALL_EXPORTS },
            dev: dev(defaultPages),
            build: BUILD,
            prod: prod(defaultPages),
        },
        {
            name: 'server-bundles',
            files: { 'react-router.config.ts': SERVER_BUNDLES_CONFIG },
            build: BUILD,
            // serverBundles moves the server entry under the bundle id
            prod: prod([page('home', '/', semiPageChecks())], { entry: 'build/server/main/index.js' }),
        },
        {
            name: 'prefix',
            files: { 'vite.config.ts': viteConfig("{ prefixCls: 'my' }") },
            dev: dev([page('home', '/', semiPageChecks('my'))]),
            build: BUILD,
            prod: prod([page('home', '/', semiPageChecks('my'))]),
        },
        {
            name: 'omit-css',
            files: {
                'vite.config.ts': viteConfig('{ omitCss: true }'),
                'app/root.tsx': root({ appPath: '.', scripts: true, css: ['@fibrae/semi-ui-react/styles.css'] }),
            },
            dev: dev([page('home', '/', semiPageChecks('semi', [noComponentCss]))]),
            build: BUILD,
            prod: prod([page('home', '/', semiPageChecks())]),
        },
        {
            name: 'tailwind',
            deps: { '@tailwindcss/vite': '4.3.3', tailwindcss: '4.3.3' },
            files: {
                'vite.config.ts': TAILWIND_VITE_CONFIG,
                'app/semi-layer.css': '@layer theme, base, semi, components, utilities;\n',
                'app/tailwind.css': TAILWIND_CSS,
                // The root module loads before every route, so its first imports lead the server-rendered styles
                'app/root.tsx': root({ appPath: '.', scripts: true, css: ['./semi-layer.css', './tailwind.css'] }),
                'app/routes.ts': routes("route('tailwind', 'routes/tailwind.tsx')"),
                'app/routes/tailwind.tsx': TAILWIND_PAGE,
            },
            dev: dev(tailwindPages),
            build: BUILD,
            prod: prod(tailwindPages),
        },
        {
            name: 'rsc',
            deps: { '@vitejs/plugin-rsc': '0.5.26', 'react-server-dom-webpack': '19.3.1' },
            files: {
                'react-router.config.ts': RSC_CONFIG,
                'vite.config.ts': RSC_VITE_CONFIG,
                'app-rsc/root.tsx': root({ appPath: '../app', scripts: false }),
                'app-rsc/routes.ts': RSC_ROUTES,
                'app-rsc/semi-client.tsx': RSC_SEMI_CLIENT,
                'app-rsc/routes/client-default.tsx': RSC_CLIENT_DEFAULT,
                'app-rsc/routes/server-wrapped.tsx': RSC_SERVER_WRAPPED,
                'app-rsc/routes/server-direct.tsx': RSC_SERVER_DIRECT,
            },
            dev: dev(rscPages, false),
            build: BUILD,
            prod: prod(rscPages, { withLang: false }),
        },
    ],
    expectedFailures: [],
} satisfies Host;
