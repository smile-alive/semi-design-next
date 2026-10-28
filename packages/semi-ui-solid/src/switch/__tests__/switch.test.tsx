import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Switch, { type SwitchProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';

type SwitchChange = NonNullable<SwitchProps['onChange']>;

const prefixCls = `${BASE_CLASS_PREFIX}-switch`;
const CHECKED_CLS = `${prefixCls}-checked`;
const DISABLED_CLS = `${prefixCls}-disabled`;

const getSwitch = () => screen.getByRole<HTMLInputElement>('switch');
const getWrapper = () => getSwitch().parentElement as HTMLElement;
const query = (cls: string) => document.querySelector(`.${cls}`);

describe('Switch', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在根元素，点击切换', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch class="test" style={{ color: 'red' }} onChange={onChange} />);
        expect(getWrapper()).toHaveClass('test', prefixCls);
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
    });

    it('ref 落在根元素', () => {
        let ref: HTMLDivElement | undefined;
        render(() => <Switch ref={(node) => (ref = node)} />);
        expect(ref).toBe(getWrapper());
    });

    it('checkedText 与 uncheckedText 随状态切换', async () => {
        render(() => <Switch checkedText={<span>ON</span>} uncheckedText={<span>OFF</span>} />);
        expect(screen.getByText('OFF').parentElement).toHaveAttribute('x-semi-prop', 'uncheckedText');
        expect(screen.getByText('OFF').parentElement).toHaveClass(`${prefixCls}-unchecked-text`);
        expect(screen.queryByText('ON')).toBeNull();
        await userEvent.click(getSwitch());
        expect(screen.getByText('ON').parentElement).toHaveAttribute('x-semi-prop', 'checkedText');
        expect(screen.getByText('ON').parentElement).toHaveClass(`${prefixCls}-checked-text`);
        expect(screen.queryByText('OFF')).toBeNull();
    });

    it.each([false, true])('defaultChecked=%s 时 disabled 随 signal 同步到控件和根元素', (defaultChecked) => {
        const [disabled, setDisabled] = createSignal(true);
        render(() => <Switch defaultChecked={defaultChecked} disabled={disabled()} />);
        expect(getWrapper()).toHaveClass(DISABLED_CLS);
        expect(getWrapper().classList.contains(CHECKED_CLS)).toBe(defaultChecked);
        expect(getSwitch()).toBeDisabled();
        expect(getSwitch().checked).toBe(defaultChecked);
        setDisabled(false);
        expect(getWrapper()).not.toHaveClass(DISABLED_CLS);
        expect(getSwitch()).toBeEnabled();
    });

    it('onChange 接收新值与原生 change 事件', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch onChange={onChange} />);
        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledTimes(1);
        const [checked, event] = onChange.mock.calls[0];
        expect(checked).toBe(true);
        expect(event.type).toBe('change');
        expect(event.target).toBe(getSwitch());
    });

    it('连续切换逐次通知', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch onChange={onChange} />);
        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());
        expect(onChange.mock.calls.map(([checked]) => checked)).toEqual([true, false, true]);
        expect(getSwitch()).toBeChecked();
    });

    it('onMouseEnter 与 onMouseLeave 落在根元素', () => {
        const onMouseEnter = vi.fn<(event: MouseEvent) => void>();
        const onMouseLeave = vi.fn<(event: MouseEvent) => void>();
        render(() => <Switch onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseEnter(getWrapper());
        fireEvent.mouseLeave(getWrapper());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        expect(onMouseEnter.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it.each(['small', 'default', 'large'] as const)('size=%s 使用对应类名', (size) => {
        render(() => <Switch size={size} />);
        expect(getWrapper().classList.contains(`${prefixCls}-small`)).toBe(size === 'small');
        expect(getWrapper().classList.contains(`${prefixCls}-large`)).toBe(size === 'large');
    });

    it('受控模式经 onChange 更新', async () => {
        const [checked, setChecked] = createSignal(false);
        const onChange = vi.fn<SwitchChange>((value) => setChecked(value));
        render(() => <Switch checked={checked()} onChange={onChange} />);
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);
        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledWith(true, expect.any(Event));
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
        expect(getSwitch()).toBeChecked();
    });

    it.each([false, true])('单向 checked=%s 只通知并恢复 DOM.checked', async (value) => {
        const [size, setSize] = createSignal<SwitchProps['size']>('default');
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch checked={value} size={size()} onChange={onChange} />);
        await userEvent.click(getSwitch());
        expect(onChange).toHaveBeenCalledWith(!value, expect.any(Event));
        expect(getSwitch().checked).toBe(value);
        expect(getWrapper().classList.contains(CHECKED_CLS)).toBe(value);
        setSize('large');
        expect(getSwitch().checked).toBe(value);
    });

    it('checked 随 signal 更新', () => {
        const [checked, setChecked] = createSignal(false);
        render(() => <Switch checked={checked()} />);
        expect(getSwitch()).not.toBeChecked();
        setChecked(true);
        expect(getSwitch()).toBeChecked();
        expect(getWrapper()).toHaveClass(CHECKED_CLS);
    });

    it('受控值变回 undefined 后取消选中并转为非受控', async () => {
        const [checked, setChecked] = createSignal<boolean | undefined>(true);
        render(() => <Switch checked={checked()} />);
        expect(getSwitch()).toBeChecked();
        setChecked(undefined);
        expect(getSwitch()).not.toBeChecked();
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
    });

    it('父组件挂载时就把 checked 改为 undefined，取消选中', () => {
        function Demo() {
            const [checked, setChecked] = createSignal<boolean | undefined>(true);
            onMount(() => setChecked(undefined));
            return <Switch checked={checked()} />;
        }
        render(() => <Demo />);
        expect(getSwitch()).not.toBeChecked();
        expect(getWrapper()).not.toHaveClass(CHECKED_CLS);
    });

    it('显式 undefined 的 checked 为非受控', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch checked={undefined} onChange={onChange} />);
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
        expect(onChange).toHaveBeenCalledWith(true, expect.any(Event));
    });

    it('defaultChecked 只初始化一次', async () => {
        const [defaultChecked, setDefaultChecked] = createSignal(false);
        render(() => <Switch defaultChecked={defaultChecked()} />);
        expect(getSwitch()).not.toBeChecked();
        setDefaultChecked(true);
        expect(getSwitch()).not.toBeChecked();
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
    });

    it('loading 显示 Spin 替换滑块，并可动态移除', () => {
        const [loading, setLoading] = createSignal(true);
        render(() => <Switch loading={loading()} />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
        expect(query(`${prefixCls}-loading-spin`)).not.toBeNull();
        expect(query(`${prefixCls}-knob`)).toBeNull();
        setLoading(false);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-loading`);
        expect(query(`${prefixCls}-knob`)).toHaveAttribute('aria-hidden', 'true');
        expect(query(`${prefixCls}-loading-spin`)).toBeNull();
    });

    it.each(['small', 'large'] as const)('%s 的 loading 保留对应尺寸', (size) => {
        render(() => <Switch loading size={size} />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-${size}`, `${prefixCls}-loading`);
        expect(query(`${prefixCls}-loading-spin`)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-${size}`);
    });

    it('默认尺寸的 loading 使用 middle 的 Spin', () => {
        render(() => <Switch loading />);
        expect(query(`${prefixCls}-loading-spin`)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-middle`);
    });

    it('loading 保持可聚焦并阻止切换与通知', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch loading onChange={onChange} />);
        expect(getSwitch()).not.toBeDisabled();
        expect(getSwitch()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getSwitch());
        expect(onChange).not.toHaveBeenCalled();
        expect(getSwitch()).not.toBeChecked();
    });

    it('disabled 和 loading 可同时生效', () => {
        render(() => <Switch disabled loading />);
        expect(getWrapper()).toHaveClass(DISABLED_CLS, `${prefixCls}-loading`);
        expect(getSwitch()).toBeDisabled();
    });

    it('aria-label 作为控件的可访问名称', () => {
        render(() => <Switch aria-label="Toggle switch" />);
        expect(screen.getByRole('switch', { name: 'Toggle switch' })).toBe(getSwitch());
        expect(getWrapper()).not.toHaveAttribute('aria-label');
    });

    it.each([
        ['aria-labelledby', 'switch-label'],
        ['aria-describedby', 'switch-description'],
        ['aria-invalid', 'true'],
        ['aria-errormessage', 'error-msg'],
        ['aria-required', 'true'],
        ['aria-controls', 'panel'],
        ['aria-description', 'hint'],
    ])('%s 落在控件', (key, value) => {
        render(() => <Switch {...{ [key]: value }} />);
        expect(getSwitch()).toHaveAttribute(key, value);
        expect(getWrapper()).not.toHaveAttribute(key);
    });

    it('创建之后经展开出现或消失的 aria-* 同样落在控件', () => {
        const [attrs, setAttrs] = createSignal<Record<string, string>>({});
        render(() => <Switch {...attrs()} />);
        expect(getSwitch()).not.toHaveAttribute('aria-label');
        setAttrs({ 'aria-label': 'late' });
        expect(getSwitch()).toHaveAttribute('aria-label', 'late');
        expect(getWrapper()).not.toHaveAttribute('aria-label');
        setAttrs({});
        expect(getSwitch()).not.toHaveAttribute('aria-label');
    });

    it('Form 注入的 validateStatus、insetLabel、insetLabelId 不进入 DOM', () => {
        const injected = { validateStatus: 'error', insetLabel: 'Label', insetLabelId: 'label-id' };
        // Form injects these keys, SwitchProps does not declare them
        render(() => <Switch {...(injected as object)} />);
        for (const key of Object.keys(injected)) {
            expect(getSwitch()).not.toHaveAttribute(key);
            expect(getWrapper()).not.toHaveAttribute(key);
            expect(getWrapper()).not.toHaveAttribute(key.toLowerCase());
        }
    });

    it('原生 checked 表达状态，不叠加 aria-checked', async () => {
        render(() => <Switch defaultChecked />);
        expect(getSwitch()).toBeChecked();
        expect(getSwitch()).not.toHaveAttribute('aria-checked');
        await userEvent.click(getSwitch());
        expect(getSwitch()).not.toBeChecked();
    });

    it('disabled 由原生属性表达', () => {
        render(() => <Switch disabled />);
        expect(getSwitch()).toBeDisabled();
        expect(getSwitch()).not.toHaveAttribute('aria-disabled');
    });

    it('控件是带 switch role 的原生 checkbox', () => {
        render(() => <Switch />);
        expect(getSwitch()).toHaveAttribute('role', 'switch');
        expect(getSwitch()).toHaveAttribute('type', 'checkbox');
        expect(getSwitch()).toHaveClass(`${prefixCls}-native-control`);
    });

    it('Tab 进入与离开 switch', async () => {
        render(() => <Switch />);
        await userEvent.tab();
        expect(getSwitch()).toHaveFocus();
        await userEvent.tab();
        expect(getSwitch()).not.toHaveFocus();
    });

    it.each([false, true])('small 在选中=%s 时不显示文本', (checked) => {
        render(() => <Switch checked={checked} checkedText="ON" size="small" uncheckedText="OFF" />);
        expect(screen.queryByText('ON')).toBeNull();
        expect(screen.queryByText('OFF')).toBeNull();
    });

    it.each(['large', 'default'] as const)('%s 尺寸显示 checkedText', (size) => {
        render(() => <Switch checked checkedText="ON" size={size} />);
        expect(query(`${prefixCls}-checked-text`)).toHaveTextContent(/^ON$/);
    });

    it('id 只落在原生控件', () => {
        render(() => <Switch id="my-switch" />);
        expect(getSwitch()).toHaveAttribute('id', 'my-switch');
        expect(getWrapper()).not.toHaveAttribute('id');
    });

    it('未声明属性落在根元素，name 与 tabIndex 落在原生控件', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        render(() => <Switch name="on" data-x="1" tabIndex={-1} title="tip" onClick={onClick} />);
        expect(getWrapper()).toHaveAttribute('title', 'tip');
        expect(getWrapper()).toHaveAttribute('data-x', '1');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        expect(getWrapper()).not.toHaveAttribute('name');
        expect(getSwitch()).toHaveAttribute('name', 'on');
        expect(getSwitch()).toHaveAttribute('tabindex', '-1');
        await userEvent.click(getSwitch());
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('小写 tabindex 同样落在原生控件，并随 signal 更新', () => {
        const [tabindex, setTabindex] = createSignal(0);
        render(() => <Switch tabindex={tabindex()} />);
        expect(getSwitch()).toHaveAttribute('tabindex', '0');
        setTabindex(-1);
        expect(getSwitch()).toHaveAttribute('tabindex', '-1');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
    });

    it('onFocus 与 onBlur 收到原生控件的事件', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(() => <Switch onFocus={onFocus} onBlur={onBlur} />);
        await userEvent.tab();
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].target).toBe(getSwitch());
    });

    it('autofocus 在挂载后聚焦原生控件，不落到根元素', () => {
        const [show, setShow] = createSignal(false);
        render(() => <>{show() && <Switch autofocus />}</>);
        setShow(true);
        expect(getSwitch()).toHaveFocus();
        expect(getWrapper()).not.toHaveAttribute('autofocus');
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Switch: { size: 'large', defaultChecked: true } };
        const first = render(() => <Switch />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-large`);
        expect(getSwitch()).toBeChecked();
        first.unmount();
        render(() => <Switch size="small" />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-small`);
    });

    it('全局 checkedText 与 uncheckedText 为节点时忽略并告警，节点不被挂载', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const checkedText = document.createElement('i');
        const uncheckedText = document.createElement('i');
        semiGlobal.config.overrideDefaultProps = { Switch: { checkedText, uncheckedText } };
        render(() => (
            <>
                <Switch defaultChecked />
                <Switch />
            </>
        ));
        expect(checkedText.isConnected).toBe(false);
        expect(uncheckedText.isConnected).toBe(false);
        expect(document.querySelector('[x-semi-prop]')).toBeNull();
    });

    it('禁用的 Switch 在 click 的 Tooltip 中被当作禁用触发器：外包 span 是停靠点，Switch 不接收指针', async () => {
        const [disabled, setDisabled] = createSignal(true);
        render(() => (
            <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                {(trigger) => <Switch disabled={disabled()} {...trigger()} />}
            </Tooltip>
        ));
        const span = document.querySelector('.probe') as HTMLElement;
        expect(span).toContainElement(getWrapper());
        expect(span).toHaveAttribute('tabindex', '0');
        expect(span.style.cursor).toBe('not-allowed');
        expect(getWrapper().style.pointerEvents).toBe('none');
        await userEvent.click(span);
        await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());

        setDisabled(false);
        expect(document.querySelector('.probe')).toBeNull();
        expect(getWrapper().style.pointerEvents).toBe('');
    });

    it('展开信号对象时，无关属性变化不重置非受控状态', async () => {
        const [props, setProps] = createSignal<SwitchProps>({});
        render(() => <Switch {...props()} />);
        await userEvent.click(getSwitch());
        expect(getSwitch().checked).toBe(true);
        setProps({ class: 'other' });
        expect(getWrapper()).toHaveClass('other', CHECKED_CLS);
        expect(getSwitch().checked).toBe(true);
    });

    it('ref 的 focus 聚焦原生控件，blur 释放焦点', () => {
        let ref!: HTMLDivElement;
        render(() => <Switch ref={(node) => (ref = node)} />);
        ref.focus();
        expect(getSwitch()).toHaveFocus();
        ref.blur();
        expect(document.body).toHaveFocus();
    });

    it('卸载后移除控件', () => {
        const { unmount } = render(() => <Switch />);
        unmount();
        expect(screen.queryByRole('switch')).toBeNull();
    });
});
