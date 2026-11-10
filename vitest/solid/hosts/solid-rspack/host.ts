// Client-only Solid app on rspack 2, plugin-less in the default variant and with `new SemiRspackPlugin({ prefixCls })` in `prefix`: babel-loader with babel-preset-solid compiles the app, CSS
// goes through the native `type: 'css'` rule from the getting-started page, and the Solid packages resolve to their
// `default` export condition (`dist/*.js`, already compiled for the DOM).
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

// `semiOptions` is the plugin's constructor argument; without it the config is the plugin-less setup, whose CSS rule
// handles `.css` imports only. With the plugin the rule also covers `.scss`, which the plugin needs treated as CSS
function rspackConfig(semiOptions?: string) {
    const withPlugin = semiOptions != null;
    return `${withPlugin ? "import { SemiRspackPlugin } from '@fibrae/semi-rspack-plugin';\n" : ''}import { rspack } from '@rspack/core';

export default {
    entry: './src/index.jsx',
    resolve: { extensions: ['.jsx', '.js'] },
    module: {
        rules: [
            { test: /\\.jsx$/, exclude: /node_modules/, loader: 'babel-loader', options: { presets: ['babel-preset-solid'] } },
            { test: /\\.${withPlugin ? 's?' : ''}css$/, type: 'css' },
        ],
    },
    plugins: [new rspack.HtmlRspackPlugin({ template: './index.html' })${withPlugin ? `, new SemiRspackPlugin(${semiOptions})` : ''}],
};
`;
}

function steps(prefixCls = 'semi') {
    return {
        // The rspack dev server exits when an explicit port is taken; only `port: 'auto'` moves on
        dev: server(['rspack', 'serve', '--mode', 'development', '--port', '{port}'], prefixCls),
        build: { command: ['rspack', 'build', '--mode', 'production'] },
        // `serve` silently switches ports unless told not to
        prod: server(['serve', 'dist', '--no-port-switching', '-l', '{port}'], prefixCls),
    };
}

export default {
    deps: {
        '@babel/core': '7.29.0',
        '@fibrae/semi-rspack-plugin': '*',
        '@fibrae/semi-ui-solid': '*',
        '@rspack/cli': '2.2.9',
        '@rspack/core': '2.2.9',
        '@rspack/dev-server': '2.2.1',
        'babel-loader': '10.1.1',
        'babel-preset-solid': '1.9.16',
        serve: '14.2.6',
        'solid-js': '1.9.17',
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
        'rspack.config.mjs': rspackConfig(),
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
        { name: 'prefix', files: { 'rspack.config.mjs': rspackConfig("{ prefixCls: 'my' }") }, ...steps('my') },
    ],
    expectedFailures: [],
} satisfies Host;
