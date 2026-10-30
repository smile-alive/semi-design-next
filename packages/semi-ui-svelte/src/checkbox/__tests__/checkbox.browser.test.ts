import { createRawSnippet } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tab } from '@test/utils/browser';
import CheckboxGroup from '../checkbox-group.svelte';
import Checkbox from '../checkbox.svelte';

const prefix = `${BASE_CLASS_PREFIX}-checkbox`;
const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;
const display = (el: Element) => el.querySelector(`.${prefix}-inner-display`) as Element;
const agree = createRawSnippet(() => ({ render: () => '<span>agree</span>' }));

describe('Svelte Checkbox（浏览器）', () => {
    it.each(['box', 'text'])('鼠标点击%s后焦点进入勾选框但不显示焦点环', async (part) => {
        const { container } = render(Checkbox, { props: { children: agree } });
        const box = display(container);
        await userEvent.click(part === 'box' ? box : screen.getByText('agree'));
        expect(screen.getByRole('checkbox')).toHaveFocus();
        expect(outlineOf(box)).toBe('none');
    });

    it('键盘聚焦后按空格切换状态，焦点环保持显示', async () => {
        const { container } = render(Checkbox, { props: { children: agree } });
        await tab();
        await userEvent.keyboard(' ');
        expect(screen.getByRole('checkbox')).toBeChecked();
        expectThemeFocusRing(display(container));
    });

    it('分组内 Tab 在勾选框间移动，焦点环只画在当前框', async () => {
        const { container } = render(CheckboxGroup, { props: { direction: 'horizontal', options: ['a', 'b', 'c'] } });
        const boxes = container.querySelectorAll(`.${prefix}`);
        await userEvent.click(boxes[0] as Element);
        expect(boxes[0]).toHaveClass(`${prefix}-checked`);
        await tab();
        expect(screen.getByRole('checkbox', { name: 'b' })).toHaveFocus();
        expectThemeFocusRing(display(boxes[1] as Element));
        expect(outlineOf(display(boxes[0] as Element))).toBe('none');
    });

    it('card 分组的键盘焦点环画在整张卡片上', async () => {
        const { container } = render(CheckboxGroup, { props: { type: 'card', value: ['a'], direction: 'horizontal', options: ['a', 'b'] } });
        const cards = container.querySelectorAll(`.${prefix}`);
        await tab();
        await tab();
        expectThemeFocusRing(cards[1] as Element);
        expect(outlineOf(display(cards[1] as Element))).toBe('none');
    });

    it('点击内容里的链接不切换', async () => {
        const link = createRawSnippet(() => ({ render: () => '<span>accept <a href="#terms">terms</a></span>' }));
        render(Checkbox, { props: { children: link } });
        const anchor = screen.getByRole('link', { name: 'terms' });
        anchor.addEventListener('click', (event) => event.preventDefault());
        await userEvent.click(anchor);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('组的 onBlur 在焦点真正离开整个组时触发一次', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(CheckboxGroup, { props: { options: ['a', 'b'], onBlur: blur } });
        const after = document.body.appendChild(document.createElement('button'));
        await tab();
        await tab();
        expect(blur).not.toHaveBeenCalled();
        await tab();
        expect(after).toHaveFocus();
        expect(blur).toHaveBeenCalledTimes(1);
        after.remove();
    });
});
