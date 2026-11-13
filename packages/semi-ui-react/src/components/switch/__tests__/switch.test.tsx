import { StrictMode, useState } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { Form, FormSwitch } from '@fibrae/semi-ui-react/form';
import Tooltip from '@fibrae/semi-ui-react/tooltip';
import { semiGlobal } from '@fibrae/semi-ui-react/utils';
import Switch from '../index';

type SwitchChange = (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-switch`;
const CHECKED_CLS = `${prefixCls}-checked`;

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

    it('switch 的 onMouseEnter / onMouseLeave', () => {
        const onMouseEnter = vi.fn<React.MouseEventHandler>();
        const onMouseLeave = vi.fn<React.MouseEventHandler>();
        render(<Switch defaultChecked onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseEnter(getWrapper());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        fireEvent.mouseLeave(getWrapper());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
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

    it('switch 使用自定义 ReactNode 类型的 checkedText 和 uncheckedText', () => {
        render(<Switch checked checkedText={<span className="custom-checked">ON</span>} uncheckedText={<span className="custom-unchecked">OFF</span>} />);
        expect(query('custom-checked')).toHaveTextContent('ON');
        expect(query('custom-unchecked')).toBeNull();
    });

    it('switch 的 aria-labelledby', () => {
        render(<Switch aria-labelledby="switch-label" />);
        expect(getSwitch()).toHaveAttribute('aria-labelledby', 'switch-label');
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

    it('switch 非 loading 时显示滑块', () => {
        render(<Switch />);
        expect(query(`${prefixCls}-knob`)).not.toBeNull();
        expect(query(`${prefixCls}-loading-spin`)).toBeNull();
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

    it('formApi.reset 后 FormSwitch 再次取消选中', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <FormSwitch field="on" />
            </Form>
        );
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
        expect(formApi.getValue('on')).toBe(true);
        await act(() => formApi.reset());
        expect(getSwitch()).not.toBeChecked();
    });

    it('FormSwitch 在 blur 时校验，且不把 Form 属性泄漏到 DOM', async () => {
        const validate = vi.fn<() => string>(() => '');
        render(
            <Form>
                <FormSwitch field="on" trigger="blur" validator={validate} />
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

    it('FormSwitch 必填时 aria-required 落在 role="switch" 的 input 上', () => {
        render(
            <Form>
                <FormSwitch field="s" rules={[{ required: true }]} />
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
