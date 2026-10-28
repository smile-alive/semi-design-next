// Next.js Pages Router with `semiNext()` and no other Semi setup, on both bundlers, as the getting-started page prescribes.
import { allExports, idsStable, langIsolation, modalOpens, primaryButton, selectOpens, ssrText, toastShows, tooltipHover, tooltipOpen } from '../../../hosts/checks.ts';
import type { Host, HostPage, Variant } from '../../../hosts/types.ts';

const home: HostPage = {
    name: 'home',
    path: '/',
    ready: 'body[data-hydrated]',
    checks: [
        ssrText('ssr-input', ['input-value-ssr']),
        ssrText('ssr-table', ['Alice-cell', 'Bob-cell', 'Carol-cell']),
        ssrText('ssr-date', ['2026-10-01']),
        primaryButton('#primary-button'),
        tooltipOpen('tooltip-open-content'),
        // Before the checks below: they open overlays that add ids of their own
        idsStable(),
        selectOpens('#probe-select', 'Option C'),
        tooltipHover('#tooltip-trigger', 'tooltip-closed-content'),
        modalOpens('#modal-button', 'modal-body-content'),
        toastShows('#toast-button', 'toast-content'),
    ],
};

// JsonViewer pulls in jsonc-parser, whose UMD build only Pages Router's server bundling cannot resolve (NP-4); the
// other pages do not import it, so they would pass with or without that fix
const heavy: HostPage = {
    name: 'heavy',
    path: '/heavy',
    ready: 'body[data-hydrated]',
    checks: [
        {
            // The viewer renders in a worker after hydration
            name: 'json-viewer',
            run: async ({ page }) => page.locator('#probe-json').getByText('jsonProbeKey').first().waitFor({ state: 'visible', timeout: 30_000 }),
        },
    ],
};

// Not named `lang`: page ids and server check ids share one namespace, and langIsolation() is `<step>/lang`
const locale: HostPage = { name: 'locale', path: '/lang', ready: 'body[data-hydrated]', checks: [idsStable()] };

const allExportsPage: HostPage = { name: 'all-exports', path: '/all-exports', ready: 'body[data-hydrated]', checks: [allExports('#all-exports')] };

const pages = [home, heavy, locale, allExportsPage];

// The DatePicker placeholder comes from the locale, so it tells which locale a response was rendered with
const langIsolated = langIsolation('/lang', { en: 'placeholder="Select date"', zh: 'placeholder="请选择日期"' });

// The config is bundler-independent (semiNext() returns both turbopack and webpack settings), so the CLI flag is the only difference
function variant(name: string, bundlerFlags: string[]): Variant {
    return {
        name,
        env: { NEXT_TELEMETRY_DISABLED: '1' },
        dev: { command: ['next', 'dev', ...bundlerFlags, '-p', '{port}'], pages, checks: [langIsolated] },
        build: { command: ['next', 'build', ...bundlerFlags] },
        prod: { command: ['next', 'start', '-p', '{port}'], pages, checks: [langIsolated] },
    };
}

