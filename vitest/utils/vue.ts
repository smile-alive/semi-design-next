import { nextTick } from 'vue';
import { type RenderOptions, render as renderVue } from '@testing-library/vue';
import { vi } from 'vite-plus/test';
import { mockMatchMediaCore } from './dom/match-media-core';
import { mockResizeObserverCore } from './dom/resize-observer-core';

export * from './dom/common';
export * from './function';
export * from './table/data';

let nextAppId = 0;

export function render<C>(component: C, options: RenderOptions<C> = {}) {
    // Testing Library registers cleanup only after a mount succeeds, so a throwing mount (e.g. onMounted) would leak
    // its container and app; only a self-created container is removed
    const container = options.container ?? document.body.appendChild(document.createElement('div'));
    const own = container !== options.container;
    try {
        return renderVue(component, {
            ...options,
            container,
            baseElement: options.baseElement ?? document.body,
            global: {
                ...options.global,
                // Vue Test Utils stubs Transition and TransitionGroup by default, which would skip the enter and leave
                // hooks the overlays and lists rely on. No test passes its own stubs, so none are merged.
                stubs: { transition: false, 'transition-group': false },
                config: { ...options.global?.config, idPrefix: `test-${nextAppId++}` },
            },
        });
    } catch (error) {
        for (const host of container.querySelectorAll<HTMLElement & { __vue_app__?: { unmount(): void } }>('*')) {
            host.__vue_app__?.unmount();
        }
        if (own) {
            container.remove();
        }
        throw error;
    }
}

/**
 * jsdom has no CSS, so Vue's Transition ends an enter or leave two animation frames after it starts. Fake timers
 * fake requestAnimationFrame too, so the frames are advanced instead of awaited.
 */
export async function endTransitions() {
    if (vi.isFakeTimers()) {
        vi.advanceTimersByTime(34);
    } else {
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    await nextTick();
}

export function mockMatchMedia(matching: string[] = []): Omit<ReturnType<typeof mockMatchMediaCore>, 'fire'> & {
    fire(media: string, matches: boolean): Promise<void>;
} {
    const mock = mockMatchMediaCore(matching);
    return {
        ...mock,
        async fire(media: string, matches: boolean) {
            mock.fire(media, matches);
            await nextTick();
        },
    };
}

export function mockResizeObserver(options: Parameters<typeof mockResizeObserverCore>[0] = {}): Omit<ReturnType<typeof mockResizeObserverCore>, 'fire' | 'fireLive'> & {
    fire(target: Element, entries: unknown[]): Promise<void>;
    fireLive(makeEntry: (target: Element) => unknown): Promise<void>;
} {
    const mock = mockResizeObserverCore(options);
    return {
        ...mock,
        async fire(target: Element, entries: unknown[]) {
            mock.fire(target, entries);
            await nextTick();
        },
        async fireLive(makeEntry: (target: Element) => unknown) {
            mock.fireLive(makeEntry);
            await nextTick();
        },
    };
}
