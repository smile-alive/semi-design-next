/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Radio, { RadioGroup } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { RadioChangeEvent, RadioGroupEmits, RadioGroupProps, RadioGroupSlots, RadioOptionItem, RadioValue } from '../interface';
import GroupModel from './fixtures/group-model.vue';
import PopoverFixture from './fixtures/in-popover.vue';

type Change = (event: RadioChangeEvent) => void;
type GroupInput = RadioGroupProps & { onChange?: Change; 'onUpdate:modelValue'?: (value?: RadioValue) => void };
const prefixCls = `${BASE_CLASS_PREFIX}-radio`;
const groupCls = `${BASE_CLASS_PREFIX}-radioGroup`;
const getRadio = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name });
const abc = () => ['A', 'B', 'C'].map((value) => <Radio value={value}>{() => value}</Radio>);
const renderChildren = (props: GroupInput = {}, attrs: Record<string, unknown> = {}) => render(RadioGroup, { props, attrs, slots: { default: abc } });
const renderOptions = (props: GroupInput = {}) =>
    render(RadioGroup, {
        props: {
            options: [
                { label: 'A', value: 'A' },
                { label: 'B', value: 'B' },
                { label: 'C', value: 'C' },
            ],
            ...props,
        },
    });
const states = () => ['A', 'B', 'C'].map((name) => getRadio(name).checked);

