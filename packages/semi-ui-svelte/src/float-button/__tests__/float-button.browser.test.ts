import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import LayoutFixture from './layout-fixture.svelte';

const prefixCls = 'semi-floatButton';
const groupCls = 'semi-floatButtonGroup';

function rectOf(el: Element) {
    const { x, y, width, height } = el.getBoundingClientRect();
    return { x, y, width, height };
}

describe('Svelte FloatButton 布局与样式（浏览器）', () => {
    it('在所有尺寸下，无论是否有 badge，主体都填满根元素', () => {
        const { container } = render(LayoutFixture, { props: { scene: 'sizes' } });
        const roots = container.querySelectorAll(`.${prefixCls}`);
        [24, 32, 40, 32].forEach((size, index) => {
            const root = roots[index];
            const body = root.querySelector(`.${prefixCls}-body`) as Element;
            expect(rectOf(root)).toMatchObject({ width: size, height: size });
            expect(rectOf(body)).toEqual(rectOf(root));
        });
    });

    it('根元素没有浏览器默认的按钮或链接样式', () => {
        const { container } = render(LayoutFixture, { props: { scene: 'reset' } });
        const style = getComputedStyle(container.querySelector(`.${prefixCls}`) as Element);
        expect(style.paddingTop).toBe('0px');
        expect(style.paddingLeft).toBe('0px');
        expect(style.borderTopWidth).toBe('0px');
        expect(style.marginTop).toBe('0px');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.textDecorationLine).toBe('none');
        expect(style.cursor).toBe('pointer');
        expect(style.borderTopLeftRadius).toBe('8px');
        expect(style.position).toBe('fixed');
    });
});

describe('Svelte FloatButtonGroup 布局与样式（浏览器）', () => {
    it('每个项使用分组项样式渲染，且没有浏览器默认按钮样式', () => {
        const { container } = render(LayoutFixture, { props: { scene: 'group' } });
        const root = container.querySelector(`.${groupCls}`) as Element;
        const item = root.querySelector(`.${groupCls}-item`) as Element;
        const style = getComputedStyle(item);
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.borderTopWidth).toBe('0px');
        expect(style.marginTop).toBe('0px');
        expect(style.padding).toBe('6px 12px');
        expect(style.fontFamily).toBe(getComputedStyle(root).fontFamily);
        expect(style.fontSize).toBe('14px');
        expect(style.fontWeight).toBe('400');
        expect(style.lineHeight).toBe('20px');
        expect(style.textDecorationLine).toBe('none');
        expect(style.cursor).toBe('pointer');
        expect(style.borderTopLeftRadius).toBe('4px');
        expect(style.color).toBe(getComputedStyle(screen.getByTestId('text-0')).color);
        expect(rectOf(item).height).toBe(32);
        expect(rectOf(root).height).toBe(44);
    });

    it('分组项在相同属性下具有与独立 FloatButton 相同的形状、尺寸和彩色外观', () => {
        render(LayoutFixture, { props: { scene: 'compare' } });
        const alone = getComputedStyle(screen.getByRole('button', { name: 'alone' }).firstElementChild as Element);
        const item = screen.getByRole('button', { name: 'grouped' });
        const grouped = getComputedStyle(item);
        expect(grouped.backgroundImage).toBe(alone.backgroundImage);
        expect(grouped.backgroundImage).not.toBe('none');
        expect(grouped.color).toBe(alone.color);
        expect(grouped.borderTopLeftRadius).toBe(alone.borderTopLeftRadius);
        expect(rectOf(item).width).toBe(parseFloat(alone.width));
        expect(rectOf(item).height).toBe(parseFloat(alone.height));
    });

    it('禁用项变暗，且没有悬停背景', async () => {
        render(LayoutFixture, { props: { scene: 'disabled' } });
        const item = screen.getByRole('button', { name: 'Editor' });
        await userEvent.hover(item);
        const style = getComputedStyle(item);
        expect(style.color).toBe(getComputedStyle(screen.getByTestId('disabled-text')).color);
        expect(style.cursor).toBe('not-allowed');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('分组宽度不足时文字项保持单行原宽，不按字换行', () => {
        const { container } = render(LayoutFixture, { props: { scene: 'narrow' } });
        const [roomy, narrow] = [...container.querySelectorAll(`.${groupCls}`)].map((group) => rectOf(group.querySelector(`.${groupCls}-item`) as Element));
        expect({ width: narrow.width, height: narrow.height }).toEqual({ width: roomy.width, height: roomy.height });
    });
});

describe('Svelte FloatButton 键盘操作（浏览器）', () => {
    it('可通过 Tab 访问按钮和链接，并用 Enter 与 Space 激活', async () => {
        const log: string[] = [];
        render(LayoutFixture, { props: { scene: 'keyboard', log } });
        await userEvent.click(screen.getByTestId('start'));

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit' }));
        expect(getComputedStyle(document.activeElement as Element).outlineStyle).toBe('solid');
        expect(getComputedStyle(document.activeElement as Element).outlineWidth).toBe('2px');
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(log).toEqual(['edit', 'edit']);

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Docs' }));
        await userEvent.keyboard('{Enter}');
        expect(log.at(-1)).toBe('docs');

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Editor' }));
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Help' }));
        await userEvent.keyboard('{Enter}');
        expect(log.filter((entry) => entry.startsWith('group:'))).toEqual(['group:editor', 'group:help']);
    });
});
