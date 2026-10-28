/** @jsxImportSource vue */
import { defineComponent, type PropType, type VNode } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import OverflowList, { type OverflowListItem, type OverflowListOverflowSlotProps } from '..';
import Tag from '../../tag';

type OverflowSlot = (props: OverflowListOverflowSlotProps<OverflowListItem>) => VNode;

const items = ['alarm', 'bookmark', 'camera', 'duration', 'edit', 'folder'].map((key) => ({ key }));
const sides: OverflowSlot = ({ items: rest, position }) => <Tag>{() => `overflow-${position === 'start' ? 0 : 1}:${rest.length}`}</Tag>;

describe('OverflowList（浏览器）', () => {
    it('第一项本身宽于容器时仍报告溢出', async () => {
        const onOverflow = vi.fn<(overflow: OverflowListItem[]) => void>();
        const { container } = render(
            defineComponent(() => () => (
                <div style={{ width: '200px' }}>
                    <OverflowList items={items} onOverflow={onOverflow}>
                        {{
                            item: ({ item }: { item: OverflowListItem }) => <Tag style={{ flex: '0 0 auto', width: item.key === 'alarm' ? '400px' : '60px' }}>{() => item.key}</Tag>,
                            overflow: ({ items: rest }: { items: OverflowListItem[] }) => (rest.length ? <Tag>{() => `+${rest.length}`}</Tag> : null),
                        }}
                    </OverflowList>
                </div>
            ))
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`)).toHaveStyle({ display: 'flex' });
        await waitFor(() => expect(onOverflow).toHaveBeenCalled());
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(items.map((item) => item.key));
        expect(screen.getByText('+6')).toBeInTheDocument();
    });

    it('修复 #1362：滚动模式下新增项会重新计算溢出，而不是复用旧的可见性', async () => {
        const overflow = vi.fn<OverflowSlot>(sides);
        const Host = defineComponent({
            props: {
                list: { type: Array as PropType<OverflowListItem[]>, required: true },
                width: { type: Number, required: true },
            },
            setup: (props) => () => (
                <div style={{ width: '500px' }}>
                    <OverflowList items={props.list} renderMode="scroll">
                        {{
                            item: ({ item }: { item: OverflowListItem }) => <div style={{ flex: '0 0 auto', width: `${props.width}px` }}>{item.key}</div>,
                            overflow,
                        }}
                    </OverflowList>
                </div>
            ),
        });
        const view = render(Host, { props: { list: items, width: 120 } });
        await waitFor(() => expect(screen.getByText(/^overflow-1:[1-9]$/)).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();

        const newItems = ['newAlarm', 'newBookmark', 'newCamera', 'newDuration'].map((key) => ({ key }));
        await view.rerender({ list: newItems, width: 40 });
        expect(screen.getByText('newDuration')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('overflow-1:0')).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();
        const lastOverflowKeys = overflow.mock.calls.slice(-2).flatMap(([args]) => args.items.map((item) => item.key));
        expect(lastOverflowKeys).toEqual([]);
    });

    it('display flex 的 overflowList 在 flex 父元素中收缩到 minVisibleItems，并能重新展开', async () => {
        const Host = defineComponent({
            props: { width: { type: Number, required: true } },
            setup: (props) => () => (
                <div style={{ width: `${props.width}px`, display: 'flex' }}>
                    <OverflowList items={items} minVisibleItems={3} style={{ width: '100%' }}>
                        {{
                            item: ({ item }: { item: OverflowListItem }) => <Tag style={{ flex: '0 0 auto', width: '70px', marginRight: '8px' }}>{() => item.key}</Tag>,
                            overflow: ({ items: rest }: { items: OverflowListItem[] }) => (rest.length ? <Tag style={{ flex: '0 0 auto' }}>{() => `+${rest.length}`}</Tag> : null),
                        }}
                    </OverflowList>
                </div>
            ),
        });
        const visibleKeys = () => items.map((item) => item.key).filter((key) => screen.queryByText(key) !== null);

        const view = render(Host, { props: { width: 600 } });
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText(/^\+\d$/)).toBeNull();

        await view.rerender({ width: 200 });
        await waitFor(() => expect(screen.getByText('+3')).toBeInTheDocument());
        expect(visibleKeys()).toEqual(['alarm', 'bookmark', 'camera']);
        const list = view.container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`) as Element;
        const plus = screen.getByText('+3').getBoundingClientRect();
        expect(Math.round(plus.top)).toBe(Math.round(screen.getByText('alarm').getBoundingClientRect().top));
        expect(plus.left).toBeGreaterThanOrEqual(list.getBoundingClientRect().left);

        await view.rerender({ width: 600 });
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText('+3')).toBeNull();
    });

    // Quarter pixels are exact in every engine's layout units; rounded to whole pixels the items would sum to 102
    it('小数宽度的项恰好填满容器时不溢出', async () => {
        const { container } = render(
            defineComponent(() => () => (
                <div style={{ width: '101.25px' }}>
                    <OverflowList items={items.slice(0, 3)}>
                        {{
                            item: ({ item }: { item: OverflowListItem }) => <div style={{ flex: '0 0 auto', width: '33.75px' }}>{item.key}</div>,
                            overflow: ({ items: rest }: { items: OverflowListItem[] }) => (rest.length ? <Tag>{() => `+${rest.length}`}</Tag> : null),
                        }}
                    </OverflowList>
                </div>
            ))
        );
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`) as Element;
        await expect.poll(() => getComputedStyle(list).visibility).toBe('visible');
        expect(['alarm', 'bookmark', 'camera'].map((key) => screen.queryByText(key) !== null)).toEqual([true, true, true]);
        expect(screen.queryByText(/^\+\d$/)).toBeNull();
    });
});

describe('overflowList', () => {
    it('intersect 模式', async () => {
        const keys = ['All', 'Users', 'Janet', 'Photos', 'Wednesday', 'image'].concat([2, 3, 4, 5, 6, 7].map((n) => `Users${n}`));
        const { container } = render(
            defineComponent(() => () => (
                <div style={{ width: '200px' }}>
                    <OverflowList items={keys.map((key) => ({ key }))} renderMode="scroll">
                        {{
                            item: ({ item }: { item: OverflowListItem }) => <div style={{ marginRight: '8px' }}>{item.key}</div>,
                            overflow: ({ items: rest }: { items: OverflowListItem[] }) => <Tag>{() => String(rest.length)}</Tag>,
                        }}
                    </OverflowList>
                </div>
            ))
        );
        const tagTexts = () => Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`), (tag) => tag.textContent);
        await waitFor(() => expect(tagTexts()).toEqual(['0', '9']));

        const wrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`) as HTMLElement;
        wrapper.scrollLeft = wrapper.scrollWidth;
        await waitFor(() => expect(tagTexts()[0]).toBe('10'));
    });
});
