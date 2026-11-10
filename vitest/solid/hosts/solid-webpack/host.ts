// Client-only Solid app on webpack 5, plugin-less in the default variant and with `new SemiWebpackPlugin({ prefixCls })` in `prefix`: babel-loader with babel-preset-solid compiles the app, and
// the Solid packages resolve to their `default` export condition (`dist/*.js`, already compiled for the DOM).
import { modalOpens, primaryButton } from '../../../hosts/checks.ts';
import type { Host, HostPage, ServerStep } from '../../../hosts/types.ts';

function page(prefixCls: string): HostPage {
    return {
        name: 'home',
        path: '/',
        ready: 'body[data-hydrated]',
        checks: [primaryButton('#btn-primary', prefixCls), modalOpens('#open-modal', 'ModalBody')],
    };
}

function server(command: string[], prefixCls: string): ServerStep {
    return { command, pages: [page(prefixCls)] };
}

// `semiOptions` is the plugin's constructor argument; without it the config is the plugin-less setup with a CSS rule
function webpackConfig(semiOptions?: string) {
    const withPlugin = semiOptions != null;
    return `${withPlugin ? "import SemiWebpackPlugin from '@fibrae/semi-webpack-plugin';\n" : ''}import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
    entry: './src/index.jsx',
    resolve: { extensions: ['.jsx', '.js'] },
    module: {
        rules: [
            { test: /\\.jsx$/, exclude: /node_modules/, loader: 'babel-loader', options: { presets: ['babel-preset-solid'] } },${withPlugin ? '' : "\n            { test: /\\.css$/, use: ['style-loader', 'css-loader'] },"}
        ],
    },
    plugins: [new HtmlWebpackPlugin({ template: './index.html' })${withPlugin ? `, new SemiWebpackPlugin(${semiOptions})` : ''}],
};
`;
}

function steps(prefixCls = 'semi') {
    return {
        // webpack-dev-server exits when an explicit port is taken; only `port: 'auto'` moves on
        dev: server(['webpack', 'serve', '--mode', 'development', '--port', '{port}'], prefixCls),
        build: { command: ['webpack', '--mode', 'production'] },
        // `serve` silently switches ports unless told not to
        prod: server(['serve', 'dist', '--no-port-switching', '-l', '{port}'], prefixCls),
    };
}

export default {
    deps: {
        '@babel/core': '7.29.0',
        '@fibrae/semi-ui-solid': '*',
        '@fibrae/semi-webpack-plugin': '*',
        'babel-loader': '10.1.1',
        'babel-preset-solid': '1.9.16',
        'css-loader': '7.1.5',
        'html-webpack-plugin': '5.6.8',
        serve: '14.2.6',
        'solid-js': '1.9.17',
        'style-loader': '4.0.0',
        webpack: '5.112.2',
        'webpack-cli': '7.2.3',
        'webpack-dev-server': '6.1.0',
    },
    files: {
        'index.html': `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
`,
        'webpack.config.mjs': webpackConfig(),
        'src/index.jsx': `import { createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import { Button, Modal } from '@fibrae/semi-ui-solid';

function App() {
    const [visible, setVisible] = createSignal(false);
    onMount(() => document.body.setAttribute('data-hydrated', ''));
    return (
        <main>
            <Button id="btn-primary" theme="solid" type="primary">
                Primary
            </Button>
            <Button id="open-modal" onClick={() => setVisible(true)}>
                Open Modal
            </Button>
            <Modal title="ModalTitle" visible={visible()} onCancel={() => setVisible(false)} onOk={() => setVisible(false)}>
                ModalBody
            </Modal>
        </main>
    );
}

render(() => <App />, document.getElementById('root'));
`,
    },
    variants: [
        { name: 'default', ...steps() },
        { name: 'prefix', files: { 'webpack.config.mjs': webpackConfig("{ prefixCls: 'my' }") }, ...steps('my') },
    ],
    expectedFailures: [],
} satisfies Host;
