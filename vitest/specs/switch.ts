import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

/** Framework-free Switch props; each fixture maps `checked` and the text props to its own binding, slots or snippets */
export interface SwitchSpecProps {
    /** `undefined` is uncontrolled */
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    loading?: boolean;
    size?: 'small' | 'default' | 'large';
    checkedText?: string;
    uncheckedText?: string;
    id?: string;
    name?: string;
    tabIndex?: number;
    title?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    onChange?: (checked: boolean, event: { type: string; target: EventTarget | null }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-switch`;

export function switchSpec(mount: SpecMount<SwitchSpecProps>, options: SpecOptions = {}) {
    defineSpec('Switch（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<SwitchSpecProps>;

        async function render(props: SwitchSpecProps = {}) {
            handle = await mount(props);
            view = within(handle.container);
            return handle;
        }

        const control = () => view.getByRole<HTMLInputElement>('switch');
        const root = () => control().parentElement!;
        // Svelte keeps the whitespace around a snippet's text
        const text = (name: 'checked' | 'unchecked') => handle.container.querySelector(`.${prefix}-${name}-text`)?.textContent?.trim() ?? null;

        test('渲染 role="switch" 的原生 checkbox，默认未选中，不叠加 aria-checked 与 aria-disabled', async () => {
            await render();
            expect(control()).toHaveAttribute('type', 'checkbox');
            expect(control()).not.toBeChecked();
            expect(control()).not.toHaveAttribute('aria-checked');
            expect(control()).not.toHaveAttribute('aria-disabled');
            expect(root()).toHaveClass(prefix);
            expect(root()).not.toHaveClass(`${prefix}-checked`);
            expect(handle.container.querySelector(`.${prefix}-knob`)).not.toBeNull();
        });

        test('非受控：点击逐次切换，onChange 收到新值与 change 事件，事件的 target 是原生控件', async () => {
            const onChange = vi.fn<NonNullable<SwitchSpecProps['onChange']>>();
            await render({ onChange });
            await userEvent.click(control());
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            const [checked, event] = onChange.mock.calls[0];
            expect(checked).toBe(true);
            expect(event.type).toBe('change');
            expect(event.target).toBe(control());
            await userEvent.click(control());
            await userEvent.click(control());
            expect(onChange.mock.calls.map(([value]) => value)).toEqual([true, false, true]);
            expect(control()).toBeChecked();
        });

        test('没有 onChange 时仍可切换', async () => {
            await render();
            await userEvent.click(control());
            expect(control()).toBeChecked();
        });

        test('defaultChecked 只决定初始状态，之后的变化不再生效', async () => {
            await render({ defaultChecked: true });
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            expect(control()).not.toBeChecked();
            await handle.update({ defaultChecked: true });
            expect(control()).not.toBeChecked();
        });

        test('受控：点击只通知新值，状态由 checked 决定，checked 更新后跟随', async () => {
            const onChange = vi.fn<NonNullable<SwitchSpecProps['onChange']>>();
            await render({ checked: false, onChange });
            await userEvent.click(control());
            expect(onChange.mock.calls.map(([value]) => value)).toEqual([true]);
            expect(control()).not.toBeChecked();
            expect(root()).not.toHaveClass(`${prefix}-checked`);

            await handle.update({ checked: true });
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            expect(onChange.mock.calls.map(([value]) => value)).toEqual([true, false]);
            expect(control()).toBeChecked();
        });

        test('checked 变回 undefined 时取消选中并转为非受控', async () => {
            await render({ checked: true });
            expect(control()).toBeChecked();
            await handle.update({ checked: undefined });
            expect(control()).not.toBeChecked();
            expect(root()).not.toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            expect(control()).toBeChecked();
        });

        test('键盘：Tab 进入与离开，空格切换', async () => {
            const onChange = vi.fn<NonNullable<SwitchSpecProps['onChange']>>();
            await render({ onChange });
            await userEvent.tab();
            expect(control()).toHaveFocus();
            await userEvent.keyboard(' ');
            expect(control()).toBeChecked();
            expect(onChange).toHaveBeenCalledTimes(1);
            await userEvent.keyboard('{Enter}');
            expect(onChange).toHaveBeenCalledTimes(1);
            await userEvent.tab();
            expect(control()).not.toHaveFocus();
        });

        test('disabled 由原生属性表达：类名、点击与键盘都不切换，更新为 false 后恢复', async () => {
            const onChange = vi.fn<NonNullable<SwitchSpecProps['onChange']>>();
            await render({ disabled: true, defaultChecked: true, onChange });
            expect(control()).toBeDisabled();
            expect(control()).not.toHaveAttribute('aria-disabled');
            expect(root()).toHaveClass(`${prefix}-disabled`, `${prefix}-checked`);
            await userEvent.click(control());
            await userEvent.tab();
            expect(control()).not.toHaveFocus();
            expect(onChange).not.toHaveBeenCalled();
            expect(control()).toBeChecked();

            await handle.update({ disabled: false });
            expect(control()).toBeEnabled();
            expect(root()).not.toHaveClass(`${prefix}-disabled`);
            await userEvent.click(control());
            expect(onChange).toHaveBeenCalledWith(false, expect.anything());
        });

        test('loading：用 Spin 替换滑块，控件保持可聚焦并带 aria-disabled，点击与空格都不切换也不通知', async () => {
            const onChange = vi.fn<NonNullable<SwitchSpecProps['onChange']>>();
            await render({ loading: true, size: 'small', onChange });
            expect(root()).toHaveClass(`${prefix}-loading`, `${prefix}-small`);
            expect(handle.container.querySelector(`.${prefix}-loading-spin`)).not.toBeNull();
            expect(handle.container.querySelector(`.${prefix}-knob`)).toBeNull();
            expect(control()).toBeEnabled();
            expect(control()).toHaveAttribute('aria-disabled', 'true');
            await userEvent.click(control());
            control().focus();
            await userEvent.keyboard(' ');
            expect(control()).toHaveFocus();
            expect(onChange).not.toHaveBeenCalled();
            expect(control()).not.toBeChecked();

            await handle.update({ loading: false, size: 'default' });
            expect(root()).not.toHaveClass(`${prefix}-loading`);
            expect(handle.container.querySelector(`.${prefix}-knob`)).not.toBeNull();
            expect(control()).not.toHaveAttribute('aria-disabled');
            await userEvent.click(control());
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('disabled 与 loading 可同时生效', async () => {
            await render({ disabled: true, loading: true });
            expect(root()).toHaveClass(`${prefix}-disabled`, `${prefix}-loading`);
            expect(control()).toBeDisabled();
        });

        test('size 设置 small、large 类名，default 不加尺寸类名', async () => {
            await render({ size: 'default' });
            expect(root()).not.toHaveClass(`${prefix}-small`);
            expect(root()).not.toHaveClass(`${prefix}-large`);
            await handle.update({ size: 'small' });
            expect(root()).toHaveClass(`${prefix}-small`);
            await handle.update({ size: 'large' });
            expect(root()).toHaveClass(`${prefix}-large`);
            expect(root()).not.toHaveClass(`${prefix}-small`);
        });

        test('checkedText 只在选中时显示，uncheckedText 只在未选中时显示，small 尺寸都不显示', async () => {
            await render({ checkedText: 'ON', uncheckedText: 'OFF' });
            expect(text('unchecked')).toBe('OFF');
            expect(text('checked')).toBeNull();
            await userEvent.click(control());
            expect(text('checked')).toBe('ON');
            expect(text('unchecked')).toBeNull();

            await handle.update({ size: 'small' });
            expect(text('checked')).toBeNull();
            expect(text('unchecked')).toBeNull();
            await handle.update({ size: 'large' });
            expect(text('checked')).toBe('ON');
        });

        test('id、name、tabIndex 与 aria-* 落在原生控件，根元素没有；其余未声明属性落在根元素', async () => {
            await render({ id: 'my-switch', name: 'on', tabIndex: -1, title: 'tip', 'aria-label': 'dark mode', 'aria-describedby': 'hint', 'aria-invalid': true });
            expect(view.getByRole('switch', { name: 'dark mode' })).toBe(control());
            expect(control()).toHaveAttribute('id', 'my-switch');
            expect(control()).toHaveAttribute('name', 'on');
            expect(control()).toHaveAttribute('tabindex', '-1');
            expect(control()).toHaveAttribute('aria-describedby', 'hint');
            expect(control()).toHaveAttribute('aria-invalid', 'true');
            for (const attribute of ['id', 'name', 'tabindex', 'aria-label', 'aria-describedby', 'aria-invalid']) {
                expect(root()).not.toHaveAttribute(attribute);
            }
            expect(root()).toHaveAttribute('title', 'tip');
        });

        test('APG switch 模式', async () => {
            await render({ 'aria-label': 'dark mode' });
            await expect(checkPattern('switch', handle.container, { press })).resolves.toBeUndefined();
        });

        test('卸载后移除控件', async () => {
            await render();
            handle.unmount();
            expect(document.querySelector('[role="switch"]')).toBeNull();
        });
    });
}
