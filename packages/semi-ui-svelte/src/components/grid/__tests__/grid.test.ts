import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { semiGlobal } from '@fibrae/semi-ui-svelte/utils';
import type { ColProps, RowProps } from '../interface';
import GridFixture from './grid-fixture.svelte';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

function gutterVars(row: HTMLElement, axis: 'x' | 'y') {
    return Object.fromEntries(breakpoints.map((bp) => [bp, row.style.getPropertyValue(`--semi-row-gutter-${axis}-${bp}`)]));
}

function colVars(col: HTMLElement) {
    return Object.fromEntries(
        Array.from(col.style)
            .filter((name) => name.startsWith('--semi-col-'))
            .map((name) => [name, col.style.getPropertyValue(name)])
    );
}

const zeros = { xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' };

function setup(row: RowProps = {}, col: ColProps = {}, nested?: RowProps) {
    const store = createStore({ row, col, nested });
    const view = render(GridFixture, { props: { store } });
    const rowEl = () => view.container.querySelector('.semi-row') as HTMLElement;
    const colEl = () => view.container.querySelector('.semi-col') as HTMLElement;
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

    it('justify 与 align 在基础类名之外追加对应类名', () => {
        const { rowEl } = setup({ align: 'middle', justify: 'space-between' });
        expect(rowEl().className).toBe('semi-row semi-row-justify-space-between semi-row-align-middle');
    });

    it('不传 justify 与 align 时只有基础类名', () => {
        const { rowEl } = setup();
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
        semiGlobal.config.overrideDefaultProps = { Row: { gutter: 16 } };
        const { rowEl, store } = setup();
        expect(gutterVars(rowEl(), 'x').md).toBe('16px');
        store.row.gutter = 0;
        flushSync();
        expect(gutterVars(rowEl(), 'x').md).toBe('0px');
        store.row.gutter = undefined;
        flushSync();
        expect(gutterVars(rowEl(), 'x').md).toBe('16px');
    });
});

describe('Svelte Col', () => {
    it('span、order、offset、push 与 pull 写成内联 CSS 变量，类名只有基础类名与 class', () => {
        const { colEl } = setup({}, { class: 'custom', offset: 3, order: 2, pull: 5, push: 4, span: 6 });
        expect(colEl().className).toBe('semi-col custom');
        expect(colVars(colEl())).toEqual({ '--semi-col-span': '6', '--semi-col-offset': '3', '--semi-col-push': '4', '--semi-col-pull': '5', '--semi-col-order': '2' });
    });

    it('值为 0 也写入变量；span 为 0 时另写 display 变量隐藏', () => {
        const { colEl } = setup({}, { offset: 0, order: 0, pull: 0, push: 0, span: 0 });
        expect(colVars(colEl())).toEqual({ '--semi-col-span': '0', '--semi-col-offset': '0', '--semi-col-push': '0', '--semi-col-pull': '0', '--semi-col-order': '0', '--semi-col-display': 'none' });
    });

    it('没有属性时不写任何变量', () => {
        const { colEl } = setup();
        expect(colVars(colEl())).toEqual({});
    });

    it('响应式尺寸接受数字或对象，变量名带断点后缀，未写的键不输出', () => {
        const { colEl } = setup({}, { md: { span: 12, order: 0, offset: 2, push: 1, pull: 0 }, xs: 24, xxl: { order: 3 } });
        expect(colVars(colEl())).toEqual({
            '--semi-col-span-xs': '24',
            '--semi-col-span-md': '12',
            '--semi-col-order-md': '0',
            '--semi-col-offset-md': '2',
            '--semi-col-push-md': '1',
            '--semi-col-pull-md': '0',
            '--semi-col-order-xxl': '3',
        });
        for (const size of ['xs', 'md', 'xxl']) {
            expect(colEl()).not.toHaveAttribute(size);
        }
    });

    it('任一层的 span 为 0 时，写了 span 的每一层都带 display 变量，后面的非 0 span 重新显示', () => {
        const { colEl } = setup({}, { md: 0, sm: 8, xs: { span: 12, order: 1 } });
        expect(colVars(colEl())).toEqual({
            '--semi-col-span-xs': '12',
            '--semi-col-order-xs': '1',
            '--semi-col-display-xs': 'block',
            '--semi-col-span-sm': '8',
            '--semi-col-display-sm': 'block',
            '--semi-col-span-md': '0',
            '--semi-col-display-md': 'none',
        });
    });

    it('用户 style 与生成的变量合并，同名时用户的值优先', () => {
        const { colEl } = setup({}, { span: 6, style: '--semi-col-span: 12; color: red' });
        expect(colEl().style.getPropertyValue('--semi-col-span')).toBe('12');
        expect(colEl().style.color).toBe('red');
    });

    it('未声明属性透传到根元素，style 原样转发', () => {
        const { colEl } = setup({ gutter: 16 }, { id: 'c', 'data-testid': 'col', style: 'padding-left: 1px' } as ColProps);
        expect(colEl()).toHaveAttribute('data-testid', 'col');
        expect(colEl()).toHaveAttribute('id', 'c');
        expect(colEl()).toHaveAttribute('x-semi-prop', 'children');
        expect(colEl().getAttribute('style')).toBe('padding-left: 1px;');
        expect(colEl()).toHaveTextContent('child');
    });

    it('span 等 prop 变化后变量响应式更新', () => {
        const { store, colEl } = setup({}, { span: 6 });
        store.col.span = 8;
        store.col.xs = { offset: 1 };
        flushSync();
        expect(colVars(colEl())).toEqual({ '--semi-col-span': '8', '--semi-col-offset-xs': '1' });
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Col: { span: 4 } };
        const { colEl, store } = setup();
        expect(colVars(colEl())).toEqual({ '--semi-col-span': '4' });
        store.col.span = 6;
        flushSync();
        expect(colVars(colEl())).toEqual({ '--semi-col-span': '6' });
    });
});
