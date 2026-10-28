/** @jsxImportSource vue */
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Checkbox, { CheckboxGroup } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { CheckboxEmits, CheckboxEvent, CheckboxHandle } from '../interface';
import CheckAll from './fixtures/check-all.vue';
import Handle from './fixtures/handle.vue';
import TooltipFixture from './fixtures/in-tooltip.vue';
import InteractiveContent from './fixtures/interactive-content.vue';
import Late from './fixtures/late.vue';
import Model from './fixtures/model.vue';
import Propagation from './fixtures/propagation.vue';

type Change = (event: CheckboxEvent) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-checkbox`;
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('checkbox');
const label = { default: () => 'Semi Design' };
// Vue ignores an ancestor listener attached at or after the timestamp of an event coming up from a child, and the
// suite freezes the system clock, so time has to be moved on by hand.
const settle = () => {
    vi.setSystemTime(Date.now() + 10);
};

describe('Checkbox', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在根元素', () => {
        render(Checkbox, { attrs: { class: 'test', style: { color: 'red' } }, slots: label });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('基本功能与点击行为', async () => {
        render(Checkbox, { slots: label });
        expect(getInput()).not.toBeChecked();
        expect(getInput()).toBeEnabled();
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`);
    });

    it('defaultChecked 生效', () => {
        render(Checkbox, { props: { defaultChecked: true }, slots: label });
        expect(getInput()).toBeChecked();
    });

    it('modelValue 受控模式随 props 变化，变回 undefined 时清空', async () => {
        const view = render(Checkbox, { props: { modelValue: true }, slots: label });
        const innerChecked = () => document.querySelector(`.${prefixCls}-inner-checked`);
        expect(getInput()).toBeChecked();
        expect(innerChecked()).not.toBeNull();
        await view.rerender({ modelValue: false });
        expect(getInput()).not.toBeChecked();
        expect(innerChecked()).toBeNull();
        await view.rerender({ modelValue: true });
        expect(getInput()).toBeChecked();
        // formApi.reset() turns a controlled value into undefined
        await view.rerender({ modelValue: undefined });
        expect(getInput()).not.toBeChecked();
        expect(innerChecked()).toBeNull();
    });

    it('禁用状态', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { disabled: true, onChange: change }, slots: label });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).toBeDisabled();
        await fireEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
        expect(change).not.toHaveBeenCalled();
    });

    it('change 报告新的选中状态，并同时发出 update:modelValue', async () => {
        const change = vi.fn<Change>();
        const update = vi.fn<(checked: boolean) => void>();
        render(Checkbox, { props: { onChange: change, 'onUpdate:modelValue': update } });
        await userEvent.click(getWrapper());
        expect(change.mock.calls[0]?.[0].target.checked).toBe(true);
        expect(update).toHaveBeenLastCalledWith(true);
        await userEvent.click(getWrapper());
        expect(change.mock.calls[1]?.[0].target.checked).toBe(false);
        expect(update).toHaveBeenLastCalledWith(false);
    });

    it('extra 插槽', () => {
        render(Checkbox, { slots: { ...label, extra: () => 'abcd' } });
        const extra = document.querySelector(`.${prefixCls}-extra`) as HTMLElement;
        expect(extra).toHaveTextContent(/^abcd$/);
        expect(extra).toHaveAttribute('x-semi-prop', 'extra');
        expect(getInput()).toHaveAttribute('aria-describedby', extra.id);
    });

    it('半选状态', () => {
        render(Checkbox, { props: { indeterminate: true }, slots: label });
        expect(getWrapper()).toHaveClass(`${prefixCls}-indeterminate`);
        expect(getInput()).not.toBeChecked();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_indeterminate`)).not.toBeNull();
    });

    it('半选与选中同时存在时显示勾选图标', () => {
        render(Checkbox, { props: { indeterminate: true, modelValue: true }, slots: label });
        expect(getWrapper()).toHaveClass(`${prefixCls}-indeterminate`);
        expect(getInput()).toBeChecked();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_tick`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_indeterminate`)).toBeNull();
    });

    it('半选状态暴露为原生 indeterminate，不输出 aria-checked', async () => {
        const view = render(Checkbox, { props: { indeterminate: true } });
        expect(getInput()).toBePartiallyChecked();
        expect(getInput()).not.toHaveAttribute('aria-checked');
        expect(getInput().matches(':indeterminate')).toBe(true);
        await view.rerender({ modelValue: true });
        expect(getInput()).not.toBePartiallyChecked();
        expect(getInput()).toBeChecked();
    });

    it('点击原生输入后受控半选仍保持 indeterminate', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { modelValue: false, indeterminate: true, onChange: change } });
        await userEvent.click(getInput());
        expect(change).toHaveBeenCalledTimes(1);
        expect(getInput()).toBePartiallyChecked();
        expect(getInput().checked).toBe(false);
    });

    it('键盘 Enter 不切换，Space 切换', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { onChange: change } });
        getInput().focus();
        await userEvent.keyboard('{Enter}');
        expect(change).not.toHaveBeenCalled();
        await userEvent.keyboard(' ');
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target.checked).toBe(true);
    });

    it('聚焦后按 Space 反复切换', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { onChange: change } });
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(getInput()).toBeChecked();
        await userEvent.keyboard(' ');
        expect(getInput()).not.toBeChecked();
        expect(change).toHaveBeenCalledTimes(2);
    });

    it('禁用的 checkbox 忽略 Enter，且不输出 aria-disabled', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { disabled: true, onChange: change } });
        await fireEvent.keyDown(getWrapper(), { key: 'Enter' });
        expect(change).not.toHaveBeenCalled();
        expect(getInput()).toBeDisabled();
        expect(getInput()).not.toHaveAttribute('aria-disabled');
    });

    it('mouseenter 与 mouseleave 接收原生事件', async () => {
        const enter = vi.fn<(event: MouseEvent) => void>();
        const leave = vi.fn<(event: MouseEvent) => void>();
        render(Checkbox, { attrs: { onMouseenter: enter, onMouseleave: leave }, slots: label });
        await fireEvent.mouseEnter(getWrapper());
        expect(enter).toHaveBeenCalledTimes(1);
        expect(enter.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
        await fireEvent.mouseLeave(getWrapper());
        expect(leave).toHaveBeenCalledTimes(1);
    });

    it('modelValue 为 false 与 defaultChecked 同时存在时，初值取受控值并可以勾选', async () => {
        const update = vi.fn<(checked: boolean) => void>();
        render(Checkbox, { props: { modelValue: false, defaultChecked: true, 'onUpdate:modelValue': update }, slots: label });
        expect(getInput()).not.toBeChecked();
        await userEvent.click(getInput());
        expect(update).toHaveBeenCalledWith(true);
    });

    it('value 进入原生 input，表单序列化得到该值', () => {
        render(() => (
            <form data-testid="form">
                <Checkbox name="fruit" value="apple" defaultChecked>
                    {label}
                </Checkbox>
            </form>
        ));
        expect(getInput()).toHaveAttribute('value', 'apple');
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('fruit')).toBe('apple');
    });

    it('aria-labelledby 落在原生 input 并合并 addon id', () => {
        render(Checkbox, { attrs: { 'aria-labelledby': 'label-id' }, slots: label });
        expect(getInput().getAttribute('aria-labelledby')).toMatch(/^label-id \S+$/);
        expect(getWrapper()).not.toHaveAttribute('aria-labelledby');
    });

    it('card 类型', () => {
        render(Checkbox, { props: { type: 'card' }, slots: label });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).toBeNull();
    });

    it('pureCard 类型', () => {
        render(Checkbox, { props: { type: 'pureCard' }, slots: label });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
    });

    it('focus 与 blur 方法', async () => {
        let handle: CheckboxHandle | undefined;
        render(Handle, { props: { onReady: (value: CheckboxHandle) => (handle = value) } });
        handle?.focus();
        expect(getInput()).toHaveFocus();
        handle?.blur();
        expect(getInput()).not.toHaveFocus();
        await userEvent.click(getWrapper());
        expect(getInput()).toHaveFocus();
        handle?.blur();
        expect(getInput()).not.toHaveFocus();
    });

    it('暴露的句柄只有 focus 与 blur', () => {
        let handle: CheckboxHandle | undefined;
        render(Handle, { props: { onReady: (value: CheckboxHandle) => (handle = value) } });
        expect(Object.keys(handle as CheckboxHandle).sort()).toEqual(['blur', 'focus']);
    });

    it('focus 将 preventScroll 传给原生 input', () => {
        let handle: CheckboxHandle | undefined;
        render(Handle, { props: { preventScroll: true, onReady: (value: CheckboxHandle) => (handle = value) } });
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        try {
            handle?.focus();
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            focus.mockRestore();
        }
    });

    it('change 中的 stopPropagation 与 preventDefault 转发给原生 click', async () => {
        const parentClick = vi.fn<() => void>();
        const view = render(Propagation, { props: { onParentClick: parentClick } });
        settle();
        await userEvent.click(getWrapper());
        expect(parentClick).not.toHaveBeenCalled();
        view.unmount();
        render(Propagation, { props: { stop: false, onParentClick: parentClick } });
        settle();
        await userEvent.click(getWrapper());
        expect(parentClick).toHaveBeenCalledTimes(1);
    });

    it('change 中调用 nativeEvent.stopImmediatePropagation 会阻止原生事件继续传播', async () => {
        const change = vi.fn<Change>((event) => event.nativeEvent.stopImmediatePropagation());
        render(Checkbox, { props: { onChange: change } });
        const onDocumentClick = vi.fn<() => void>();
        document.addEventListener('click', onDocumentClick);
        try {
            await userEvent.click(getWrapper());
        } finally {
            document.removeEventListener('click', onDocumentClick);
        }
        expect(change).toHaveBeenCalledTimes(1);
        expect(onDocumentClick).not.toHaveBeenCalled();
    });

    it('change 的 target 只含 checked、value、name、disabled，nativeEvent 是原生点击', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, {
            props: { value: 'v', onChange: change },
            attrs: { name: 'n' },
            slots: { ...label, extra: () => 'e' },
        });
        await userEvent.click(getWrapper());
        const [event] = change.mock.calls[0] as [CheckboxEvent];
        expect(event.target).toEqual({ checked: true, value: 'v', name: 'n', disabled: false });
        expect(Object.keys(event.target).sort()).toEqual(['checked', 'disabled', 'name', 'value']);
        expect(event.nativeEvent).toBeInstanceOf(MouseEvent);
        expect(event.nativeEvent.type).toBe('click');
        expect(typeof event.stopPropagation).toBe('function');
        expect(typeof event.preventDefault).toBe('function');
    });

    it('非受控 checkbox 可反复切换', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { onChange: change }, slots: label });
        await userEvent.click(getWrapper());
        await userEvent.click(getWrapper());
        expect(change.mock.calls.map(([event]) => event.target.checked)).toEqual([true, false]);
        expect(getInput()).not.toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
    });

    it('受控 checkbox 只通知，直到父组件更新 modelValue', async () => {
        const change = vi.fn<Change>();
        const view = render(Checkbox, { props: { modelValue: false, onChange: change }, slots: label });
        await userEvent.click(getWrapper());
        expect(change.mock.calls[0]?.[0].target.checked).toBe(true);
        expect(getInput()).not.toBeChecked();
        await userEvent.click(getInput());
        expect(getInput().checked).toBe(false);
        await view.rerender({ modelValue: true });
        expect(getInput()).toBeChecked();
    });

    it('modelValue 为 undefined 按非受控处理：取 defaultChecked，点击即切换', async () => {
        render(Checkbox, { props: { modelValue: undefined, defaultChecked: true }, slots: label });
        expect(getInput()).toBeChecked();
        await userEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
    });

    it('显式 undefined 加 update 监听仍为非受控', async () => {
        const update = vi.fn<(checked: boolean) => void>();
        render(Checkbox, { props: { modelValue: undefined, 'onUpdate:modelValue': update } });
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
        expect(update).toHaveBeenCalledWith(true);
    });

    it('v-model 双向同步，变回 undefined 后清空', async () => {
        render(Model);
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
        expect(screen.getByLabelText('model')).toHaveTextContent('true');
        await userEvent.click(getWrapper());
        expect(screen.getByLabelText('model')).toHaveTextContent('false');
        await userEvent.click(screen.getByRole('button', { name: 'check' }));
        expect(getInput()).toBeChecked();
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(getInput()).not.toBeChecked();
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
    });

    it('全选 demo：半选随分组变化，全选时回写分组', async () => {
        render(CheckAll);
        const all = screen.getByRole('checkbox', { name: 'all' });
        expect(all).toBePartiallyChecked();
        await userEvent.click(all);
        expect(screen.getAllByRole('checkbox').every((input) => (input as HTMLInputElement).checked)).toBe(true);
        expect(all).not.toBePartiallyChecked();
        await userEvent.click(all);
        expect(screen.getAllByRole('checkbox').some((input) => (input as HTMLInputElement).checked)).toBe(false);
    });

    it('aria 属性落在原生 input，aria-labelledby 与 addon id 合并', () => {
        render(Checkbox, {
            attrs: {
                'aria-describedby': 'desc',
                'aria-errormessage': 'err',
                'aria-invalid': true,
                'aria-label': 'agree',
                'aria-labelledby': 'outer',
                'aria-required': true,
            },
            slots: { default: () => 'label' },
        });
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'agree');
        expect(input).toHaveAttribute('aria-describedby', 'desc');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'err');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).not.toHaveAttribute('aria-checked');
        const addon = document.querySelector(`.${prefixCls}-addon`) as HTMLElement;
        expect(addon.id).not.toBe('');
        expect(input).toHaveAttribute('aria-labelledby', `outer ${addon.id}`);
        expect(getWrapper()).not.toHaveAttribute('aria-labelledby');
    });

    it('addonId 与 extraId 用作 id', () => {
        render(Checkbox, {
            props: { addonId: 'my-addon', extraId: 'my-extra' },
            slots: { default: () => 'label', extra: () => 'more' },
        });
        expect(document.querySelector(`.${prefixCls}-addon`)).toHaveAttribute('id', 'my-addon');
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveAttribute('id', 'my-extra');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(getInput()).toHaveAttribute('aria-describedby', 'my-extra');
    });

    it('有 extra 时调用方的 aria-describedby 与 extra 都在描述中', () => {
        render(Checkbox, {
            props: { extraId: 'ex' },
            attrs: { 'aria-describedby': 'outer' },
            slots: { default: () => 'label', extra: () => 'more' },
        });
        expect(getInput()).toHaveAttribute('aria-describedby', 'outer ex');
    });

    it('无默认插槽与 extra 时不渲染 addon 或 extra 节点', () => {
        render(Checkbox, { attrs: { 'aria-label': 'bare' } });
        expect(document.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('data-*、role、style 与 onClick 落在根元素；id、name、tabindex 落在 input', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        render(Checkbox, {
            attrs: {
                id: 'cb-id',
                name: 'agree',
                style: { color: 'red' },
                'data-testid': 'cb',
                role: 'none',
                tabindex: -1,
                title: 'tip',
                onClick: click,
            },
            slots: label,
        });
        const wrapper = getWrapper();
        expect(wrapper).toHaveAttribute('data-testid', 'cb');
        expect(wrapper).toHaveAttribute('role', 'none');
        expect(wrapper).toHaveAttribute('title', 'tip');
        expect(wrapper).not.toHaveAttribute('id');
        expect(wrapper).not.toHaveAttribute('name');
        expect(wrapper).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('id', 'cb-id');
        expect(getInput()).toHaveAttribute('name', 'agree');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
        await userEvent.click(wrapper);
        expect(click).toHaveBeenCalledTimes(1);
        expect(getInput()).toBeChecked();
    });

    it('attrs 更新后重新分流', async () => {
        const view = render(Checkbox, { attrs: { 'aria-label': 'before', tabindex: 0 } });
        await view.rerender({ 'aria-label': 'after', tabindex: -1, 'data-x': 'new' });
        expect(screen.getByRole('checkbox', { name: 'after' })).toHaveAttribute('tabindex', '-1');
        expect(getWrapper()).toHaveAttribute('data-x', 'new');
    });

    it('focus 与 blur 监听收到原生 input 事件', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(Checkbox, { attrs: { onFocus: focus, onBlur: blur } });
        await userEvent.tab();
        await userEvent.tab();
        expect(focus).toHaveBeenCalledOnce();
        expect(blur).toHaveBeenCalledOnce();
        expect(blur.mock.calls[0]?.[0].target).toBe(getInput());
    });

    it('autofocus 在挂载后聚焦 input', async () => {
        render(Late);
        await userEvent.click(screen.getByRole('button', { name: 'show' }));
        expect(getInput()).toHaveFocus();
    });

    it('点击文字时聚焦原生 input', async () => {
        render(Checkbox, { slots: label });
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
        expect(getInput()).toHaveFocus();
    });

    it('点击内容里的链接与按钮不切换，点击普通文字仍切换', async () => {
        const change = vi.fn<Change>();
        render(InteractiveContent, { attrs: { onChange: change } });
        await userEvent.click(screen.getByRole('link', { name: 'terms' }));
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        await userEvent.click(screen.getByRole('link', { name: 'extra link' }));
        expect(getInput()).not.toBeChecked();
        expect(change).not.toHaveBeenCalled();
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
        expect(getInput()).toBeChecked();
        expect(change).toHaveBeenCalledTimes(1);
    });

    it('在 Tooltip 中只占一个 Tab 停靠点，由 tooltip 描述', async () => {
        render(TooltipFixture);
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription());
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('服务端渲染的 HTML 包含 addon 与 extra 的 id', async () => {
        const app = createSSRApp({
            render: () => <Checkbox>{{ default: () => 'label', extra: () => 'more' }}</Checkbox>,
        });
        const container = document.createElement('div');
        container.innerHTML = await renderToString(app);
        const input = container.querySelector('input') as HTMLInputElement;
        const addonId = (container.querySelector(`.${prefixCls}-addon`) as HTMLElement).id;
        const extraId = (container.querySelector(`.${prefixCls}-extra`) as HTMLElement).id;
        expect(addonId).not.toBe('');
        expect(input.getAttribute('aria-labelledby')).toBe(addonId);
        expect(input.getAttribute('aria-describedby')).toBe(extraId);
    });

    it('卡片类型的 extra 在没有标题时带 noChildren 类', () => {
        render(Checkbox, { props: { type: 'card' }, slots: { extra: () => 'more' } });
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveClass(`${prefixCls}-cardType_extra_noChildren`);
    });

    it('prefixCls 替换所有类名前缀', () => {
        render(Checkbox, { props: { prefixCls: 'my-cb' }, slots: label });
        expect(document.querySelector('.my-cb')).not.toBeNull();
        expect(document.querySelector('.my-cb-inner-display')).not.toBeNull();
        expect(document.querySelector('.my-cb-addon')).not.toBeNull();
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Checkbox: { type: 'card' } };
        const first = render(Checkbox, { slots: label });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        first.unmount();
        render(Checkbox, { props: { type: 'default' }, slots: label });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-cardType`);
    });

    it('全局默认值里的 addonId、extraId 不影响 Checkbox', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets them anyway
        semiGlobal.config.overrideDefaultProps = {
            Checkbox: { addonId: 'addon-global', extraId: 'extra-global' },
        } as object;
        render(Checkbox, { slots: { ...label, extra: () => 'E' } });
        expect(document.getElementById('addon-global')).toBeNull();
        expect(document.getElementById('extra-global')).toBeNull();
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Checkbox: { disabled: true, defaultChecked: true } };
        render(Checkbox, { global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expect(getInput()).toBeDisabled();
        expect(getInput()).toBeChecked();
    });

    it('Checkbox.Group 与 CheckboxGroup 是同一个组件', () => {
        expect(Checkbox.Group).toBe(CheckboxGroup);
    });

    it('没有 value 时 value 缺省为 undefined 而不是 false，不属于任何分组', async () => {
        const change = vi.fn<Change>();
        render(CheckboxGroup, {
            props: { modelValue: ['a'] },
            slots: {
                default: () => (
                    <>
                        <Checkbox value="a">{() => 'A'}</Checkbox>
                        <Checkbox onChange={change}>{() => 'free'}</Checkbox>
                    </>
                ),
            },
        });
        await userEvent.click(screen.getByRole('checkbox', { name: 'free' }));
        expect(screen.getByRole('checkbox', { name: 'free' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'free' })).not.toHaveAttribute('name');
        expect(change).toHaveBeenCalledTimes(1);
    });

    it('事件与插槽类型', () => {
        expectTypeOf<CheckboxEmits['change']>().toEqualTypeOf<[event: CheckboxEvent]>();
        expectTypeOf<CheckboxEmits['update:modelValue']>().toEqualTypeOf<[checked: boolean]>();
        expectTypeOf<CheckboxEvent['target']>().toEqualTypeOf<{
            checked: boolean;
            value: string | number | boolean | undefined;
            name: string | undefined;
            disabled: boolean;
        }>();
        expectTypeOf<CheckboxEvent['nativeEvent']>().toEqualTypeOf<MouseEvent>();
    });
});
