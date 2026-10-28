import { hydrate } from 'solid-js/web';
import type { MountDiff, SsrCase } from './ssr.solid';

export interface HydrationReport {
    errors: string[];
    server: string;
    client: string;
    // The root as hydration left it, before markers and mountDiff attributes are dropped, for assertions on what the
    // mount added
    mounted: string;
    // Roles of the elements outside the root after hydration, i.e. portaled overlays
    overlays: string[];
}

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

// The server writes style as given, the browser serializes the parsed declarations; reading both through CSSOM
// compares the declarations, not their spelling.
function normalizeStyle(element: HTMLElement) {
    if (element.style.length === 0) {
        element.removeAttribute('style');
    } else {
        element.setAttribute('style', element.style.cssText);
    }
}

// Markers and hydration keys differ by design; attributes the case registers as written after mount are dropped too
function normalize(root: Element, mountDiff: MountDiff[]) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    const comments: Node[] = [];
    while (walker.nextNode()) {
        comments.push(walker.currentNode);
    }
    for (const comment of comments) {
        comment.parentNode?.removeChild(comment);
    }
    const names = ['data-hk'];
    for (const entry of mountDiff) {
        if (typeof entry === 'string') {
            names.push(entry);
            continue;
        }
        for (const element of root.querySelectorAll(entry.selector)) {
            for (const name of entry.attrs ?? []) {
                element.removeAttribute(name);
            }
            element.classList.remove(...(entry.classes ?? []));
        }
    }
    for (const element of root.querySelectorAll('*')) {
        for (const name of names) {
            element.removeAttribute(name);
        }
        if (element instanceof HTMLElement && element.hasAttribute('style')) {
            normalizeStyle(element);
        }
        // a class rewritten after an update loses the trailing space clsx leaves on the server; an emptied one equals none
        const className = element.getAttribute('class')?.trim();
        if (className) {
            element.setAttribute('class', className.split(/\s+/).join(' '));
        } else {
            element.removeAttribute('class');
        }
    }
    root.normalize();
    // One element per line, so a failed comparison diffs to the element that differs
    return root.innerHTML.replace(/></g, '>\n<');
}

// Runs inside a fresh iframe per case, so solid-js and its hydration registry start empty for each one
export async function hydrateCase(ssrCase: SsrCase, root: Element, serverHtml: string): Promise<HydrationReport> {
    const errors: string[] = [];
    const record = (...args: unknown[]) => errors.push(args.map(String).join(' '));
    const { error, warn } = console;
    console.error = record;
    console.warn = record;
    const onError = (event: ErrorEvent) => record(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => record(event.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    const undo = ssrCase.setup?.();
    try {
        try {
            hydrate(ssrCase.render, root);
        } catch (thrown) {
            record(thrown);
        }
        await nextFrame();
        await nextFrame();
        const overlayRoles = () => [...document.body.querySelectorAll('[role]')].filter((element) => !root.contains(element)).map((element) => element.getAttribute('role') ?? '');
        // An overlay behind a measurement, such as the menu of Tabs' collapsed tabs, can take more frames to open; the
        // bound keeps one that never opens failing
        for (let frame = 0; ssrCase.opened && frame < 60 && !overlayRoles().includes(ssrCase.opened); frame++) {
            await nextFrame();
        }
        const template = document.createElement('template');
        template.innerHTML = serverHtml;
        const mountDiff = ssrCase.mountDiff ?? [];
        const server = document.createElement('div');
        server.append(template.content);
        return { errors, server: normalize(server, mountDiff), client: normalize(root.cloneNode(true) as Element, mountDiff), mounted: root.innerHTML, overlays: overlayRoles() };
    } finally {
        undo?.();
        console.error = error;
        console.warn = warn;
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
    }
}
