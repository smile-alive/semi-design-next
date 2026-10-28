import React, { createRef, StrictMode, useLayoutEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form, Tooltip } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { RadioWithGroup as Radio, type RadioChangeEvent, type RadioHandle } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-radio`;

describe('radio', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('radio 基础功能正常', () => {
        render(<Radio />);
        const radioDOM = screen.getByRole('radio');

        expect(radioDOM).not.toBeChecked();
        expect(radioDOM).not.toBeDisabled();
    });

    it('radio 默认选中', () => {
        render(<Radio checked />);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('radio 默认禁用', () => {
        render(<Radio disabled />);
        expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('radio onChange', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const onChange2 = vi.fn<(e: RadioChangeEvent) => void>();
        render(<Radio aria-label="plain" onChange={onChange} />);
        render(<Radio aria-label="advanced" mode="advanced" onChange={onChange2} />);

        await userEvent.click(screen.getByRole('radio', { name: 'plain' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);

        await userEvent.click(screen.getByRole('radio', { name: 'advanced' }));
        expect(onChange2).toHaveBeenCalledTimes(1);
        expect(onChange2.mock.calls[0][0].target.checked).toBe(true);
    });

    it('radio 高级模式', async () => {
        // a click on the checked radio unchecks it, which a native radio never does by itself
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const { container } = render(
            <Radio mode="advanced" onChange={onChange}>
                允许取消选择
            </Radio>
        );
        const input = screen.getByRole('radio');
        const label = container.querySelector(`.${prefixCls}`);

        await userEvent.click(input);
        expect(input).toBeChecked();
        expect(label).toHaveClass(`${prefixCls}-checked`);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);

        await userEvent.click(input);
        expect(input).not.toBeChecked();
        expect(label).not.toHaveClass(`${prefixCls}-checked`);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].target.checked).toBe(false);
    });

    it('radio 高级模式下按 Space 取消选中', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        render(<Radio defaultChecked mode="advanced" onChange={onChange} />);
        const input = screen.getByRole('radio');
        input.focus();
        await userEvent.keyboard(' ');
        expect(input).not.toBeChecked();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
    });

    it('radio button 样式', () => {
        const { container } = render(<Radio type="button" />);
        expect(container.querySelector(`.${prefixCls}-buttonRadioComponent`)).not.toBeNull();
    });

    it('radio card 样式', () => {
        const { container } = render(<Radio type="card">Card Radio</Radio>);
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
    });

    it('radio pureCard 样式', () => {
        const { container } = render(<Radio type="pureCard">Pure Card Radio</Radio>);
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-inner-pureCardRadio`)).not.toBeNull();
    });

    it('radio onMouseEnter 与 onMouseLeave', async () => {
        const onMouseEnter = vi.fn<(e: React.MouseEvent<HTMLLabelElement>) => void>();
        const onMouseLeave = vi.fn<(e: React.MouseEvent<HTMLLabelElement>) => void>();
        const { container } = render(
            <Radio onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                Test
            </Radio>
        );
        const label = container.querySelector('label');
        await userEvent.hover(label);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        await userEvent.unhover(label);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('radio extra 属性', () => {
        const extraText = 'Extra information';
        const { container } = render(<Radio extra={extraText}>Radio with extra</Radio>);
        const extra = container.querySelector(`.${prefixCls}-extra`);
        expect(extra).toHaveTextContent(/^Extra information$/);
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', extra.id);
    });

    it('radio displayMode 为 vertical', () => {
        const { container } = render(<Radio displayMode="vertical">Vertical Radio</Radio>);
        expect(container.querySelector(`.${prefixCls}-vertical`)).not.toBeNull();
    });

    it('radio 受控模式', () => {
        const { rerender } = render(<Radio checked>Controlled Radio</Radio>);
        expect(screen.getByRole('radio')).toBeChecked();

        rerender(<Radio checked={false}>Controlled Radio</Radio>);
        expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('radio 使用 value 属性', () => {
        render(<Radio value="test-value">Radio with value</Radio>);
        expect(screen.getByRole('radio')).toHaveAttribute('value', 'test-value');
    });

    it('radio aria-label', () => {
        render(<Radio aria-label="Test radio">Radio</Radio>);
        expect(screen.getByRole('radio')).toHaveAttribute('aria-label', 'Test radio');
    });

    it('radio 的 focus 与 blur 方法', () => {
        const ref = createRef<RadioHandle>();
        render(<Radio ref={ref}>Test Radio</Radio>);
        const input = screen.getByRole('radio');
        ref.current.focus();
        expect(input).toHaveFocus();
        ref.current.blur();
        expect(input).not.toHaveFocus();
    });

    it('radio 受控模式下值为 undefined', () => {
        const { container, rerender } = render(<Radio checked>Controlled Radio</Radio>);
        expect(screen.getByRole('radio')).toBeChecked();

        rerender(<Radio checked={undefined}>Controlled Radio</Radio>);
        expect(screen.getByRole('radio')).not.toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-checked`);
    });

    it('服务端渲染的 HTML 包含 addon 与 extra 的 id', () => {
        const container = document.createElement('div');
        container.innerHTML = renderToString(<Radio extra="more">label</Radio>);
        const input = container.querySelector('input');
        const addonId = container.querySelector(`.${prefixCls}-addon`).id;
        expect(addonId).not.toBe('');
        expect(input.getAttribute('aria-labelledby')).toBe(addonId);
        expect(input.getAttribute('aria-describedby')).toBe(container.querySelector(`.${prefixCls}-extra`).id);
    });

    it('受控 checked 变化时，首次提交的 DOM 就已是新值', () => {
        const commits: boolean[] = [];
        const Spy = () => {
            useLayoutEffect(() => {
                commits.push(screen.getByRole<HTMLInputElement>('radio').checked);
            });
            return null;
        };
        const App = ({ checked }: { checked: boolean }) => (
            <>
                <Radio checked={checked}>A</Radio>
                <Spy />
            </>
        );
        const { rerender } = render(<App checked={false} />);
        commits.length = 0;
        rerender(<App checked />);
        expect(commits[0]).toBe(true);
    });

    it('radioInner 的 blur 与 focus 方法', () => {
        const ref = createRef<RadioHandle>();
        render(
            <Radio ref={ref} mode="advanced">
                Test Radio
            </Radio>
        );
        const input = screen.getByRole('radio');
        ref.current.focus();
        expect(input).toHaveFocus();
        ref.current.blur();
        expect(input).not.toHaveFocus();
    });

    it('radioInner 设置 preventScroll', () => {
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const ref = createRef<RadioHandle>();
        render(
            <Radio ref={ref} preventScroll>
                Test Radio
            </Radio>
        );
        ref.current.focus();
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(screen.getByRole('radio')).toHaveFocus();
    });

    it('radio 非受控：defaultChecked，点击后选中并保持选中', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const { container, unmount } = render(<Radio defaultChecked>A</Radio>);
        expect(screen.getByRole('radio')).toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-checked`);
        unmount();

        const { container: c2 } = render(<Radio onChange={onChange}>B</Radio>);
        await userEvent.click(screen.getByRole('radio'));
        expect(screen.getByRole('radio')).toBeChecked();
        expect(c2.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-checked`);
        expect(c2.querySelector(`.${prefixCls}-inner-checked`)).not.toBeNull();
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('radio 受控：点击上报选中，但最终由属性决定', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const { container } = render(
            <Radio checked={false} onChange={onChange}>
                A
            </Radio>
        );
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
        expect(screen.getByRole('radio')).not.toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-checked`);
    });

    it('radio onChange 事件对象', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const parentChange = vi.fn<() => void>();
        render(
            <div onChange={parentChange}>
                <Radio
                    name="n1"
                    value="v1"
                    onChange={(e) => {
                        onChange(e);
                        e.stopPropagation();
                    }}
                >
                    A
                </Radio>
            </div>
        );
        await userEvent.click(screen.getByRole('radio'));
        const e = onChange.mock.calls[0][0];
        expect(e.target.checked).toBe(true);
        expect(e.target.value).toBe('v1');
        expect(e.target.name).toBe('n1');
        expect(typeof e.preventDefault).toBe('function');
        // stopPropagation is forwarded to the React change event
        expect(parentChange).not.toHaveBeenCalled();
    });

    it('radio 禁用时不改变状态', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const { container } = render(
            <Radio disabled onChange={onChange}>
                A
            </Radio>
        );
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('radio')).not.toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-disabled`);
    });

    it('radio 的 name 与 autoFocus 作用于 input', () => {
        const { unmount } = render(<Radio>A</Radio>);
        expect(screen.getByRole('radio')).not.toHaveAttribute('name');
        unmount();
        render(
            <Radio name="n" autoFocus>
                A
            </Radio>
        );
        expect(screen.getByRole('radio')).toHaveAttribute('name', 'n');
        expect(screen.getByRole('radio')).toHaveFocus();
    });

    it('radio 的 aria-labelledby 与 aria-describedby 指向 addon 与 extra', () => {
        const { container, unmount } = render(<Radio extra="more">A</Radio>);
        const addon = container.querySelector(`.${prefixCls}-addon`);
        expect(addon.id).toBeTruthy();
        expect(screen.getByRole('radio')).toHaveAttribute('aria-labelledby', addon.id);
        expect(screen.getByRole('radio', { name: 'A' })).toHaveAccessibleDescription('more');
        unmount();

        render(
            <Radio addonId="my-addon" extraId="my-extra" extra="more">
                A
            </Radio>
        );
        expect(screen.getByRole('radio')).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'my-extra');
        expect(document.getElementById('my-addon')).toHaveTextContent('A');
    });

    it('没有 children 或 extra 时，radio 不包含 addon、extra 或 aria 引用', () => {
        const { container } = render(<Radio />);
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(screen.getByRole('radio')).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('radio')).not.toHaveAttribute('aria-describedby');
    });

    it('button 类型下隐藏 addon 属性与 extra', () => {
        const { container } = render(
            <Radio type="button" addonClassName="ac" addonStyle={{ color: 'red' }} extra="more">
                A
            </Radio>
        );
        const addon = container.querySelector(`.${prefixCls}-addon-buttonRadio`);
        expect(addon).toHaveClass('ac');
        expect(addon).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.querySelector(`.${prefixCls}-extra`)).toBeNull();
    });

    // hover styles are CSS :hover, asserted in radio.browser.test.tsx
    it('radio button 类型的选中类名', async () => {
        const { container } = render(<Radio type="button">A</Radio>);
        const addon = container.querySelector(`.${prefixCls}-addon-buttonRadio`);
        await userEvent.click(screen.getByRole('radio'));
        expect(addon).toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
    });

    it('radio card 类型的选中类名', async () => {
        const { container } = render(<Radio type="card">A</Radio>);
        const label = container.querySelector('label');
        await userEvent.click(screen.getByRole('radio'));
        expect(label).toHaveClass(`${prefixCls}-cardRadioGroup_checked`);
        expect(container.querySelector(`.${prefixCls}-isCardRadioGroup_content`)).not.toBeNull();
    });

    it('radio 的 className、style、prefixCls 与 data-* 作用于根 label', () => {
        const { container } = render(
            <Radio className="c" style={{ color: 'red' }} data-test="x" prefixCls="my-radio">
                A
            </Radio>
        );
        const label = container.querySelector('label');
        expect(label).toHaveClass('c', 'my-radio');
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(label).toHaveAttribute('data-test', 'x');
        expect(container.querySelector('.my-radio-inner')).not.toBeNull();
    });

    it('radio 读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { type: 'button' } };
        try {
            const { container, unmount } = render(<Radio>A</Radio>);
            expect(container.querySelector(`.${prefixCls}-buttonRadioComponent`)).not.toBeNull();
            unmount();
            const { container: c2 } = render(<Radio type="card">A</Radio>);
            expect(c2.querySelector(`.${prefixCls}-buttonRadioComponent`)).toBeNull();
            expect(c2.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下 radio 每次点击只变化一次', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const { container } = render(
            <StrictMode>
                <Radio onChange={onChange}>A</Radio>
            </StrictMode>
        );
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('radio')).toBeChecked();
        expect(container.querySelector(`.${prefixCls}-addon`).id).toBeTruthy();
    });

    it('Form.Radio 在 formApi.reset 后取消选中，并跟随 setValue', async () => {
        let formApi;
        const { unmount } = render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Radio field="agree">Agree</Form.Radio>
            </Form>
        );
        await userEvent.click(screen.getByRole('radio'));
        expect(screen.getByRole('radio')).toBeChecked();
        expect(formApi.getValue('agree')).toBe(true);
        await act(() => formApi.reset());
        expect(screen.getByRole('radio')).not.toBeChecked();
        unmount();

        render(
            <Form getFormApi={(api) => (formApi = api)} initValues={{ agree: true }}>
                <Form.Radio field="agree">Agree</Form.Radio>
            </Form>
        );
        expect(screen.getByRole('radio')).toBeChecked();
        await act(() => formApi.setValue('agree', undefined));
        expect(screen.getByRole('radio')).not.toBeChecked();
        await act(() => formApi.setValue('agree', true));
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('radio 的 ref 是带 focus 与 blur 的句柄', () => {
        const ref = createRef<RadioHandle>();
        render(<Radio ref={ref}>A</Radio>);
        expect(Object.keys(ref.current).sort()).toEqual(['blur', 'focus']);
    });

    it('radio 把未声明的属性透传到根 label', async () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(
            <Radio title="tip" onClick={onClick}>
                A
            </Radio>
        );
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('title', 'tip');
        await userEvent.click(label);
        expect(onClick).toHaveBeenCalled();
    });

    it('radio 位于 Tooltip 中时，tabIndex 与 aria-describedby 作用于 input 而非 label', () => {
        const { container } = render(
            <Tooltip content="tip" trigger="custom" visible>
                <Radio>A</Radio>
            </Tooltip>
        );
        const label = container.querySelector('label');
        expect(label).not.toHaveAttribute('tabindex');
        expect(label).not.toHaveAttribute('aria-describedby');
        expect(screen.getByRole('radio')).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('radio')).toHaveAccessibleDescription('tip');
    });

    it('带 field 的 Form.Radio 用错误信息描述 input，并且不把不支持的 aria 与 Form 属性放到 DOM 上', async () => {
        // `required` is not a declared Form.Radio prop; it is passed on purpose to check it stays off the DOM
        const requiredProp = { required: true };
        render(
            <Form>
                <Form.Radio {...requiredProp} field="agree" rules={[{ validator: () => false, message: 'must be off' }]}>
                    Agree
                </Form.Radio>
            </Form>
        );
        await userEvent.click(screen.getByRole('radio'));
        const input = screen.getByRole('radio');
        // the radio role supports none of these, so the error is only part of the description
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(input).not.toHaveAttribute(name));
        await waitFor(() => expect(input).toHaveAccessibleDescription('must be off'));
        const label = input.closest('label');
        expect(label).not.toHaveAttribute('validatestatus');
        expect(label).not.toHaveAttribute('aria-invalid');
    });

    it('带 field 的 Form.Radio 在 blur 时校验', () => {
        const validate = vi.fn<() => string>(() => '');
        render(
            <Form>
                <Form.Radio field="agree" trigger="blur" validator={validate}>
                    Agree
                </Form.Radio>
            </Form>
        );
        act(() => screen.getByRole('radio').focus());
        act(() => screen.getByRole('radio').blur());
        expect(validate).toHaveBeenCalled();
    });

    // Form.Radio without a field prop renders a plain Radio, which must keep the ref Tooltip relies on
    it('fix #384: 不带 field 的 Form.Radio 转发 ref', () => {
        const ref = createRef<RadioHandle>();
        render(
            <Form>
                <Tooltip content="hi bytedance" trigger="custom" visible>
                    <Form.Radio>Semi</Form.Radio>
                </Tooltip>
                <Form.Radio ref={ref}>Design</Form.Radio>
            </Form>
        );
        expect(screen.getByText('hi bytedance')).toBeInTheDocument();
        ref.current.focus();
        expect(screen.getByRole('radio', { name: 'Design' })).toHaveFocus();
    });
});

describe('radio 审计修复', () => {
    it('有 extra 时调用方的 aria-describedby 与 extra 都在描述中', () => {
        render(
            <Radio aria-describedby="outer" extraId="ex" extra="more">
                A
            </Radio>
        );
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'outer ex');
    });

    it('checked={false} 与 defaultChecked 同时存在时，state 初值取受控值', () => {
        const { rerender } = render(
            <Radio checked={false} defaultChecked>
                A
            </Radio>
        );
        expect(screen.getByRole('radio')).not.toBeChecked();
        // a non-boolean checked is ignored, so the radio shows its state
        rerender(
            <Radio checked={null as unknown as boolean} defaultChecked>
                A
            </Radio>
        );
        expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('Form.Radio 的 helpText 与 extra 同时出现在描述中', () => {
        render(
            <Form>
                <Form.Radio field="agree" helpText="help" extra="more">
                    accept
                </Form.Radio>
            </Form>
        );
        const input = screen.getByRole('radio');
        expect(input).toHaveAccessibleDescription(expect.stringContaining('help'));
        expect(input).toHaveAccessibleDescription(expect.stringContaining('more'));
    });

    it('数字 0 作为 children 或 extra 时照常渲染并参与命名', () => {
        render(<Radio extra={0}>{0}</Radio>);
        expect(screen.getByRole('radio', { name: '0' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('0');
        expect(screen.getByRole('radio')).toHaveAccessibleDescription('0');
    });

    it('按钮式 Radio 不渲染 extra，也不在 aria-describedby 中引用它', () => {
        render(
            <Radio type="button" extra="more">
                a
            </Radio>
        );
        expect(document.querySelector(`.${prefixCls}-extra`)).toBeNull();
        expect(screen.getByRole('radio')).not.toHaveAttribute('aria-describedby');
    });

    it('组外同名的非受控 Radio 互斥，先选中的那个取消选中状态与类名', async () => {
        const onChange = vi.fn<(e: RadioChangeEvent) => void>();
        const { container } = render(
            <>
                <Radio name="x" value="a" onChange={onChange}>
                    A
                </Radio>
                <Radio name="x" value="b">
                    B
                </Radio>
                <Radio name="y" value="c">
                    C
                </Radio>
            </>
        );
        const [a, b, c] = Array.from(container.querySelectorAll(`.${prefixCls}`));
        await userEvent.click(screen.getByRole('radio', { name: 'A' }));
        await userEvent.click(screen.getByRole('radio', { name: 'C' }));
        await userEvent.click(screen.getByRole('radio', { name: 'B' }));
        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'C' })).toBeChecked();
        expect(a).not.toHaveClass(`${prefixCls}-checked`);
        expect(b).toHaveClass(`${prefixCls}-checked`);
        expect(c).toHaveClass(`${prefixCls}-checked`);
        // the native uncheck of the previous radio reports no change
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('Radio 根元素上使用方的 onClick，点击文字时只调用一次', async () => {
        const onClick = vi.fn<() => void>();
        render(<Radio onClick={onClick}>label</Radio>);
        await userEvent.click(screen.getByText('label'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('原生 input 带 value，id 落在 input 上，外部 label 的 for 可以指向它', async () => {
        render(
            <form data-testid="form">
                <label htmlFor="r-id">outer label</label>
                <Radio id="r-id" name="fruit" value="apple">
                    apple
                </Radio>
            </form>
        );
        const input = screen.getByRole('radio');
        expect(input).toHaveAttribute('value', 'apple');
        expect(input).toHaveAttribute('id', 'r-id');
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveAttribute('id');
        await userEvent.click(screen.getByText('outer label'));
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('fruit')).toBe('apple');
    });

    it('Form.Radio 的标签与 addon 都在可访问名称中', () => {
        render(
            <Form>
                <Form.Radio field="agree" label="Terms">
                    accept
                </Form.Radio>
            </Form>
        );
        const input = screen.getByRole('radio');
        const ids = input.getAttribute('aria-labelledby').split(' ');
        expect(ids).toHaveLength(2);
        expect(document.getElementById(ids[0])).toHaveTextContent('Terms');
        expect(document.getElementById(ids[1])).toHaveTextContent('accept');
    });
});
