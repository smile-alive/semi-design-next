import { flushSync, tick } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { ResizeCallback, ResizeStartCallback } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Box from './box.svelte';
import { down, drag, key, mockLayout, move, up } from './helpers';

const getRoot = () => document.querySelector<HTMLElement>('.semi-resizable-resizable') as HTMLElement;
const getHandle = (dir: string) => document.querySelector<HTMLElement>(`.semi-resizable-resizableHandler-${dir}`) as HTMLElement;
const getBackground = () => document.querySelector('.semi-resizable-background');
function sizeOf() {
    const { width, height } = getRoot().style;
    return { width, height };
}

const renderBox = (props: Record<string, unknown> = {}) => render(Box, { props: { defaultSize: { width: 200, height: 100 }, ...props } });

beforeEach(() => {
    mockLayout();
});

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Resizable', () => {
    it('渲染带 class、style、data-* 与子内容的根元素，并为每个方向渲染一个手柄', () => {
        render(Box, { props: { class: 'custom', style: 'color: red', 'data-testid': 'box', content: true } });
        const root = getRoot();
        expect(root).toHaveClass('custom');
        expect(root.style.color).toBe('red');
        expect(root.dataset.testid).toBe('box');
        expect(root.querySelector('.child')).toHaveTextContent('content');
        expect(sizeOf()).toEqual({ width: 'auto', height: 'auto' });
        expect([...document.querySelectorAll('.semi-resizable-resizableHandler')].map((el) => [...el.classList].find((c) => c.startsWith('semi-resizable-resizableHandler-')))).toEqual(
            ['top', 'right', 'bottom', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'].map((dir) => `semi-resizable-resizableHandler-${dir}`)
        );
        expect(getBackground()).toBeNull();
    });

    it('根据 defaultSize 的数字与字符串计算尺寸，并应用 min/max 样式，数字输出 px', () => {
        const store = createStore<Record<string, unknown>>({ defaultSize: { width: 200, height: '50%' }, maxHeight: '90%', minWidth: 50 });
        render(Box, { props: store });
        expect(sizeOf()).toEqual({ width: '200px', height: '50%' });
        expect(getRoot().style.minWidth).toBe('50px');
        expect(getRoot().style.maxHeight).toBe('90%');
        store.size = { width: '30vw', height: 120 };
        flushSync();
        expect(sizeOf()).toEqual({ width: '30vw', height: '120px' });
    });

    it.each([
        ['right', [150, 100], 250, 100],
        ['left', [50, 100], 250, 100],
        ['bottom', [100, 150], 200, 150],
        ['top', [100, 50], 200, 150],
        ['bottomRight', [150, 130], 250, 130],
        ['topLeft', [50, 70], 250, 130],
    ] as const)('拖动 %s 手柄', async (dir, to, width, height) => {
        const onChange = vi.fn<ResizeCallback>();
        renderBox({ onChange });
        await down(getHandle(dir), [100, 100]);
        await move([...to]);
        expect(sizeOf()).toEqual({ width: `${width}px`, height: `${height}px` });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0]?.[0]).toEqual({ width, height });
        expect(onChange.mock.calls[0]?.[2]).toBe(dir);
        await up([...to]);
        expect(sizeOf()).toEqual({ width: `${width}px`, height: `${height}px` });
    });

    it('调用 onResizeStart、onChange 与 onResizeEnd，并传入尺寸、事件与方向', async () => {
        const onResizeStart = vi.fn<ResizeStartCallback>();
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        renderBox({ onResizeStart, onChange, onResizeEnd });
        await down(getHandle('right'), [100, 100]);
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        expect(onResizeStart.mock.calls[0]?.[0]).toBeInstanceOf(PointerEvent);
        expect(onResizeStart.mock.calls[0]?.[1]).toBe('right');
        expect(getBackground()).not.toBeNull();
        await move([150, 100]);
        await up([150, 100]);
        expect(onResizeEnd).toHaveBeenCalledTimes(1);
        expect(onResizeEnd.mock.calls[0]?.[0]).toEqual({ width: 250, height: 100 });
        expect(getBackground()).toBeNull();
    });

    it('onResizeStart 返回 false 时取消缩放', async () => {
        const onChange = vi.fn<ResizeCallback>();
        renderBox({ onResizeStart: () => false, onChange });
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(onChange).not.toHaveBeenCalled();
        expect(sizeOf()).toEqual({ width: '200px', height: '100px' });
    });

    it('size 受控：不跟随拖动，由使用方在 onChange 里更新', async () => {
        const store = createStore<{ size: { width: number }; log: number[] }>({ size: { width: 200 }, log: [] });
        render(Box, {
            props: {
                get size() {
                    return store.size;
                },
                defaultSize: { height: 100 },
                onChange: (next: { width?: string | number }) => store.log.push(Number(next.width)),
            },
        });
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(store.log.at(-1)).toBe(250);
        expect(getRoot().style.width).toBe('200px');
        store.size = { width: 250 };
        flushSync();
        expect(getRoot().style.width).toBe('250px');
    });

    it('enable 为 false 时不渲染手柄，对象里缺省的方向仍启用，false 的方向不渲染', () => {
        const { unmount } = renderBox({ enable: false });
        expect(document.querySelectorAll('.semi-resizable-resizableHandler')).toHaveLength(0);
        unmount();
        renderBox({ enable: { top: false, left: false } });
        expect(getHandle('top')).toBeNull();
        expect(getHandle('right')).not.toBeNull();
    });

    it('有键盘可达的边时手柄是带语言包名称与取值范围的 separator，方向键缩放', async () => {
        const onChange = vi.fn<ResizeCallback>();
        renderBox({ onChange, enable: { right: true, top: false, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false } });
        const separator = screen.getByRole('separator', { name: zh_CN.Resizable.resizeWidth });
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        expect(separator).toHaveAttribute('tabindex', '0');
        const notPrevented = await key(separator, 'ArrowRight');
        expect(notPrevented).toBe(false);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getRoot().style.width).toBe('210px');
        await tick();
    });

    it('全局默认值：overrideDefaultProps 提供 handleWrapperClass', () => {
        semiGlobal.config.overrideDefaultProps = { Resizable: { handleWrapperClass: 'from-global' } };
        renderBox();
        expect(document.querySelector('.from-global')).not.toBeNull();
    });
});
