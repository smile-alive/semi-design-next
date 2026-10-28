// Client-only React with Rspack 2, written as the build-plugin section of the getting-started page does: the default
// prefix and layered styles need no Semi plugin, only a native `type: 'css'` rule; the `prefix` variant uses
// `new SemiRspackPlugin({ prefixCls })`. The JSX rule, the HTML plugin and the static server are the app's own.
import { modalOpens, primaryButton, selectOpens } from '../../../hosts/checks.ts';
import type { Host, HostPage } from '../../../hosts/types.ts';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Semi react-rspack</title>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
`;

// `semiOptions` is the plugin's constructor argument; without it the config is the plugin-less setup, whose CSS rule
// handles `.css` imports only. With the plugin the rule also covers `.scss`, which the plugin needs treated as CSS
function rspackConfig(semiOptions?: string) {
    const withPlugin = semiOptions != null;
    return `${withPlugin ? "import { SemiRspackPlugin } from '@fibrae/semi-rspack-plugin';\n" : ''}import { rspack } from '@rspack/core';

export default {
    entry: './src/main.jsx',
    output: { path: import.meta.dirname + '/dist', clean: true },
    module: {
        rules: [
            {
                test: /\\.jsx$/,
                exclude: /node_modules/,
                loader: 'builtin:swc-loader',
                options: { jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } } },
            },
            { test: /\\.${withPlugin ? 's?' : ''}css$/, type: 'css' },
        ],
    },
    plugins: [new rspack.HtmlRspackPlugin({ template: './index.html' })${withPlugin ? `, new SemiRspackPlugin(${semiOptions})` : ''}],
};
`;
}

const MAIN = `import '@fibrae/semi-ui-react/tokens';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
`;

// Set from an effect, so it exists only once React has mounted
const APP = `import { useEffect, useState } from 'react';
import { Button, Modal, Select } from '@fibrae/semi-ui-react';

const options = [
    { value: 'a', label: 'OptA' },
    { value: 'b', label: 'OptB' },
    { value: 'c', label: 'OptC' },
];

export function App() {
    const [modal, setModal] = useState(false);
    useEffect(() => {
        document.body.dataset.hydrated = '';
    }, []);
    return (
        <>
            <Button id="btn-primary" type="primary" theme="solid">
                Primary
            </Button>
            <Button id="btn-modal" onClick={() => setModal(true)}>
                Open Modal
            </Button>
            <Select id="select-probe" defaultValue="b" optionList={options} style={{ width: 200 }} />
            <Modal title="ModalTitle" visible={modal} onCancel={() => setModal(false)} onOk={() => setModal(false)}>
                ModalBody
            </Modal>
        </>
    );
}
`;

function page(prefixCls: string): HostPage {
    return { name: 'home', path: '/', ready: 'body[data-hydrated]', checks: [primaryButton('#btn-primary', prefixCls), selectOpens('#select-probe', 'OptC'), modalOpens('#btn-modal', 'ModalTitle')] };
}

function steps(prefixCls = 'semi') {
    return {
        dev: { command: ['rspack', 'dev', '--port', '{port}'], pages: [page(prefixCls)] },
        build: { command: ['rspack', 'build', '--mode', 'production'] },
        // serve moves to another port when this one is taken unless told not to
        prod: { command: ['serve', '--listen', '{port}', '--no-port-switching', 'dist'], pages: [page(prefixCls)] },
    };
}

export default {
    deps: {
        '@fibrae/semi-icons-react': '*',
        '@fibrae/semi-rspack-plugin': '*',
        '@fibrae/semi-ui-react': '*',
        '@rspack/cli': '2.2.9',
        '@rspack/core': '2.2.9',
        '@rspack/dev-server': '2.2.1',
        react: '19.3.1',
        'react-dom': '19.3.1',
        serve: '14.2.6',
    },
    files: {
        'index.html': INDEX_HTML,
        'rspack.config.js': rspackConfig(),
        'src/main.jsx': MAIN,
        'src/App.jsx': APP,
    },
    variants: [
        { name: 'default', ...steps() },
        { name: 'prefix', files: { 'rspack.config.js': rspackConfig("{ prefixCls: 'my' }") }, ...steps('my') },
    ],
    expectedFailures: [],
} satisfies Host;
