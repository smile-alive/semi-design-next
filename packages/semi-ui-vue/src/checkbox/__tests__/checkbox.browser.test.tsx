/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, preventBackspaceNavigation, tab } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Checkbox, { CheckboxGroup } from '..';
import type { CheckboxEvent, CheckboxType } from '../interface';
import FocusButton from './fixtures/focus-button.vue';
import FormSubmit from './fixtures/form-submit.vue';

const prefix = `${BASE_CLASS_PREFIX}-checkbox`;
const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;
const display = (el: Element) => el.querySelector(`.${prefix}-inner-display`) as Element;

describe('Checkbox（浏览器）', () => {
    it.each(['box', 'text'])('鼠标点击%s后焦点进入勾选框但不显示焦点环', async (part) => {
        const { container } = render(Checkbox, { slots: { default: () => 'agree' } });
        const box = display(container);
        await userEvent.click(part === 'box' ? box : screen.getByText('agree'));
        expect(screen.getByRole('checkbox')).toHaveFocus();
        expect(outlineOf(box)).toBe('none');
    });

    it('键盘聚焦后按空格切换状态，焦点环保持显示', async () => {
        const { container } = render(Checkbox, { slots: { default: () => 'agree' } });
        await tab();
        await userEvent.keyboard(' ');
        expect(screen.getByRole('checkbox')).toBeChecked();
        expectThemeFocusRing(display(container));
    });

    it('checkbox Tab 测试', async () => {
        preventBackspaceNavigation();
        const { container } = render(CheckboxGroup, {
            props: { direction: 'horizontal' },
            slots: {
                default: () =>
                    [
                        ['dy', '抖音'],
                        ['hotsoon', '火山'],
                        ['toutiao', '今日头条'],
                        ['xigua', '西瓜视频'],
                    ].map(([value, text]) => <Checkbox value={value}>{() => text}</Checkbox>),
            },
        });
        const checkboxes = container.querySelectorAll(`.${prefix}`);

        await userEvent.click(checkboxes[0] as Element);
        expect(checkboxes[0]).toHaveClass(`${prefix}-checked`);
        await tab();
        expect(screen.getByRole('checkbox', { name: '火山' })).toHaveFocus();
        expectThemeFocusRing(display(checkboxes[1] as Element));
        expect(outlineOf(display(checkboxes[0] as Element))).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expect(checkboxes[1]).toHaveClass(`${prefix}-unChecked`);
        await userEvent.keyboard('{Backspace}');
        expect(checkboxes[1]).toHaveClass(`${prefix}-unChecked`);
        expect(checkboxes[0]).toHaveClass(`${prefix}-checked`);
    });

    it('checkbox 禁用', async () => {
        const { container } = render({
            render: () => (
                <div>
                    <Checkbox value={1}>{() => 'hello'}</Checkbox>
                    <Checkbox modelValue>{() => '这是一个受控的checked=true的checkbox,没有配change'}</Checkbox>
                    <Checkbox defaultChecked>{() => '这是一个不受控的defaultChecked=true的checkbox'}</Checkbox>
                    <Checkbox disabled>{() => '这是一个受控的disabled=true的checkbox'}</Checkbox>
                    <Checkbox modelValue disabled>
                        {() => '既checked又disabled'}
                    </Checkbox>
                    <Checkbox indeterminate>{() => 'indeterminate'}</Checkbox>
                    <Checkbox value={1} />
                </div>
            ),
        });
        const displays = container.querySelectorAll(`.${prefix}-inner-display`);

        await userEvent.click(container.querySelector(`.${prefix}`) as Element);
        await tab();
        await tab();
        await tab();
        expect(screen.getByRole('checkbox', { name: 'indeterminate' })).toHaveFocus();
        expectThemeFocusRing(displays[5] as Element);
        expect(Array.from(displays).filter((el) => outlineOf(el) !== 'none')).toEqual([displays[5]]);
    });

    it('受控半选的 checkbox 点击后仍是 :indeterminate，原生 input 保持 mixed', async () => {
        const change = vi.fn<(event: CheckboxEvent) => void>();
        render(Checkbox, {
            props: { modelValue: false, indeterminate: true, onChange: change },
            slots: { default: () => 'partial' },
        });
        const input = screen.getByRole<HTMLInputElement>('checkbox', { name: 'partial' });
        expect(input.matches(':indeterminate')).toBe(true);
        // the native input is visually hidden, so the click goes to the wrapper like a pointer would
        await userEvent.click(input.closest(`.${prefix}`) as Element);
        expect(change).toHaveBeenCalledTimes(1);
        expect(input.matches(':indeterminate')).toBe(true);
        expect(input).toBePartiallyChecked();
    });

    it.each<[string, CheckboxType]>([
        ['checkbox card', 'card'],
        ['checkbox pureCard', 'pureCard'],
    ])('%s', async (_, type) => {
        preventBackspaceNavigation();
        const { container } = render(CheckboxGroup, {
            props: { type, defaultValue: ['1'], direction: 'horizontal' },
            slots: {
                default: () =>
                    ['1', '2', '3'].map((value) => (
                        <Checkbox style={{ width: '280px' }} value={value}>
                            {{ default: () => '多选框标题', extra: () => 'Semi Design' }}
                        </Checkbox>
                    )),
            },
        });
        const cards = container.querySelectorAll(`.${prefix}`);
        const tick = (card: Element) => card.querySelector(`.${prefix}-inner-display .${BASE_CLASS_PREFIX}-icon-checkbox_tick`);
        expect(tick(cards[0] as Element)).not.toBeNull();

        await userEvent.click(cards[0] as Element);
        expect(tick(cards[0] as Element)).toBeNull();
        await tab();
        // Card types draw the keyboard focus ring on the whole card
        expectThemeFocusRing(cards[1] as Element);
        expect(Array.from(cards).filter((card) => outlineOf(card) !== 'none')).toEqual([cards[1]]);
        expect(outlineOf(display(cards[1] as Element))).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expect(tick(cards[1] as Element)).toBeNull();
        await userEvent.keyboard('{Space}');
        expect(tick(cards[1] as Element)).not.toBeNull();
    });

    it('Enter 不切换状态，隐式表单提交交由浏览器处理', async () => {
        const change = vi.fn<(event: CheckboxEvent) => void>();
        const submit = vi.fn<() => void>();
        render(FormSubmit, { props: { onChange: change, onSubmit: submit } });
        screen.getByRole('checkbox').focus();
        await userEvent.keyboard('{Enter}');
        expect(change).not.toHaveBeenCalled();
        expect(submit).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(change).toHaveBeenCalledTimes(1);
    });

    it('Enter 不执行会把焦点移到按钮上的 change，因此该按钮不会被按下', async () => {
        const confirm = vi.fn<() => void>();
        render(FocusButton, { props: { onConfirm: confirm } });
        screen.getByRole('checkbox').focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('checkbox')).toHaveFocus();
        expect(confirm).not.toHaveBeenCalled();
    });

    it('点击内容里的链接不切换', async () => {
        render(Checkbox, {
            slots: {
                default: () => [
                    'accept ',
                    <a href="#terms" onClick={(e: Event) => e.preventDefault()}>
                        terms
                    </a>,
                ],
            },
        });
        await userEvent.click(screen.getByRole('link', { name: 'terms' }));
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('组的 blur 在焦点真正离开整个组时触发一次', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render({
            render: () => (
                <>
                    <CheckboxGroup options={['a', 'b']} onBlur={blur} />
                    <button type="button">after</button>
                </>
            ),
        });
        await tab();
        await tab();
        expect(screen.getByRole('checkbox', { name: 'b' })).toHaveFocus();
        expect(blur).not.toHaveBeenCalled();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(blur).toHaveBeenCalledTimes(1);
    });
});
