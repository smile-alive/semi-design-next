import { createRef, StrictMode } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form, Popover } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { RadioWithGroup as Radio, type RadioChangeEvent, type RadioGroupProps } from '../index';
import RadioGroup, { type OptionItem } from '../radio-group';

const prefixCls = `${BASE_CLASS_PREFIX}-radio`;

describe('RadioGroup', () => {
    // data-* attributes are only typed on JSX attributes, not on a props object
    type GroupTestProps = RadioGroupProps & { 'data-test'?: string };

    const createRadioGroup = (props: GroupTestProps = {}) => {
        return (
            <RadioGroup {...props}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
                <Radio value="C">C</Radio>
            </RadioGroup>
        );
    };

    const createRadioGroupByOption = (props: RadioGroupProps = {}) => {
        const options = [
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'C', value: 'C' },
        ];

        return <RadioGroup {...props} options={options} />;
    };

    const getRadio = (name) => screen.getByRole('radio', { name });

    it('value 变化时触发 change 事件', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();

        const { unmount } = render(createRadioGroup({ onChange, defaultValue: 'B' }));
        await userEvent.click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBe('A');
        expect(getRadio('A')).toBeChecked();
        unmount();

        render(createRadioGroup({ onChange, value: 'A' }));
        await userEvent.click(getRadio('B'));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].target.value).toBe('B');
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
    });

    it('radio 与 radioGroup 同时存在时都会触发 onChange 事件', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const onChangeRadioGroup = vi.fn<(e: RadioChangeEvent) => void>();

        const createGroup = (props) => (
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

        const { unmount } = render(createGroup({ defaultValue: 'B' }));
        await userEvent.click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChangeRadioGroup).toHaveBeenCalledTimes(1);
        unmount();

        render(createGroup({ value: 'A' }));
        await userEvent.click(getRadio('B'));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChangeRadioGroup).toHaveBeenCalledTimes(2);
    });

    it('使用 options 的 group 中只触发一次', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const options = [{ label: 'Bamboo', value: 'Bamboo' }];
        render(<RadioGroup options={options} onChange={onChange} />);

        await userEvent.click(getRadio('Bamboo'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('value 不变时不触发 change 事件', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();

        const { unmount } = render(createRadioGroup({ onChange, defaultValue: 'B' }));
        await userEvent.click(getRadio('B'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getRadio('B')).toBeChecked();
        unmount();

        render(createRadioGroup({ onChange, value: 'A' }));
        await userEvent.click(getRadio('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getRadio('A')).toBeChecked();
    });

    it('没有 value 的 radio 在组内不被选中', () => {
        render(
            <RadioGroup>
                <Radio>A</Radio>
                <Radio>B</Radio>
            </RadioGroup>
        );
        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).not.toBeChecked();
    });

    it('optional 正确渲染', () => {
        render(createRadioGroupByOption());
        expect(screen.getAllByRole('radio')).toHaveLength(3);
        expect(getRadio('A')).toBeInTheDocument();
        expect(getRadio('B')).toBeInTheDocument();
        expect(getRadio('C')).toBeInTheDocument();
    });

    it('所有子项都有 name 属性', () => {
        const GROUP_NAME = 'radiogroup';
        render(createRadioGroup({ name: GROUP_NAME }));

        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((el) => {
            expect(el).toHaveAttribute('name', GROUP_NAME);
        });
    });

    it('radioGroup button 样式', () => {
        const { container } = render(createRadioGroup({ type: 'button' }));
        expect(container.querySelector(`.${prefixCls}-buttonRadioGroup`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-inner-buttonRadio`)).not.toBeNull();
    });

    it('radioGroup card 样式', () => {
        const { container, unmount } = render(createRadioGroup({ type: 'card' }));
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        unmount();

        const { container: disabledContainer } = render(createRadioGroup({ type: 'card', disabled: true, defaultValue: 'A' }));
        const cards = disabledContainer.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
    });

    it('radioGroup pure card 样式', () => {
        const { container, unmount } = render(createRadioGroup({ type: 'pureCard' }));
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-inner-pureCardRadio`)).not.toBeNull();
        unmount();

        const { container: disabledContainer } = render(createRadioGroup({ type: 'pureCard', disabled: true, defaultValue: 'A' }));
        const cards = disabledContainer.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardRadioGroup_checked_disabled`);
    });

    it('button 类型 radio 的 buttonSize', () => {
        for (const buttonSize of ['small', 'middle', 'large'] as const) {
            const { container, unmount } = render(createRadioGroup({ type: 'button', buttonSize }));
            expect(container.querySelectorAll(`.${prefixCls}-addon-buttonRadio-${buttonSize}`)).toHaveLength(3);
            unmount();
        }
    });

    it('把 radio-group 的 value 设为 NaN 时不触发 Maximum update exceeded', () => {
        const { container } = render(createRadioGroup({ value: NaN }));

        expect(container.querySelector(`.${prefixCls}-checked`)).toBeNull();
        screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
    });

    it('direction 为 horizontal', () => {
        const { container } = render(createRadioGroup({ direction: 'horizontal' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup-horizontal`)).not.toBeNull();
    });

    it('direction 为 vertical', () => {
        const { container } = render(createRadioGroup({ direction: 'vertical' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup-vertical`)).not.toBeNull();
    });

    it('受控 value', () => {
        const { rerender } = render(createRadioGroup({ value: 'A' }));
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('B')).not.toBeChecked();

        rerender(createRadioGroup({ value: 'B' }));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('defaultValue', () => {
        render(createRadioGroup({ defaultValue: 'B' }));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('禁用 group', () => {
        render(createRadioGroup({ disabled: true }));
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((input) => {
            expect(input).toBeDisabled();
        });
    });

    it('aria-label', () => {
        const { container } = render(createRadioGroup({ 'aria-label': 'Radio group label' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup`)).toHaveAttribute('aria-label', 'Radio group label');
    });

    it('没有 name 的 group 内 radio 共用生成的 name，且与其他 group 不同', () => {
        render(
            <>
                <RadioGroup aria-label="one" options={['A', 'B']} />
                <RadioGroup aria-label="two" options={['A', 'B']} />
            </>
        );
        const names = ['one', 'two'].map((label) => {
            const radios = screen.getByLabelText(label).querySelectorAll('input');
            expect(radios[0].name).toBeTruthy();
            expect(radios[0].name).toBe(radios[1].name);
            return radios[0].name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('方向键不会在两个没有 name 的 group 之间移动', async () => {
        render(
            <>
                <RadioGroup aria-label="one" options={['A', 'B']} />
                <RadioGroup aria-label="two" options={['A', 'B']} />
            </>
        );
        const one = within(screen.getByLabelText('one'));
        const two = within(screen.getByLabelText('two'));
        await userEvent.click(one.getByRole('radio', { name: 'A' }));
        await userEvent.keyboard('{ArrowDown}');
        expect(one.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(two.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(two.getByRole('radio', { name: 'B' })).not.toBeChecked();
    });

    it('根元素是带有 aria 属性的 radiogroup', () => {
        render(createRadioGroup({ 'aria-label': 'x', 'aria-required': true, 'aria-invalid': true }));
        expect(screen.getByRole('radiogroup', { name: 'x' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('radiogroup', { name: 'x' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('作为 Popover 触发器时，根元素去掉 aria-expanded、aria-haspopup、aria-controls 与 tabIndex', async () => {
        render(
            <Popover content={<div>popup</div>} trigger="click">
                {createRadioGroup({ 'aria-label': 'x' })}
            </Popover>
        );
        const root = screen.getByRole('radiogroup', { name: 'x' });
        const absent = () => ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        absent();
        await userEvent.click(getRadio('A'));
        expect(await screen.findByText('popup')).toBeInTheDocument();
        absent();
    });

    it('Radio 的 name 优先于 group 的 name', () => {
        render(
            <RadioGroup name="g">
                <Radio name="own" value="A">
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        expect(getRadio('A')).toHaveAttribute('name', 'own');
        expect(getRadio('B')).toHaveAttribute('name', 'g');
    });

    it('options: 字符串与带单项属性的对象', () => {
        const { container } = render(
            <RadioGroup
                defaultValue={2}
                options={[
                    {
                        label: 'One',
                        value: 1,
                        extra: 'first',
                        className: 'opt1',
                        style: { color: 'red' },
                        addonId: 'a1',
                        extraId: 'e1',
                        addonClassName: 'ac1',
                        addonStyle: { color: 'blue' },
                    },
                    { label: 'Two', value: 2, disabled: true },
                ]}
            />
        );
        const one = getRadio('One');
        expect(one).toHaveAttribute('aria-labelledby', 'a1');
        expect(one).toHaveAttribute('aria-describedby', 'e1');
        expect(document.getElementById('e1')).toHaveTextContent('first');
        const label = container.querySelector('.opt1');
        expect(label).toHaveClass(prefixCls);
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.getElementById('a1')).toHaveClass('ac1');
        expect(document.getElementById('a1')).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getRadio('Two')).toBeDisabled();
        expect(getRadio('Two')).toBeChecked();
        expect(one).not.toBeDisabled();
    });

    it('label 为数字 0 的选项照常渲染并成为可访问名称', () => {
        render(
            <RadioGroup
                type="button"
                options={[
                    { label: 0, value: 0 },
                    { label: 1, value: 1 },
                ]}
            />
        );
        expect(screen.getByRole('radio', { name: '0' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: '1' })).toBeInTheDocument();
    });

    it('字符串选项跟随 group 的 disabled', () => {
        render(<RadioGroup disabled options={['x', 'y']} />);
        expect(getRadio('x')).toBeDisabled();
        expect(getRadio('y')).toBeDisabled();
    });

    it('启用的 group 中禁用的 Radio', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup onChange={onChange}>
                <Radio disabled value="A">
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        expect(getRadio('A')).toBeDisabled();
        await userEvent.click(getRadio('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getRadio('B')).not.toBeDisabled();
    });

    it('group onChange 事件对象与 Radio onChange', async () => {
        const groupChange = vi.fn<(e: RadioChangeEvent) => void>();
        const radioChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup name="g" onChange={groupChange}>
                <Radio value="A" onChange={radioChange}>
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        await userEvent.click(getRadio('A'));
        const e = groupChange.mock.calls[0][0];
        expect(e.target.value).toBe('A');
        expect(e.target.checked).toBe(true);
        expect(e.target.name).toBe('g');
        expect(typeof e.stopPropagation).toBe('function');
        expect(typeof e.preventDefault).toBe('function');
        expect(radioChange.mock.calls[0][0].target.value).toBe('A');
        // the Radio's own state is not used inside a group: the group value decides
        await userEvent.click(getRadio('B'));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
    });

    it('方向键在 group 内移动选中项', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup name="keys" defaultValue="A" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio disabled value="B">
                    B
                </Radio>
                <Radio value="C">C</Radio>
            </RadioGroup>
        );
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

    it('受控 group 在 value 属性变化前忽略点击', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(createRadioGroup({ value: 'A', onChange }));
        await userEvent.click(getRadio('C'));
        expect(onChange.mock.calls[0][0].target.value).toBe('C');
        expect(getRadio('A')).toBeChecked();
        expect(getRadio('C')).not.toBeChecked();
    });

    it('受控高级 group 取消选中时上报 undefined', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup value="A" mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        const a = screen.getByRole('radio', { name: 'A' });
        await userEvent.click(a);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBeUndefined();
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
        expect(a).toBeChecked();
    });

    it('非受控高级 group 可切换到另一个选项', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        await userEvent.click(screen.getByRole('radio', { name: 'A' }));
        await userEvent.click(screen.getByRole('radio', { name: 'B' }));
        expect(onChange.mock.calls.map(([e]) => e.target.value)).toEqual(['A', 'B']);
        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
    });

    it('高级 group 用方向键移动选中项，与原生 radiogroup 一致', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup aria-label="pick" defaultValue="A" mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        expect(screen.getByRole('radiogroup', { name: 'pick' })).toBeInTheDocument();
        screen.getByRole('radio', { name: 'A' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(onChange.mock.calls.at(-1)[0].target.value).toBe('B');
    });

    it('button 与 card 类型的 group 标记选中的 radio', async () => {
        const { container, unmount } = render(createRadioGroup({ type: 'button', defaultValue: 'B' }));
        const addons = container.querySelectorAll(`.${prefixCls}-addon-buttonRadio`);
        expect(addons[1]).toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
        expect(addons[0]).not.toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup-buttonRadio`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup-horizontal`)).toBeNull();
        unmount();

        const { container: c2 } = render(createRadioGroup({ type: 'card', direction: 'vertical' }));
        await userEvent.click(getRadio('C'));
        const cards = c2.querySelectorAll(`.${prefixCls}-cardRadioGroup`);
        expect(cards[2]).toHaveClass(`${prefixCls}-cardRadioGroup_checked`);
        expect(c2.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup-vertical-card`)).not.toBeNull();
    });

    it('group 的 prefixCls 作用于各 radio', () => {
        const { container } = render(createRadioGroup({ prefixCls: 'my-group' }));
        expect(container.firstChild).toHaveClass('my-group', 'my-group-wrapper');
        expect(container.querySelectorAll('label.my-group')).toHaveLength(3);
    });

    it('group 的 id、aria-* 与 data-* 作用于根元素', () => {
        const { container } = render(
            createRadioGroup({
                id: 'gid',
                'aria-describedby': 'd',
                'aria-errormessage': 'em',
                'aria-invalid': true,
                'aria-labelledby': 'l',
                'aria-required': true,
                'data-test': 'x',
                className: 'gc',
                style: { color: 'red' },
            })
        );
        const root = container.firstChild;
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

    it('Form.RadioGroup 的 reset 清空选中项', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.RadioGroup field="g" initValue="A">
                    <Radio value="A">A</Radio>
                    <Radio value="B">B</Radio>
                </Form.RadioGroup>
            </Form>
        );
        expect(getRadio('A')).toBeChecked();
        await userEvent.click(getRadio('B'));
        expect(formApi.getValue('g')).toBe('B');
        await act(() => formApi.setValue('g', undefined));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).not.toBeChecked();
        await act(() => formApi.reset());
        expect(getRadio('A')).toBeChecked();
    });

    it('StrictMode 下 group 每次点击只触发一次 onChange', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(<StrictMode>{createRadioGroup({ onChange })}</StrictMode>);
        await userEvent.click(getRadio('B'));
        await userEvent.click(getRadio('C'));
        expect(onChange.mock.calls.map(([e]) => e.target.value)).toEqual(['B', 'C']);
        expect(getRadio('C')).toBeChecked();
    });

    it('group 读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { RadioGroup: { type: 'button', buttonSize: 'small' } };
        try {
            const { container } = render(createRadioGroup());
            expect(container.querySelectorAll(`.${prefixCls}-addon-buttonRadio-small`)).toHaveLength(3);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('group 的 ref 指向根 div，未声明的属性透传到根 div', async () => {
        const ref = createRef<HTMLDivElement>();
        const onClick = vi.fn<() => void>();
        const { container } = render(createRadioGroup({ ref, title: 'tip', onClick }));
        expect(ref.current).toBe(container.firstChild);
        expect(container.firstChild).toHaveAttribute('title', 'tip');
        await userEvent.click(getRadio('A'));
        expect(onClick).toHaveBeenCalled();
    });

    it('Form.RadioGroup 在 blur 时校验，且不把 Form 属性泄漏到 DOM', async () => {
        const validate = vi.fn<() => string>(() => '');
        const { container } = render(
            <Form>
                <Form.RadioGroup field="g" trigger="blur" validator={validate}>
                    <Radio value="A">A</Radio>
                    <Radio value="B">B</Radio>
                </Form.RadioGroup>
            </Form>
        );
        act(() => getRadio('A').focus());
        act(() => getRadio('B').focus());
        expect(validate).not.toHaveBeenCalled();
        act(() => getRadio('B').blur());
        expect(validate).toHaveBeenCalledTimes(1);
        const root = container.querySelector(`.${BASE_CLASS_PREFIX}-radioGroup`);
        expect(root).not.toHaveAttribute('validatestatus');
        expect(root).not.toHaveAttribute('validateStatus');
    });

    it('Form.RadioGroup 把 required 与错误信息放在 radiogroup 上，而非各个 radio 上', async () => {
        let formApi;
        // `required` is not a declared Form.RadioGroup prop; the test checks it still reaches the radiogroup role
        const requiredProp = { required: true };
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.RadioGroup {...requiredProp} field="g" label="Pick" rules={[{ required: true, message: 'pick one' }]}>
                    <Radio value="A">A</Radio>
                    <Radio value="B">B</Radio>
                </Form.RadioGroup>
            </Form>
        );
        const group = screen.getByRole('radiogroup');
        expect(group).toHaveAttribute('aria-required', 'true');
        await act(() => formApi.validate().catch(() => {}));
        await waitFor(() => expect(group).toHaveAttribute('aria-invalid', 'true'));
        expect(group).toHaveAttribute('aria-errormessage');
        screen.getAllByRole('radio').forEach((radio) => {
            ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(radio).not.toHaveAttribute(name));
        });
    });

    it('mode 为 advanced 时允许取消选中', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(
            <RadioGroup defaultValue="A" mode="advanced" onChange={onChange}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );

        const radioA = screen.getByRole('radio', { name: 'A' });
        expect(radioA).toBeChecked();
        await userEvent.click(radioA);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBeUndefined();
        expect(radioA).not.toBeChecked();
    });

    it('options 的 value 可以是 boolean', () => {
        expectTypeOf<{ label: string; value: true }>().toExtend<OptionItem>();
    });
});
