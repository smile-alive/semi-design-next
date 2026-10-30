import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { MarkdownRenderProps } from '../interface';
import Driver from './driver.svelte';

// unified calls a plugin's attacher once per compile, so a no-op remark plugin counts compiles
export const compileCounter = () => vi.fn<() => undefined>(() => undefined);
export const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

export function setup(initial: MarkdownRenderProps, context?: Map<unknown, unknown>) {
    const store = createStore<MarkdownRenderProps>(initial);
    const view = render(Driver, { props: { store }, context });
    const update = async (next: Partial<MarkdownRenderProps>) => {
        Object.assign(store, next);
        flushSync();
        await settle();
    };
    return { store, update, ...view };
}
