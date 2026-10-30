import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { LayoutProps } from '../interface';
import LayoutFixture from './layout-fixture.svelte';

const flexDirection = (container: Element) => getComputedStyle(container.querySelector('.semi-layout') as HTMLElement).flexDirection;

describe('Svelte Layout 浏览器', () => {
    it('has-sider 使 Layout 横向排列，无 Sider 时纵向排列', async () => {
        const store = createStore<{ props: LayoutProps; sider: 'direct' | 'none'; parts: boolean }>({ props: {}, sider: 'direct', parts: true });
        const view = render(LayoutFixture, { props: { store } });
        await Promise.resolve();
        expect(flexDirection(view.container)).toBe('row');
        store.sider = 'none';
        flushSync();
        expect(flexDirection(view.container)).toBe('column');
    });

    it('嵌套较深的 Sider 挂载后登记，随后横向排列', async () => {
        const store = createStore({ props: {}, sider: 'deep' as const });
        const view = render(LayoutFixture, { props: { store } });
        await Promise.resolve();
        expect(flexDirection(view.container)).toBe('row');
    });
});
