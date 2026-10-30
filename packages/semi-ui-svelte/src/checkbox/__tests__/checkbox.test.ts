import { type ComponentProps, createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Checkbox from '../checkbox.svelte';
import type { CheckboxEvent } from '../interface';
import CheckboxModes from './checkbox-modes.svelte';
import Scenes from './scenes.svelte';

type Change = (event: CheckboxEvent) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-checkbox`;
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('checkbox');
const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));
const label = text('Semi Design');

function scene(name: ComponentProps<typeof Scenes>['scene'], props: { stop?: boolean } = {}) {
    const store = createStore({ log: [] as string[], show: false });
    render(Scenes, { props: { scene: name, store, ...props } });
    return store;
}

function setup(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: boolean, accept = true) {
    const store = createStore<{ value: boolean | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(CheckboxModes, { props: { mode, store } });
    const input = getInput();
    const click = async () => {
        await userEvent.click(getWrapper());
        flushSync();
    };
    return { store, input, click };
}

describe('Svelte Checkbox 受控值（$bindable）', () => {
    it('非受控：点击切换，onChange 收到新值', async () => {
        const { store, input, click } = setup('uncontrolled');
        await click();
        expect(input.checked).toBe(true);
        await click();
        expect(input.checked).toBe(false);
        expect(store.log).toEqual(['change true', 'change false']);
    });

    it('bind:checked：点击写回父级，父级改值同步到组件，重置为 undefined 后取消勾选', async () => {
        const { store, input, click } = setup('bind', false);
        await click();
        expect(store.value).toBe(true);
        expect(input.checked).toBe(true);
        store.value = false;
        flushSync();
        expect(input.checked).toBe(false);
        await click();
        store.value = undefined;
        flushSync();
        expect(input.checked).toBe(false);
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
        await click();
        expect(input.checked).toBe(true);
    });

    it('函数绑定：setter 拒绝时组件保持原值，DOM 也不翻转', async () => {
        const { store, input, click } = setup('function', false, false);
        await click();
        expect(store.log).toEqual(['set true', 'change true']);
        expect(store.value).toBe(false);
        expect(input.checked).toBe(false);
        await userEvent.click(input);
        flushSync();
        expect(input.checked).toBe(false);
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store, input, click } = setup('function', false, true);
        await click();
        expect(store.value).toBe(true);
        expect(input.checked).toBe(true);
    });

    it('单向传值：组件在本地覆盖并翻转，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, input, click } = setup('one-way', false);
        await click();
        expect(store.value).toBe(false);
        expect(input.checked).toBe(true);
        store.value = true;
        flushSync();
        store.value = false;
        flushSync();
        expect(input.checked).toBe(false);
    });
});

describe('Svelte Checkbox', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在根元素', () => {
        render(Checkbox, { props: { class: 'test', style: 'color: red', children: label } });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('禁用状态不触发 onChange', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { disabled: true, onChange: change, children: label } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).toBeDisabled();
        await fireEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
        expect(change).not.toHaveBeenCalled();
    });

    it('onChange 的 target 只含 checked、value、name、disabled，nativeEvent 是原生点击', async () => {
        const change = vi.fn<Change>();
        render(Checkbox, { props: { value: 'v', name: 'n', onChange: change, children: label, extra: text('e') } });
        await userEvent.click(getWrapper());
        const [event] = change.mock.calls[0] as [CheckboxEvent];
        expect(event.target).toEqual({ checked: true, value: 'v', name: 'n', disabled: false });
        expect(event.nativeEvent).toBeInstanceOf(MouseEvent);
        expect(event.nativeEvent.type).toBe('click');
    });

    it('extra 片段：带 x-semi-prop 且被 aria-describedby 引用', () => {
        render(Checkbox, { props: { children: label, extra: text('abcd') } });
        const extra = document.querySelector(`.${prefixCls}-extra`) as HTMLElement;
        expect(extra).toHaveTextContent(/^abcd$/);
        expect(extra).toHaveAttribute('x-semi-prop', 'extra');
        expect(getInput()).toHaveAttribute('aria-describedby', extra.id);
    });

    it('半选状态：显示半选图标，原生 indeterminate，选中后显示勾选图标', () => {
        const { unmount } = render(Checkbox, { props: { indeterminate: true, children: label } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-indeterminate`);
        expect(getInput()).toBePartiallyChecked();
        expect(getInput()).not.toHaveAttribute('aria-checked');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_indeterminate`)).not.toBeNull();
        unmount();
        render(Checkbox, { props: { indeterminate: true, checked: true, children: label } });
        expect(getInput()).toBeChecked();
        expect(getInput()).not.toBePartiallyChecked();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_tick`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_indeterminate`)).toBeNull();
    });

    it('点击原生输入后被拒绝的半选仍保持 indeterminate', async () => {
        const store = scene('rejecting-indeterminate');
        await userEvent.click(getInput());
        flushSync();
        expect(store.log).toEqual(['set true']);
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

    it('value 进入原生 input，表单序列化得到该值；没有 value 时得到浏览器默认的 on', () => {
        scene('form');
        expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('value', 'apple');
        const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
        expect(data.get('fruit')).toBe('apple');
        expect(data.has('plain')).toBe(false);
    });

    it('aria 属性落在原生 input，aria-labelledby 与 addon id 合并，根元素没有 aria', () => {
        render(Checkbox, {
            props: { 'aria-describedby': 'desc', 'aria-errormessage': 'err', 'aria-invalid': true, 'aria-label': 'agree', 'aria-labelledby': 'outer', 'aria-required': true, children: label },
        });
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'agree');
        expect(input).toHaveAttribute('aria-describedby', 'desc');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'err');
        expect(input).toHaveAttribute('aria-required', 'true');
        const addon = document.querySelector(`.${prefixCls}-addon`) as HTMLElement;
        expect(addon.id).not.toBe('');
        expect(input).toHaveAttribute('aria-labelledby', `outer ${addon.id}`);
        expect(getWrapper()).not.toHaveAttribute('aria-labelledby');
    });

    it('addonId 与 extraId 用作 id', () => {
        render(Checkbox, { props: { addonId: 'my-addon', extraId: 'my-extra', children: label, extra: text('more') } });
        expect(document.querySelector(`.${prefixCls}-addon`)).toHaveAttribute('id', 'my-addon');
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveAttribute('id', 'my-extra');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(getInput()).toHaveAttribute('aria-describedby', 'my-extra');
    });

    it('无 children 与 extra 时不渲染 content', () => {
        render(Checkbox, { props: { 'aria-label': 'bare' } });
        expect(document.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('data-*、role、onclick 落在根元素；id、name、tabindex 落在 input，onclick 在切换前调用', async () => {
        const order: string[] = [];
        render(Checkbox, {
            props: {
                id: 'cb-id',
                name: 'agree',
                'data-testid': 'cb',
                role: 'none',
                tabindex: -1,
                title: 'tip',
                onclick: () => order.push(`click ${getInput().checked}`),
                onChange: () => order.push('change'),
                children: label,
            },
        });
        const wrapper = getWrapper();
        expect(wrapper).toHaveAttribute('data-testid', 'cb');
        expect(wrapper).toHaveAttribute('role', 'none');
        expect(wrapper).toHaveAttribute('title', 'tip');
        expect(wrapper).not.toHaveAttribute('id');
        expect(wrapper).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('id', 'cb-id');
        expect(getInput()).toHaveAttribute('name', 'agree');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
        await userEvent.click(wrapper);
        expect(order).toEqual(['click false', 'change']);
        expect(getInput()).toBeChecked();
    });

    it('focus 与 blur 监听收到原生 input 事件', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(Checkbox, { props: { onfocus: focus, onblur: blur } });
        await userEvent.tab();
        await userEvent.tab();
        expect(focus).toHaveBeenCalledOnce();
        expect(blur).toHaveBeenCalledOnce();
        expect(blur.mock.calls[0]?.[0].target).toBe(getInput());
    });

    it('autofocus 在挂载后聚焦 input', async () => {
        const store = scene('late');
        store.show = true;
        flushSync();
        await Promise.resolve();
        expect(getInput()).toHaveFocus();
    });

    it('点击文字时聚焦原生 input', async () => {
        render(Checkbox, { props: { children: label } });
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
        expect(getInput()).toHaveFocus();
    });

    it('focus 与 blur 方法，focus 把 preventScroll 传给 input', () => {
        const view = render(Checkbox, { props: { preventScroll: true } });
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        try {
            view.component.focus();
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            focus.mockRestore();
        }
        expect(getInput()).toHaveFocus();
        view.component.blur();
        expect(getInput()).not.toHaveFocus();
    });

    it('点击内容里的链接与按钮不切换，点击普通文字仍切换', async () => {
        const store = scene('interactive');
        await userEvent.click(screen.getByRole('link', { name: 'terms' }));
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        await userEvent.click(screen.getByRole('link', { name: 'extra link' }));
        expect(getInput()).not.toBeChecked();
        expect(store.log).toEqual([]);
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
        expect(getInput()).toBeChecked();
        expect(store.log).toEqual(['change']);
    });

    it('onChange 中的 stopPropagation 转发给原生 click', async () => {
        const store = scene('propagation');
        await userEvent.click(getWrapper());
        expect(store.log).toEqual([]);
    });

    it('onChange 中不阻止时点击冒泡到父元素', async () => {
        const store = scene('propagation', { stop: false });
        await userEvent.click(getWrapper());
        expect(store.log).toEqual(['parent']);
    });

    it('onChange 中调用 nativeEvent.stopImmediatePropagation 会阻止原生事件继续传播', async () => {
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

    it('全选：半选随分组变化，全选时回写分组', async () => {
        scene('check-all');
        const all = screen.getByRole('checkbox', { name: 'all' });
        expect(all).toBePartiallyChecked();
        await userEvent.click(all);
        expect(screen.getAllByRole('checkbox').every((input) => (input as HTMLInputElement).checked)).toBe(true);
        expect(all).not.toBePartiallyChecked();
        await userEvent.click(all);
        expect(screen.getAllByRole('checkbox').some((input) => (input as HTMLInputElement).checked)).toBe(false);
    });

    it('card 与 pureCard 类型，卡片的 extra 在没有标题时带 noChildren 类', () => {
        const { unmount } = render(Checkbox, { props: { type: 'card', children: label } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).toBeNull();
        unmount();
        render(Checkbox, { props: { type: 'pureCard', extra: text('more') } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveClass(`${prefixCls}-cardType_extra_noChildren`);
    });

    it('prefixCls 替换所有类名前缀', () => {
        render(Checkbox, { props: { prefixCls: 'my-cb', children: label } });
        expect(document.querySelector('.my-cb')).not.toBeNull();
        expect(document.querySelector('.my-cb-inner-display')).not.toBeNull();
        expect(document.querySelector('.my-cb-addon')).not.toBeNull();
    });

    it('全局默认值生效，显式 props 优先，addonId 与 extraId 不受全局默认值影响', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets them anyway
        semiGlobal.config.overrideDefaultProps = { Checkbox: { type: 'card', addonId: 'addon-global' } } as object;
        const first = render(Checkbox, { props: { children: label } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.getElementById('addon-global')).toBeNull();
        first.unmount();
        render(Checkbox, { props: { type: 'default', children: label } });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-cardType`);
    });
});
