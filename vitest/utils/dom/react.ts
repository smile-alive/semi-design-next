import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { act } from '@testing-library/react';
import { onTestFinished, vi } from 'vite-plus/test';
import { mockMatchMediaCore } from './match-media-core';
import { mockResizeObserverCore } from './resize-observer-core';

// Server rendering has no document; remove jsdom's so a render-time read throws ReferenceError as in Node
export function renderWithoutDocument(element: ReactElement) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
    if (!descriptor) {
        throw new Error('expected jsdom to define document on globalThis');
    }
    Reflect.deleteProperty(globalThis, 'document');
    try {
        return renderToString(element);
    } finally {
        Object.defineProperty(globalThis, 'document', descriptor);
    }
}

// Hydrates the server HTML of `element`; `errors` collects recoverable and uncaught errors and hydration warnings,
// which React reports through console.error. `beforeHydrate` runs on the server DOM, e.g. to fire image events.
// Only document is removed for the server pass: window and the other jsdom globals stay, so a dependency that branches
// on `typeof window` takes its browser branch on both sides and such a mismatch goes unseen here.
export async function hydrateFromServer(element: ReactElement, beforeHydrate?: (container: HTMLElement) => void) {
    const container = document.createElement('div');
    container.innerHTML = renderWithoutDocument(element);
    document.body.append(container);
    beforeHydrate?.(container);
    const errors: unknown[] = [];
    const originalError = console.error;
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        if (/hydrat/i.test(args.map(String).join(' '))) {
            errors.push(args.join(' '));
        } else {
            originalError(...args);
        }
    });
    const root = await act(async () => hydrateRoot(container, element, { onRecoverableError: (error) => errors.push(error), onUncaughtError: (error) => errors.push(error) }));
    onTestFinished(() => {
        act(() => root.unmount());
        container.remove();
        consoleError.mockRestore();
    });
    return { container, errors };
}

export function mockMatchMedia(matching: string[] = []) {
    const mock = mockMatchMediaCore(matching);
    return {
        ...mock,
        fire(media: string, matches: boolean) {
            act(() => mock.fire(media, matches));
        },
    };
}

export function mockResizeObserver(options: Parameters<typeof mockResizeObserverCore>[0] = {}) {
    const mock = mockResizeObserverCore(options);
    return {
        ...mock,
        fire(target: Element, entries: unknown[]) {
            act(() => mock.fire(target, entries));
        },
        fireLive(makeEntry: (target: Element) => unknown) {
            act(() => mock.fireLive(makeEntry));
        },
    };
}
