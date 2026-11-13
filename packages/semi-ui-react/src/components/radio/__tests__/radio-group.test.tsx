import { createRef, StrictMode } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { Form, FormRadioGroup, Popover } from '@fibrae/semi-ui-react';
import { semiGlobal } from '@fibrae/semi-ui-react/utils';
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

    const getRadio = (name) => screen.getByRole('radio', { name });

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

    it('禁用 group', () => {
        render(createRadioGroup({ disabled: true }));
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
        radios.forEach((input) => {
            expect(input).toBeDisabled();
        });
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

    it('组内 Radio 一律用 group 的 name', () => {
        render(
            <RadioGroup name="g">
                <Radio name="own" value="A">
                    A
                </Radio>
                <Radio value="B">B</Radio>
            </RadioGroup>
        );
        expect(getRadio('A')).toHaveAttribute('name', 'g');
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
        await userEvent.click(getRadio('B'));
        expect(getRadio('A')).not.toBeChecked();
        expect(getRadio('B')).toBeChecked();
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

    it('FormRadioGroup 的 reset 清空选中项', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <FormRadioGroup field="g" initValue="A">
                    <Radio value="A">A</Radio>
                    <Radio value="B">B</Radio>
                </FormRadioGroup>
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

    it('FormRadioGroup 在 blur 时校验，且不把 Form 属性泄漏到 DOM', async () => {
        const validate = vi.fn<() => string>(() => '');
        const { container } = render(
            <Form>
                <FormRadioGroup field="g" trigger="blur" validator={validate}>
                    <Radio value="A">A</Radio>
                    <Radio value="B">B</Radio>
                </FormRadioGroup>
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

    it('FormRadioGroup 把 required 与错误信息放在 radiogroup 上，而非各个 radio 上', async () => {
        let formApi;
        // `required` is not a declared FormRadioGroup prop; the test checks it still reaches the radiogroup role
        const requiredProp = { required: true };
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <FormRadioGroup {...requiredProp} field="g" label="Pick" rules={[{ required: true, message: 'pick one' }]}>
                    <Radio value="A">A</Radio>
                    <Radio value="B">B</Radio>
                </FormRadioGroup>
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
