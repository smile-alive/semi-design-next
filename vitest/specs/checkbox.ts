import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export type CheckboxSpecValue = string | number | boolean;

export interface CheckboxSpecEvent {
    target: { checked: boolean; value?: CheckboxSpecValue; name?: string; disabled: boolean };
}

/** Framework-free Checkbox props; each fixture maps `checked` to its binding and `label`, `extra` to children, slots or snippets */
export interface CheckboxSpecProps {
    /** `undefined` is uncontrolled */
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    value?: CheckboxSpecValue;
    name?: string;
    id?: string;
    tabIndex?: number;
    type?: 'default' | 'card' | 'pureCard';
    label?: string;
    extra?: string;
    title?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    onChange?: (event: CheckboxSpecEvent) => void;
}

export interface CheckboxSpecOption {
    value: CheckboxSpecValue;
    label: string;
    disabled?: boolean;
    extra?: string;
}

/** Framework-free CheckboxGroup props; `options` become `options` items, or Checkbox children when `asChildren` is set */
export interface CheckboxGroupSpecProps {
    options: Array<string | CheckboxSpecOption>;
    asChildren?: boolean;
    /** `undefined` is uncontrolled */
    value?: CheckboxSpecValue[];
    defaultValue?: CheckboxSpecValue[];
    disabled?: boolean;
    name?: string;
    direction?: 'horizontal' | 'vertical';
    type?: 'default' | 'card' | 'pureCard';
    title?: string;
    'aria-label'?: string;
    'aria-invalid'?: boolean;
    onChange?: (value: CheckboxSpecValue[]) => void;
    // React passes a synthetic event, so only `type` is common to every framework
    onBlur?: (event: { type: string }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-checkbox`;
const groupPrefix = `${BASE_CLASS_PREFIX}-checkboxGroup`;

const threeOptions: CheckboxSpecOption[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
];

export function checkboxSpec(mount: SpecMount<CheckboxSpecProps>, mountGroup: SpecMount<CheckboxGroupSpecProps>, options: SpecOptions = {}, groupOptions: SpecOptions = {}) {
    defineSpec('Checkbox（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<CheckboxSpecProps>;

        async function render(props: CheckboxSpecProps = {}) {
            handle = await mount(props);
            view = within(handle.container);
            return handle;
        }

        const control = () => view.getByRole<HTMLInputElement>('checkbox');
        const root = () => handle.container.querySelector(`.${prefix}`)!;
        const onChangeSpy = () => vi.fn<NonNullable<CheckboxSpecProps['onChange']>>();

        test('渲染原生 checkbox，默认未选中，不叠加 aria-checked 与 aria-disabled', async () => {
            await render({ label: 'A' });
            expect(control()).toHaveAttribute('type', 'checkbox');
            expect(control()).not.toBeChecked();
            expect(control()).not.toHaveAttribute('aria-checked');
            expect(control()).not.toHaveAttribute('aria-disabled');
            expect(root()).toHaveClass(`${prefix}-unChecked`);
            expect(view.getByRole('checkbox', { name: 'A' })).toBe(control());
        });

        test('非受控：点击逐次切换，onChange 的 target 只有 checked、value、name、disabled', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'A', value: 'a', name: 'n', onChange });
            await userEvent.click(control());
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            expect(root()).not.toHaveClass(`${prefix}-unChecked`);
            expect(onChange.mock.calls[0][0].target).toEqual({ checked: true, value: 'a', name: 'n', disabled: false });
            await userEvent.click(control());
            await userEvent.click(control());
            expect(onChange.mock.calls.map(([event]) => event.target.checked)).toEqual([true, false, true]);
            expect(control()).toBeChecked();
        });

        test('没有 onChange 时仍可切换', async () => {
            await render();
            await userEvent.click(control());
            expect(control()).toBeChecked();
        });

        test('defaultChecked 决定初始状态，之后的变化不再生效', async () => {
            await render({ defaultChecked: true });
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            expect(control()).not.toBeChecked();
            await handle.update({ defaultChecked: true });
            expect(control()).not.toBeChecked();
        });

        test('受控：点击只通知新值，状态由 checked 决定，checked 更新后跟随', async () => {
            const onChange = onChangeSpy();
            await render({ checked: false, onChange });
            await userEvent.click(control());
            expect(onChange.mock.calls.map(([event]) => event.target.checked)).toEqual([true]);
            expect(control()).not.toBeChecked();
            expect(root()).toHaveClass(`${prefix}-unChecked`);

            await handle.update({ checked: true });
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            expect(onChange.mock.calls.map(([event]) => event.target.checked)).toEqual([true, false]);
            expect(control()).toBeChecked();
        });

        test('checked 与 defaultChecked 同传时取 checked，包括 false', async () => {
            await render({ checked: false, defaultChecked: true });
            expect(control()).not.toBeChecked();
        });

        test('checked 变回 undefined 时取消选中并转为非受控', async () => {
            await render({ checked: true });
            expect(control()).toBeChecked();
            await handle.update({ checked: undefined });
            expect(control()).not.toBeChecked();
            expect(root()).toHaveClass(`${prefix}-unChecked`);
            await userEvent.click(control());
            expect(control()).toBeChecked();
        });

        test('键盘：Tab 进入，空格切换，Enter 不切换', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'A', onChange });
            await userEvent.tab();
            expect(control()).toHaveFocus();
            await userEvent.keyboard('{Enter}');
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.keyboard(' ');
            expect(control()).toBeChecked();
            await userEvent.keyboard(' ');
            expect(control()).not.toBeChecked();
            expect(onChange).toHaveBeenCalledTimes(2);
            await userEvent.tab();
            expect(control()).not.toHaveFocus();
        });

        test('点击文字切换并聚焦原生 input', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'Agree', onChange });
            await userEvent.click(view.getByText('Agree'));
            expect(control()).toBeChecked();
            expect(control()).toHaveFocus();
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('disabled 由原生属性表达：类名、点击与键盘都不切换，更新为 false 后恢复', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'A', disabled: true, defaultChecked: true, onChange });
            expect(control()).toBeDisabled();
            expect(control()).not.toHaveAttribute('aria-disabled');
            expect(root()).toHaveClass(`${prefix}-disabled`, `${prefix}-checked`);
            await userEvent.click(control());
            await userEvent.click(view.getByText('A'));
            await userEvent.tab();
            await userEvent.keyboard(' ');
            expect(onChange).not.toHaveBeenCalled();
            expect(control()).toBeChecked();

            await handle.update({ disabled: false });
            expect(control()).toBeEnabled();
            expect(root()).not.toHaveClass(`${prefix}-disabled`);
            await userEvent.click(control());
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][0].target).toEqual({ checked: false, disabled: false });
        });

        test('indeterminate：原生 indeterminate 为 true，类名随之变化，选中后回到 false，不输出 aria-checked', async () => {
            await render({ indeterminate: true });
            expect(control().indeterminate).toBe(true);
            expect(control()).not.toHaveAttribute('aria-checked');
            expect(root()).toHaveClass(`${prefix}-indeterminate`);
            await handle.update({ checked: true });
            expect(control().indeterminate).toBe(false);
            expect(control()).toBeChecked();
            await handle.update({ checked: false });
            expect(control().indeterminate).toBe(true);
        });

        test('受控半选：点击后原生 indeterminate 仍保持 true', async () => {
            const onChange = onChangeSpy();
            await render({ checked: false, indeterminate: true, onChange });
            await userEvent.click(control());
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(control().indeterminate).toBe(true);
            expect(control()).not.toBeChecked();
        });

        test('value 进入原生 input；id、name、tabIndex 与 aria-* 落在原生 input，根元素没有；其余未声明属性落在根元素', async () => {
            await render({ value: 'v', id: 'my-box', name: 'on', tabIndex: -1, title: 'tip', 'aria-label': 'accept', 'aria-describedby': 'hint', 'aria-invalid': true });
            expect(view.getByRole('checkbox', { name: 'accept' })).toBe(control());
            expect(control()).toHaveAttribute('value', 'v');
            expect(control()).toHaveAttribute('id', 'my-box');
            expect(control()).toHaveAttribute('name', 'on');
            expect(control()).toHaveAttribute('tabindex', '-1');
            expect(control()).toHaveAttribute('aria-describedby', 'hint');
            expect(control()).toHaveAttribute('aria-invalid', 'true');
            for (const attribute of ['id', 'name', 'tabindex', 'aria-label', 'aria-describedby', 'aria-invalid', 'value']) {
                expect(root()).not.toHaveAttribute(attribute);
            }
            expect(root()).toHaveAttribute('title', 'tip');
        });

        test('label 命名 input，extra 描述 input，并与调用方的 aria-describedby 合并', async () => {
            await render({ label: 'Agree', extra: 'Terms apply' });
            expect(control()).toHaveAccessibleName('Agree');
            expect(control()).toHaveAccessibleDescription('Terms apply');
            await handle.update({ 'aria-describedby': 'hint' });
            expect(control().getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
            expect(control().getAttribute('aria-describedby')).toContain('hint');
        });

        test('没有 label 与 extra 时不渲染内容区', async () => {
            await render({ 'aria-label': 'bare' });
            expect(handle.container.querySelector(`.${prefix}-content`)).toBeNull();
            expect(handle.container.querySelector(`.${prefix}-addon`)).toBeNull();
            expect(handle.container.querySelector(`.${prefix}-extra`)).toBeNull();
        });

        test('type 为 card、pureCard 时标记卡片类名，选中后带 cardType_checked', async () => {
            await render({ label: 'A', type: 'card' });
            expect(root()).toHaveClass(`${prefix}-cardType`, `${prefix}-cardType_enable`);
            expect(handle.container.querySelector(`.${prefix}-inner-pureCardType`)).toBeNull();
            await userEvent.click(control());
            expect(root()).toHaveClass(`${prefix}-cardType_checked`);
            await handle.update({ type: 'pureCard' });
            expect(handle.container.querySelector(`.${prefix}-inner-pureCardType`)).not.toBeNull();
            await handle.update({ disabled: true });
            expect(root()).toHaveClass(`${prefix}-cardType_checked_disabled`);
        });

        test('APG checkbox 模式', async () => {
            await render({ label: 'Agree' });
            await expect(checkPattern('checkbox', handle.container, { press })).resolves.toBeUndefined();
        });

        test('卸载后移除控件', async () => {
            await render();
            handle.unmount();
            expect(document.querySelector('input[type="checkbox"]')).toBeNull();
        });
    });

    defineSpec('CheckboxGroup（共享 spec）', groupOptions, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<CheckboxGroupSpecProps>;

        async function render(props: Partial<CheckboxGroupSpecProps> = {}) {
            handle = await mountGroup({ options: threeOptions, ...props });
            view = within(handle.container);
            return handle;
        }

        const boxes = () => view.queryAllByRole<HTMLInputElement>('checkbox');
        const box = (name: string) => view.getByRole<HTMLInputElement>('checkbox', { name });
        const checkedNames = () =>
            boxes()
                .filter((input) => input.checked)
                .map((input) => input.getAttribute('value'));
        const group = () => view.getByRole('group');
        const onChangeSpy = () => vi.fn<NonNullable<CheckboxGroupSpecProps['onChange']>>();

        for (const asChildren of [false, true]) {
            const how = asChildren ? 'children' : 'options';

            test(`通过 ${how} 渲染带 role="group" 的分组，每个选项是带 value 的 checkbox，默认都未选中`, async () => {
                await render({ asChildren });
                expect(group()).toHaveClass(groupPrefix);
                expect(boxes().map((input) => input.getAttribute('value'))).toEqual(['a', 'b', 'c']);
                expect(box('A')).toBeInTheDocument();
                expect(checkedNames()).toEqual([]);
            });

            test(`通过 ${how} 声明的分组：非受控点击累加与取消，onChange 收到新数组`, async () => {
                const onChange = onChangeSpy();
                await render({ asChildren, onChange });
                await userEvent.click(box('A'));
                await userEvent.click(box('C'));
                await userEvent.click(box('A'));
                expect(onChange.mock.calls.map(([value]) => value)).toEqual([['a'], ['a', 'c'], ['c']]);
                expect(checkedNames()).toEqual(['c']);
            });
        }

        test('字符串选项的 label 与 value 相同', async () => {
            const onChange = onChangeSpy();
            await render({ options: ['x', 'y'], onChange });
            await userEvent.click(box('y'));
            expect(onChange).toHaveBeenCalledWith(['y']);
        });

        test('defaultValue 决定初始选中项，之后的变化不再生效', async () => {
            await render({ defaultValue: ['b'] });
            expect(checkedNames()).toEqual(['b']);
            await userEvent.click(box('C'));
            expect(checkedNames()).toEqual(['b', 'c']);
            await handle.update({ defaultValue: ['a'] });
            expect(checkedNames()).toEqual(['b', 'c']);
        });

        test('受控：点击只通知新数组，选中项由 value 决定，value 更新后跟随', async () => {
            const onChange = onChangeSpy();
            await render({ value: ['a'], onChange });
            await userEvent.click(box('B'));
            expect(onChange).toHaveBeenCalledWith(['a', 'b']);
            expect(checkedNames()).toEqual(['a']);
            await handle.update({ value: ['a', 'b'] });
            expect(checkedNames()).toEqual(['a', 'b']);
        });

        test('受控 value 变回 undefined 时清空选中项并转为非受控', async () => {
            await render({ value: ['a', 'b'] });
            expect(checkedNames()).toEqual(['a', 'b']);
            await handle.update({ value: undefined });
            expect(checkedNames()).toEqual([]);
            await userEvent.click(box('C'));
            expect(checkedNames()).toEqual(['c']);
        });

        test('options 项的 value 可以是 0 与 false', async () => {
            const onChange = onChangeSpy();
            await render({
                options: [
                    { value: 0, label: 'zero' },
                    { value: false, label: 'no' },
                ],
                onChange,
            });
            await userEvent.click(box('zero'));
            await userEvent.click(box('no'));
            expect(onChange.mock.calls.map(([value]) => value)).toEqual([[0], [0, false]]);
        });

        test('options 项的 disabled 只禁用该项，字符串项跟随分组的 disabled', async () => {
            const onChange = onChangeSpy();
            await render({
                options: [{ value: 'a', label: 'A', disabled: true }, { value: 'b', label: 'B' }, 'c'],
                onChange,
            });
            expect(box('A')).toBeDisabled();
            expect(box('B')).toBeEnabled();
            await userEvent.click(box('A'));
            expect(onChange).not.toHaveBeenCalled();
            await handle.update({ disabled: true });
            expect(boxes().every((input) => input.disabled)).toBe(true);
            await userEvent.click(box('B'));
            expect(onChange).not.toHaveBeenCalled();
            await handle.update({ disabled: false });
            expect(box('B')).toBeEnabled();
        });

        test('options 项的 extra 描述对应的 checkbox', async () => {
            await render({
                options: [
                    { value: 'a', label: 'A', extra: 'about A' },
                    { value: 'b', label: 'B' },
                ],
            });
            expect(box('A')).toHaveAccessibleDescription('about A');
            expect(box('B')).not.toHaveAttribute('aria-describedby');
        });

        test('name 下发给所有 input；未设置时每组生成一个名称，且与其他分组不同', async () => {
            await render({ name: 'fruit' });
            expect(boxes().map((input) => input.name)).toEqual(['fruit', 'fruit', 'fruit']);
            handle.unmount();

            await render();
            const first = boxes().map((input) => input.name);
            expect(first[0]).not.toBe('');
            expect(new Set(first).size).toBe(1);
            const firstHandle = handle;
            const second = await mountGroup({ options: threeOptions });
            const secondName = within(second.container).getAllByRole<HTMLInputElement>('checkbox')[0].name;
            expect(secondName).not.toBe(first[0]);
            second.unmount();
            firstHandle.unmount();
        });

        test('direction 默认 vertical，可改为 horizontal；card 与 pureCard 追加类名', async () => {
            await render();
            expect(group()).toHaveClass(`${groupPrefix}-vertical`);
            await handle.update({ direction: 'horizontal' });
            expect(group()).toHaveClass(`${groupPrefix}-horizontal`);
            expect(group()).not.toHaveClass(`${groupPrefix}-vertical`);
            expect(group()).not.toHaveClass(`${groupPrefix}-horizontal-cardType`);
            await handle.update({ type: 'card' });
            expect(group()).toHaveClass(`${groupPrefix}-horizontal-cardType`);
            expect(handle.container.querySelectorAll(`.${prefix}-cardType`)).toHaveLength(3);
            await handle.update({ type: 'pureCard' });
            expect(group()).toHaveClass(`${groupPrefix}-horizontal-pureCardType`);
            expect(handle.container.querySelectorAll(`.${prefix}-inner-pureCardType`)).toHaveLength(3);
        });

        test('aria-label 命名分组，其余未声明属性落在 role="group" 的根元素', async () => {
            await render({ 'aria-label': 'fruits', title: 'tip' });
            expect(view.getByRole('group', { name: 'fruits' })).toBe(group());
            expect(group()).toHaveAttribute('title', 'tip');
        });

        test('aria-invalid 传给每个 input，不落在 role="group" 的根元素上', async () => {
            await render({ 'aria-invalid': true });
            expect(boxes().every((input) => input.getAttribute('aria-invalid') === 'true')).toBe(true);
            expect(group()).not.toHaveAttribute('aria-invalid');
        });

        test('onBlur：焦点在组内两个框之间移动时不触发，离开整个分组时触发一次', async () => {
            const onBlur = vi.fn<NonNullable<CheckboxGroupSpecProps['onBlur']>>();
            await render({ onBlur });
            await userEvent.tab();
            expect(box('A')).toHaveFocus();
            await userEvent.tab();
            expect(box('B')).toHaveFocus();
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.tab();
            await userEvent.tab();
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onBlur.mock.calls[0][0].type).toMatch(/blur|focusout/);
        });

        test('键盘：空格切换聚焦的选项', async () => {
            const onChange = onChangeSpy();
            await render({ onChange });
            await userEvent.tab();
            await userEvent.keyboard(' ');
            expect(onChange).toHaveBeenCalledWith(['a']);
            expect(checkedNames()).toEqual(['a']);
        });

        test('APG checkbox 模式', async () => {
            await render({ 'aria-label': 'fruits' });
            await expect(checkPattern('checkbox', handle.container, { press })).resolves.toBeUndefined();
        });
    });
}
