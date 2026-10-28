import type { JSX } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { expect } from 'vite-plus/test';

// An attribute dropped from every element, or attributes and classes dropped from the elements the selector matches on
// both sides; scope an entry to the elements that change, so the rest of the tree is still compared
export type MountDiff = string | { selector: string; attrs?: string[]; classes?: string[] };

// One server-render case; both packages' tables and the hydration project share the shape
export interface SsrCase<Export extends string = string> {
    // `<component directory>/<scene>`, so `-t '^(tooltip|popover)/'` selects by directory
    name: string;
    // Entry exports the case renders; the export guard fails when a component export is in no case
    covers: Export[];
    render: () => JSX.Element;
    // Runs before rendering on each side and returns the undo; for module-level config such as semiGlobal
    setup?: () => () => void;
    // Text the server HTML must contain: first-frame content that no hydration warning reports
    text?: string[];
    // Markup the server HTML must contain, for first-frame state that lives in attributes (an input's value)
    html?: string[];
    // Attributes docs/component-issues.md registers as written after mount; '*' when the structure itself changes
    mountDiff?: MountDiff[];
    // Role of the overlay the case opens by default; hydration must leave an element with it in the body outside the
    // root, which the root comparison cannot see because overlays are portaled
    opened?: string;
}

export interface ServerRender {
    html: string;
    // Errors thrown while rendering or while the root is disposed after it
    errors: unknown[];
}

function nextTask() {
    return new Promise<void>((resolve) => setTimeout(resolve));
}

// renderToString disposes the root in a setTimeout, so cleanup that touches the DOM throws as an uncaught exception
// there; in a real server that exception ends the Node process
export async function renderServer(ssrCase: Pick<SsrCase, 'render' | 'setup'>): Promise<ServerRender> {
    const errors: unknown[] = [];
    const record = (error: unknown) => errors.push(error);
    process.on('uncaughtException', record);
    process.on('unhandledRejection', record);
    const undo = ssrCase.setup?.();
    try {
        let html = '';
        try {
            html = renderToString(ssrCase.render);
        } catch (error) {
            errors.push(error);
        }
        await nextTask();
        await nextTask();
        return { html, errors };
    } finally {
        undo?.();
        process.off('uncaughtException', record);
        process.off('unhandledRejection', record);
    }
}

// Visible text of server HTML: Solid splits text nodes with comment markers
export function serverText(html: string) {
    return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '');
}

// Message plus the first source frames: the first is where the error is thrown, the next ones usually hold the root
// cause, which decides the owning directory
export function summarizeError(error: unknown) {
    if (!(error instanceof Error)) {
        return String(error);
    }
    const frames = (error.stack ?? '')
        .split('\n')
        .flatMap((line) => line.match(/packages\/[^/]+\/src\/[^)\s]+/) ?? [])
        .filter((frame) => !frame.includes('/__tests__/'))
        .slice(0, 4);
    return [`${error.name}: ${error.message}`, ...frames].join(' @ ');
}

export async function expectServerCase(ssrCase: SsrCase) {
    const { html, errors } = await renderServer(ssrCase);
    expect(errors.map(summarizeError)).toEqual([]);
    const text = serverText(html);
    for (const expected of ssrCase.text ?? []) {
        expect(text).toContain(expected);
    }
    for (const expected of ssrCase.html ?? []) {
        expect(html).toContain(expected);
    }
}

// Value names a package entry re-exports with `export { ... } from`; `export type` blocks are skipped
export function entryValueExports(source: string) {
    return [...source.matchAll(/^export \{([^}]*)\} from /gm)].flatMap((match) =>
        match[1]
            .split(',')
            .map((specifier) => specifier.trim())
            .filter((specifier) => specifier && !specifier.startsWith('type '))
            .map((specifier) => specifier.split(/\s+as\s+/).pop() ?? specifier)
    );
}

// Every component export must be rendered by some case; `others` lists the value exports that are not components
export function uncoveredExports(source: string, cases: SsrCase[], others: string[]) {
    const exported = entryValueExports(source);
    const covered = new Set(cases.flatMap((ssrCase) => ssrCase.covers));
    return {
        uncovered: exported.filter((name) => !others.includes(name) && !covered.has(name)),
        // An entry in `others` that the package no longer exports is stale
        stale: others.filter((name) => !exported.includes(name)),
    };
}
