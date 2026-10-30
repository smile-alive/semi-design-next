import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ColProps, RowProps } from '../interface';
import GridFixture from './grid-fixture.svelte';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

function gutterVars(row: HTMLElement, axis: 'x' | 'y') {
    return Object.fromEntries(breakpoints.map((bp) => [bp, row.style.getPropertyValue(`--semi-row-gutter-${axis}-${bp}`)]));
}

const zeros = { xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' };

function setup(row: RowProps = {}, col: ColProps = {}, nested?: RowProps) {
    const store = createStore({ row, col, nested });
    const view = render(GridFixture, { props: { store } });
    const rowEl = () => view.container.querySelector('.semi-row, .semi-row-flex, [class*="-row"]') as HTMLElement;
    const colEl = () => view.container.querySelector('[class*="-col"]') as HTMLElement;
    return { store, view, rowEl, colEl };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Row', () => {
    it('渲染基础 row 类名与子内容，并把未声明属性透传到根元素', () => {
        const { rowEl } = setup({ id: 'r', 'data-testid': 'row', class: 'custom', style: 'color: red' } as RowProps);
        expect(rowEl().tagName).toBe('DIV');
        expect(rowEl()).toHaveClass('semi-row', 'custom');
        expect(rowEl()).toHaveAttribute('x-semi-prop', 'children');
        expect(rowEl()).toHaveAttribute('data-testid', 'row');
        expect(rowEl()).toHaveAttribute('id', 'r');
        expect(rowEl()).not.toHaveAttribute('gutter');
        expect(rowEl().style.color).toBe('red');
        expect(rowEl()).toHaveTextContent('child');
    });

    it('type 为 flex 时使用 flex 类名，替代基础类名', () => {
        const { rowEl } = setup({ type: 'flex', align: 'middle', justify: 'space-between' });
        expect(rowEl().className).toBe('semi-row-flex semi-row-flex-space-between semi-row-flex-middle');
    });

    it('未设置 type 时忽略 justify 与 align', () => {
        const { rowEl } = setup({ align: 'top', justify: 'center' });
        expect(rowEl().className).toBe('semi-row');
    });

    it('不传 gutter 时，横纵向在每个断点都写入 0px', () => {
        const { rowEl } = setup();
        expect(gutterVars(rowEl(), 'x')).toEqual(zeros);
        expect(gutterVars(rowEl(), 'y')).toEqual(zeros);
    });

    it('数字 gutter 对每个断点都写入同一个值', () => {
        const { rowEl } = setup({ gutter: 16 });
        expect(gutterVars(rowEl(), 'x')).toEqual({ xs: '16px', sm: '16px', md: '16px', lg: '16px', xl: '16px', xxl: '16px' });
    });

    it('gutter 为 0 或负数时，横纵向变量都解析为 0px，Col 没有自己的内联样式', () => {
        const { rowEl, colEl } = setup({ gutter: [0, -8] });
        expect(gutterVars(rowEl(), 'x')).toEqual(zeros);
        expect(gutterVars(rowEl(), 'y')).toEqual(zeros);
        expect(colEl().getAttribute('style')).toBeNull();
    });

    it('响应式 gutter 对象按断点写入对应的 CSS 变量：sm 及以上延用更小断点的值，xs 是独立区间', () => {
        const { rowEl } = setup({ gutter: { xs: 4, md: 16, xl: 24 } });
        expect(gutterVars(rowEl(), 'x')).toEqual({ xs: '4px', sm: '0px', md: '16px', lg: '16px', xl: '24px', xxl: '24px' });
    });

    it('响应式 gutter 也作用于纵向', () => {
        const { rowEl } = setup({ gutter: [8, { xs: 4, sm: 20 }] });
        expect(gutterVars(rowEl(), 'y')).toMatchObject({ xs: '4px', sm: '20px', md: '20px' });
        expect(gutterVars(rowEl(), 'x')).toMatchObject({ xs: '8px', sm: '8px' });
    });

    it('不调用 window.matchMedia 解析响应式 gutter', () => {
        const matchMediaSpy = vi.fn<typeof window.matchMedia>();
        vi.stubGlobal('matchMedia', matchMediaSpy);
        const { store, view } = setup({ gutter: { xs: 4, md: 16 } });
        store.row.gutter = 8;
        flushSync();
        view.unmount();
        expect(matchMediaSpy).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it('挂载后 gutter 变为响应式时，CSS 变量立即反映新的断点配置', () => {
        const { store, rowEl } = setup({ gutter: 8 });
        store.row.gutter = { sm: 8, xxl: 40 };
        flushSync();
        expect(gutterVars(rowEl(), 'x')).toMatchObject({ sm: '8px', md: '8px', lg: '8px', xl: '8px', xxl: '40px' });
    });

    it('用户 style 中同名的变量覆盖 Row 写入的变量', () => {
        const { rowEl } = setup({ style: '--semi-row-gutter-x-md: 3px', gutter: 16 });
        expect(rowEl().style.getPropertyValue('--semi-row-gutter-x-md')).toBe('3px');
        expect(rowEl().style.getPropertyValue('--semi-row-gutter-x-lg')).toBe('16px');
    });

    it('嵌套 Row 完整写出自己的变量，不依赖外层', () => {
        const { view } = setup({ gutter: 20 }, {}, { gutter: 8 });
        const inner = view.container.querySelector('.inner') as HTMLElement;
        expect(gutterVars(inner, 'x')).toMatchObject({ xs: '8px', xxl: '8px' });
        expect(gutterVars(inner, 'y')).toEqual(zeros);
    });

    it('读取全局默认值，显式属性优先；undefined 回落到全局值', () => {
        semiGlobal.config.overrideDefaultProps = { Row: { gutter: 16, prefixCls: 'g' } };
        const { rowEl, store } = setup();
        expect(rowEl()).toHaveClass('g-row');
        expect(gutterVars(rowEl(), 'x').md).toBe('16px');
        store.row.gutter = 0;
        flushSync();
        expect(gutterVars(rowEl(), 'x').md).toBe('0px');
        store.row.gutter = undefined;
        flushSync();
        expect(gutterVars(rowEl(), 'x').md).toBe('16px');
    });

    it('prefixCls 局部覆盖对 Row 与 Col 分别生效', () => {
        const { view } = setup({ prefixCls: 'a' }, { prefixCls: 'b' });
        expect(view.container.querySelector('.a-row')).not.toBeNull();
        expect(view.container.querySelector('.b-col')).not.toBeNull();
    });
});

describe('Svelte Col', () => {
    it('渲染 span、order、offset、push 与 pull 类名', () => {
        const { colEl } = setup({}, { class: 'custom', offset: 3, order: 2, pull: 5, push: 4, span: 6 });
        expect(colEl().className).toBe('semi-col semi-col-6 semi-col-order-2 semi-col-offset-3 semi-col-push-4 semi-col-pull-5 custom');
    });

    it('跳过为 0 的 order、offset、push 与 pull，但保留 span 0', () => {
        const { colEl } = setup({}, { offset: 0, order: 0, pull: 0, push: 0, span: 0 });
        expect(colEl().className).toBe('semi-col semi-col-0');
    });

    it('从数字与对象渲染响应式尺寸类名，并保留 0 值', () => {
        const { colEl } = setup({}, { md: { span: 12, order: 0, offset: 2, push: 1, pull: 0 }, xs: 24, xxl: { order: 3 } });
        expect(colEl().className).toBe('semi-col semi-col-xs-24 semi-col-md-12 semi-col-md-order-0 semi-col-md-offset-2 semi-col-md-push-1 semi-col-md-pull-0 semi-col-xxl-order-3');
        for (const size of ['xs', 'md', 'xxl']) {
            expect(colEl()).not.toHaveAttribute(size);
        }
    });

    it('未声明属性透传到根元素，style 原样转发', () => {
        const { colEl } = setup({ gutter: 16 }, { id: 'c', 'data-testid': 'col', style: 'padding-left: 1px' } as ColProps);
        expect(colEl()).toHaveAttribute('data-testid', 'col');
        expect(colEl()).toHaveAttribute('id', 'c');
        expect(colEl()).toHaveAttribute('x-semi-prop', 'children');
        expect(colEl().getAttribute('style')).toBe('padding-left: 1px;');
        expect(colEl()).toHaveTextContent('child');
    });

    it('span 等 prop 变化后类名响应式更新', () => {
        const { store, colEl } = setup({}, { span: 6 });
        store.col.span = 8;
        store.col.xs = { offset: 1 };
        flushSync();
        expect(colEl().className).toBe('semi-col semi-col-8 semi-col-xs-offset-1');
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Col: { prefixCls: 'g', span: 4 } };
        const { colEl, store } = setup();
        expect(colEl()).toHaveClass('g-col', 'g-col-4');
        store.col.prefixCls = 'own';
        flushSync();
        expect(colEl()).toHaveClass('own-col');
    });
});
