import type * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

const MARK = '__semi_react_root__';

type ContainerType = (Element | DocumentFragment) & {
    [MARK]?: Root;
};

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
