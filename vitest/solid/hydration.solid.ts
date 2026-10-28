import { expect, inject } from 'vite-plus/test';
import type { HydrationReport } from './hydration.client.solid';
import type { SsrCase } from './ssr.solid';

// The vitest server serves sources at their own paths, so the iframe imports them by URL like the tests do
const clientUrl = new URL('./hydration.client.solid.tsx', import.meta.url).href;

function inlineJson(value: unknown) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

// hydrate() falls back to a client render once any delegated event has set _$HY.done, and solid-js keeps one
// hydration registry per realm, so each case loads its own module graph in a fresh same-origin iframe
function hydrateInFrame(casesUrl: string, name: string, script: string, html: string) {
    const frame = document.createElement('iframe');
    // Kept clear of the pointer, which browser.setup parks at the bottom-right corner
    frame.style.cssText = 'position:fixed;inset-block-start:0;inset-inline-start:0;inline-size:800px;block-size:600px;border:0;pointer-events:none';
    // A failed import must still report, or the test only ends at its timeout. Vitest's browser transform wraps every
    // dynamic import() in this runner global, which only its own test page defines
    const boot = `globalThis.__vitest_browser_runner__ ??= { wrapDynamicImport: (load) => load() };
try {
    const [{ hydrateCase }, { ssrCases }] = await Promise.all([import(${inlineJson(clientUrl)}), import(${inlineJson(casesUrl)})]);
    const ssrCase = ssrCases.find((item) => item.name === ${inlineJson(name)});
    parent.postMessage(await hydrateCase(ssrCase, document.getElementById('root'), ${inlineJson(html)}), '*');
} catch (error) {
    parent.postMessage({ errors: [String(error)], server: '', client: '', mounted: '', overlays: [] }, '*');
}`;
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${script}</head><body><div id="root">${html}</div><script type="module">${boot}</script></body></html>`;
    return new Promise<HydrationReport>((resolve) => {
        const onMessage = (event: MessageEvent<HydrationReport>) => {
            if (event.source === frame.contentWindow) {
                window.removeEventListener('message', onMessage);
                frame.remove();
                resolve(event.data);
            }
        };
        window.addEventListener('message', onMessage);
        document.body.append(frame);
    });
}

// casesUrl is the URL of the case table the server rendered, so the iframe hydrates the same cases
export async function hydrateServerCase(name: string, casesUrl: string) {
    const { script, cases } = inject('solidSsr');
    const server = cases[name];
    return { server, report: await hydrateInFrame(casesUrl, name, script, server.html) };
}

export async function expectHydratedCase(ssrCase: SsrCase, casesUrl: string) {
    const { server, report } = await hydrateServerCase(ssrCase.name, casesUrl);
    expect(server.errors).toEqual([]);
    expect(report.errors).toEqual([]);
    if (!ssrCase.mountDiff?.includes('*')) {
        expect(report.client).toBe(report.server);
    }
    if (ssrCase.opened) {
        expect(report.overlays).toContain(ssrCase.opened);
    }
    return report;
}
