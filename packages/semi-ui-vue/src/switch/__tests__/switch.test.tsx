/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Switch from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import TooltipFixture from './fixtures/in-tooltip.vue';
import Late from './fixtures/late.vue';
import Model from './fixtures/model.vue';

type SwitchChange = (checked: boolean, event: Event) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-switch`;
const getSwitch = () => screen.getByRole<HTMLInputElement>('switch');
const getWrapper = () => getSwitch().parentElement;
const textSlots = { checkedText: () => <span>ON</span>, uncheckedText: () => <span>OFF</span> };

describe('Switch', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class/style 落在根元素并允许点击切换', async () => {
        const change = vi.fn<SwitchChange>();
        render(Switch, { attrs: { class: 'test', style: { color: 'red' } }, props: { onChange: change } });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await userEvent.click(getSwitch());
        expect(change).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`);
    });

    it('checkedText 与 uncheckedText 随状态显示', async () => {
        render(Switch, { slots: textSlots });
        expect(screen.getByText('OFF').parentElement).toHaveAttribute('x-semi-prop', 'uncheckedText');
        await userEvent.click(getSwitch());
        expect(screen.getByText('ON').parentElement).toHaveAttribute('x-semi-prop', 'checkedText');
        expect(screen.queryByText('OFF')).toBeNull();
    });

    it.each([false, true])('defaultChecked=%s 时同步 disabled 控件及根class', async (defaultChecked) => {
        const view = render(Switch, { props: { disabled: true, defaultChecked } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
        expect(getSwitch()).toBeDisabled();
        expect(getSwitch().checked).toBe(defaultChecked);
        await view.rerender({ disabled: false });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-disabled`);
        expect(getSwitch()).toBeEnabled();
    });

    it('change 报告新值', async () => {
        const change = vi.fn<SwitchChange>();
        render(Switch, { props: { onChange: change } });
        await userEvent.click(getSwitch());
        expect(change).toHaveBeenCalledOnce();
        expect(change.mock.calls[0]?.[0]).toBe(true);
    });

    it('mouseenter/mouseleave 接收原生事件', async () => {
        const enter = vi.fn<(event: MouseEvent) => void>();
        const leave = vi.fn<(event: MouseEvent) => void>();
        render(Switch, { attrs: { onMouseenter: enter, onMouseleave: leave } });
        await fireEvent.mouseEnter(getWrapper() as HTMLElement);
        await fireEvent.mouseLeave(getWrapper() as HTMLElement);
        expect(enter).toHaveBeenCalledOnce();
        expect(leave).toHaveBeenCalledOnce();
        expect(enter.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    });

    it.each(['small', 'default', 'large'] as const)('size=%s 使用对应类名', (size) => {
        render(Switch, { props: { size } });
        expect(getWrapper()).toHaveClass(prefixCls);
        expect(getWrapper()?.classList.contains(`${prefixCls}-small`)).toBe(size === 'small');
        expect(getWrapper()?.classList.contains(`${prefixCls}-large`)).toBe(size === 'large');
    });

    it('v-model 受控更新值并发出原生事件', async () => {
        const change = vi.fn<SwitchChange>();
        render(Model, { props: { onChange: change } });
        await userEvent.click(getSwitch());
        expect(change).toHaveBeenCalledWith(true, expect.any(Event));
        expect(getSwitch()).toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`);
    });

    it('loading 可动态移除', async () => {
        const view = render(Switch, { props: { loading: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
        await view.rerender({ loading: false });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-loading`);
    });

    it('loading 挂载时显示类名', () => {
        render(Switch, { props: { loading: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
    });

    it('aria-label 落在控件', () => {
        render(Switch, { attrs: { 'aria-label': 'Toggle switch' } });
        expect(screen.getByRole('switch', { name: 'Toggle switch' })).toBe(getSwitch());
        expect(getWrapper()).not.toHaveAttribute('aria-label');
    });

    it('defaultChecked 只初始化一次，之后非受控切换', async () => {
        const view = render(Switch, { props: { defaultChecked: true } });
        expect(getSwitch()).toBeChecked();
        await userEvent.click(getSwitch());
        expect(getSwitch()).not.toBeChecked();
        await view.rerender({ defaultChecked: false });
        expect(getSwitch()).not.toBeChecked();
    });

    it('id 只落在原生控件', () => {
        render(Switch, { attrs: { id: 'my-switch' } });
        expect(getSwitch()).toHaveAttribute('id', 'my-switch');
        expect(getWrapper()).not.toHaveAttribute('id');
    });

    it('checkedText 支持自定义节点', () => {
        render(Switch, {
            props: { modelValue: true },
            slots: {
                checkedText: () => <span class="custom-checked">ON</span>,
                uncheckedText: () => <i>OFF</i>,
            },
        });
        expect(screen.getByText('ON')).toHaveClass('custom-checked');
        expect(screen.queryByText('OFF')).toBeNull();
    });

    it.each([
        ['aria-labelledby', 'switch-label'],
        ['aria-describedby', 'switch-description'],
        ['aria-invalid', 'true'],
        ['aria-errormessage', 'error-msg'],
    ])('%s 落在控件', (key, value) => {
        render(Switch, { attrs: { [key]: value } });
        expect(getSwitch()).toHaveAttribute(key, value);
        expect(getWrapper()).not.toHaveAttribute(key);
    });

    it('原生 checked 表达状态，不叠加 aria-checked', async () => {
        render(Switch, { props: { defaultChecked: true } });
        expect(getSwitch()).toBeChecked();
        expect(getSwitch()).not.toHaveAttribute('aria-checked');
        await userEvent.click(getSwitch());
        expect(getSwitch()).not.toBeChecked();
    });

    it('disabled 用原生属性表达', () => {
        render(Switch, { props: { disabled: true } });
        expect(getSwitch()).toBeDisabled();
        expect(getSwitch()).not.toHaveAttribute('aria-disabled');
    });

    it('原生输入带 switch role', () => {
        render(Switch);
        expect(getSwitch()).toHaveAttribute('role', 'switch');
    });

    it('Tab 进入与离开控件', async () => {
        render(Switch);
        await userEvent.tab();
        expect(getSwitch()).toHaveFocus();
        await userEvent.tab();
        expect(getSwitch()).not.toHaveFocus();
    });

    it('loading 保持可聚焦并阻止切换与通知', async () => {
        const change = vi.fn<SwitchChange>();
        const update = vi.fn<(checked: boolean) => void>();
        render(Switch, { props: { loading: true, onChange: change, 'onUpdate:modelValue': update } });
        expect(getSwitch()).not.toBeDisabled();
        expect(getSwitch()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getSwitch());
        expect(change).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(getSwitch()).not.toBeChecked();
    });

    it.each([false, true])('small 在选中=%s 时不显示文本', (modelValue) => {
        render(Switch, { props: { size: 'small', modelValue }, slots: textSlots });
        expect(screen.queryByText('ON')).toBeNull();
        expect(screen.queryByText('OFF')).toBeNull();
    });

    it.each(['large', 'default'] as const)('%s 显示 checkedText', (size) => {
        render(Switch, { props: { size, modelValue: true }, slots: textSlots });
        expect(screen.getByText('ON')).toBeInTheDocument();
    });

    it.each([false, true])('选中=%s 时只显示当前文本', (modelValue) => {
        render(Switch, { props: { modelValue }, slots: textSlots });
        expect(screen.getByText(modelValue ? 'ON' : 'OFF')).toBeInTheDocument();
        expect(screen.queryByText(modelValue ? 'OFF' : 'ON')).toBeNull();
    });

    it('loading 显示 Spin 并替换滑块', () => {
        render(Switch, { props: { loading: true } });
        expect(document.querySelector(`.${prefixCls}-loading-spin`)).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-knob`)).toBeNull();
    });

    it('非 loading 显示滑块', () => {
        render(Switch);
        expect(document.querySelector(`.${prefixCls}-knob`)).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-loading-spin`)).toBeNull();
    });

    it('挂载初始化 disabled 状态', () => {
        render(Switch, { props: { disabled: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
        expect(getSwitch()).toBeDisabled();
    });

    it('卸载清理控件', () => {
        const view = render(Switch);
        view.unmount();
        expect(screen.queryByRole('switch')).toBeNull();
    });

    it('modelValue 更新立即控制原生状态和类名', async () => {
        const view = render(Switch, { props: { modelValue: false } });
        expect(getSwitch()).not.toBeChecked();
        await view.rerender({ modelValue: true });
        expect(getSwitch()).toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`);
    });

    it('输入类型为 checkbox', () => {
        render(Switch);
        expect(getSwitch()).toHaveAttribute('type', 'checkbox');
    });

    it('输入类名与共享样式一致', () => {
        render(Switch);
        expect(getSwitch()).toHaveClass(`${prefixCls}-native-control`);
    });

    it.each(['small', 'large'] as const)('%s loading 保留对应尺寸', (size) => {
        render(Switch, { props: { size, loading: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-${size}`, `${prefixCls}-loading`);
        expect(document.querySelector(`.${prefixCls}-loading-spin`)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-${size}`);
    });

    it('disabled 和 loading 可同时生效', () => {
        render(Switch, { props: { disabled: true, loading: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-loading`);
        expect(getSwitch()).toBeDisabled();
    });

    it('defaultChecked 和 disabled 可同时生效', () => {
        render(Switch, { props: { defaultChecked: true, disabled: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`, `${prefixCls}-disabled`);
    });

    it('change 事件保留原生 Event 和目标', async () => {
        const change = vi.fn<SwitchChange>();
        render(Switch, { props: { onChange: change } });
        await userEvent.click(getSwitch());
        const [value, event] = change.mock.calls[0] as [boolean, Event];
        expect(value).toBe(true);
        expect(event).toBeInstanceOf(Event);
        expect(event.type).toBe('change');
        expect(event.target).toBe(getSwitch());
    });

    it('连续切换逐次发出值', async () => {
        const change = vi.fn<SwitchChange>();
        render(Switch, { props: { onChange: change } });
        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());
        await userEvent.click(getSwitch());
        expect(change.mock.calls.map(([value]) => value)).toEqual([true, false, true]);
    });

    it('未监听事件仍可切换', async () => {
        render(Switch);
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
    });

    it('受控值变回 undefined 后清空并转为非受控', async () => {
        const view = render(Switch, { props: { modelValue: true } });
        await view.rerender({ modelValue: undefined });
        expect(getSwitch()).not.toBeChecked();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-checked`);
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
    });

    it('未知属性在根元素，焦点属性在输入框', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        render(Switch, { attrs: { name: 'on', 'data-x': '1', tabindex: -1, title: 'tip', onClick: click } });
        expect(getWrapper()).toHaveAttribute('title', 'tip');
        expect(getWrapper()).toHaveAttribute('data-x', '1');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        expect(getWrapper()).not.toHaveAttribute('name');
        expect(getSwitch()).toHaveAttribute('name', 'on');
        expect(getSwitch()).toHaveAttribute('tabindex', '-1');
        await userEvent.click(getSwitch());
        expect(click).toHaveBeenCalledOnce();
    });

    it('Tooltip 内的 Switch 是单个 Tab 停靠点', async () => {
        render(TooltipFixture);
        await userEvent.tab();
        expect(getSwitch()).toHaveFocus();
        await waitFor(() => expect(getSwitch()).toHaveAccessibleDescription());
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Switch: { size: 'large', defaultChecked: true } };
        const first = render(Switch);
        expect(getWrapper()).toHaveClass(`${prefixCls}-large`);
        expect(getSwitch()).toBeChecked();
        first.unmount();
        render(Switch, { props: { size: 'small' } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-small`);
    });

    it.each([false, true])('单向 modelValue=%s 只通知且恢复 DOM.checked', async (modelValue) => {
        const change = vi.fn<SwitchChange>();
        const update = vi.fn<(value: boolean) => void>();
        const view = render(Switch, { props: { modelValue, onChange: change, 'onUpdate:modelValue': update } });
        await userEvent.click(getSwitch());
        expect(change).toHaveBeenCalledWith(!modelValue, expect.any(Event));
        expect(update).toHaveBeenCalledWith(!modelValue);
        expect(getSwitch().checked).toBe(modelValue);
        await view.rerender({ modelValue, size: 'large' });
        expect(getSwitch().checked).toBe(modelValue);
    });

    it('显式 undefined 加 update 监听仍为非受控', async () => {
        const update = vi.fn<(value: boolean) => void>();
        render(Switch, { props: { modelValue: undefined, 'onUpdate:modelValue': update } });
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
        expect(update).toHaveBeenCalledWith(true);
    });

    it('v-model 可以重置为 undefined', async () => {
        render(Model);
        await userEvent.click(getSwitch());
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(getSwitch()).not.toBeChecked();
    });

    it('应用注入的 semiGlobal 默认值隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Switch: { disabled: true, loading: true } };
        render(Switch, { global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expect(getSwitch()).toBeDisabled();
        expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
    });

    it('attrs 更新重新分流到当前控件', async () => {
        const view = render(Switch, { attrs: { 'aria-label': 'before', tabindex: 0 } });
        await view.rerender({ 'aria-label': 'after', tabindex: -1, 'data-x': 'new' });
        expect(screen.getByRole('switch', { name: 'after' })).toHaveAttribute('tabindex', '-1');
        expect(getWrapper()).toHaveAttribute('data-x', 'new');
    });

    it('autofocus 落在唯一原生焦点目标', () => {
        render(Switch, { attrs: { autofocus: true } });
        expect(getSwitch()).toHaveAttribute('autofocus');
        expect(getWrapper()).not.toHaveAttribute('autofocus');
    });

    it('autofocus 在挂载后聚焦 input', async () => {
        render(Late);
        await userEvent.click(screen.getByRole('button', { name: 'show' }));
        expect(getSwitch()).toHaveFocus();
    });

    it('focus/blur 监听收到原生控件事件', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(Switch, { attrs: { onFocus: focus, onBlur: blur } });
        await userEvent.tab();
        await userEvent.tab();
        expect(focus).toHaveBeenCalledOnce();
        expect(blur).toHaveBeenCalledOnce();
        expect(blur.mock.calls[0]?.[0].target).toBe(getSwitch());
    });
});
