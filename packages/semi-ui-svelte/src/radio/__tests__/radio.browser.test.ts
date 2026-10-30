import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { RadioGroupProps, RadioProps } from '../interface';
import GroupFixture from './group-fixture.svelte';
import GroupModes from './group-modes.svelte';
import RadioFixture from './radio-fixture.svelte';

const prefix = `${BASE_CLASS_PREFIX}-radio`;
const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;
const display = (el: Element) => el.querySelector(`.${prefix}-inner-display`) as Element;
const group = (props: RadioGroupProps = {}) => render(GroupFixture, { props: { store: createStore({ props }) } });
const radio = (props: RadioProps, label: string) => render(RadioFixture, { props: { store: createStore({ props, label }) } });

describe('Svelte Radio（浏览器）', () => {
    // Chrome sends no click for Space on a checked radio, which the jsdom tests cannot reproduce
    it('高级模式下，聚焦已选中的 Radio 按空格取消选中', async () => {
        const onChange = vi.fn<(event: { target: { checked: boolean } }) => void>();
        radio({ mode: 'advanced', checked: true, 'aria-label': 'advanced', onChange }, '');
        screen.getByRole<HTMLInputElement>('radio').focus();
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0]?.[0].target.checked).toBe(false);
        expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('键盘聚焦未选中的单选框显示主题焦点环，鼠标点击后不显示，再按键后显示', async () => {
        const { container } = radio({}, 'label');
        await userEvent.keyboard('{Tab}');
        expectThemeFocusRing(display(container));
        await userEvent.click(container.querySelector(`.${prefix}`) as Element);
        expect(outlineOf(display(container))).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(display(container));
    });

    it('方向键在 group 内移动选中项并跳过禁用项', async () => {
        const onChange = vi.fn<(event: { target: { value: unknown } }) => void>();
        group({
            options: [
                { label: 'A', value: 'A' },
                { label: 'B', value: 'B', disabled: true },
                { label: 'C', value: 'C' },
            ],
            value: 'A',
            onChange,
        });
        screen.getByRole<HTMLInputElement>('radio', { name: 'A' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('radio', { name: 'C' })).toHaveFocus();
        expect(screen.getByRole('radio', { name: 'C' })).toBeChecked();
        expect(onChange.mock.calls[0]?.[0].target.value).toBe('C');
    });

    it('受控 group 拒绝方向键与点击，保持受控值', async () => {
        const store = createStore<{ value: string | undefined; accept: boolean; log: string[] }>({ value: 'B', accept: false, log: [] });
        render(GroupModes, { props: { mode: 'function', store } });
        await userEvent.click(screen.getByRole('radio', { name: 'A' }));
        await userEvent.click(screen.getByRole('radio', { name: 'C' }));
        await userEvent.keyboard('{ArrowUp}');
        expect(['A', 'B', 'C'].map((name) => (screen.getByRole('radio', { name }) as HTMLInputElement).checked)).toEqual([false, true, false]);
    });

    it('RadioGroup blur：组内方向键移动不触发，Tab 离开整个组触发一次', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        group({ options: ['A', 'B'], onBlur });
        radio({ type: 'button' }, 'after');
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'after' })).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('悬停未选中的卡片选项显示悬停背景', async () => {
        const probe = (token: string) => {
            const span = document.createElement('span');
            span.style.backgroundColor = `var(${token})`;
            document.body.append(span);
            const color = getComputedStyle(span).backgroundColor;
            span.remove();
            return color;
        };
        const { container } = radio({ type: 'card' }, 'card');
        const card = container.querySelector<HTMLElement>('label') as HTMLElement;
        card.style.transition = 'none';
        await userEvent.hover(card);
        expect(getComputedStyle(card).backgroundColor).toBe(probe('--semi-color-fill-0'));
        await userEvent.click(card);
        expect(getComputedStyle(card).backgroundColor).not.toBe(probe('--semi-color-fill-0'));
    });
});
