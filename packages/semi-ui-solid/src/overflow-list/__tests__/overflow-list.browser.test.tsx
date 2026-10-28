import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import OverflowList, { type OverflowItem, type OverflowListProps } from '..';

const items = ['alarm', 'bookmark', 'camera', 'duration', 'edit', 'folder'].map((key) => ({ key }));
const prefixCls = `${BASE_CLASS_PREFIX}-overflow-list`;
// Stands in for Tag: a fixed-size inline box, since no theme is loaded
const Chip = (props: { width?: number; marginRight?: number; children: unknown }) => <span style={{ display: 'inline-block', flex: '0 0 auto', width: `${props.width ?? 60}px`, 'margin-right': props.marginRight ? `${props.marginRight}px` : undefined }}>{props.children as string}</span>;

describe('OverflowList（浏览器）', () => {
    it('第一项本身宽于容器时仍报告溢出', async () => {
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const { container } = render(() => (
            <div style={{ width: '200px' }}>
                <OverflowList items={items} overflowRenderer={(overflow) => (overflow.length ? <Chip>+{overflow.length}</Chip> : null)} visibleItemRenderer={(item) => <Chip width={item.key === 'alarm' ? 400 : 60}>{item.key}</Chip>} onOverflow={onOverflow} />
            </div>
        ));
        expect(container.querySelector(`.${prefixCls}`)).toHaveStyle({ display: 'flex' });
        await waitFor(() => expect(onOverflow).toHaveBeenCalled());
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(items.map((item) => item.key));
        expect(screen.getByText('+6')).toBeInTheDocument();
    });

    it('滚动模式下新增项会重新计算溢出，而不是复用旧的可见性', async () => {
        const overflowRenderer = vi.fn<NonNullable<Extract<OverflowListProps, { renderMode: 'scroll' }>['overflowRenderer']>>(([start, end]) => [<Chip>{`overflow-0:${start.length}`}</Chip>, <Chip>{`overflow-1:${end.length}`}</Chip>]);
        const [list, setList] = createSignal<OverflowItem[]>(items);
        const [width, setWidth] = createSignal(120);
        render(() => (
            <div style={{ width: '500px' }}>
                <OverflowList items={list()} overflowRenderer={overflowRenderer} visibleItemRenderer={(item) => <div style={{ flex: '0 0 auto', width: `${width()}px` }}>{item.key}</div>} renderMode="scroll" />
            </div>
        ));
        await waitFor(() => expect(screen.getByText(/^overflow-1:[1-9]$/)).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();

        setWidth(40);
        setList(['newAlarm', 'newBookmark', 'newCamera', 'newDuration'].map((key) => ({ key })));
        expect(screen.getByText('newDuration')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('overflow-1:0')).toBeInTheDocument());
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();
        expect(overflowRenderer.mock.lastCall?.[0].flat().map((item) => item.key)).toEqual([]);
    });

    it('display flex 的 overflowList 在 flex 父元素中收缩到 minVisibleItems，并能重新展开', async () => {
        const [width, setWidth] = createSignal(600);
        const visibleKeys = () => items.map((item) => item.key).filter((key) => screen.queryByText(key) !== null);
        const { container } = render(() => (
            <div style={{ width: `${width()}px`, display: 'flex' }}>
                <OverflowList
                    style={{ width: '100%' }}
                    items={items}
                    minVisibleItems={3}
                    overflowRenderer={(overflow) => (overflow.length ? <Chip>+{overflow.length}</Chip> : null)}
                    visibleItemRenderer={(item) => (
                        <Chip width={70} marginRight={8}>
                            {item.key}
                        </Chip>
                    )}
                />
            </div>
        ));
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText(/^\+\d$/)).toBeNull();

        setWidth(200);
        await waitFor(() => expect(screen.getByText('+3')).toBeInTheDocument());
        expect(visibleKeys()).toEqual(['alarm', 'bookmark', 'camera']);
        const list = container.querySelector(`.${prefixCls}`) as HTMLElement;
        const plus = screen.getByText('+3').getBoundingClientRect();
        expect(Math.round(plus.top)).toBe(Math.round(screen.getByText('alarm').getBoundingClientRect().top));
        expect(plus.left).toBeGreaterThanOrEqual(list.getBoundingClientRect().left);

        setWidth(600);
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText('+3')).toBeNull();
    });

    // Quarter pixels are exact in every engine's layout units; rounded to whole pixels the items would sum to 102
    it('小数宽度的项恰好填满容器时不溢出', async () => {
        const { container } = render(() => (
            <div style={{ width: '101.25px' }}>
                <OverflowList items={items.slice(0, 3)} overflowRenderer={(overflow) => (overflow.length ? <Chip>+{overflow.length}</Chip> : null)} visibleItemRenderer={(item) => <Chip width={33.75}>{item.key}</Chip>} />
            </div>
        ));
        const list = container.querySelector(`.${prefixCls}`) as HTMLElement;
        await expect.poll(() => getComputedStyle(list).visibility).toBe('visible');
        expect(['alarm', 'bookmark', 'camera'].map((key) => screen.queryByText(key) !== null)).toEqual([true, true, true]);
        expect(screen.queryByText(/^\+\d$/)).toBeNull();
    });

    it('collapseFrom 为 start 时在窄容器中保留末尾的项，变宽后展开全部', async () => {
        const [width, setWidth] = createSignal(200);
        const visibleKeys = () => items.map((item) => item.key).filter((key) => screen.queryByText(key) !== null);
        render(() => (
            <div style={{ width: `${width()}px` }}>
                <OverflowList collapseFrom="start" items={items} overflowRenderer={(overflow) => (overflow.length ? <Chip width={30}>+{overflow.length}</Chip> : null)} visibleItemRenderer={(item) => <Chip>{item.key}</Chip>} />
            </div>
        ));
        await waitFor(() => expect(screen.getByText(/^\+\d$/)).toBeInTheDocument());
        expect(visibleKeys().at(-1)).toBe('folder');
        expect(visibleKeys().length).toBeLessThan(6);
        expect(screen.getByText(/^\+\d$/).getBoundingClientRect().left).toBeLessThan(screen.getByText('folder').getBoundingClientRect().left);

        setWidth(600);
        await waitFor(() => expect(visibleKeys()).toHaveLength(6));
        expect(screen.queryByText(/^\+\d$/)).toBeNull();
    });

    it('intersect 模式', async () => {
        const keys = ['All', 'Users', 'Janet', 'Photos', 'Wednesday', 'image'].concat([2, 3, 4, 5, 6, 7].map((n) => `Users${n}`));
        const { container } = render(() => (
            <div style={{ width: '200px' }}>
                <OverflowList items={keys.map((key) => ({ key }))} overflowRenderer={([start, end]) => [<b>{start.length}</b>, <b>{end.length}</b>]} visibleItemRenderer={(item) => <div style={{ 'margin-right': '8px' }}>{item.key}</div>} renderMode="scroll" />
            </div>
        ));
        const sideTexts = () => Array.from(container.querySelectorAll('b'), (side) => side.textContent);
        await waitFor(() => expect(Number(sideTexts()[1])).toBeGreaterThan(5));
        expect(sideTexts()[0]).toBe('0');

        const wrapper = container.querySelector(`.${prefixCls}-scroll-wrapper`) as HTMLElement;
        wrapper.scrollLeft = wrapper.scrollWidth;
        await waitFor(() => expect(Number(sideTexts()[0])).toBeGreaterThan(5));
        expect(sideTexts()[1]).toBe('0');
    });

    it('两侧溢出节点同时变化时，滚动容器保持原位，scrollLeft 不归零', async () => {
        const keys = Array.from({ length: 12 }, (_, i) => `item${i}`);
        const { container } = render(() => (
            <div style={{ width: '200px' }}>
                <OverflowList
                    items={keys.map((key) => ({ key }))}
                    overflowRenderer={([start, end]) => [
                        <>
                            <b>{start.length}</b>
                            <i />
                        </>,
                        <>
                            <b>{end.length}</b>
                            <i />
                        </>,
                    ]}
                    visibleItemRenderer={(item) => <Chip>{item.key}</Chip>}
                    renderMode="scroll"
                />
            </div>
        ));
        const sideTexts = () => Array.from(container.querySelectorAll('b'), (side) => side.textContent);
        await waitFor(() => expect(Number(sideTexts()[1])).toBeGreaterThan(0));

        const wrapper = container.querySelector(`.${prefixCls}-scroll-wrapper`) as HTMLElement;
        wrapper.scrollLeft = 120;
        const scrolled = wrapper.scrollLeft;
        expect(scrolled).toBeGreaterThan(0);
        await waitFor(() => expect(Number(sideTexts()[0])).toBeGreaterThan(0));
        expect(wrapper.scrollLeft).toBe(scrolled);
    });
});
