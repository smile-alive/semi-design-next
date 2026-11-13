/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { semiGlobal, SemiGlobal, semiGlobalKey } from '@fibrae/semi-ui-vue/utils';
import { render } from '@test/utils/vue';
import Switch from '..';
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

    it('mouseenter/mouseleave 接收原生事件', async () => {
        const enter = vi.fn<(event: MouseEvent) => void>();
        const leave = vi.fn<(event: MouseEvent) => void>();
        render(Switch, { attrs: { onMouseenter: enter, onMouseleave: leave } });
        await fireEvent.mouseEnter(getWrapper()!);
        await fireEvent.mouseLeave(getWrapper()!);
        expect(enter).toHaveBeenCalledOnce();
        expect(leave).toHaveBeenCalledOnce();
        expect(enter.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    });

    it('v-model 受控更新值并发出原生事件', async () => {
        const change = vi.fn<SwitchChange>();
        render(Model, { props: { onChange: change } });
        await userEvent.click(getSwitch());
        expect(change).toHaveBeenCalledWith(true, expect.any(Event));
        expect(getSwitch()).toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`);
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

    it('非 loading 显示滑块', () => {
        render(Switch);
        expect(document.querySelector(`.${prefixCls}-knob`)).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-loading-spin`)).toBeNull();
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
