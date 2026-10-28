import { StrictMode, useState } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { Form } from '@fibrae/semi-ui-react/form';
import Tooltip from '@fibrae/semi-ui-react/tooltip';
import Switch from '../index';

type SwitchChange = (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-switch`;
const CHECKED_CLS = `${prefixCls}-checked`;
const DISABLED_CLS = `${prefixCls}-disabled`;

const getSwitch = () => screen.getByRole('switch');
const getWrapper = () => document.querySelector(`.${prefixCls}`);
const query = (cls) => document.querySelector(`.${cls}`);

describe('Switch', () => {
    it('switch 带自定义 className 和 style', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(<Switch className="test" style={{ color: 'red' }} onChange={onChange} />);
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
    });

    it('switch 的 checkedText / unchekcedText', () => {
        render(
            <>
                <Switch checked checkedText="semi" uncheckedText="design" />
                <Switch checkedText="semi" uncheckedText="design" />
            </>
        );
        expect(query(`${prefixCls}-checked-text`)).toHaveTextContent(/^semi$/);
        expect(query(`${prefixCls}-unchecked-text`)).toHaveTextContent(/^design$/);
    });

    it('props.disabled 时 switch 禁用', () => {
        const { rerender, unmount } = render(<Switch disabled />);
        expect(getWrapper()).toHaveClass(DISABLED_CLS);
        expect(getSwitch()).toBeDisabled();
        rerender(<Switch disabled={false} />);
        expect(getWrapper()).not.toHaveClass(DISABLED_CLS);
        expect(getSwitch()).toBeEnabled();
        unmount();

        const { rerender: rerenderChecked } = render(<Switch defaultChecked disabled />);
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
        expect(getWrapper()).toHaveClass(DISABLED_CLS);
        expect(getSwitch()).toBeDisabled();
        rerenderChecked(<Switch defaultChecked disabled={false} />);
        expect(getWrapper()).not.toHaveClass(DISABLED_CLS);
        expect(getSwitch()).toBeEnabled();
    });

    it('switch 的 onChange', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(<Switch onChange={onChange} />);
        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(true);
    });

    it('switch 的 onMouseEnter / onMouseLeave', () => {
        const onMouseEnter = vi.fn<React.MouseEventHandler>();
        const onMouseLeave = vi.fn<React.MouseEventHandler>();
        render(<Switch defaultChecked onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseEnter(getWrapper());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        fireEvent.mouseLeave(getWrapper());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('switch 的 size', () => {
        const { container } = render(
            <>
                <Switch className="large" size="large" />
                <Switch className="default" size="default" />
                <Switch className="small" size="small" />
            </>
        );
        const small = container.querySelector('.small');
        const def = container.querySelector('.default');
        const large = container.querySelector('.large');
        expect(small).toHaveClass(`${prefixCls}-small`);
        expect(def).not.toHaveClass(`${prefixCls}-small`);
        expect(def).not.toHaveClass(`${prefixCls}-large`);
        expect(large).toHaveClass(`${prefixCls}-large`);
    });

    it('switch 受控模式', async () => {
        const onChange = vi.fn<(checked: boolean) => void>();
        function Controlled() {
            const [checked, setChecked] = useState(false);
            return (
                <Switch
                    checked={checked}
                    onChange={(val) => {
                        onChange(val);
                        setChecked(val);
                    }}
                />
            );
        }
        render(<Controlled />);
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);

        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
        expect(getSwitch()).toBeChecked();
    });

    it('switch 带 loading', () => {
        const { unmount } = render(<Switch loading />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
        unmount();
        render(<Switch />);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-loading`);
    });

    it('switch loading 状态', () => {
        render(<Switch loading />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
    });

    it('switch 的 aria-label', () => {
        render(<Switch aria-label="Toggle switch" />);
        expect(screen.getByRole('switch', { name: 'Toggle switch' })).toHaveAttribute('aria-label', 'Toggle switch');
    });

    it('switch 的 defaultChecked', async () => {
        render(<Switch defaultChecked />);
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
        expect(getSwitch()).toBeChecked();
        await userEvent.click(getSwitch());
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);
    });

    it('switch 的 id 属性', () => {
        render(<Switch id="my-switch" />);
        expect(getSwitch()).toHaveAttribute('id', 'my-switch');
    });

    it('switch 使用自定义 ReactNode 类型的 checkedText 和 uncheckedText', () => {
        render(<Switch checked checkedText={<span className="custom-checked">ON</span>} uncheckedText={<span className="custom-unchecked">OFF</span>} />);
        expect(query('custom-checked')).toHaveTextContent('ON');
        expect(query('custom-unchecked')).toBeNull();
    });

    it('switch 的 aria-labelledby', () => {
        render(<Switch aria-labelledby="switch-label" />);
        expect(getSwitch()).toHaveAttribute('aria-labelledby', 'switch-label');
    });

    it('switch 的 aria-describedby', () => {
        render(<Switch aria-describedby="switch-description" />);
        expect(getSwitch()).toHaveAttribute('aria-describedby', 'switch-description');
    });

    it('switch 的 aria-invalid', () => {
        render(<Switch aria-invalid />);
        expect(getSwitch()).toHaveAttribute('aria-invalid', 'true');
    });

    it('switch 的 aria-errormessage', () => {
        render(<Switch aria-errormessage="error-msg" />);
        expect(getSwitch()).toHaveAttribute('aria-errormessage', 'error-msg');
    });

    it('其余 aria-* 也交给原生控件，不落在根元素上', () => {
        render(<Switch aria-controls="panel" aria-keyshortcuts="Alt+S" />);
        expect(getSwitch()).toHaveAttribute('aria-controls', 'panel');
        expect(getSwitch()).toHaveAttribute('aria-keyshortcuts', 'Alt+S');
        expect(getWrapper()).not.toHaveAttribute('aria-controls');
        expect(getWrapper()).not.toHaveAttribute('aria-keyshortcuts');
    });

    it('switch 的 aria-checked 反映状态', async () => {
        render(<Switch defaultChecked />);
        // a duplicate aria-checked could contradict the native checked state
        expect(getSwitch()).toBeChecked();
        expect(getSwitch()).not.toHaveAttribute('aria-checked');
        await userEvent.click(getSwitch());
        expect(getSwitch()).not.toBeChecked();
    });

    it('switch 的 disabled 由原生属性表达', () => {
        render(<Switch disabled />);
        expect(getSwitch()).toBeDisabled();
        expect(getSwitch()).not.toHaveAttribute('aria-disabled');
    });

    it('switch 的 role 为 switch', () => {
        render(<Switch />);
        expect(document.querySelector('input')).toHaveAttribute('role', 'switch');
    });

    it('Tab 进入与离开 switch', async () => {
        render(<Switch />);
        await userEvent.tab();
        expect(getSwitch()).toHaveFocus();
        await userEvent.tab();
        expect(getSwitch()).not.toHaveFocus();
    });

    it('switch loading 时阻止切换', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(<Switch loading onChange={onChange} />);
        // a disabled input would drop focus when loading starts mid-interaction
        expect(getSwitch()).not.toBeDisabled();
        expect(getSwitch()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getSwitch());
        expect(onChange).not.toHaveBeenCalled();
        expect(getSwitch()).not.toBeChecked();
    });

    it('switch small 尺寸不显示 checkedText', () => {
        render(<Switch checked checkedText="ON" size="small" />);
        expect(query(`${prefixCls}-checked-text`)).toBeNull();
        expect(screen.queryByText('ON')).toBeNull();
    });

    it('switch small 尺寸不显示 uncheckedText', () => {
        render(<Switch size="small" uncheckedText="OFF" />);
        expect(query(`${prefixCls}-unchecked-text`)).toBeNull();
        expect(screen.queryByText('OFF')).toBeNull();
    });

    it('switch large 尺寸显示 checkedText', () => {
        render(<Switch checked checkedText="ON" size="large" />);
        expect(query(`${prefixCls}-checked-text`)).toHaveTextContent(/^ON$/);
    });

    it('switch 默认尺寸显示 checkedText', () => {
        render(<Switch checked checkedText="ON" size="default" />);
        expect(query(`${prefixCls}-checked-text`)).toHaveTextContent(/^ON$/);
    });

    it('switch 未选中时不显示 checkedText', () => {
        render(<Switch checkedText="ON" uncheckedText="OFF" />);
        expect(query(`${prefixCls}-checked-text`)).toBeNull();
        expect(query(`${prefixCls}-unchecked-text`)).toHaveTextContent(/^OFF$/);
    });

    it('switch 选中时不显示 uncheckedText', () => {
        render(<Switch checked checkedText="ON" uncheckedText="OFF" />);
        expect(query(`${prefixCls}-checked-text`)).toHaveTextContent(/^ON$/);
        expect(query(`${prefixCls}-unchecked-text`)).toBeNull();
    });

    it('switch loading 时显示 Spin 组件', () => {
        render(<Switch loading />);
        expect(query(`${prefixCls}-loading-spin`)).not.toBeNull();
        expect(query(`${prefixCls}-knob`)).toBeNull();
    });

    it('switch 非 loading 时显示滑块', () => {
        render(<Switch />);
        expect(query(`${prefixCls}-knob`)).not.toBeNull();
        expect(query(`${prefixCls}-loading-spin`)).toBeNull();
    });

    it('switch 的 componentDidMount 初始化 foundation', () => {
        render(<Switch disabled />);
        expect(getWrapper()).not.toBeNull();
        expect(getWrapper()).toHaveClass(DISABLED_CLS);
        expect(getSwitch()).toBeDisabled();
    });

    it('switch 的 componentWillUnmount 销毁 foundation', () => {
        const { unmount } = render(<Switch />);
        expect(() => unmount()).not.toThrow();
        expect(getWrapper()).toBeNull();
    });

    it('switch 的 checked 属性更新状态', () => {
        const { rerender } = render(<Switch checked={false} />);
        expect(getSwitch()).not.toBeChecked();
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);

        rerender(<Switch checked />);
        expect(getSwitch()).toBeChecked();
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
    });

    it('switch 输入框类型为 checkbox', () => {
        render(<Switch />);
        expect(getSwitch()).toHaveAttribute('type', 'checkbox');
    });

    it('switch 输入框的 className 正确', () => {
        render(<Switch />);
        expect(getSwitch()).toHaveClass(`${prefixCls}-native-control`);
    });

    it('switch 不同尺寸下的 loading', () => {
        const { unmount } = render(<Switch loading size="small" />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-small`);
        unmount();

        render(<Switch loading size="large" />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-large`);
    });

    it('switch 同时 disabled 和 loading', () => {
        render(<Switch disabled loading />);
        expect(getWrapper()).toHaveClass(DISABLED_CLS);
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
        expect(getSwitch()).toBeDisabled();
    });

    it('switch defaultChecked 且 disabled', () => {
        render(<Switch defaultChecked disabled />);
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
        expect(getWrapper()).toHaveClass(DISABLED_CLS);
    });

    it('switch 的 onChange 接收事件对象', async () => {
        const onChange = vi.fn<SwitchChange>((_checked, e) => e.persist());
        render(<Switch onChange={onChange} />);

        await userEvent.click(getSwitch());

        expect(onChange).toHaveBeenCalledTimes(1);
        const [checked, e] = onChange.mock.calls[0];
        expect(checked).toBe(true);
        expect(e.type).toBe('change');
        expect(e.target).toBe(getSwitch());
    });

    it('switch 多次调用 onChange', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(<Switch onChange={onChange} />);

        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());

        expect(onChange).toHaveBeenCalledTimes(3);
        expect(onChange.mock.calls.map(([checked]) => checked)).toEqual([true, false, true]);
    });

    it('switch 没有 onChange 属性', async () => {
        render(<Switch />);
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
    });

    it('switch 的 checked 属性变回 undefined 时取消选中', () => {
        const { rerender } = render(<Switch checked />);
        expect(getSwitch()).toBeChecked();
        rerender(<Switch checked={undefined} />);
        expect(getSwitch()).not.toBeChecked();
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);
    });

    it('formApi.reset 后 Form.Switch 再次取消选中', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Switch field="on" />
            </Form>
        );
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
        expect(formApi.getValue('on')).toBe(true);
        await act(() => formApi.reset());
        expect(getSwitch()).not.toBeChecked();
    });

    it('Form.Switch 在 blur 时校验，且不把 Form 属性泄漏到 DOM', async () => {
        const validate = vi.fn<() => string>(() => '');
        render(
            <Form>
                <Form.Switch field="on" trigger="blur" validator={validate} />
            </Form>
        );
        act(() => getSwitch().focus());
        act(() => getSwitch().blur());
        expect(validate).toHaveBeenCalled();
        expect(getWrapper()).not.toHaveAttribute('validatestatus');
        expect(getWrapper()).not.toHaveAttribute('validateStatus');
    });

    it('switch 把未知属性传给根元素，焦点相关属性传给原生控件', async () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        // not declared in SwitchProps, but forwarded to the root
        const rootAttrs = { title: 'tip', onClick };
        render(<Switch name="on" data-x="1" tabIndex={-1} {...rootAttrs} />);
        expect(getWrapper()).toHaveAttribute('title', 'tip');
        expect(getWrapper()).toHaveAttribute('data-x', '1');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        expect(getWrapper()).not.toHaveAttribute('name');
        expect(getSwitch()).toHaveAttribute('name', 'on');
        expect(getSwitch()).toHaveAttribute('tabindex', '-1');
        await userEvent.click(getSwitch());
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Tooltip 内的 switch 是一个 Tab 停靠点，由 tooltip 描述', async () => {
        render(
            <Tooltip content="tip">
                <Switch aria-label="dark mode" />
            </Tooltip>
        );
        await userEvent.tab();
        expect(getSwitch()).toHaveFocus();
        await waitFor(() => expect(getSwitch()).toHaveAccessibleDescription('tip'));
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('switch 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Switch: { size: 'large', defaultChecked: true } };
        try {
            const { unmount } = render(<Switch />);
            expect(getWrapper()).toHaveClass(`${prefixCls}-large`);
            expect(getSwitch()).toBeChecked();
            unmount();
            render(<Switch size="small" />);
            expect(getWrapper()).toHaveClass(`${prefixCls}-small`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('switch 在 StrictMode 下每次点击只切换一次', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(
            <StrictMode>
                <Switch disabled={false} onChange={onChange} />
            </StrictMode>
        );
        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());
        expect(onChange.mock.calls.map(([checked]) => checked)).toEqual([true, false]);
        expect(getSwitch()).not.toBeChecked();
    });

    it('Form.Switch 必填时 aria-required 落在 role="switch" 的 input 上', () => {
        render(
            <Form>
                <Form.Switch field="s" rules={[{ required: true }]} />
            </Form>
        );
        expect(getSwitch()).toHaveAttribute('aria-required', 'true');
        expect(getWrapper()).not.toHaveAttribute('aria-required');
    });

    it('autoFocus 聚焦原生 switch，不落到外层 div', () => {
        render(<Switch autoFocus />);
        expect(getSwitch()).toHaveFocus();
        expect(getWrapper()).not.toHaveAttribute('autofocus');
    });
});
