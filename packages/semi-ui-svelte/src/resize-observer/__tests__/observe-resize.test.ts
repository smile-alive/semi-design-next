import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { mockResizeObserverCore } from '@test/utils/dom/resize-observer-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import { observeResize as fromHooks } from '../../hooks';
import { observeResize as fromRoot } from '../../index';
import observeResize from '../observe-resize';
import Fixture from './observe-fixture.svelte';

describe('Svelte observeResize', () => {
    it('包根与 hooks 子路径导出同一个 observeResize', () => {
        expect(fromRoot).toBe(observeResize);
        expect(fromHooks).toBe(observeResize);
    });

    it('观察挂载的元素并把尺寸变化交给回调', () => {
        const observer = mockResizeObserverCore();
        const onResize = vi.fn<(entries: ResizeObserverEntry[]) => void>();
        render(Fixture, { props: { store: { show: true, onResize } } });
        const box = screen.getByTestId('box');
        expect(observer.observed()).toEqual([box]);
        const entries = [{ target: box }];
        observer.fire(box, entries);
        expect(onResize).toHaveBeenCalledWith(entries, expect.anything());
    });

    it('元素移除后断开观察', () => {
        const observer = mockResizeObserverCore();
        const store = createStore({ show: true, onResize: vi.fn<(entries: ResizeObserverEntry[]) => void>() });
        render(Fixture, { props: { store } });
        expect(observer.live()).toHaveLength(1);
        store.show = false;
        flushSync();
        expect(observer.live()).toHaveLength(0);
    });
});
