// Client-only React with Vite, written as the getting-started page does: `vite build` needs the Semi plugin, the dev
// server does not (the `no-plugin` variant). The tailwind variant follows the Tailwind page.
import { modalOpens, primaryButton, selectOpens, tailwindCoexist } from '../../../hosts/checks.ts';
import type { Host, HostPage, Variant } from '../../../hosts/types.ts';

const INDEX_HTML = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Semi react-vite</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
`;

const VITE_CONFIG = `import semi from '@fibrae/semi-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [semi(), react()],
});
`;

const NO_PLUGIN_VITE_CONFIG = `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
});
`;

const TAILWIND_VITE_CONFIG = `import semi from '@fibrae/semi-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [semi(), react(), tailwindcss()],
});
`;

const MAIN = `import '@fibrae/semi-ui-react/tokens';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
`;

// Layer order first, then Tailwind, then everything else, as the Tailwind page prescribes
const TAILWIND_MAIN = `import './semi-layer.css';
import './tailwind.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
`;

const SEMI_LAYER_CSS = `@layer theme, base, semi, components, utilities;
`;

const TAILWIND_CSS = `@import 'tailwindcss';
@import '@fibrae/semi-ui-react/tailwind.css';
@custom-variant dark (&:where([theme-mode='dark'], [theme-mode='dark'] *));
`;

// Set from an effect, so it exists only once React has mounted
const HYDRATED = `import { useEffect } from 'react';

export function useMarkHydrated() {
    useEffect(() => {
        document.body.dataset.hydrated = '';
    }, []);
}
`;

const APP = `import { useState } from 'react';
import { Button, Modal, Select } from '@fibrae/semi-ui-react';
import { useMarkHydrated } from './hydrated';

const options = [
    { value: 'a', label: 'OptA' },
    { value: 'b', label: 'OptB' },
    { value: 'c', label: 'OptC' },
];

export function App() {
    const [modal, setModal] = useState(false);
    useMarkHydrated();
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

const TAILWIND_APP = `import { Button } from '@fibrae/semi-ui-react';
import { useMarkHydrated } from './hydrated';

export function App() {
    useMarkHydrated();
    return (
        <>
            <Button id="tw-padding" type="primary" theme="solid" className="p-0">
                Primary
            </Button>
            <div id="tw-alpha" className="bg-semi-color-primary/50">
                Alpha
            </div>
            <div theme-mode="dark">
                <div id="tw-dark" className="bg-white dark:bg-black">
                    Dark
                </div>
            </div>
        </>
    );
}
`;

function page(checks: HostPage['checks']): HostPage {
    return { name: 'home', path: '/', ready: 'body[data-hydrated]', checks };
}

const defaultChecks = [primaryButton('#btn-primary'), selectOpens('#select-probe', 'OptC'), modalOpens('#btn-modal', 'ModalTitle')];
const tailwindChecks = [tailwindCoexist()];

function dev(checks: HostPage['checks']): Variant['dev'] {
    return { command: ['vite', '--strictPort', '--port', '{port}'], pages: [page(checks)] };
}

function steps(checks: HostPage['checks']) {
    return {
        dev: dev(checks),
        build: { command: ['vite', 'build'] },
        prod: { command: ['vite', 'preview', '--strictPort', '--port', '{port}'], pages: [page(checks)] },
    };
}

export default {
    deps: {
        '@fibrae/semi-icons-react': '*',
        '@fibrae/semi-ui-react': '*',
        '@fibrae/semi-vite-plugin': '*',
        '@vitejs/plugin-react': '6.1.2',
        react: '19.3.1',
        'react-dom': '19.3.1',
        vite: '8.3.5',
    },
    files: {
        'index.html': INDEX_HTML,
        'vite.config.ts': VITE_CONFIG,
        'src/main.tsx': MAIN,
        'src/hydrated.ts': HYDRATED,
        'src/App.tsx': APP,
    },
    variants: [
        { name: 'default', ...steps(defaultChecks) },
        // The dev server works without the plugin; `vite build` does not
        { name: 'no-plugin', files: { 'vite.config.ts': NO_PLUGIN_VITE_CONFIG }, dev: dev(defaultChecks) },
        {
            name: 'tailwind',
            deps: { '@tailwindcss/vite': '4.3.3', tailwindcss: '4.3.3' },
            files: {
                'vite.config.ts': TAILWIND_VITE_CONFIG,
                'src/main.tsx': TAILWIND_MAIN,
                'src/App.tsx': TAILWIND_APP,
                'src/semi-layer.css': SEMI_LAYER_CSS,
                'src/tailwind.css': TAILWIND_CSS,
            },
            ...steps(tailwindChecks),
        },
    ],
    expectedFailures: [],
} satisfies Host;