describe('RadioGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('value 变化时触发 change 事件', async () => {
        const change = vi.fn<Change>();
        const uncontrolled = renderChildren({ onChange: change, defaultValue: 'B' });
        await userEvent.click(getRadio('A'));
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target.value).toBe('A');
        expect(getRadio('A')).toBeChecked();
        uncontrolled.unmount();

        renderChildren({ onChange: change, modelValue: 'A' });
        await userEvent.click(getRadio('B'));
        expect(change).toHaveBeenCalledTimes(2);
        expect(change.mock.calls[1]?.[0].target.value).toBe('B');
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('radio 与 radioGroup 同时存在时都会触发 change 事件，并发出 update:modelValue', async () => {
        const change = vi.fn<Change>();
        const groupChange = vi.fn<Change>();
        const update = vi.fn<(value?: RadioValue) => void>();
        render(RadioGroup, {
            props: { defaultValue: 'B', onChange: groupChange, 'onUpdate:modelValue': update },
            slots: {
                default: () =>
                    ['A', 'B', 'C'].map((value) => (
                        <Radio value={value} onChange={change}>
                            {() => value}
                        </Radio>
                    )),
            },
        });
        await userEvent.click(getRadio('A'));
        expect(change).toHaveBeenCalledTimes(1);
        expect(groupChange).toHaveBeenCalledTimes(1);
        expect(update).toHaveBeenLastCalledWith('A');
    });

    it('使用 options 的 group 中只触发一次', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, { props: { options: [{ label: 'Bamboo', value: 'Bamboo' }], onChange: change } });
        await userEvent.click(getRadio('Bamboo'));
        expect(change).toHaveBeenCalledTimes(1);
    });

    it('value 不变时不触发 change 事件', async () => {
        const change = vi.fn<Change>();
        const uncontrolled = renderChildren({ onChange: change, defaultValue: 'B' });
        await userEvent.click(getRadio('B'));
        expect(change).not.toHaveBeenCalled();
        expect(getRadio('B')).toBeChecked();
        uncontrolled.unmount();

        renderChildren({ onChange: change, modelValue: 'A' });
        await userEvent.click(getRadio('A'));
        expect(change).not.toHaveBeenCalled();
        expect(getRadio('A')).toBeChecked();
    });

    it('没有 value 的 radio 在组内不被选中', () => {
        render(RadioGroup, { slots: { default: () => ['A', 'B'].map((text) => <Radio>{() => text}</Radio>) } });
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('options 正确渲染', () => {
        renderOptions();
        expect(screen.getAllByRole('radio')).toHaveLength(3);
        ['A', 'B', 'C'].forEach((name) => expect(getRadio(name)).toBeInTheDocument());
    });

    it('所有子项都有 name 属性', () => {
        renderChildren({ name: 'radiogroup' });
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((el) => expect(el).toHaveAttribute('name', 'radiogroup'));
    });

    it('button 样式', () => {
        renderChildren({ type: 'button' });
        expect(document.querySelector(`.${prefixCls}-buttonRadioGroup`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-inner-buttonRadio`)).not.toBeNull();
        expect(screen.getByRole('radiogroup')).toHaveClass(`${groupCls}-buttonRadio`);
        expect(screen.getByRole('radiogroup')).not.toHaveClass(`${groupCls}-horizontal`);
    });

    it('card 样式', () => {
        const first = renderChildren({ type: 'card' });
        expect(document.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        first.unmount();
        renderChildren({ type: 'card', disabled: true, defaultValue: 'A' });
        const cards = document.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
    });

    it('pureCard 样式', () => {
        const first = renderChildren({ type: 'pureCard' });
        expect(document.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-inner-pureCardRadio`)).not.toBeNull();
        first.unmount();
        renderChildren({ type: 'pureCard', disabled: true, defaultValue: 'A' });
        const cards = document.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
    });

    it.each(['small', 'middle', 'large'] as const)('button 类型 radio 的 buttonSize=%s', (buttonSize) => {
        renderChildren({ type: 'button', buttonSize });
        expect(document.querySelectorAll(`.${prefixCls}-addon-buttonRadio-${buttonSize}`)).toHaveLength(3);
    });

    it('把 modelValue 设为 NaN 时不会无限更新，也没有选中项', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        renderChildren({ modelValue: NaN as unknown as number });
        expect(document.querySelector(`.${prefixCls}-checked`)).toBeNull();
        screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Maximum recursive updates'));
    });

    it('direction 为 horizontal 与 vertical', () => {
        const first = renderChildren({ direction: 'horizontal' });
        expect(document.querySelector(`.${groupCls}-horizontal`)).not.toBeNull();
        first.unmount();
        renderChildren({ direction: 'vertical' });
        expect(document.querySelector(`.${groupCls}-vertical`)).not.toBeNull();
    });

    it('modelValue 受控', async () => {
        const view = renderChildren({ modelValue: 'A' });
        expect(states()).toEqual([true, false, false]);
        await view.rerender({ modelValue: 'B' });
        expect(states()).toEqual([false, true, false]);
    });

    it('defaultValue', () => {
        renderChildren({ defaultValue: 'B' });
        expect(states()).toEqual([false, true, false]);
    });

    it('禁用 group', () => {
        renderChildren({ disabled: true });
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((input) => expect(input).toBeDisabled());
    });

    it('aria-label 命名 radiogroup', () => {
        renderChildren({}, { 'aria-label': 'Radio group label' });
        expect(screen.getByRole('radiogroup', { name: 'Radio group label' })).toHaveClass(groupCls);
    });

    it('没有 name 的 group 内 radio 共用生成的 name，且与其他 group 不同', () => {
        render({
            render: () => (
                <>
                    <RadioGroup aria-label="one" options={['A', 'B']} />
                    <RadioGroup aria-label="two" options={['A', 'B']} />
                </>
            ),
        });
        const names = ['one', 'two'].map((label) => {
            const radios = screen.getByRole('radiogroup', { name: label }).querySelectorAll('input');
            expect(radios[0]?.name).toBeTruthy();
            expect(radios[0]?.name).toBe(radios[1]?.name);
            return radios[0]?.name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('方向键不会在两个没有 name 的 group 之间移动', async () => {
        render({
            render: () => (
                <>
                    <RadioGroup aria-label="one" options={['A', 'B']} />
                    <RadioGroup aria-label="two" options={['A', 'B']} />
                </>
            ),
        });
        const one = within(screen.getByRole('radiogroup', { name: 'one' }));
        const two = within(screen.getByRole('radiogroup', { name: 'two' }));
        await userEvent.click(one.getByRole('radio', { name: 'A' }));
        await userEvent.keyboard('{ArrowDown}');
        expect(one.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(two.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(two.getByRole('radio', { name: 'B' })).not.toBeChecked();
    });

    it('根元素是带有 aria 属性的 radiogroup', () => {
        renderChildren({}, { 'aria-label': 'x', 'aria-required': true, 'aria-invalid': true });
        expect(screen.getByRole('radiogroup', { name: 'x' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('radiogroup', { name: 'x' })).toHaveAttribute('aria-invalid', 'true');
        screen.getAllByRole('radio').forEach((radio) => {
            ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(radio).not.toHaveAttribute(name));
        });
    });

    it('作为 Popover 触发器时，根元素去掉 aria-expanded、aria-haspopup、aria-controls 与 tabindex', async () => {
        render(PopoverFixture);
        const root = screen.getByRole('radiogroup', { name: 'x' });
        const absent = () => ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        absent();
        await userEvent.click(root);
        expect(await screen.findByText('popup')).toBeInTheDocument();
        absent();
    });

    it('Radio 的 name 优先于 group 的 name', () => {
        render(RadioGroup, {
            props: { name: 'g' },
            slots: {
                default: () => (
                    <>
                        <Radio name="own" value="A">
                            {() => 'A'}
                        </Radio>
                        <Radio value="B">{() => 'B'}</Radio>
                    </>
                ),
            },
        });
        expect(getRadio('A')).toHaveAttribute('name', 'own');
        expect(getRadio('B')).toHaveAttribute('name', 'g');
    });

    it('options：字符串与带单项属性的对象', () => {
        render(RadioGroup, {
            props: {
                defaultValue: 2,
                options: [
                    {
                        label: 'One',
                        value: 1,
                        extra: 'first',
                        class: 'opt1',
                        style: { color: 'red' },
                        addonId: 'a1',
                        extraId: 'e1',
                        addonClass: 'ac1',
                        addonStyle: { color: 'blue' },
                    },
                    { label: 'Two', value: 2, disabled: true },
                ],
            },
        });
        const one = getRadio('One');
        expect(one).toHaveAttribute('aria-labelledby', 'a1');
        expect(one).toHaveAttribute('aria-describedby', 'e1');
        expect(document.getElementById('e1')).toHaveTextContent('first');
        const label = document.querySelector('.opt1');
        expect(label).toHaveClass(prefixCls);
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.getElementById('a1')).toHaveClass('ac1');
        expect(document.getElementById('a1')).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getRadio('Two')).toBeDisabled();
        expect(getRadio('Two')).toBeChecked();
        expect(one).not.toBeDisabled();
    });

    it('options 项的 value 可以是 0 与 false', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, {
            props: {
                modelValue: false,
                onChange: change,
                options: [
                    { label: 'zero', value: 0 },
                    { label: 'no', value: false },
                ],
            },
        });
        expect(getRadio('no')).toBeChecked();
        expect(getRadio('zero')).not.toBeChecked();
        await userEvent.click(getRadio('zero'));
        expect(change.mock.calls[0]?.[0].target.value).toBe(0);
    });

    it('#label 与 #extra 作用域插槽覆盖所有选项，字符串选项归一为对象', () => {
        render(RadioGroup, {
            props: { options: ['plain', { label: 'B', value: 'b', extra: 'x' }] },
            slots: {
                label: ({ option, index }: { option: RadioOptionItem; index: number }) => <i>{`${index}:${option.label}`}</i>,
                extra: ({ option }: { option: RadioOptionItem }) => <b>{`extra-${String(option.value)}`}</b>,
            },
        });
        expect(screen.getByText('0:plain').tagName).toBe('I');
        expect(screen.getByText('1:B')).toBeInTheDocument();
        expect(screen.getByText('extra-plain')).toBeInTheDocument();
        expect(screen.getByText('extra-b')).toBeInTheDocument();
    });

    it('button 类型的 group 不渲染 #extra', () => {
        render(RadioGroup, {
            props: { type: 'button', options: ['plain'] },
            slots: { extra: () => 'never' },
        });
        expect(screen.queryByText('never')).toBeNull();
    });

    it('字符串选项跟随 group 的 disabled', () => {
        render(RadioGroup, { props: { disabled: true, options: ['x', 'y'] } });
        expect(getRadio('x')).toBeDisabled();
        expect(getRadio('y')).toBeDisabled();
    });

    it('启用的 group 中禁用的 Radio', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, {
            props: { onChange: change },
            slots: {
                default: () => (
                    <>
                        <Radio disabled value="A">
                            {() => 'A'}
                        </Radio>
                        <Radio value="B">{() => 'B'}</Radio>
                    </>
                ),
            },
        });
        expect(getRadio('A')).toBeDisabled();
        await userEvent.click(getRadio('A'));
        expect(change).not.toHaveBeenCalled();
        expect(getRadio('B')).not.toBeDisabled();
    });

    it('group change 事件对象只含白名单字段，name 取组名', async () => {
        const groupChange = vi.fn<Change>();
        const radioChange = vi.fn<Change>();
        render(RadioGroup, {
            props: { name: 'g', onChange: groupChange },
            slots: {
                default: () => (
                    <>
                        <Radio value="A" onChange={radioChange}>
                            {() => 'A'}
                        </Radio>
                        <Radio value="B">{() => 'B'}</Radio>
                    </>
                ),
            },
        });
        await userEvent.click(getRadio('A'));
        const event = groupChange.mock.calls[0]?.[0] as RadioChangeEvent;
        expect(event.target).toEqual({ checked: true, value: 'A', name: 'g', disabled: false });
        expect(Object.keys(event.target).sort()).toEqual(['checked', 'disabled', 'name', 'value']);
        expect(typeof event.stopPropagation).toBe('function');
        expect(typeof event.preventDefault).toBe('function');
        expect(radioChange.mock.calls[0]?.[0].target.value).toBe('A');
        await userEvent.click(getRadio('B'));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('方向键在 group 内移动选中项', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, {
            props: { name: 'keys', defaultValue: 'A', onChange: change },
            slots: {
                default: () => (
                    <>
                        <Radio value="A">{() => 'A'}</Radio>
                        <Radio disabled value="B">
                            {() => 'B'}
                        </Radio>
                        <Radio value="C">{() => 'C'}</Radio>
                    </>
                ),
            },
        });
        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getRadio('C')).toHaveFocus();
        expect(getRadio('C')).toBeChecked();
        expect(getRadio('A')).not.toBeChecked();
        expect(change.mock.calls[0]?.[0].target.value).toBe('C');
        await userEvent.keyboard('{ArrowRight}');
        expect(getRadio('A')).toBeChecked();
        await userEvent.keyboard('{ArrowUp}');
        expect(getRadio('C')).toBeChecked();
        await userEvent.keyboard('{ArrowLeft}');
        expect(getRadio('A')).toBeChecked();
        expect(change).toHaveBeenCalledTimes(4);
    });

    it('受控 group 在 modelValue 变化前忽略点击，被浏览器取消的同名兄弟恢复为选中', async () => {
        const change = vi.fn<Change>();
        const view = renderChildren({ modelValue: 'A', onChange: change });
        await userEvent.click(getRadio('C'));
        expect(change.mock.calls[0]?.[0].target.value).toBe('C');
        expect(states()).toEqual([true, false, false]);
        expect(getRadio('A')).toBeChecked();
        await view.rerender({ modelValue: 'C' });
        expect(states()).toEqual([false, false, true]);
    });

    it('单向受控 group 连续被拒绝仍保持受控值', async () => {
        renderChildren({ modelValue: 'B' });
        await userEvent.click(getRadio('A'));
        await userEvent.click(getRadio('C'));
        await userEvent.keyboard('{ArrowUp}');
        expect(states()).toEqual([false, true, false]);
    });

    it('受控高级 group 取消选中时上报 undefined', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, {
            props: { modelValue: 'A', mode: 'advanced', onChange: change },
            slots: { default: abc },
        });
        await userEvent.click(getRadio('A'));
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target.value).toBeUndefined();
        expect(change.mock.calls[0]?.[0].target.checked).toBe(false);
        expect(getRadio('A')).toBeChecked();
    });

    it('非受控高级 group 可切换到另一个选项', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, { props: { mode: 'advanced', onChange: change }, slots: { default: abc } });
        await userEvent.click(getRadio('A'));
        await userEvent.click(getRadio('B'));
        expect(change.mock.calls.map(([event]) => event.target.value)).toEqual(['A', 'B']);
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('高级 group 用方向键移动选中项，与原生 radiogroup 一致', async () => {
        const change = vi.fn<Change>();
        render(RadioGroup, {
            props: { defaultValue: 'A', mode: 'advanced', onChange: change },
            attrs: { 'aria-label': 'pick' },
            slots: { default: abc },
        });
        expect(screen.getByRole('radiogroup', { name: 'pick' })).toBeInTheDocument();
        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getRadio('B')).toBeChecked();
        expect(change.mock.calls.at(-1)?.[0].target.value).toBe('B');
    });

    it('mode 为 advanced 时允许取消选中', async () => {
        const change = vi.fn<Change>();
        const update = vi.fn<(value?: RadioValue) => void>();
        render(RadioGroup, {
            props: { defaultValue: 'A', mode: 'advanced', onChange: change, 'onUpdate:modelValue': update },
            slots: { default: abc },
        });
        expect(getRadio('A')).toBeChecked();
        await userEvent.click(getRadio('A'));
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target.value).toBeUndefined();
        expect(update).toHaveBeenLastCalledWith(undefined);
        expect(getRadio('A')).not.toBeChecked();
    });

    it('button 与 card 类型的 group 标记选中的 radio', async () => {
        const first = renderChildren({ type: 'button', defaultValue: 'B' });
        const addons = document.querySelectorAll(`.${prefixCls}-addon-buttonRadio`);
        expect(addons[1]).toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
        expect(addons[0]).not.toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
        expect(document.querySelector(`.${groupCls}-buttonRadio`)).not.toBeNull();
        expect(document.querySelector(`.${groupCls}-horizontal`)).toBeNull();
        first.unmount();

        renderChildren({ type: 'card', direction: 'vertical' });
        await userEvent.click(getRadio('C'));
        const cards = document.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[2]).toHaveClass(`${prefixCls}-cardRadioGroup_checked`);
        expect(document.querySelector(`.${groupCls}-vertical-card`)).not.toBeNull();
    });

    it('group 的 prefixCls 作用于各 radio 的根', () => {
        const { container } = renderChildren({ prefixCls: 'my-group' });
        expect(container.firstElementChild).toHaveClass('my-group', 'my-group-wrapper');
        expect(container.querySelectorAll('label.my-group')).toHaveLength(3);
    });

    it('group 的 id、aria-*、data-*、class 与 style 作用于根元素', () => {
        const { container } = renderChildren(
            {},
            {
                id: 'gid',
                'aria-describedby': 'd',
                'aria-errormessage': 'em',
                'aria-invalid': true,
                'aria-labelledby': 'l',
                'aria-required': true,
                'data-test': 'x',
                class: 'gc',
                style: { color: 'red' },
                title: 'tip',
            }
        );
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveAttribute('id', 'gid');
        expect(root).toHaveAttribute('aria-describedby', 'd');
        expect(root).toHaveAttribute('aria-errormessage', 'em');
        expect(root).toHaveAttribute('aria-invalid', 'true');
        expect(root).toHaveAttribute('aria-labelledby', 'l');
        expect(root).toHaveAttribute('aria-required', 'true');
        expect(root).toHaveAttribute('data-test', 'x');
        expect(root).toHaveAttribute('title', 'tip');
        expect(root).toHaveClass('gc');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('v-model 双向同步，变回 undefined 后没有选中项', async () => {
        const change = vi.fn<Change>();
        render(GroupModel, { props: { onChange: change } });
        expect(getRadio('semi')).toBeChecked();
        await userEvent.click(getRadio('design'));
        expect(screen.getByLabelText('model')).toHaveTextContent('2');
        expect(change.mock.calls[0]?.[0].target.value).toBe(2);
        await userEvent.click(screen.getByRole('button', { name: 'pick 3' }));
        expect(getRadio('dsm')).toBeChecked();
        expect(getRadio('design')).not.toBeChecked();
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
        await userEvent.click(getRadio('semi'));
        expect(getRadio('semi')).toBeChecked();
    });

    it('blur：组内移动不触发，焦点离开整个组触发一次', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(RadioGroup, { props: { options: ['A', 'B'], onBlur: blur } });
        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getRadio('B')).toHaveFocus();
        expect(blur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(blur).toHaveBeenCalledTimes(1);
        expect(blur.mock.calls[0]?.[0]).toBeInstanceOf(FocusEvent);
    });

    it('全局默认值生效，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { RadioGroup: { type: 'button', buttonSize: 'small' } };
        const first = renderChildren();
        expect(document.querySelectorAll(`.${prefixCls}-addon-buttonRadio-small`)).toHaveLength(3);
        first.unmount();
        renderChildren({ type: 'default' });
        expect(document.querySelectorAll(`.${prefixCls}-addon-buttonRadio-small`)).toHaveLength(0);
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { RadioGroup: { disabled: true, defaultValue: 'B' } };
        render(RadioGroup, { slots: { default: abc }, global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expect(getRadio('B')).toBeChecked();
        expect(getRadio('A')).toBeDisabled();
    });

    it('分组的 prefixCls 优先于 Radio 的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { prefixCls: 'gx' } };
        render(RadioGroup, { props: { prefixCls: 'g' }, slots: { default: abc } });
        const label = getRadio('A').closest('label');
        expect(label).toHaveClass('g');
        expect(label).not.toHaveClass('gx');
    });

    it('根元素是组件的 $el：未声明的属性与 click 监听落在 radiogroup', async () => {
        const click = vi.fn<() => void>();
        const { container } = renderChildren({}, { title: 'tip', onClick: click });
        expect(container.firstElementChild).toHaveAttribute('title', 'tip');
        expect(container.firstElementChild).toHaveAttribute('role', 'radiogroup');
        await userEvent.click(container.firstElementChild as Element);
        expect(click).toHaveBeenCalledOnce();
    });

    it('options 与 value 的类型与运行时一致', () => {
        expectTypeOf<{ label: string; value: true }>().toExtend<RadioOptionItem>();
        expectTypeOf<{ lable: string }>().not.toExtend<RadioOptionItem>();
        expectTypeOf<RadioOptionItem>().not.toHaveProperty('onChange');
        expectTypeOf<RadioOptionItem['label']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<RadioOptionItem['extra']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<RadioGroupProps['modelValue']>().toEqualTypeOf<string | number | boolean | undefined>();
    });

    it('事件与插槽的载荷类型', () => {
        expectTypeOf<RadioGroupEmits['update:modelValue']>().toEqualTypeOf<[value: RadioValue | undefined]>();
        expectTypeOf<RadioGroupEmits['change']>().toEqualTypeOf<[event: RadioChangeEvent]>();
        expectTypeOf<RadioGroupEmits['blur']>().toEqualTypeOf<[event: FocusEvent]>();
        expectTypeOf<Parameters<NonNullable<RadioGroupSlots['extra']>>[0]>().toEqualTypeOf<{
            option: RadioOptionItem;
            index: number;
        }>();
    });
});
