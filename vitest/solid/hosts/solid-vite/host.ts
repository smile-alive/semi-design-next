// Client-only Solid app on Vite with vite-plugin-solid and the Semi plugin (`plugins: [solid(), semi()]`), as the
// getting-started page prescribes for Solid. vite-plugin-solid compiles the Solid packages' `solid` export condition
// (`dist/*.jsx`) with the app. The `tailwind` variant follows the Tailwind page.
import { modalOpens, primaryButton, tailwindCoexist } from '../../../hosts/checks.ts';
import type { Host, HostPage, ServerStep, Variant } from '../../../hosts/types.ts';

// Set from onMount, so it exists only once the app is running in the browser
const mounted = 'body[data-hydrated]';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/index.tsx"></script>
    </body>
</html>
`;

const BASIC_ENTRY = `import { render } from 'solid-js/web';
import App from './App';

render(() => <App />, document.getElementById('root')!);
`;

const BASIC_APP = `import { createSignal, onMount } from 'solid-js';
import { Button, Modal } from '@fibrae/semi-ui-solid';

export default function App() {
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
`;

const TAILWIND_ENTRY = `import './semi-layer.css';
import './tailwind.css';
import { render } from 'solid-js/web';
import App from './App';

render(() => <App />, document.getElementById('root')!);
`;

const TAILWIND_APP = `import { onMount } from 'solid-js';
import { Button } from '@fibrae/semi-ui-solid';

export default function App() {
    onMount(() => document.body.setAttribute('data-hydrated', ''));
    return (
        <main>
            <Button id="tw-padding" class="p-0" theme="solid" type="primary">
                Padding
            </Button>
            <div id="tw-alpha" class="bg-semi-color-primary/50">
                Alpha
            </div>
            <div theme-mode="dark">
                <div id="tw-dark" class="bg-white dark:bg-black">
                    Dark
                </div>
            </div>
        </main>
    );
}
`;

const basic: HostPage = {
    name: 'home',
    path: '/',
    ready: mounted,
    checks: [primaryButton('#btn-primary'), modalOpens('#open-modal', 'ModalBody')],
};

const tailwind: HostPage = {
    name: 'home',
    path: '/',
    ready: mounted,
    checks: [tailwindCoexist()],
};

function variant(name: string, page: HostPage, extra?: Pick<Variant, 'files' | 'deps'>): Variant {
    const server = (command: string[]): ServerStep => ({ command, pages: [page] });
    return {
        name,
        ...extra,
        dev: server(['vite', '--port', '{port}', '--strictPort']),
        build: { command: ['vite', 'build'] },
        prod: server(['vite', 'preview', '--port', '{port}', '--strictPort']),
    };
}

export default {
    deps: {
        '@fibrae/semi-ui-solid': '*',
        '@fibrae/semi-vite-plugin': '*',
        'solid-js': '1.9.17',
        vite: '8.3.5',
        'vite-plugin-solid': '2.11.14',
    },
    files: {
        'index.html': INDEX_HTML,
        'vite.config.ts': `import semi from '@fibrae/semi-vite-plugin';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
    plugins: [solid(), semi()],
});
`,
        'src/index.tsx': BASIC_ENTRY,
        'src/App.tsx': BASIC_APP,
    },
    variants: [
        variant('default', basic),
        variant('tailwind', tailwind, {
            deps: { '@tailwindcss/vite': '4.3.3', tailwindcss: '4.3.3' },
            files: {
                'vite.config.ts': `import semi from '@fibrae/semi-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
    plugins: [solid(), semi(), tailwindcss()],
});
`,
                'src/semi-layer.css': `@layer theme, base, semi, components, utilities;
`,
                'src/tailwind.css': `@import 'tailwindcss';
@import '@fibrae/semi-ui-solid/tailwind.css';
@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`,
                'src/index.tsx': TAILWIND_ENTRY,
                'src/App.tsx': TAILWIND_APP,
            },
        }),
    ],
    expectedFailures: [],
} satisfies Host;
