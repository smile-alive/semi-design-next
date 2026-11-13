import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export type RadioSpecValue = string | number | boolean;

export interface RadioSpecEvent {
    target: { checked: boolean; value?: RadioSpecValue; name?: string; disabled: boolean };
}

/** Framework-free Radio props; each fixture maps `checked` to its binding and `label`, `extra` to children, slots or snippets */
export interface RadioSpecProps {
    /** `undefined` is uncontrolled */
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    value?: RadioSpecValue;
    name?: string;
    id?: string;
    tabIndex?: number;
    type?: 'default' | 'button' | 'card' | 'pureCard';
    mode?: 'advanced' | '';
    displayMode?: 'vertical' | '';
    label?: string;
    extra?: string;
    title?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    onChange?: (event: RadioSpecEvent) => void;
}

export interface RadioSpecOption {
    value: RadioSpecValue;
    label: string;
    disabled?: boolean;
    extra?: string;
}

/** Framework-free RadioGroup props; `options` become `options` items, or Radio children when `asChildren` is set */
export interface RadioGroupSpecProps {
    options: string[] | RadioSpecOption[];
    asChildren?: boolean;
    /** `undefined` is uncontrolled */
    value?: RadioSpecValue;
    defaultValue?: RadioSpecValue;
    disabled?: boolean;
    name?: string;
    direction?: 'horizontal' | 'vertical';
    type?: 'default' | 'button' | 'card' | 'pureCard';
    mode?: 'advanced' | '';
    buttonSize?: 'small' | 'middle' | 'large';
    title?: string;
    'aria-label'?: string;
    onChange?: (event: RadioSpecEvent) => void;
    // React passes a synthetic event, so only `type` is common to every framework
    onBlur?: (event: { type: string }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-radio`;
const groupPrefix = `${BASE_CLASS_PREFIX}-radioGroup`;

const threeOptions: RadioSpecOption[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
];

export function radioSpec(mount: SpecMount<RadioSpecProps>, mountGroup: SpecMount<RadioGroupSpecProps>, options: SpecOptions = {}, groupOptions: SpecOptions = {}) {
    defineSpec('Radio（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<RadioSpecProps>;

        async function render(props: RadioSpecProps = {}) {
            handle = await mount(props);
            view = within(handle.container);
            return handle;
        }

        const control = () => view.getByRole<HTMLInputElement>('radio');
        const root = () => handle.container.querySelector(`.${prefix}`)!;
        const onChangeSpy = () => vi.fn<NonNullable<RadioSpecProps['onChange']>>();

        test('渲染原生 radio，默认未选中，不叠加 aria-checked 与 aria-disabled', async () => {
            await render({ label: 'A' });
            expect(control()).toHaveAttribute('type', 'radio');
            expect(control()).not.toBeChecked();
            expect(control()).not.toHaveAttribute('aria-checked');
            expect(control()).not.toHaveAttribute('aria-disabled');
            expect(root()).not.toHaveClass(`${prefix}-checked`);
            expect(view.getByRole('radio', { name: 'A' })).toBe(control());
        });

        test('非受控：点击选中并保持选中，onChange 的 target 只有 checked、value、name、disabled', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'A', value: 'a', name: 'n', onChange });
            await userEvent.click(control());
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            expect(onChange.mock.calls[0][0].target).toEqual({ checked: true, value: 'a', name: 'n', disabled: false });
            await userEvent.click(control());
            expect(control()).toBeChecked();
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('没有 onChange 时仍可选中', async () => {
            await render();
            await userEvent.click(control());
            expect(control()).toBeChecked();
        });

        test('defaultChecked 决定初始状态，之后的变化不再生效', async () => {
            await render({ defaultChecked: true });
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
            await handle.update({ defaultChecked: false });
            expect(control()).toBeChecked();
        });

        test('受控：点击只通知，状态由 checked 决定，checked 更新后跟随', async () => {
            const onChange = onChangeSpy();
            await render({ checked: false, onChange });
            await userEvent.click(control());
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(control()).not.toBeChecked();
            expect(root()).not.toHaveClass(`${prefix}-checked`);
            await handle.update({ checked: true });
            expect(control()).toBeChecked();
            expect(root()).toHaveClass(`${prefix}-checked`);
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
            expect(root()).not.toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            expect(control()).toBeChecked();
        });

        test('mode 为 advanced 时点击或空格可取消选中，onChange 上报 checked 为 false', async () => {
            const onChange = onChangeSpy();
            await render({ mode: 'advanced', label: 'A', onChange });
            await userEvent.click(control());
            expect(control()).toBeChecked();
            await userEvent.click(control());
            expect(control()).not.toBeChecked();
            expect(root()).not.toHaveClass(`${prefix}-checked`);
            await userEvent.click(control());
            control().focus();
            await userEvent.keyboard(' ');
            expect(control()).not.toBeChecked();
            expect(onChange.mock.calls.map(([event]) => event.target.checked)).toEqual([true, false, true, false]);
        });

        test('键盘：Tab 进入，空格选中', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'A', onChange });
            await userEvent.tab();
            expect(control()).toHaveFocus();
            await userEvent.keyboard(' ');
            expect(control()).toBeChecked();
            expect(onChange).toHaveBeenCalledTimes(1);
            await userEvent.tab();
            expect(control()).not.toHaveFocus();
        });

        test('点击文字选中并聚焦原生 input', async () => {
            await render({ label: 'Agree' });
            await userEvent.click(view.getByText('Agree'));
            expect(control()).toBeChecked();
            expect(control()).toHaveFocus();
        });

        test('disabled 由原生属性表达：类名、点击与键盘都不改变状态，更新为 false 后恢复', async () => {
            const onChange = onChangeSpy();
            await render({ label: 'A', disabled: true, onChange });
            expect(control()).toBeDisabled();
            expect(control()).not.toHaveAttribute('aria-disabled');
            expect(root()).toHaveClass(`${prefix}-disabled`);
            await userEvent.click(control());
            await userEvent.click(view.getByText('A'));
            await userEvent.tab();
            await userEvent.keyboard(' ');
            expect(onChange).not.toHaveBeenCalled();
            expect(control()).not.toBeChecked();

            await handle.update({ disabled: false });
            expect(control()).toBeEnabled();
            expect(root()).not.toHaveClass(`${prefix}-disabled`);
            await userEvent.click(control());
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('value、id、name、tabIndex 与 aria-* 落在原生 input，根元素没有；其余未声明属性落在根元素', async () => {
            await render({ value: 'v', id: 'my-radio', name: 'on', tabIndex: -1, title: 'tip', 'aria-label': 'pick', 'aria-describedby': 'hint' });
            expect(view.getByRole('radio', { name: 'pick' })).toBe(control());
            expect(control()).toHaveAttribute('value', 'v');
            expect(control()).toHaveAttribute('id', 'my-radio');
            expect(control()).toHaveAttribute('name', 'on');
            expect(control()).toHaveAttribute('tabindex', '-1');
            expect(control()).toHaveAttribute('aria-describedby', 'hint');
            for (const attribute of ['id', 'name', 'tabindex', 'aria-label', 'aria-describedby', 'value']) {
                expect(root()).not.toHaveAttribute(attribute);
            }
            expect(root()).toHaveAttribute('title', 'tip');
        });

        test('label 命名 input，extra 描述 input，并与调用方的 aria-describedby 合并', async () => {
            await render({ label: 'Agree', extra: 'Terms apply' });
            expect(control()).toHaveAccessibleName('Agree');
            expect(control()).toHaveAccessibleDescription('Terms apply');
            await handle.update({ 'aria-describedby': 'hint' });
            expect(control().getAttribute('aria-describedby')).toContain('hint');
            expect(control().getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
        });

        test('没有 label 与 extra 时不渲染内容区', async () => {
            await render({ 'aria-label': 'bare' });
            expect(handle.container.querySelector(`.${prefix}-content`)).toBeNull();
            expect(handle.container.querySelector(`.${prefix}-addon`)).toBeNull();
            expect(handle.container.querySelector(`.${prefix}-extra`)).toBeNull();
            expect(control()).not.toHaveAttribute('aria-describedby');
        });

        test('displayMode 为 vertical 时根元素带 vertical 类名', async () => {
            await render({ displayMode: 'vertical' });
            expect(root()).toHaveClass(`${prefix}-vertical`);
        });

        test('type 为 button 时标记按钮类名并选中态，不渲染 extra', async () => {
            await render({ type: 'button', label: 'A', extra: 'about A' });
            expect(root()).toHaveClass(`${prefix}-buttonRadioComponent`);
            expect(handle.container.querySelector(`.${prefix}-extra`)).toBeNull();
            expect(control()).not.toHaveAttribute('aria-describedby');
            expect(handle.container.querySelector(`.${prefix}-addon-buttonRadio`)).not.toHaveClass(`${prefix}-addon-buttonRadio-checked`);
            await userEvent.click(control());
            expect(handle.container.querySelector(`.${prefix}-addon-buttonRadio`)).toHaveClass(`${prefix}-addon-buttonRadio-checked`);
        });

        test('type 为 card、pureCard 时标记卡片类名，选中后带 checked', async () => {
            await render({ type: 'card', label: 'A' });
            expect(root()).toHaveClass(`${prefix}-cardRadioGroup`);
            expect(handle.container.querySelector(`.${prefix}-inner-pureCardRadio`)).toBeNull();
            await userEvent.click(control());
            expect(root()).toHaveClass(`${prefix}-cardRadioGroup_checked`);
            await handle.update({ type: 'pureCard' });
            expect(handle.container.querySelector(`.${prefix}-inner-pureCardRadio`)).not.toBeNull();
            await handle.update({ disabled: true });
            expect(root()).toHaveClass(`${prefix}-cardRadioGroup_checked_disabled`);
        });

        test('卸载后移除控件', async () => {
            await render();
            handle.unmount();
            expect(document.querySelector('input[type="radio"]')).toBeNull();
        });
    });

    defineSpec('RadioGroup（共享 spec）', groupOptions, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<RadioGroupSpecProps>;

        async function render(props: Partial<RadioGroupSpecProps> = {}) {
            handle = await mountGroup({ options: threeOptions, ...props });
            view = within(handle.container);
            return handle;
        }

        const radios = () => view.queryAllByRole<HTMLInputElement>('radio');
        const radio = (name: string) => view.getByRole<HTMLInputElement>('radio', { name });
        const checkedValues = () =>
            radios()
                .filter((input) => input.checked)
                .map((input) => input.getAttribute('value'));
        const group = () => view.getByRole('radiogroup');
        const onChangeSpy = () => vi.fn<NonNullable<RadioGroupSpecProps['onChange']>>();
        const values = (spy: ReturnType<typeof onChangeSpy>) => spy.mock.calls.map(([event]) => event.target.value);

        for (const asChildren of [false, true]) {
            const how = asChildren ? 'children' : 'options';

            test(`通过 ${how} 渲染 role="radiogroup"，每个选项是带 value 的 radio，默认都未选中`, async () => {
                await render({ asChildren });
                expect(group()).toHaveClass(groupPrefix);
                expect(radios().map((input) => input.getAttribute('value'))).toEqual(['a', 'b', 'c']);
                expect(radio('A')).toBeInTheDocument();
                expect(checkedValues()).toEqual([]);
            });

            test(`通过 ${how} 声明的分组：非受控点击切换选中项，onChange 的 target 带组的 name`, async () => {
                const onChange = onChangeSpy();
                await render({ asChildren, name: 'g', onChange });
                await userEvent.click(radio('A'));
                await userEvent.click(radio('C'));
                expect(values(onChange)).toEqual(['a', 'c']);
                expect(onChange.mock.calls[0][0].target).toEqual({ checked: true, value: 'a', name: 'g', disabled: false });
                expect(checkedValues()).toEqual(['c']);
                await userEvent.click(radio('C'));
                expect(onChange).toHaveBeenCalledTimes(2);
            });
        }

        test('字符串选项的 label 与 value 相同', async () => {
            const onChange = onChangeSpy();
            await render({ options: ['x', 'y'], onChange });
            await userEvent.click(radio('y'));
            expect(values(onChange)).toEqual(['y']);
        });

        test('defaultValue 决定初始选中项，之后的变化不再生效', async () => {
            await render({ defaultValue: 'b' });
            expect(checkedValues()).toEqual(['b']);
            await userEvent.click(radio('C'));
            expect(checkedValues()).toEqual(['c']);
            await handle.update({ defaultValue: 'a' });
            expect(checkedValues()).toEqual(['c']);
        });

        test('受控：点击只通知，选中项由 value 决定，value 更新后跟随，不变时不通知', async () => {
            const onChange = onChangeSpy();
            await render({ value: 'a', onChange });
            await userEvent.click(radio('C'));
            expect(values(onChange)).toEqual(['c']);
            expect(checkedValues()).toEqual(['a']);
            await handle.update({ value: 'c' });
            expect(checkedValues()).toEqual(['c']);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('受控 value 变回 undefined 时没有选中项，并转为非受控', async () => {
            await render({ value: 'a' });
            expect(checkedValues()).toEqual(['a']);
            await handle.update({ value: undefined });
            expect(checkedValues()).toEqual([]);
            await userEvent.click(radio('C'));
            expect(checkedValues()).toEqual(['c']);
        });

        test('mode 为 advanced 时点击已选项取消选中，onChange 的 value 为 undefined；受控时由 value 决定', async () => {
            const onChange = onChangeSpy();
            await render({ mode: 'advanced', onChange });
            await userEvent.click(radio('A'));
            await userEvent.click(radio('B'));
            expect(checkedValues()).toEqual(['b']);
            await userEvent.click(radio('B'));
            expect(checkedValues()).toEqual([]);
            expect(values(onChange)).toEqual(['a', 'b', undefined]);
            expect(onChange.mock.calls[2][0].target.checked).toBe(false);
            handle.unmount();

            const controlled = onChangeSpy();
            await render({ mode: 'advanced', value: 'a', onChange: controlled });
            await userEvent.click(radio('A'));
            expect(values(controlled)).toEqual([undefined]);
            expect(radio('A')).toBeChecked();
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
            await userEvent.click(radio('zero'));
            await userEvent.click(radio('no'));
            expect(values(onChange)).toEqual([0, false]);
            expect(checkedValues()).toEqual(['false']);
        });

        test('options 项的 disabled 只禁用该项，分组的 disabled 禁用全部', async () => {
            const onChange = onChangeSpy();
            await render({
                options: [
                    { value: 'a', label: 'A', disabled: true },
                    { value: 'b', label: 'B' },
                ],
                onChange,
            });
            expect(radio('A')).toBeDisabled();
            expect(radio('B')).toBeEnabled();
            await userEvent.click(radio('A'));
            expect(onChange).not.toHaveBeenCalled();
            await handle.update({ disabled: true });
            expect(radios().every((input) => input.disabled)).toBe(true);
            await userEvent.click(radio('B'));
            expect(onChange).not.toHaveBeenCalled();
            await handle.update({ disabled: false });
            expect(radio('B')).toBeEnabled();
        });

        test('字符串选项跟随分组的 disabled', async () => {
            await render({ options: ['a', 'b'], disabled: true });
            expect(radios().every((input) => input.disabled)).toBe(true);
        });

        test('options 项的 extra 描述对应的 radio', async () => {
            await render({
                options: [
                    { value: 'a', label: 'A', extra: 'about A' },
                    { value: 'b', label: 'B' },
                ],
            });
            expect(radio('A')).toHaveAccessibleDescription('about A');
            expect(radio('B')).not.toHaveAttribute('aria-describedby');
        });

        test('name 下发给所有 input；未设置时每组生成一个名称，且与其他分组不同', async () => {
            await render({ name: 'fruit' });
            expect(radios().map((input) => input.name)).toEqual(['fruit', 'fruit', 'fruit']);
            handle.unmount();

            await render();
            const first = radios().map((input) => input.name);
            expect(first[0]).not.toBe('');
            expect(new Set(first).size).toBe(1);
            const firstHandle = handle;
            const second = await mountGroup({ options: threeOptions });
            const secondName = within(second.container).getAllByRole<HTMLInputElement>('radio')[0].name;
            expect(secondName).not.toBe(first[0]);
            second.unmount();
            firstHandle.unmount();
        });

        test('direction 默认 horizontal，可改为 vertical；type 追加对应类名', async () => {
            await render();
            expect(group()).toHaveClass(`${groupPrefix}-horizontal`, `${groupPrefix}-horizontal-default`);
            await handle.update({ direction: 'vertical' });
            expect(group()).toHaveClass(`${groupPrefix}-vertical`, `${groupPrefix}-vertical-default`);
            expect(group()).not.toHaveClass(`${groupPrefix}-horizontal`);
            await handle.update({ type: 'card' });
            expect(group()).toHaveClass(`${groupPrefix}-vertical-card`);
            expect(handle.container.querySelectorAll(`.${prefix}-cardRadioGroup`)).toHaveLength(3);
            await handle.update({ type: 'pureCard' });
            expect(group()).toHaveClass(`${groupPrefix}-vertical-card`);
            expect(handle.container.querySelectorAll(`.${prefix}-inner-pureCardRadio`)).toHaveLength(3);
        });

        test('type 为 button 时分组带 buttonRadio 类名，选中项的 addon 带选中类名，buttonSize 追加尺寸类名', async () => {
            await render({ type: 'button', defaultValue: 'b', buttonSize: 'large' });
            expect(group()).toHaveClass(`${groupPrefix}-buttonRadio`);
            expect(group()).not.toHaveClass(`${groupPrefix}-horizontal`);
            const addons = handle.container.querySelectorAll(`.${prefix}-addon-buttonRadio`);
            expect(addons).toHaveLength(3);
            expect(addons[1]).toHaveClass(`${prefix}-addon-buttonRadio-checked`);
            expect(addons[0]).not.toHaveClass(`${prefix}-addon-buttonRadio-checked`);
            expect(addons[0]).toHaveClass(`${prefix}-addon-buttonRadio-large`);
            await handle.update({ buttonSize: 'small' });
            expect(addons[0]).toHaveClass(`${prefix}-addon-buttonRadio-small`);
        });

        test('card 类型的选中项带 cardRadioGroup_checked', async () => {
            await render({ type: 'card' });
            await userEvent.click(radio('C'));
            const cards = handle.container.querySelectorAll(`.${prefix}-cardRadioGroup`);
            expect(cards[2]).toHaveClass(`${prefix}-cardRadioGroup_checked`);
            expect(cards[0]).not.toHaveClass(`${prefix}-cardRadioGroup_checked`);
        });

        test('aria-label 命名分组，其余未声明属性落在 role="radiogroup" 的根元素', async () => {
            await render({ 'aria-label': 'fruits', title: 'tip' });
            expect(view.getByRole('radiogroup', { name: 'fruits' })).toBe(group());
            expect(group()).toHaveAttribute('title', 'tip');
        });

        test('键盘：Tab 只停在选中项，方向键移动选中并跳过禁用项、首尾循环，onChange 逐次通知', async () => {
            const onChange = onChangeSpy();
            await render({
                options: [
                    { value: 'a', label: 'A' },
                    { value: 'b', label: 'B', disabled: true },
                    { value: 'c', label: 'C' },
                ],
                defaultValue: 'a',
                onChange,
            });
            await userEvent.tab();
            expect(radio('A')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(radio('C')).toHaveFocus();
            expect(radio('C')).toBeChecked();
            expect(radio('A')).not.toBeChecked();
            await userEvent.keyboard('{ArrowRight}');
            expect(radio('A')).toBeChecked();
            await userEvent.keyboard('{ArrowUp}');
            expect(radio('C')).toBeChecked();
            await userEvent.keyboard('{ArrowLeft}');
            expect(radio('A')).toBeChecked();
            expect(values(onChange)).toEqual(['c', 'a', 'c', 'a']);
            expect(radio('B')).not.toBeChecked();
        });

        test('onBlur：焦点在组内两个 radio 之间移动时不触发，离开整个分组时触发一次', async () => {
            const onBlur = vi.fn<NonNullable<RadioGroupSpecProps['onBlur']>>();
            await render({ defaultValue: 'a', onBlur });
            await userEvent.tab();
            expect(radio('A')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(radio('B')).toHaveFocus();
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.tab();
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onBlur.mock.calls[0][0].type).toMatch(/blur|focusout/);
        });

        test('APG radio-group 模式', async () => {
            await render({ 'aria-label': 'fruits', defaultValue: 'a' });
            await expect(checkPattern('radio-group', handle.container, { press })).resolves.toBeUndefined();
        });
    });
}
