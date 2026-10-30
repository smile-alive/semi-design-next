import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal } from '../../_utils/semi-global';
import type { SwitchProps } from '../interface';
import GlobalContext from './global-context.svelte';
import SwitchFixture from './switch-fixture.svelte';

type SwitchChange = (checked: boolean, event: Event) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-switch`;
const getSwitch = () => screen.getByRole<HTMLInputElement>('switch');
const getWrapper = () => getSwitch().parentElement as HTMLElement;

function setup(props: SwitchProps = {}, texts = false) {
    const store = createStore<{ props: SwitchProps; texts: boolean }>({ props, texts });
    const view = render(SwitchFixture, { props: { store } });
    return { store, view };
}

describe('Svelte Switch', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    describe('全局默认值', () => {
        it('模块单例：默认值生效且显式 props 优先', () => {
            semiGlobal.config.overrideDefaultProps = { Switch: { size: 'large', checked: true } };
            const first = setup();
            expect(getWrapper()).toHaveClass(`${prefixCls}-large`);
            first.view.unmount();
            setup({ size: 'small' });
            expect(getWrapper()).toHaveClass(`${prefixCls}-small`);
        });

        it('context：semiGlobalKey 提供的实例生效，且不影响模块单例', () => {
            const semi = new SemiGlobal();
            semi.config.overrideDefaultProps = { Switch: { disabled: true, loading: true } };
            const scoped = render(GlobalContext, { props: { semi } });
            expect(getSwitch()).toBeDisabled();
            expect(getWrapper()).toHaveClass(`${prefixCls}-loading`);
            scoped.unmount();
            setup();
            expect(getSwitch()).toBeEnabled();
            expect(getWrapper()).not.toHaveClass(`${prefixCls}-loading`);
        });
    });

    describe('loading', () => {
        it('显示 Spin 并替换滑块，非 loading 显示滑块', () => {
            const { store } = setup({ loading: true });
            expect(document.querySelector(`.${prefixCls}-loading-spin`)).toBeInTheDocument();
            expect(document.querySelector(`.${prefixCls}-knob`)).toBeNull();
            store.props.loading = false;
            flushSync();
            expect(document.querySelector(`.${prefixCls}-loading-spin`)).toBeNull();
            expect(document.querySelector(`.${prefixCls}-knob`)).toBeInTheDocument();
            expect(getWrapper()).not.toHaveClass(`${prefixCls}-loading`);
        });

        it('保持可聚焦并阻止切换与通知', async () => {
            const change = vi.fn<SwitchChange>();
            setup({ loading: true, onChange: change });
            expect(getSwitch()).not.toBeDisabled();
            expect(getSwitch()).toHaveAttribute('aria-disabled', 'true');
            await fireEvent.click(getSwitch());
            flushSync();
            expect(change).not.toHaveBeenCalled();
            expect(getSwitch()).not.toBeChecked();
            expect(getWrapper()).not.toHaveClass(`${prefixCls}-checked`);
        });

        it.each(['small', 'large'] as const)('%s loading 保留对应尺寸', (size) => {
            setup({ size, loading: true });
            expect(getWrapper()).toHaveClass(`${prefixCls}-${size}`, `${prefixCls}-loading`);
            expect(document.querySelector(`.${prefixCls}-loading-spin`)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-${size}`);
        });

        it('disabled 和 loading 可同时生效', () => {
            setup({ disabled: true, loading: true });
            expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-loading`);
            expect(getSwitch()).toBeDisabled();
        });
    });

    describe('属性分流', () => {
        it.each([
            ['aria-label', 'Toggle switch'],
            ['aria-labelledby', 'switch-label'],
            ['aria-describedby', 'switch-description'],
            ['aria-invalid', 'true'],
            ['aria-errormessage', 'error-msg'],
            ['id', 'my-switch'],
            ['name', 'on'],
        ])('%s 落在控件，不落在根元素', (key, value) => {
            setup({ [key]: value } as SwitchProps);
            expect(getSwitch()).toHaveAttribute(key, value);
            expect(getWrapper()).not.toHaveAttribute(key);
        });

        it('aria-label 成为控件的可访问名称', () => {
            setup({ 'aria-label': 'Toggle switch' } as SwitchProps);
            expect(screen.getByRole('switch', { name: 'Toggle switch' })).toBe(getSwitch());
        });

        it('data-*、class、style、title 与点击监听落在根元素，tabindex 与 autofocus 落在控件', async () => {
            const click = vi.fn<(event: MouseEvent) => void>();
            setup({ class: 'test', style: 'color: red', title: 'tip', 'data-x': '1', tabindex: -1, autofocus: true, onclick: click } as SwitchProps);
            expect(getWrapper()).toHaveClass(prefixCls, 'test');
            expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(getWrapper()).toHaveAttribute('title', 'tip');
            expect(getWrapper()).toHaveAttribute('data-x', '1');
            expect(getWrapper()).not.toHaveAttribute('tabindex');
            expect(getWrapper()).not.toHaveAttribute('autofocus');
            expect(getSwitch()).not.toHaveAttribute('data-x');
            expect(getSwitch()).toHaveAttribute('tabindex', '-1');
            await fireEvent.click(getSwitch());
            expect(click).toHaveBeenCalledOnce();
        });

        it('属性更新后重新分流到当前元素', () => {
            const { store } = setup({ 'aria-label': 'before', tabindex: 0 } as SwitchProps);
            Object.assign(store.props, { 'aria-label': 'after', tabindex: -1, 'data-x': 'new' });
            flushSync();
            expect(screen.getByRole('switch', { name: 'after' })).toHaveAttribute('tabindex', '-1');
            expect(getWrapper()).toHaveAttribute('data-x', 'new');
        });

        it('mouseenter 与 mouseleave 接收原生事件', async () => {
            const enter = vi.fn<(event: MouseEvent) => void>();
            const leave = vi.fn<(event: MouseEvent) => void>();
            setup({ onmouseenter: enter, onmouseleave: leave } as SwitchProps);
            await fireEvent.mouseEnter(getWrapper());
            await fireEvent.mouseLeave(getWrapper());
            expect(enter).toHaveBeenCalledOnce();
            expect(leave).toHaveBeenCalledOnce();
            expect(enter.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
        });

        it('focus 与 blur 监听收到原生控件事件', async () => {
            const focus = vi.fn<(event: FocusEvent) => void>();
            const blur = vi.fn<(event: FocusEvent) => void>();
            setup({ onfocus: focus, onblur: blur } as SwitchProps);
            await userEvent.tab();
            expect(getSwitch()).toHaveFocus();
            await userEvent.tab();
            expect(focus).toHaveBeenCalledOnce();
            expect(blur).toHaveBeenCalledOnce();
            expect(blur.mock.calls[0]?.[0].target).toBe(getSwitch());
        });
    });

    describe('checkedText 与 uncheckedText', () => {
        it('随状态显示，外层带 x-semi-prop', async () => {
            setup({}, true);
            expect(screen.getByText('OFF').parentElement).toHaveAttribute('x-semi-prop', 'uncheckedText');
            await fireEvent.click(getSwitch());
            flushSync();
            expect(screen.getByText('ON').parentElement).toHaveAttribute('x-semi-prop', 'checkedText');
            expect(screen.queryByText('OFF')).toBeNull();
        });

        it.each([false, true])('选中=%s 时只显示当前文本', (checked) => {
            setup({ checked }, true);
            expect(screen.getByText(checked ? 'ON' : 'OFF')).toBeInTheDocument();
            expect(screen.queryByText(checked ? 'OFF' : 'ON')).toBeNull();
        });

        it.each([false, true])('small 在选中=%s 时不渲染文本', (checked) => {
            setup({ size: 'small', checked }, true);
            expect(screen.queryByText('ON')).toBeNull();
            expect(screen.queryByText('OFF')).toBeNull();
            expect(document.querySelector('[x-semi-prop]')).toBeNull();
        });

        it.each(['large', 'default'] as const)('%s 显示 checkedText', (size) => {
            setup({ size, checked: true }, true);
            expect(screen.getByText('ON')).toBeInTheDocument();
        });
    });

    describe('基本状态', () => {
        it.each(['small', 'default', 'large'] as const)('size=%s 使用对应类名', (size) => {
            setup({ size });
            expect(getWrapper()).toHaveClass(prefixCls);
            expect(getWrapper().classList.contains(`${prefixCls}-small`)).toBe(size === 'small');
            expect(getWrapper().classList.contains(`${prefixCls}-large`)).toBe(size === 'large');
        });

        it('disabled 用原生属性表达并随 props 更新', () => {
            const { store } = setup({ disabled: true });
            expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
            expect(getSwitch()).toBeDisabled();
            expect(getSwitch()).not.toHaveAttribute('aria-disabled');
            store.props.disabled = false;
            flushSync();
            expect(getWrapper()).not.toHaveClass(`${prefixCls}-disabled`);
            expect(getSwitch()).toBeEnabled();
        });

        it('原生输入是带 switch role 的 checkbox，状态由原生 checked 表达', async () => {
            setup({ checked: true });
            expect(getSwitch()).toHaveAttribute('type', 'checkbox');
            expect(getSwitch()).toHaveClass(`${prefixCls}-native-control`);
            expect(getSwitch()).toBeChecked();
            expect(getSwitch()).not.toHaveAttribute('aria-checked');
        });

        it('onChange 报告新值与原生 Event，连续切换逐次发出', async () => {
            const change = vi.fn<SwitchChange>();
            setup({ onChange: change });
            await fireEvent.click(getSwitch());
            await fireEvent.click(getSwitch());
            await fireEvent.click(getSwitch());
            expect(change.mock.calls.map(([value]) => value)).toEqual([true, false, true]);
            const event = change.mock.calls[0]?.[1] as Event;
            expect(event).toBeInstanceOf(Event);
            expect(event.type).toBe('change');
            expect(event.target).toBe(getSwitch());
        });

        it('Tab 进入与离开控件', async () => {
            setup();
            await userEvent.tab();
            expect(getSwitch()).toHaveFocus();
            await userEvent.tab();
            expect(getSwitch()).not.toHaveFocus();
        });

        it('卸载清理控件', () => {
            const { view } = setup();
            view.unmount();
            expect(screen.queryByRole('switch')).toBeNull();
        });
    });
});
