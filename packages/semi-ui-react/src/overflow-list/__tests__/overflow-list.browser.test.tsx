import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { OverflowList, Tag } from '@fibrae/semi-ui-react';
import type { OverflowItem, OverflowListProps } from '../index';

const items = ['alarm', 'bookmark', 'camera', 'duration', 'edit', 'folder'].map((key) => ({ key }));

describe('OverflowList（浏览器）', () => {
    it('第一项本身宽于容器时仍报告溢出', async () => {
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const { container } = render(
            <div style={{ width: 200 }}>
                <OverflowList
                    items={items}
                    overflowRenderer={(overflow) => (overflow.length ? <Tag>+{overflow.length}</Tag> : null)}
                    visibleItemRenderer={(item) => (
                        <Tag key={item.key} style={{ flex: '0 0 auto', width: item.key === 'alarm' ? 400 : 60 }}>
                            {item.key}
                        </Tag>
                    )}
                    onOverflow={onOverflow}
                />
            </div>
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`)).toHaveStyle({ display: 'flex' });
        await waitFor(() => expect(onOverflow).toHaveBeenCalled());
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(items.map((item) => item.key));
        expect(screen.getByText('+6')).toBeInTheDocument();
    });

    it('修复 #1362：滚动模式下新增项会重新计算溢出，而不是复用旧的可见性', async () => {
        const overflowRenderer = vi.fn<NonNullable<Extract<OverflowListProps, { renderMode: 'scroll' }>['overflowRenderer']>>(([start, end]) => [<Tag key="start">{`overflow-0:${start.length}`}</Tag>, <Tag key="end">{`overflow-1:${end.length}`}</Tag>]);
        const renderList = (list: OverflowItem[], width: number) => (
            <div style={{ width: 500 }}>
                <OverflowList
                    items={list}
                    overflowRenderer={overflowRenderer}
                    visibleItemRenderer={(item) => (
                        <div key={item.key} style={{ flex: '0 0 auto', width }}>
                            {item.key}
                        </div>
                    )}
                    renderMode="scroll"
                />
            </div>
        );
        const { rerender } = render(renderList(items, 120));
        await waitFor(() => expect(screen.getByText(/^overflow-1:[1-9]$/)).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();

        const newItems = ['newAlarm', 'newBookmark', 'newCamera', 'newDuration'].map((key) => ({ key }));
        rerender(renderList(newItems, 40));
        expect(screen.getByText('newDuration')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('overflow-1:0')).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();
        const lastOverflowKeys = overflowRenderer.mock.lastCall[0].flat().map((item) => item.key);
        expect(lastOverflowKeys).toEqual([]);
    });

    it('display flex 的 overflowList 在 flex 父元素中收缩到 minVisibleItems，并能重新展开', async () => {
        const renderList = (width) => (
            <div style={{ width, display: 'flex' }}>
                <OverflowList
                    style={{ width: '100%' }}
                    items={items}
                    minVisibleItems={3}
                    overflowRenderer={(overflow) => (overflow.length ? <Tag style={{ flex: '0 0 auto' }}>+{overflow.length}</Tag> : null)}
                    visibleItemRenderer={(item) => (
                        <Tag key={item.key} style={{ flex: '0 0 auto', width: 70, marginRight: 8 }}>
                            {item.key}
                        </Tag>
                    )}
                />
            </div>
        );
        const visibleKeys = () => items.map((item) => item.key).filter((key) => screen.queryByText(key) !== null);

        const { container, rerender } = render(renderList(600));
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText(/^\+\d$/)).toBeNull();

        rerender(renderList(200));
        await waitFor(() => expect(screen.getByText('+3')).toBeInTheDocument());
        expect(visibleKeys()).toEqual(['alarm', 'bookmark', 'camera']);
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`);
        const plus = screen.getByText('+3').getBoundingClientRect();
        expect(Math.round(plus.top)).toBe(Math.round(screen.getByText('alarm').getBoundingClientRect().top));
        expect(plus.left).toBeGreaterThanOrEqual(list.getBoundingClientRect().left);

        rerender(renderList(600));
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText('+3')).toBeNull();
    });

    // Quarter pixels are exact in every engine's layout units; rounded to whole pixels the items would sum to 102
    it('小数宽度的项恰好填满容器时不溢出', async () => {
        const { container } = render(
            <div style={{ width: 101.25 }}>
                <OverflowList
                    items={items.slice(0, 3)}
                    overflowRenderer={(overflow) => (overflow.length ? <Tag>+{overflow.length}</Tag> : null)}
                    visibleItemRenderer={(item) => (
                        <div key={item.key} style={{ flex: '0 0 auto', width: 33.75 }}>
                            {item.key}
                        </div>
                    )}
                />
            </div>
        );
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`);
        await expect.poll(() => getComputedStyle(list).visibility).toBe('visible');
        expect(['alarm', 'bookmark', 'camera'].map((key) => screen.queryByText(key) !== null)).toEqual([true, true, true]);
        expect(screen.queryByText(/^\+\d$/)).toBeNull();
    });
});

describe('overflowList', () => {
    it('intersect 模式', async () => {
        const keys = ['All', 'Users', 'Janet', 'Photos', 'Wednesday', 'image'].concat([2, 3, 4, 5, 6, 7].map((n) => `Users${n}`));
        const { container } = render(
            <div style={{ width: 200 }}>
                <OverflowList
                    items={keys.map((key) => ({ key }))}
                    overflowRenderer={([start, end]) => [<Tag key="start">{start.length}</Tag>, <Tag key="end">{end.length}</Tag>]}
                    visibleItemRenderer={(item) => (
                        <div key={item.key} style={{ marginRight: 8 }}>
                            {item.key}
                        </div>
                    )}
                    renderMode="scroll"
                />
            </div>
        );
        const tagTexts = () => Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`), (tag) => tag.textContent);
        await waitFor(() => expect(tagTexts()).toEqual(['0', '9']));

        const wrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        wrapper.scrollLeft = wrapper.scrollWidth;
        await waitFor(() => expect(tagTexts()[0]).toBe('10'));
    });
});
