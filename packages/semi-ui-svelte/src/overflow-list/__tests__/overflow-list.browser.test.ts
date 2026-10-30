import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { OverflowListItem } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import OverflowListLayout from './overflow-list-layout.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-overflow-list`;
const items = ['alarm', 'bookmark', 'camera', 'duration', 'edit', 'folder'].map((key) => ({ key }));

function setup(variant: 'wide-first' | 'scroll-new' | 'flex' | 'fractional' | 'intersect', list: OverflowListItem[], width = 0, onOverflow?: (overflow: OverflowListItem[]) => void) {
    const store = createStore({ list, width });
    const view = render(OverflowListLayout, { props: { variant, store, onOverflow } });
    const set = (next: Partial<typeof store>) => {
        Object.assign(store, next);
        flushSync();
    };
    return { ...view, set, list: () => view.container.querySelector(`.${prefixCls}`) as HTMLElement };
}

describe('OverflowList（浏览器）', () => {
    it('第一项本身宽于容器时仍报告溢出', async () => {
        const onOverflow = vi.fn<(overflow: OverflowListItem[]) => void>();
        const view = setup('wide-first', items, 0, onOverflow);
        expect(view.list()).toHaveStyle({ display: 'flex' });
        await waitFor(() => expect(onOverflow).toHaveBeenCalled());
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(items.map((item) => item.key));
        expect(screen.getByText('+6')).toBeInTheDocument();
    });

    it('滚动模式下新增项会重新计算溢出，而不是复用旧的可见性', async () => {
        const view = setup('scroll-new', items, 120);
        await waitFor(() => expect(screen.getByText(/^overflow-1:[1-9]$/)).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();

        view.set({ list: ['newAlarm', 'newBookmark', 'newCamera', 'newDuration'].map((key) => ({ key })), width: 40 });
        expect(screen.getByText('newDuration')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('overflow-1:0')).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();
    });

    it('display flex 的 overflowList 在 flex 父元素中收缩到 minVisibleItems，并能重新展开', async () => {
        const visibleKeys = () => items.map((item) => item.key).filter((key) => screen.queryByText(key) !== null);
        const view = setup('flex', items, 600);
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText(/^\+\d$/)).toBeNull();

        view.set({ width: 200 });
        await waitFor(() => expect(screen.getByText('+3')).toBeInTheDocument());
        expect(visibleKeys()).toEqual(['alarm', 'bookmark', 'camera']);
        const plus = screen.getByText('+3').getBoundingClientRect();
        expect(Math.round(plus.top)).toBe(Math.round(screen.getByText('alarm').getBoundingClientRect().top));
        expect(plus.left).toBeGreaterThanOrEqual(view.list().getBoundingClientRect().left);

        view.set({ width: 600 });
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText('+3')).toBeNull();
    });

    // Quarter pixels are exact in every engine's layout units; rounded to whole pixels the items would sum to 102
    it('小数宽度的项恰好填满容器时不溢出', async () => {
        const view = setup('fractional', items.slice(0, 3));
        await expect.poll(() => getComputedStyle(view.list()).visibility).toBe('visible');
        expect(['alarm', 'bookmark', 'camera'].map((key) => screen.queryByText(key) !== null)).toEqual([true, true, true]);
        expect(screen.queryByText(/^\+\d$/)).toBeNull();
    });

    it('scroll 模式随滚动更新两侧 overflow 的数量', async () => {
        const keys = ['All', 'Users', 'Janet', 'Photos', 'Wednesday', 'image'].concat([2, 3, 4, 5, 6, 7].map((n) => `Users${n}`));
        const view = setup(
            'intersect',
            keys.map((key) => ({ key }))
        );
        const counts = () => Array.from(view.container.querySelectorAll(`.${prefixCls} > span`), (node) => node.textContent);
        await waitFor(() => expect(Number(counts()[1])).toBeGreaterThan(0));
        expect(counts()[0]).toBe('0');

        const wrapper = view.container.querySelector(`.${prefixCls}-scroll-wrapper`) as HTMLElement;
        wrapper.scrollLeft = wrapper.scrollWidth;
        await waitFor(() => expect(Number(counts()[0])).toBeGreaterThan(0));
        expect(counts()[1]).toBe('0');
    });
});
