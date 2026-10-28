import { type App, type VNode, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, vi } from 'vite-plus/test';

// One row of a package's SSR case table. `covers` lists the exported names the row renders, which the guard checks
// against the package entry in both directions.
export interface SsrCase {
    name: string;
    covers: string[];
    render: () => VNode;
}

export interface SsrRun {
    html: string;
    warnings: string[];
}

// Every exported name is covered by a row or listed as a non-component, and neither list may keep a stale name
export function uncoveredExports(exported: string[], cases: SsrCase[], nonComponents: ReadonlySet<string>): { uncovered: string[]; stale: string[] } {
    const covered = new Set(cases.flatMap((item) => item.covers));
    return {
        uncovered: exported.filter((name) => !covered.has(name) && !nonComponents.has(name)),
        stale: [...covered, ...nonComponents].filter((name) => !exported.includes(name)),
    };
}

export async function expectCleanServerRender(item: SsrCase): Promise<void> {
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    const { html, warnings } = await renderOnServer(item.render);
    expect(html).not.toBe('');
    expect(warnings).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
}

export async function expectCleanHydration(item: SsrCase): Promise<void> {
    const { warnings } = await hydrate(item.render);
    expect(warnings.filter((message) => message.includes('Hydration'))).toEqual([]);
}

function createApp(render: () => VNode, idPrefix: string, warnings: string[]): App {
    const app = createSSRApp({ render });
    app.config.idPrefix = idPrefix;
    app.config.warnHandler = (message) => {
        warnings.push(message);
    };
    // Rethrow: a bare errorHandler would swallow setup and watcher errors that renderToString rejects with
    app.config.errorHandler = (error) => {
        throw error;
    };
    return app;
}

export async function renderOnServer(render: () => VNode, idPrefix = 'ssr'): Promise<SsrRun> {
    const warnings: string[] = [];
    const html = await renderToString(createApp(render, idPrefix, warnings));
    return { html, warnings };
}

// Server and client use the same idPrefix: Astro writes the prefix to both sides, and useId output differs without it
export async function hydrate(render: () => VNode, idPrefix = 'ssr'): Promise<SsrRun> {
    const { html } = await renderOnServer(render, idPrefix);
    const warnings: string[] = [];
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = html;
    const app = createApp(render, idPrefix, warnings);
    try {
        app.mount(container);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    } finally {
        app.unmount();
        container.remove();
        // Overlays opened after mount teleport into body and would leak into the next case
        document.body.replaceChildren();
    }
    return { html, warnings };
}
