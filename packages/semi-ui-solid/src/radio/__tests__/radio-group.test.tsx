import { createSignal, onMount, type JSX } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Radio, { RadioGroup, type RadioChangeEvent, type RadioGroupProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Popover from '../../popover';
import type { OptionItem } from '../radio-group';

type Change = (event: RadioChangeEvent) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-radio`;
const groupCls = `${BASE_CLASS_PREFIX}-radioGroup`;

const getRadio = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name });

function threeRadios(props: RadioGroupProps = {}) {
    return (
        <RadioGroup {...props}>
            <Radio value="A">A</Radio>
            <Radio value="B">B</Radio>
            <Radio value="C">C</Radio>
        </RadioGroup>
    );
}

const abcOptions = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
];

describe('RadioGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('value 变化时触发 change 事件', async () => {
        const onChange = vi.fn<Change>();
        const { unmount } = render(() => threeRadios({ onChange, defaultValue: 'B' }));
        await userEvent.click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBe('A');
        expect(getRadio('A')).toBeChecked();
        unmount();

        render(() => threeRadios({ onChange, value: 'A' }));
        await userEvent.click(getRadio('B'));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].target.value).toBe('B');
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('radio 与 radioGroup 同时存在时都会触发 onChange 事件', async () => {
        const onChange = vi.fn<Change>();
        const onChangeRadioGroup = vi.fn<Change>();
        const group = (props: RadioGroupProps) => (
            <RadioGroup onChange={onChangeRadioGroup} {...props}>
                <Radio value="A" onChange={onChange}>
                    A
                </Radio>
                <Radio value="B" onChange={onChange}>
                    B
                </Radio>
                <Radio value="C" onChange={onChange}>
                    C
                </Radio>
            </RadioGroup>
        );

        const { unmount } = render(() => group({ defaultValue: 'B' }));
        await userEvent.click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChangeRadioGroup).toHaveBeenCalledTimes(1);
        unmount();

        render(() => group({ value: 'A' }));
        await userEvent.click(getRadio('B'));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChangeRadioGroup).toHaveBeenCalledTimes(2);
    });

    it('使用 options 的 group 中只触发一次', async () => {
        const onChange = vi.fn<Change>();
        render(() => <RadioGroup options={[{ label: 'Bamboo', value: 'Bamboo' }]} onChange={onChange} />);
        await userEvent.click(getRadio('Bamboo'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('value 不变时不触发 change 事件', async () => {
        const onChange = vi.fn<Change>();
        const { unmount } = render(() => threeRadios({ onChange, defaultValue: 'B' }));
        await userEvent.click(getRadio('B'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getRadio('B')).toBeChecked();
        unmount();

        render(() => threeRadios({ onChange, value: 'A' }));
        await userEvent.click(getRadio('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getRadio('A')).toBeChecked();
    });

    it('没有 value 的 radio 在组内不被选中', () => {
        render(() => (
            <RadioGroup>
                <Radio>A</Radio>
                <Radio>B</Radio>
            </RadioGroup>
        ));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('options 正确渲染', () => {
        render(() => <RadioGroup options={abcOptions} />);
        expect(screen.getAllByRole('radio')).toHaveLength(3);
        expect(getRadio('A')).toBeInTheDocument();
        expect(getRadio('C')).toBeInTheDocument();
    });

    it('所有子项都有 name 属性', () => {
        render(() => threeRadios({ name: 'radiogroup' }));
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((el) => expect(el).toHaveAttribute('name', 'radiogroup'));
    });

    it('button 样式与 buttonSize', () => {
        const { container, unmount } = render(() => threeRadios({ type: 'button' }));
        expect(container.querySelector(`.${prefixCls}-buttonRadioGroup`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-inner-buttonRadio`)).not.toBeNull();
        unmount();

        for (const buttonSize of ['small', 'middle', 'large'] as const) {
            const view = render(() => threeRadios({ type: 'button', buttonSize }));
            expect(view.container.querySelectorAll(`.${prefixCls}-addon-buttonRadio-${buttonSize}`)).toHaveLength(3);
            view.unmount();
        }
    });

    it.each(['card', 'pureCard'] as const)('%s 样式，禁用且选中的卡片带 checked_disabled', (type) => {
        const { container, unmount } = render(() => threeRadios({ type }));
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-inner-pureCardRadio`) !== null).toBe(type === 'pureCard');
        unmount();

        const disabled = render(() => threeRadios({ type, disabled: true, defaultValue: 'A' }));
        const cards = disabled.container.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
    });

    it('把 value 设为 NaN 时没有选中项也不重复更新', () => {
        const { container } = render(() => threeRadios({ value: NaN as unknown as number }));
        expect(container.querySelector(`.${prefixCls}-checked`)).toBeNull();
        screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
    });

    it.each(['horizontal', 'vertical'] as const)('direction %s', (direction) => {
        const { container } = render(() => threeRadios({ direction }));
        expect(container.querySelector(`.${groupCls}-${direction}`)).not.toBeNull();
    });

    it('受控 value 随 signal 更新', () => {
        const [value, setValue] = createSignal<string | undefined>('A');
        render(() =>
            threeRadios({
                get value() {
                    return value();
                },
            })
        );
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('B')).not.toBeChecked();

        setValue('B');
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('defaultValue', () => {
        render(() => threeRadios({ defaultValue: 'B' }));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('禁用 group', () => {
        render(() => threeRadios({ disabled: true }));
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((input) => expect(input).toBeDisabled());
    });

    it('没有 name 的 group 内 radio 共用生成的 name，且与其他 group 不同', () => {
        render(() => (
            <>
                <RadioGroup aria-label="one" options={['A', 'B']} />
                <RadioGroup aria-label="two" options={['A', 'B']} />
            </>
        ));
        const names = ['one', 'two'].map((label) => {
            const radios = screen.getByLabelText(label).querySelectorAll('input');
            expect(radios[0].name).toBeTruthy();
            expect(radios[0].name).toBe(radios[1].name);
            return radios[0].name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('方向键不会在两个没有 name 的 group 之间移动', async () => {
        render(() => (
            <>
                <RadioGroup aria-label="one" options={['A', 'B']} />
                <RadioGroup aria-label="two" options={['A', 'B']} />
            </>
        ));
        const one = within(screen.getByLabelText('one'));
        const two = within(screen.getByLabelText('two'));
        await userEvent.click(one.getByRole('radio', { name: 'A' }));
        await userEvent.keyboard('{ArrowDown}');
        expect(one.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(two.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(two.getByRole('radio', { name: 'B' })).not.toBeChecked();
    });

    it('根元素是带有 aria 属性的 radiogroup', () => {
        render(() => threeRadios({ 'aria-label': 'x', 'aria-required': true, 'aria-invalid': true }));
        expect(screen.getByRole('radiogroup', { name: 'x' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('radiogroup', { name: 'x' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('作为 Popover 触发器时，根元素去掉 aria-expanded、aria-haspopup、aria-controls 与 tabIndex', async () => {
        render(() => (
            <Popover content={<div>popup</div>} trigger="click">
                {(trigger) => threeRadios({ 'aria-label': 'x', ...trigger() } as RadioGroupProps)}
            </Popover>
        ));
        const root = screen.getByRole('radiogroup', { name: 'x' });
        const absent = () => ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        absent();
        await userEvent.click(getRadio('A'));
        expect(await screen.findByText('popup')).toBeInTheDocument();
        absent();
    });

    it('Radio 的 name 优先于 group 的 name', () => {
        render(() => (
            <RadioGroup name="g">
                <Radio name="own" value="A">
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        expect(getRadio('A')).toHaveAttribute('name', 'own');
        expect(getRadio('B')).toHaveAttribute('name', 'g');
    });

    it('options：字符串与带单项属性的对象', () => {
        const { container } = render(() => (
            <RadioGroup
                defaultValue={2}
                options={[
                    { label: 'One', value: 1, extra: 'first', class: 'opt1', style: { color: 'red' }, addonId: 'a1', extraId: 'e1', addonClassName: 'ac1', addonStyle: { color: 'blue' } },
                    { label: 'Two', value: 2, disabled: true },
                ]}
            />
        ));
        const one = getRadio('One');
        expect(one).toHaveAttribute('aria-labelledby', 'a1');
        expect(one).toHaveAttribute('aria-describedby', 'e1');
        expect(document.getElementById('e1')).toHaveTextContent('first');
        const label = container.querySelector('.opt1') as HTMLElement;
        expect(label).toHaveClass(prefixCls);
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.getElementById('a1')).toHaveClass('ac1');
        expect(document.getElementById('a1')).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getRadio('Two')).toBeDisabled();
        expect(getRadio('Two')).toBeChecked();
        expect(one).not.toBeDisabled();
    });

    it('label 为数字 0 的选项照常渲染并成为可访问名称', () => {
        render(() => (
            <RadioGroup
                type="button"
                options={[
                    { label: 0, value: 0 },
                    { label: 1, value: 1 },
                ]}
            />
        ));
        expect(screen.getByRole('radio', { name: '0' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: '1' })).toBeInTheDocument();
    });

    it('字符串选项跟随 group 的 disabled', () => {
        render(() => <RadioGroup disabled options={['x', 'y']} />);
        expect(getRadio('x')).toBeDisabled();
        expect(getRadio('y')).toBeDisabled();
    });

    it('启用的 group 中禁用的 Radio', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <RadioGroup onChange={onChange}>
                <Radio disabled value="A">
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        expect(getRadio('A')).toBeDisabled();
        await userEvent.click(getRadio('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getRadio('B')).not.toBeDisabled();
    });

    it('group onChange 事件对象与 Radio onChange', async () => {
        const groupChange = vi.fn<Change>();
        const radioChange = vi.fn<Change>();
        render(() => (
            <RadioGroup name="g" onChange={groupChange}>
                <Radio value="A" onChange={radioChange}>
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        await userEvent.click(getRadio('A'));
        const event = groupChange.mock.calls[0][0];
        expect(event.target.value).toBe('A');
        expect(event.target.checked).toBe(true);
        expect(event.target.name).toBe('g');
        expect(typeof event.stopPropagation).toBe('function');
        expect(typeof event.preventDefault).toBe('function');
        expect(radioChange.mock.calls[0][0].target.value).toBe('A');
        // the Radio's own state is not used inside a group: the group value decides
        await userEvent.click(getRadio('B'));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('方向键在 group 内移动选中项并跳过禁用项', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <RadioGroup name="keys" defaultValue="A" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio disabled value="B">
                    B
                </Radio>
                <Radio value="C">C</Radio>
            </RadioGroup>
        ));
        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getRadio('C')).toHaveFocus();
        expect(getRadio('C')).toBeChecked();
        expect(getRadio('A')).not.toBeChecked();
        expect(onChange.mock.calls[0][0].target.value).toBe('C');
        await userEvent.keyboard('{ArrowRight}');
        expect(getRadio('A')).toBeChecked();
        await userEvent.keyboard('{ArrowUp}');
        expect(getRadio('C')).toBeChecked();
        await userEvent.keyboard('{ArrowLeft}');
        expect(getRadio('A')).toBeChecked();
        expect(onChange).toHaveBeenCalledTimes(4);
    });

    it('受控 group 在 value 属性变化前忽略点击与方向键，原生选中项写回', async () => {
        const onChange = vi.fn<Change>();
        render(() => threeRadios({ value: 'A', onChange, name: 'controlled' }));
        await userEvent.click(getRadio('C'));
        expect(onChange.mock.calls[0][0].target.value).toBe('C');
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('C')).not.toBeChecked();

        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onChange.mock.calls[1][0].target.value).toBe('B');
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('受控高级 group 取消选中时上报 undefined', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <RadioGroup value="A" mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        await userEvent.click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBeUndefined();
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
        expect(getRadio('A')).toBeChecked();
    });

    it('非受控高级 group 可切换到另一个选项', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <RadioGroup mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        await userEvent.click(getRadio('A'));
        await userEvent.click(getRadio('B'));
        expect(onChange.mock.calls.map(([event]) => event.target.value)).toEqual(['A', 'B']);
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('高级 group 用方向键移动选中项，与原生 radiogroup 一致', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <RadioGroup aria-label="pick" defaultValue="A" mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getRadio('B')).toBeChecked();
        expect(onChange.mock.lastCall?.[0].target.value).toBe('B');
    });

    it('mode 为 advanced 时允许取消选中', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <RadioGroup defaultValue="A" mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        ));
        expect(getRadio('A')).toBeChecked();
        await userEvent.click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBeUndefined();
        expect(getRadio('A')).not.toBeChecked();
    });

    it('button 与 card 类型的 group 标记选中的 radio', async () => {
        const { container, unmount } = render(() => threeRadios({ type: 'button', defaultValue: 'B' }));
        const addons = container.querySelectorAll(`.${prefixCls}-addon-buttonRadio`);
        expect(addons[1]).toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
        expect(addons[0]).not.toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
        expect(container.querySelector(`.${groupCls}-buttonRadio`)).not.toBeNull();
        expect(container.querySelector(`.${groupCls}-horizontal`)).toBeNull();
        unmount();

        const second = render(() => threeRadios({ type: 'card', direction: 'vertical' }));
        await userEvent.click(getRadio('C'));
        const cards = second.container.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[2]).toHaveClass(`${prefixCls}-cardRadioGroup_checked`);
        expect(second.container.querySelector(`.${groupCls}-vertical-card`)).not.toBeNull();
    });

    it('group 的 prefixCls 作用于各 radio', () => {
        const { container } = render(() => threeRadios({ prefixCls: 'my-group' }));
        expect(container.firstElementChild).toHaveClass('my-group', 'my-group-wrapper');
        expect(container.querySelectorAll('label.my-group')).toHaveLength(3);
    });

    it('group 的 id、aria-*、data-*、class 与 style 作用于根元素', () => {
        const props = {
            id: 'gid',
            'aria-describedby': 'd',
            'aria-errormessage': 'em',
            'aria-invalid': true,
            'aria-labelledby': 'l',
            'aria-required': true,
            'data-test': 'x',
            class: 'gc',
            style: { color: 'red' },
        } as RadioGroupProps;
        const { container } = render(() => threeRadios(props));
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveAttribute('id', 'gid');
        expect(root).toHaveAttribute('aria-describedby', 'd');
        expect(root).toHaveAttribute('aria-errormessage', 'em');
        expect(root).toHaveAttribute('aria-invalid', 'true');
        expect(root).toHaveAttribute('aria-labelledby', 'l');
        expect(root).toHaveAttribute('aria-required', 'true');
        expect(root).toHaveAttribute('data-test', 'x');
        expect(root).toHaveClass('gc');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('value 变为 undefined 后组内没有选中项', () => {
        const [value, setValue] = createSignal<string | undefined>('A');
        render(() =>
            threeRadios({
                get value() {
                    return value();
                },
            })
        );
        expect(getRadio('A')).toBeChecked();
        setValue(undefined);
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('父组件挂载时就把 value 改为 undefined，组内没有选中项', () => {
        function Demo() {
            const [value, setValue] = createSignal<string | undefined>('A');
            onMount(() => setValue(undefined));
            return threeRadios({
                get value() {
                    return value();
                },
            });
        }
        render(() => <Demo />);
        expect(getRadio('A')).not.toBeChecked();
    });

    it('文本子节点被丢弃，元素子节点保留', () => {
        const { container } = render(() => (
            <RadioGroup>
                plain text
                <Radio value="A">A</Radio>
            </RadioGroup>
        ));
        expect(container.firstElementChild).not.toHaveTextContent('plain text');
        expect(getRadio('A')).toBeInTheDocument();
    });

    it('条件渲染的子 Radio 随 signal 出现', async () => {
        const [show, setShow] = createSignal(false);
        render(() => (
            <RadioGroup>
                {show() ? <Radio value="X">X</Radio> : null}
                <Radio value="A">A</Radio>
            </RadioGroup>
        ));
        const before = getRadio('A');
        setShow(true);
        await userEvent.click(getRadio('X'));
        expect(getRadio('X')).toBeChecked();
        expect(getRadio('A')).toBe(before);
    });

    it('group 读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { RadioGroup: { type: 'button', buttonSize: 'small' } };
        const { container } = render(() => threeRadios());
        expect(container.querySelectorAll(`.${prefixCls}-addon-buttonRadio-small`)).toHaveLength(3);
    });

    it('group 的 ref 指向根 div，未声明的属性透传到根 div', async () => {
        let ref: HTMLDivElement | undefined;
        const onClick = vi.fn<() => void>();
        const props = { ref: (node: HTMLDivElement) => (ref = node), title: 'tip', onClick } as RadioGroupProps;
        const { container } = render(() => threeRadios(props));
        expect(ref).toBe(container.firstElementChild);
        expect(container.firstElementChild).toHaveAttribute('title', 'tip');
        await userEvent.click(getRadio('A'));
        expect(onClick).toHaveBeenCalled();
    });

    it('onBlur 在焦点移出 group 时调用一次，组内移动不调用', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(() => (
            <>
                {threeRadios({ onBlur, name: 'blur' })}
                <button type="button">outside</button>
            </>
        ));
        getRadio('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getRadio('B')).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
        await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1));
    });

    it('Form 注入的 validateStatus 不进入 DOM', () => {
        const { container } = render(() => threeRadios({ validateStatus: 'error' } as RadioGroupProps));
        expect(container.firstElementChild).not.toHaveAttribute('validatestatus');
    });

    it('options 的 value 可以是 boolean', () => {
        expectTypeOf<{ label: string; value: true }>().toExtend<OptionItem>();
    });

    it('children 的类型是 JSX.Element', () => {
        expectTypeOf<NonNullable<RadioGroupProps['children']>>().toExtend<JSX.Element>();
    });

    it('展开信号对象时，无关属性变化不重置非受控的选中项', async () => {
        const [props, setProps] = createSignal<RadioGroupProps>({});
        render(() => (
            <RadioGroup {...props()}>
                <Radio value="a">A</Radio>
                <Radio value="b">B</Radio>
            </RadioGroup>
        ));
        await userEvent.click(getRadio('B'));
        expect(getRadio('B').checked).toBe(true);
        setProps({ class: 'other' });
        expect(document.querySelector(`.${groupCls}.other`)).not.toBeNull();
        expect(getRadio('B').checked).toBe(true);
    });
});
