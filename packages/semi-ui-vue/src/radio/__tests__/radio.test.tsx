/** @jsxImportSource vue */
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Radio, { RadioGroup } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { RadioChangeEvent, RadioEmits, RadioHandle } from '../interface';
import Handle from './fixtures/handle.vue';
import TooltipFixture from './fixtures/in-tooltip.vue';
import Late from './fixtures/late.vue';
import Model from './fixtures/model.vue';
import Propagation from './fixtures/propagation.vue';

type Change = (event: RadioChangeEvent) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-radio`;
const getRadio = () => screen.getByRole<HTMLInputElement>('radio');
// Vue ignores an ancestor listener attached at or after the timestamp of an event coming up from a child, and the
// suite freezes the system clock, so time has to be moved on by hand.
function settle() {
    vi.setSystemTime(Date.now() + 10);
}
const getLabel = () => document.querySelector<HTMLLabelElement>('label') as HTMLLabelElement;
function handleOf(props: Record<string, unknown> = {}) {
    const holder: { current?: RadioHandle } = {};
    render(Handle, { props: { ...props, onReady: (handle: RadioHandle) => (holder.current = handle) } });
    return holder;
}

describe('Radio', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('基础功能正常', () => {
        render(Radio);
        expect(getRadio()).not.toBeChecked();
        expect(getRadio()).not.toBeDisabled();
        expect(getRadio()).toHaveAttribute('type', 'radio');
    });

    it('modelValue 为 true 时选中', () => {
        render(Radio, { props: { modelValue: true } });
        expect(getRadio()).toBeChecked();
    });

    it('默认禁用', () => {
        render(Radio, { props: { disabled: true } });
        expect(getRadio()).toBeDisabled();
    });

    it('change 报告选中状态，高级模式的首次点击同样是选中', async () => {
        const change = vi.fn<Change>();
        const change2 = vi.fn<Change>();
        render(Radio, { props: { onChange: change }, attrs: { 'aria-label': 'plain' } });
        render(Radio, { props: { mode: 'advanced', onChange: change2 }, attrs: { 'aria-label': 'advanced' } });
        await userEvent.click(screen.getByRole('radio', { name: 'plain' }));
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target.checked).toBe(true);
        await userEvent.click(screen.getByRole('radio', { name: 'advanced' }));
        expect(change2).toHaveBeenCalledTimes(1);
        expect(change2.mock.calls[0]?.[0].target.checked).toBe(true);
    });

    it('同时发出 update:modelValue', async () => {
        const update = vi.fn<(checked: boolean) => void>();
        render(Radio, { props: { 'onUpdate:modelValue': update } });
        await userEvent.click(getRadio());
        expect(update).toHaveBeenCalledWith(true);
    });

    it('高级模式：点击已选中项取消选中', async () => {
        const change = vi.fn<Change>();
        render(Radio, { props: { mode: 'advanced', onChange: change }, slots: { default: () => '允许取消选择' } });
        await userEvent.click(getRadio());
        expect(getRadio()).toBeChecked();
        expect(getLabel()).toHaveClass(`${prefixCls}-checked`);
        expect(change.mock.calls[0]?.[0].target.checked).toBe(true);
        await userEvent.click(getRadio());
        expect(getRadio()).not.toBeChecked();
        expect(getLabel()).not.toHaveClass(`${prefixCls}-checked`);
        expect(change).toHaveBeenCalledTimes(2);
        expect(change.mock.calls[1]?.[0].target.checked).toBe(false);
    });

    it('高级模式下按 Space 取消选中', async () => {
        const change = vi.fn<Change>();
        render(Radio, { props: { defaultChecked: true, mode: 'advanced', onChange: change } });
        getRadio().focus();
        await userEvent.keyboard(' ');
        expect(getRadio()).not.toBeChecked();
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0].target.checked).toBe(false);
    });

    it('高级模式的 v-model：取消选中报告 false，选中图标随之消失', async () => {
        const change = vi.fn<Change>();
        render(Model, { props: { onChange: change } });
        expect(document.querySelector(`.${prefixCls} svg`)).not.toBeNull();
        await userEvent.click(getRadio());
        expect(screen.getByLabelText('model')).toHaveTextContent('false');
        expect(document.querySelector(`.${prefixCls} svg`)).toBeNull();
        expect(getLabel()).not.toHaveClass(`${prefixCls}-checked`);
        expect(change.mock.calls.at(-1)?.[0].target.checked).toBe(false);
        await userEvent.click(getRadio());
        expect(getRadio()).toBeChecked();
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(getRadio()).not.toBeChecked();
    });

    it('button 样式', () => {
        render(Radio, { props: { type: 'button' } });
        expect(document.querySelector(`.${prefixCls}-buttonRadioComponent`)).not.toBeNull();
    });

    it('card 样式', () => {
        render(Radio, { props: { type: 'card' }, slots: { default: () => 'Card Radio' } });
        expect(document.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
    });

    it('pureCard 样式', () => {
        render(Radio, { props: { type: 'pureCard' }, slots: { default: () => 'Pure Card Radio' } });
        expect(document.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-inner-pureCardRadio`)).not.toBeNull();
    });

    it('mouseenter 与 mouseleave 落在 label，接收原生事件', async () => {
        const enter = vi.fn<(event: MouseEvent) => void>();
        const leave = vi.fn<(event: MouseEvent) => void>();
        render(Radio, { attrs: { onMouseenter: enter, onMouseleave: leave }, slots: { default: () => 'Test' } });
        await userEvent.hover(getLabel());
        expect(enter).toHaveBeenCalledTimes(1);
        expect(enter.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
        await userEvent.unhover(getLabel());
        expect(leave).toHaveBeenCalledTimes(1);
    });

    it('extra 插槽', () => {
        render(Radio, { slots: { default: () => 'Radio with extra', extra: () => 'Extra information' } });
        const extra = document.querySelector(`.${prefixCls}-extra`) as HTMLElement;
        expect(extra).toHaveTextContent(/^Extra information$/);
        expect(extra).toHaveAttribute('x-semi-prop', 'extra');
        expect(getRadio()).toHaveAttribute('aria-describedby', extra.id);
    });

    it('displayMode 为 vertical', () => {
        render(Radio, { props: { displayMode: 'vertical' }, slots: { default: () => 'Vertical Radio' } });
        expect(document.querySelector(`.${prefixCls}-vertical`)).not.toBeNull();
    });

    it('modelValue 受控，变回 undefined 时取消选中', async () => {
        const view = render(Radio, { props: { modelValue: true }, slots: { default: () => 'Controlled Radio' } });
        expect(getRadio()).toBeChecked();
        await view.rerender({ modelValue: false });
        expect(getRadio()).not.toBeChecked();
        await view.rerender({ modelValue: true });
        expect(getRadio()).toBeChecked();
        await view.rerender({ modelValue: undefined });
        expect(getRadio()).not.toBeChecked();
        expect(getLabel()).not.toHaveClass(`${prefixCls}-checked`);
    });

    it('value 进入原生 input，表单序列化得到该值', () => {
        render(() => (
            <form data-testid="form">
                <Radio name="fruit" value="apple" defaultChecked>
                    {() => 'apple'}
                </Radio>
            </form>
        ));
        expect(getRadio()).toHaveAttribute('value', 'apple');
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('fruit')).toBe('apple');
    });

    it('组外同名的非受控 Radio 互斥，先选中的那个取消选中状态与类名', async () => {
        const view = render(() => (
            <>
                <Radio name="x" value="a">
                    {() => 'A'}
                </Radio>
                <Radio name="x" value="b">
                    {() => 'B'}
                </Radio>
            </>
        ));
        const [a, b] = Array.from(view.container.querySelectorAll(`.${prefixCls}`));
        await userEvent.click(screen.getByRole('radio', { name: 'A' }));
        await userEvent.click(screen.getByRole('radio', { name: 'B' }));
        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(a).not.toHaveClass(`${prefixCls}-checked`);
        expect(b).toHaveClass(`${prefixCls}-checked`);
    });

    it('根元素上使用方的 onClick，点击文字时只调用一次', async () => {
        const onClick = vi.fn<() => void>();
        render(Radio, { attrs: { onClick }, slots: { default: () => 'label' } });
        await userEvent.click(screen.getByText('label'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getRadio()).toBeChecked();
    });

    it('aria-label 落在原生 input', () => {
        render(Radio, { attrs: { 'aria-label': 'Test radio' }, slots: { default: () => 'Radio' } });
        expect(getRadio()).toHaveAttribute('aria-label', 'Test radio');
        expect(getLabel()).not.toHaveAttribute('aria-label');
    });

    it('focus 与 blur 方法', () => {
        const holder = handleOf();
        holder.current?.focus();
        expect(getRadio()).toHaveFocus();
        holder.current?.blur();
        expect(getRadio()).not.toHaveFocus();
    });

    it('暴露的句柄只有 focus 与 blur', () => {
        const holder = handleOf();
        expect(Object.keys(holder.current as RadioHandle).sort()).toEqual(['blur', 'focus']);
    });

    it('focus 将 preventScroll 传给原生 input', () => {
        const holder = handleOf({ preventScroll: true });
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        holder.current?.focus();
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getRadio()).toHaveFocus();
    });

    it('服务端渲染的 HTML 包含 addon 与 extra 的 id', async () => {
        const app = createSSRApp({ render: () => <Radio>{{ default: () => 'label', extra: () => 'more' }}</Radio> });
        const container = document.createElement('div');
        container.innerHTML = await renderToString(app);
        const input = container.querySelector('input') as HTMLInputElement;
        const addonId = (container.querySelector(`.${prefixCls}-addon`) as HTMLElement).id;
        expect(addonId).not.toBe('');
        expect(input.getAttribute('aria-labelledby')).toBe(addonId);
        expect(input.getAttribute('aria-describedby')).toBe((container.querySelector(`.${prefixCls}-extra`) as HTMLElement).id);
    });

    it('modelValue 变化时当次渲染的 DOM 就已是新值', async () => {
        const view = render(Radio, { props: { modelValue: false }, slots: { default: () => 'A' } });
        await view.rerender({ modelValue: true });
        expect(getRadio().checked).toBe(true);
    });

    it('非受控：defaultChecked，点击后选中并保持选中', async () => {
        const change = vi.fn<Change>();
        const first = render(Radio, { props: { defaultChecked: true }, slots: { default: () => 'A' } });
        expect(getRadio()).toBeChecked();
        expect(getLabel()).toHaveClass(`${prefixCls}-checked`);
        first.unmount();

        render(Radio, { props: { onChange: change }, slots: { default: () => 'B' } });
        await userEvent.click(getRadio());
        expect(getRadio()).toBeChecked();
        expect(getLabel()).toHaveClass(`${prefixCls}-checked`);
        expect(document.querySelector(`.${prefixCls}-inner-checked`)).not.toBeNull();
        await userEvent.click(getRadio());
        expect(change).toHaveBeenCalledTimes(1);
        expect(getRadio()).toBeChecked();
    });

    it('受控：点击上报选中，但最终由 modelValue 决定', async () => {
        const change = vi.fn<Change>();
        const view = render(Radio, { props: { modelValue: false, onChange: change }, slots: { default: () => 'A' } });
        await userEvent.click(getRadio());
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target.checked).toBe(true);
        expect(getRadio().checked).toBe(false);
        expect(getLabel()).not.toHaveClass(`${prefixCls}-checked`);
        await view.rerender({ modelValue: true });
        expect(getRadio().checked).toBe(true);
    });

    it('显式 undefined 加 update 监听仍为非受控', async () => {
        const update = vi.fn<(checked: boolean) => void>();
        render(Radio, { props: { modelValue: undefined, 'onUpdate:modelValue': update } });
        await userEvent.click(getRadio());
        expect(getRadio()).toBeChecked();
        expect(update).toHaveBeenCalledWith(true);
    });

    it('change 事件对象的 target 只含 checked、value、name、disabled', async () => {
        const change = vi.fn<Change>();
        render(Radio, {
            props: { value: 'v1', onChange: change },
            attrs: { name: 'n1' },
            slots: { default: () => 'A', extra: () => 'e' },
        });
        await userEvent.click(getRadio());
        const [event] = change.mock.calls[0] as [RadioChangeEvent];
        expect(event.target).toEqual({ checked: true, value: 'v1', name: 'n1', disabled: false });
        expect(Object.keys(event.target).sort()).toEqual(['checked', 'disabled', 'name', 'value']);
        expect(typeof event.preventDefault).toBe('function');
        expect(typeof event.stopPropagation).toBe('function');
    });

    it('change 中的 stopPropagation 阻止原生 change 冒泡', async () => {
        const parentChange = vi.fn<() => void>();
        const change = vi.fn<Change>();
        const view = render(Propagation, { props: { onChange: change, onParentChange: parentChange } });
        settle();
        await userEvent.click(getRadio());
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0].target).toMatchObject({ checked: true, value: 'v1', name: 'n1' });
        expect(parentChange).not.toHaveBeenCalled();
        view.unmount();
        render(Propagation, { props: { stop: false, onParentChange: parentChange } });
        settle();
        await userEvent.click(getRadio());
        expect(parentChange).toHaveBeenCalledTimes(1);
    });

    it('禁用时不改变状态', async () => {
        const change = vi.fn<Change>();
        render(Radio, { props: { disabled: true, onChange: change }, slots: { default: () => 'A' } });
        await userEvent.click(getRadio());
        expect(change).not.toHaveBeenCalled();
        expect(getRadio()).not.toBeChecked();
        expect(getLabel()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('name 作用于 input 而非 label', async () => {
        const first = render(Radio, { slots: { default: () => 'A' } });
        expect(getRadio()).not.toHaveAttribute('name');
        first.unmount();
        render(Radio, { attrs: { name: 'n' }, slots: { default: () => 'A' } });
        expect(getRadio()).toHaveAttribute('name', 'n');
        expect(getLabel()).not.toHaveAttribute('name');
    });

    it('autofocus 在挂载后聚焦 input', async () => {
        render(Late);
        await userEvent.click(screen.getByRole('button', { name: 'show' }));
        expect(getRadio()).toHaveFocus();
    });

    it('aria-labelledby 与 aria-describedby 指向 addon 与 extra', () => {
        const first = render(Radio, { slots: { default: () => 'A', extra: () => 'more' } });
        const addon = document.querySelector(`.${prefixCls}-addon`) as HTMLElement;
        expect(addon.id).toBeTruthy();
        expect(getRadio()).toHaveAttribute('aria-labelledby', addon.id);
        expect(screen.getByRole('radio', { name: 'A' })).toHaveAccessibleDescription('more');
        first.unmount();

        render(Radio, {
            props: { addonId: 'my-addon', extraId: 'my-extra' },
            slots: { default: () => 'A', extra: () => 'more' },
        });
        expect(getRadio()).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(getRadio()).toHaveAttribute('aria-describedby', 'my-extra');
        expect(document.getElementById('my-addon')).toHaveTextContent('A');
    });

    it('没有默认插槽或 extra 时，不包含 addon、extra 或 aria 引用', () => {
        render(Radio);
        expect(document.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getRadio()).not.toHaveAttribute('aria-labelledby');
        expect(getRadio()).not.toHaveAttribute('aria-describedby');
    });

    it('有 extra 时调用方的 aria-describedby 与 extra 都在描述中', () => {
        render(Radio, {
            props: { extraId: 'ex' },
            attrs: { 'aria-describedby': 'outer' },
            slots: { default: () => 'A', extra: () => 'more' },
        });
        expect(getRadio()).toHaveAttribute('aria-describedby', 'outer ex');
    });

    it('button 类型隐藏 extra，不引用它，并应用 addonClassName 与 addonStyle', () => {
        render(Radio, {
            props: { type: 'button', addonClassName: 'ac', addonStyle: { color: 'red' } },
            slots: { default: () => 'A', extra: () => 'more' },
        });
        const addon = document.querySelector(`.${prefixCls}-addon-buttonRadio`) as HTMLElement;
        expect(addon).toHaveClass('ac');
        expect(addon).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.querySelector(`.${prefixCls}-extra`)).toBeNull();
        expect(getRadio()).not.toHaveAttribute('aria-describedby');
    });

    it('button 类型的选中类名', async () => {
        render(Radio, { props: { type: 'button' }, slots: { default: () => 'A' } });
        const addon = document.querySelector(`.${prefixCls}-addon-buttonRadio`) as HTMLElement;
        await userEvent.click(getRadio());
        expect(addon).toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
    });

    it('card 类型的选中类名', async () => {
        render(Radio, { props: { type: 'card' }, slots: { default: () => 'A' } });
        await userEvent.click(getRadio());
        expect(getLabel()).toHaveClass(`${prefixCls}-cardRadioGroup_checked`);
        expect(document.querySelector(`.${prefixCls}-isCardRadioGroup_content`)).not.toBeNull();
    });

    it('class、style、prefixCls 与 data-* 作用于根 label', () => {
        render(Radio, {
            props: { prefixCls: 'my-radio' },
            attrs: { class: 'c', style: { color: 'red' }, 'data-test': 'x' },
            slots: { default: () => 'A' },
        });
        expect(getLabel()).toHaveClass('c', 'my-radio');
        expect(getLabel()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getLabel()).toHaveAttribute('data-test', 'x');
        expect(document.querySelector('.my-radio-inner')).not.toBeNull();
    });

    it('未声明的属性和 click 监听落在根 label', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        render(Radio, { attrs: { title: 'tip', onClick: click }, slots: { default: () => 'A' } });
        expect(getLabel()).toHaveAttribute('title', 'tip');
        await userEvent.click(getLabel());
        expect(click).toHaveBeenCalled();
    });

    it('id、tabindex、onFocus 与 onBlur 落在原生 input', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(Radio, { attrs: { id: 'r-id', tabindex: 0, onFocus: focus, onBlur: blur } });
        expect(getRadio()).toHaveAttribute('id', 'r-id');
        expect(getLabel()).not.toHaveAttribute('id');
        await userEvent.tab();
        await userEvent.tab();
        expect(focus).toHaveBeenCalledOnce();
        expect(blur).toHaveBeenCalledOnce();
        expect(blur.mock.calls[0]?.[0].target).toBe(getRadio());
    });

    it('attrs 更新后重新分流', async () => {
        const view = render(Radio, { attrs: { 'aria-label': 'before', tabindex: 0 } });
        await view.rerender({ 'aria-label': 'after', tabindex: -1, 'data-x': 'new' });
        expect(screen.getByRole('radio', { name: 'after' })).toHaveAttribute('tabindex', '-1');
        expect(getLabel()).toHaveAttribute('data-x', 'new');
    });

    it('不输出 aria-invalid、aria-errormessage、aria-required，无效时错误信息进入描述', () => {
        render(Radio, {
            attrs: { 'aria-invalid': true, 'aria-errormessage': 'err', 'aria-required': true, 'aria-label': 'A' },
        });
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(getRadio()).not.toHaveAttribute(name));
        expect(getRadio()).toHaveAttribute('aria-describedby', 'err');
        expect(getLabel()).not.toHaveAttribute('aria-invalid');
    });

    it('在 Tooltip 中，tabindex 与 aria-describedby 作用于 input 而非 label，只占一个 Tab 停靠点', async () => {
        render(TooltipFixture);
        expect(getLabel()).not.toHaveAttribute('tabindex');
        await userEvent.tab();
        expect(getRadio()).toHaveFocus();
        await waitFor(() => expect(getRadio()).toHaveAccessibleDescription());
        expect(getLabel()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { type: 'button' } };
        const first = render(Radio, { slots: { default: () => 'A' } });
        expect(document.querySelector(`.${prefixCls}-buttonRadioComponent`)).not.toBeNull();
        first.unmount();
        render(Radio, { props: { type: 'card' }, slots: { default: () => 'A' } });
        expect(document.querySelector(`.${prefixCls}-buttonRadioComponent`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
    });

    it('全局默认值里的 addonId、extraId 不影响 Radio', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets them anyway
        semiGlobal.config.overrideDefaultProps = {
            Radio: { addonId: 'addon-global', extraId: 'extra-global' },
        } as object;
        render(Radio, { slots: { default: () => 'A', extra: () => 'E' } });
        expect(document.getElementById('addon-global')).toBeNull();
        expect(document.getElementById('extra-global')).toBeNull();
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Radio: { disabled: true, defaultChecked: true } };
        render(Radio, { global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expect(getRadio()).toBeDisabled();
        expect(getRadio()).toBeChecked();
    });

    it('Radio.Group 与 RadioGroup 是同一个组件', () => {
        expect(Radio.Group).toBe(RadioGroup);
    });

    it('value 缺省为 undefined 而不是 false', async () => {
        render(RadioGroup, {
            props: { modelValue: false },
            slots: {
                default: () => (
                    <>
                        <Radio value={false}>{() => 'no'}</Radio>
                        <Radio>{() => 'free'}</Radio>
                    </>
                ),
            },
        });
        expect(screen.getByRole('radio', { name: 'no' })).toBeChecked();
        await fireEvent.click(screen.getByRole('radio', { name: 'free' }));
        expect(screen.getByRole('radio', { name: 'no' })).toBeChecked();
    });

    it('事件载荷类型', () => {
        expectTypeOf<RadioEmits['change']>().toEqualTypeOf<[event: RadioChangeEvent]>();
        expectTypeOf<RadioEmits['update:modelValue']>().toEqualTypeOf<[checked: boolean]>();
        expectTypeOf<RadioChangeEvent['target']>().toEqualTypeOf<{
            checked: boolean;
            value: string | number | boolean | undefined;
            name: string | undefined;
            disabled: boolean;
        }>();
    });
});
