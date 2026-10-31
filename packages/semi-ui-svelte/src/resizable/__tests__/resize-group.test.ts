import { flushSync, tick } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { ResizeCallback } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Group from './group.svelte';
import { down, drag, key, mockLayout, up } from './helpers';
import KeyedGroup from './keyed-group.svelte';

const getGroup = () => document.querySelector<HTMLElement>('.semi-resizable-group') as HTMLElement;
const getItems = () => [...document.querySelectorAll<HTMLElement>('.semi-resizable-item')];
const getHandlers = () => [...document.querySelectorAll<HTMLElement>('.semi-resizable-handler')];
const getBackground = () => document.querySelector('.semi-resizable-background');
const widths = () => getItems().map((el) => el.style.width);
const heights = () => getItems().map((el) => el.style.height);
const handler = (index = 0) => getHandlers()[index] as HTMLElement;
const item = (index = 0) => getItems()[index] as HTMLElement;

beforeEach(() => {
    mockLayout();
});

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte ResizeGroup', () => {
    it('水平 group 布局：各项等分，并减去相邻手柄宽度的一半', () => {
        render(Group);
        const group = getGroup();
        expect(group).toHaveClass('custom');
        expect(group.dataset.testid).toBe('group');
        expect(group.style.flexDirection).toBe('row');
        expect(widths()).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(handler()).toHaveClass('semi-resizable-handler-horizontal');
        expect(handler().querySelector('svg')).not.toBeNull();
        expect(item(1)).toHaveTextContent('item 1');
    });

    it('垂直 group 按高度布局', () => {
        render(Group, { props: { direction: 'vertical', width: '500px', height: '510px' } });
        expect(getGroup().style.flexDirection).toBe('column');
        expect(heights()).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(handler()).toHaveClass('semi-resizable-handler-vertical');
    });

    it('group 背景层不使用使用方传入的 class', async () => {
        render(Group);
        await down(handler(), [500, 0]);
        expect(getBackground()).not.toBeNull();
        expect(getBackground()).not.toHaveClass('custom');
        await up([500, 0]);
        expect(getBackground()).toBeNull();
    });

    it('拖动手柄：相邻两项的尺寸互补，并触发各自的 onChange 与 onResizeEnd', async () => {
        const onChangeA = vi.fn<ResizeCallback>();
        const onEndB = vi.fn<ResizeCallback>();
        render(Group, { props: { items: [{ onChange: onChangeA }, { onResizeEnd: onEndB }] } });
        await drag(handler(), [500, 0], [600, 0]);
        expect(onChangeA).toHaveBeenCalled();
        expect(onEndB).toHaveBeenCalledTimes(1);
        const [first, second] = widths();
        expect(first).not.toBe('calc(50% - 5px)');
        expect(second).not.toBe('calc(50% - 5px)');
    });

    it('中途插入到中间的项按文档顺序参与布局：拖动它相邻的手柄只调整相邻两项', async () => {
        const store = createStore({ ids: ['a', 'c'] });
        render(KeyedGroup, { props: store });
        store.ids = ['a', 'b', 'c'];
        flushSync();
        const before = widths();
        await key(handler(), 'ArrowRight');
        const after = widths();
        expect(after[0]).not.toBe(before[0]);
        expect(after[1]).not.toBe(before[1]);
        expect(after[2]).toBe(before[2]);
    });

    it('item 的 min 限制拖动范围', async () => {
        render(Group, { props: { items: [{ min: '40%' }, {}] } });
        await drag(handler(), [500, 0], [0, 0]);
        // 40% of the 1010px group, as a share of the group minus half the handler
        expect(item(0).style.width).toBe('calc(40.495% - 5px)');
    });

    it('handler 是带语言包名称的 separator，方向键移动', async () => {
        render(Group);
        const separator = screen.getByRole('separator', { name: zh_CN.Resizable.separator });
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        const before = widths();
        const notPrevented = await key(separator, 'ArrowRight');
        await tick();
        expect(notPrevented).toBe(false);
        expect(widths()).not.toEqual(before);
    });

    it('传入 aria-label 时 handler 的可访问名称是传入值，不被语言包覆盖', () => {
        render(Group, { props: { handlerProps: { 'aria-label': '调整侧栏宽度' } } });
        expect(screen.getByRole('separator', { name: '调整侧栏宽度' })).toBe(handler());
    });

    it('全局默认值：overrideDefaultProps 提供 direction', () => {
        semiGlobal.config.overrideDefaultProps = { ResizeGroup: { direction: 'vertical' } };
        render(Group);
        expect(getGroup().style.flexDirection).toBe('column');
    });
});
