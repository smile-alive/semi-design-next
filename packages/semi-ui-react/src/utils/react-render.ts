import type * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

const MARK = '__semi_react_root__';

type ContainerType = (Element | DocumentFragment) & {
    [MARK]?: Root;
};

// Imperative APIs render into a container they add to document; on the server there is none, and the ReferenceError
// from deep inside would not say where the call belongs
export function assertBrowser(api: string, hook: string) {
    if (typeof document === 'undefined') {
        throw new Error(`${api} can only be called in the browser: call it from an event handler or an effect, or render the holder returned by ${hook} instead.`);
    }
}

export function render(node: React.ReactElement, container: ContainerType) {
    const root = container[MARK] || createRoot(container);
    root.render(node);
    container[MARK] = root;
}

export function unmount(container: ContainerType) {
    const root = container[MARK];
    if (root) {
        delete container[MARK];
        // Callers unmount from inside the root's own commit (Modal.confirm's afterClose), where React refuses a
        // synchronous unmount; let the current render finish first
        void Promise.resolve().then(() => root.unmount());
    }
}
