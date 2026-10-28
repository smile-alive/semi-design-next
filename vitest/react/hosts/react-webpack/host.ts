// Client-only React with webpack 5, written as the build-plugin section of the getting-started page does: the default
// prefix and layered styles need no Semi plugin, only a rule for `.css` imports (css-loader with style-loader, which
// applies the CSS); the `prefix` variant uses `new SemiWebpackPlugin({ prefixCls })`. The loader rule for JSX, the HTML
// plugin and the static server are the app's own, not Semi's.
import { modalOpens, primaryButton, selectOpens } from '../../../hosts/checks.ts';
import type { Host, HostPage } from '../../../hosts/types.ts';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Semi react-webpack</title>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
`;

// `semiOptions` is the plugin's constructor argument; without it the config is the plugin-less setup with a CSS rule
function webpackConfig(semiOptions?: string) {
    const withPlugin = semiOptions != null;
    return `${withPlugin ? "import SemiWebpackPlugin from '@fibrae/semi-webpack-plugin';\n" : ''}import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
    entry: './src/main.jsx',
    output: { path: import.meta.dirname + '/dist', clean: true },
    module: {
        rules: [
            {
                test: /\\.jsx$/,
                exclude: /node_modules/,
                loader: 'swc-loader',
                options: { jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } } },
            },${withPlugin ? '' : "\n            { test: /\\.css$/, use: ['style-loader', 'css-loader'] },"}
        ],
    },
    plugins: [new HtmlWebpackPlugin({ template: './index.html' })${withPlugin ? `, new SemiWebpackPlugin(${semiOptions})` : ''}],
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
        dev: { command: ['webpack', 'serve', '--mode', 'development', '--port', '{port}'], pages: [page(prefixCls)] },
        build: { command: ['webpack', '--mode', 'production'] },
        // serve moves to another port when this one is taken unless told not to
        prod: { command: ['serve', '--listen', '{port}', '--no-port-switching', 'dist'], pages: [page(prefixCls)] },
    };
}

export default {
    deps: {
        '@fibrae/semi-icons-react': '*',
        '@fibrae/semi-ui-react': '*',
        '@fibrae/semi-webpack-plugin': '*',
        '@swc/core': '1.16.20',
        'css-loader': '7.1.5',
        'html-webpack-plugin': '5.6.8',
        react: '19.3.1',
        'react-dom': '19.3.1',
        serve: '14.2.6',
        'style-loader': '4.0.0',
        'swc-loader': '0.2.7',
        webpack: '5.112.2',
        'webpack-cli': '7.2.3',
        'webpack-dev-server': '6.1.0',
    },
    allowBuilds: { '@swc/core': true },
    files: {
        'index.html': INDEX_HTML,
        'webpack.config.js': webpackConfig(),
        'src/main.jsx': MAIN,
        'src/App.jsx': APP,
    },
    variants: [
        { name: 'default', ...steps() },
        { name: 'prefix', files: { 'webpack.config.js': webpackConfig("{ prefixCls: 'my' }") }, ...steps('my') },
    ],
    expectedFailures: [],
} satisfies Host;
