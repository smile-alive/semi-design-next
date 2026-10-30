import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { ColProps, RowProps } from '../interface';
import GridFixture from './grid-fixture.svelte';

const q = (root: ParentNode, selector: string) => root.querySelector(selector) as Element;
const style = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name);

function setup(row: RowProps, col: ColProps = {}, nested?: RowProps) {
    const store = createStore({ row, col, nested });
    return { store, ...render(GridFixture, { props: { store } }) };
}

describe('Svelte Grid 浏览器', () => {
    afterEach(async () => {
        await page.viewport(1000, 660);
    });

    it('md 为 0 只在 md 及以上隐藏', async () => {
        const displayAt = async (width: number) => {
            await page.viewport(width, 660);
            const { container, unmount } = setup({}, { md: 0 });
            const display = getComputedStyle(q(container, '.semi-col')).display;
            unmount();
            return display;
        };
        expect(await displayAt(500)).not.toBe('none');
        expect(await displayAt(1000)).toBe('none');
    });

    it('数字 gutter 只影响横向，纵向为 0', () => {
        const { container } = setup({ gutter: 16 });
        const row = q(container, '.semi-row');
        const col = q(container, '.semi-col');
        expect(style(row, 'margin-left')).toBe('-8px');
        expect(style(row, 'margin-top')).toBe('0px');
        expect(style(col, 'padding-left')).toBe('8px');
        expect(style(col, 'padding-top')).toBe('0px');
    });

    it('数组 gutter [横, 纵] 两个方向各自生效，flex 布局落点一致', () => {
        const { container } = setup({ type: 'flex', gutter: [16, 24] });
        const row = q(container, '.semi-row-flex');
        const col = q(container, '.semi-col');
        expect(getComputedStyle(row).display).toBe('flex');
        expect(style(row, 'margin-left')).toBe('-8px');
        expect(style(row, 'margin-top')).toBe('-12px');
        expect(style(col, 'padding-left')).toBe('8px');
        expect(style(col, 'padding-top')).toBe('12px');
    });

    it('用户 style 只覆盖显式设置的一侧，另一侧仍由 gutter 决定', () => {
        const { container } = setup({ style: 'margin-left: 3px', gutter: [16, 24] });
        const row = q(container, '.semi-row');
        expect(style(row, 'margin-left')).toBe('3px');
        expect(style(row, 'margin-right')).toBe('-8px');
        expect(style(row, 'margin-top')).toBe('-12px');
    });

    it('嵌套 Row 完全覆盖外层的 gutter', () => {
        const { container } = setup({ gutter: 20 }, {}, { gutter: 8 });
        expect(style(q(container, '.inner-col'), 'padding-left')).toBe('4px');
    });

    it.each([
        [500, '-2px', '2px'],
        [700, '0px', '0px'],
        [800, '-8px', '8px'],
        [1300, '-12px', '12px'],
    ])('响应式 gutter：视口宽度 %dpx 时，margin 为 %s，padding 为 %s', async (width, expectedMargin, expectedPadding) => {
        await page.viewport(width, 600);
        const { container } = setup({ gutter: { xs: 4, md: 16, xl: 24 } });
        await expect.poll(() => style(q(container, '.semi-row'), 'margin-left')).toBe(expectedMargin);
        expect(style(q(container, '.semi-col'), 'padding-left')).toBe(expectedPadding);
    });

    it('gutter prop 由数字改成响应式对象后，xxl 视口下 padding 随之更新', async () => {
        await page.viewport(1700, 600);
        const { store, container } = setup({ gutter: 8 });
        const col = q(container, '.semi-col');
        await expect.poll(() => style(col, 'padding-left')).toBe('4px');
        store.row.gutter = { sm: 8, xxl: 40 };
        flushSync();
        await expect.poll(() => style(col, 'padding-left')).toBe('20px');
    });
});