export default {
    deps: {
        '@fibrae/semi-ai-react': '*',
        '@fibrae/semi-icons-react': '*',
        '@fibrae/semi-next': '*',
        '@fibrae/semi-ui-react': '*',
        '@types/node': '24.19.2',
        '@types/react': '19.3.0',
        '@types/react-dom': '19.3.0',
        next: '16.4.3',
        react: '19.3.1',
        'react-dom': '19.3.1',
        typescript: '6.0.3',
    },
    files: {
        'next.config.mjs': `import semiNext from '@fibrae/semi-next';

export default semiNext()({});
`,
        'tsconfig.json': `{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": false,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "react-jsx",
        "incremental": true
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules"]
}
`,
        'pages/_app.tsx': `import { useEffect } from 'react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    // Effects run only after hydration, which is what the runner waits for
    useEffect(() => {
        document.body.dataset.hydrated = '';
    }, []);
    return <Component {...pageProps} />;
}
`,
        'pages/index.tsx': `import { useState } from 'react';
import { Button, Checkbox, ConfigProvider, DatePicker, Form, Input, Modal, Select, Table, Tabs, Toast, Tooltip, Typography } from '@fibrae/semi-ui-react';
import { IconHome } from '@fibrae/semi-icons-react';
import en_US from '@fibrae/semi-ui-react/locale/source/en_US';

const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
];

const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age' },
];

const data = [
    { key: '1', name: 'Alice-cell', age: 31 },
    { key: '2', name: 'Bob-cell', age: 32 },
    { key: '3', name: 'Carol-cell', age: 33 },
];

export default function Home() {
    const [modal, setModal] = useState(false);
    return (
        <ConfigProvider locale={en_US}>
            <main style={{ padding: 24 }}>
                <Typography.Title heading={3}>Semi probe</Typography.Title>
                <Typography.Text>Typography text</Typography.Text>
                <IconHome id="icon-home" />
                <div>
                    <Button id="primary-button" type="primary" theme="solid">
                        Primary button
                    </Button>
                    <Button id="toast-button" onClick={() => Toast.info('toast-content')}>
                        Toast
                    </Button>
                    <Button id="modal-button" onClick={() => setModal(true)}>
                        Open modal
                    </Button>
                </div>
                <Input id="probe-input" value="input-value-ssr" onChange={() => {}} />
                <Select id="probe-select" value="b" optionList={options} style={{ width: 200 }} />
                <Tooltip content="tooltip-closed-content">
                    <Button id="tooltip-trigger">Hover me</Button>
                </Tooltip>
                <Tooltip content="tooltip-open-content" visible trigger="custom">
                    <Button>Always open</Button>
                </Tooltip>
                <Modal title="Modal title" visible={modal} onCancel={() => setModal(false)} onOk={() => setModal(false)}>
                    modal-body-content
                </Modal>
                <Table columns={columns} dataSource={data} pagination={false} />
                <DatePicker value={new Date(2026, 9, 1)} />
                <Form>
                    <Form.Input field="name" label="Name" initValue="form-name" />
                    <Form.Select field="pick" label="Pick" optionList={options} style={{ width: 200 }} />
                    <Form.Checkbox field="agree">Agree</Form.Checkbox>
                </Form>
                <Checkbox>Standalone checkbox</Checkbox>
                <Tabs
                    tabList={[
                        { tab: 'Tab one', itemKey: '1' },
                        { tab: 'Tab two', itemKey: '2' },
                        { tab: 'Tab three', itemKey: '3' },
                    ]}
                />
            </main>
        </ConfigProvider>
    );
}
`,
        'pages/heavy.tsx': `import { JsonViewer } from '@fibrae/semi-ui-react';

const value = JSON.stringify({ jsonProbeKey: 'json-probe-value', n: 1 }, null, 2);

export default function Heavy() {
    return <JsonViewer id="probe-json" value={value} width={400} height={120} />;
}
`,
        'pages/all-exports.tsx': `import * as SemiAI from '@fibrae/semi-ai-react';
import * as SemiUI from '@fibrae/semi-ui-react';

export default function AllExports() {
    return <p id="all-exports">{Object.keys(SemiUI).length + Object.keys(SemiAI).length}</p>;
}
`,
        'pages/lang.tsx': `import type { GetServerSideProps } from 'next';
import { Button, ConfigProvider, DatePicker, Modal, Select, Tooltip } from '@fibrae/semi-ui-react';
import en_US from '@fibrae/semi-ui-react/locale/source/en_US';
import zh_CN from '@fibrae/semi-ui-react/locale/source/zh_CN';

type Props = { lang: 'en' | 'zh' };

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => ({
    props: { lang: query.lang === 'zh' ? 'zh' : 'en' },
});

export default function Lang({ lang }: Props) {
    return (
        <ConfigProvider locale={lang === 'zh' ? zh_CN : en_US}>
            <p id="req-lang">req:{lang}</p>
            <DatePicker />
            <Select id="lang-select" optionList={[{ value: 'x', label: 'X' }]} style={{ width: 200 }} />
            <Tooltip content="lang-tip">
                <Button>tip</Button>
            </Tooltip>
            <Modal visible={false} title="t" />
        </ConfigProvider>
    );
}
`,
    },
    variants: [variant('turbopack', []), variant('webpack', ['--webpack'])],
    expectedFailures: [],
} satisfies Host;
