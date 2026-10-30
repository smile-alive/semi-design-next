import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { RadioChangeEvent, RadioProps } from '../interface';
import Radio from '../radio.svelte';
import Peers from './peers.svelte';
import RadioFixture from './radio-fixture.svelte';
import RadioModes from './radio-modes.svelte';

const prefix = `${BASE_CLASS_PREFIX}-radio`;
const getRadio = () => screen.getByRole<HTMLInputElement>('radio');
const getLabel = () => document.querySelector<HTMLLabelElement>('label') as HTMLLabelElement;
async function click(el: Element) {
    await fireEvent.click(el);
    flushSync();
}
function fixture(props: RadioProps = {}, label = 'A', extra?: string) {
    const store = createStore({ props, label, extra });
    render(RadioFixture, { props: { store } });
    return store;
}

function setup(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: boolean, accept = true, extra: RadioProps = {}) {
    const store = createStore<{ value: boolean | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(RadioModes, { props: { mode, store, extra } });
    return { store, input: getRadio() };
}

describe('Svelte Radio 受控值（$bindable）', () => {
    it('非受控：点击选中，onChange 报告 checked', async () => {
        const { store, input } = setup('uncontrolled');
        expect(input.checked).toBe(false);
        await click(input);
        expect(input.checked).toBe(true);
        expect(getLabel()).toHaveClass(`${prefix}-checked`);
        expect(store.log).toEqual(['change true']);
    });

    it('bind:checked：点击写回父级，父级改值同步到组件，重置为 undefined 后未选中', async () => {
        const { store, input } = setup('bind', false);
        await click(input);
        expect(store.value).toBe(true);
        expect(input.checked).toBe(true);
        store.value = false;
        flushSync();
        expect(input.checked).toBe(false);
        await click(input);
        store.value = undefined;
        flushSync();
        expect(input.checked).toBe(false);
        expect(getLabel()).not.toHaveClass(`${prefix}-checked`);
    });

    it('函数绑定：setter 拒绝时组件保持原值，DOM 不翻转', async () => {
        const { store, input } = setup('function', false, false);
        await click(input);
        expect(store.log).toEqual(['set true', 'change true']);
        expect(store.value).toBe(false);
        expect(input.checked).toBe(false);
        expect(getLabel()).not.toHaveClass(`${prefix}-checked`);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store, input } = setup('function', false, true);
        await click(input);
        expect(store.value).toBe(true);
        expect(input.checked).toBe(true);
    });

    it('单向传值：组件在本地覆盖，父级再推值时以父级为准', async () => {
        const { store, input } = setup('one-way', false);
        await click(input);
        expect(store.value).toBe(false);
        expect(input.checked).toBe(true);
        store.value = true;
        flushSync();
        store.value = false;
        flushSync();
        expect(input.checked).toBe(false);
    });

    it('高级模式 bind：取消选中报告 false，选中图标消失', async () => {
        const { store, input } = setup('bind', true, true, { mode: 'advanced' });
        expect(document.querySelector(`.${prefix} svg`)).not.toBeNull();
        await click(input);
        expect(store.value).toBe(false);
        expect(store.log.at(-1)).toBe('change false');
        expect(document.querySelector(`.${prefix} svg`)).toBeNull();
        await click(input);
        expect(input.checked).toBe(true);
    });

    it('组外同名的非受控 Radio 互斥，先选中的取消选中状态与类名', async () => {
        render(Peers);
        await click(screen.getByRole('radio', { name: 'A' }));
        await click(screen.getByRole('radio', { name: 'B' }));
        const [a, b] = Array.from(document.querySelectorAll(`.${prefix}`));
        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(a).not.toHaveClass(`${prefix}-checked`);
        expect(b).toHaveClass(`${prefix}-checked`);
    });
});

describe('Svelte Radio', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('基础功能正常', () => {
        render(Radio);
        expect(getRadio()).not.toBeChecked();
        expect(getRadio()).not.toBeDisabled();
        expect(getRadio()).toHaveAttribute('type', 'radio');
    });

    it('checked 为 true 时选中，disabled 时禁用且点击不触发 onChange', async () => {
        const onChange = vi.fn<(event: RadioChangeEvent) => void>();
        render(Radio, { props: { checked: true, disabled: true, onChange } });
        expect(getRadio()).toBeChecked();
        expect(getRadio()).toBeDisabled();
        await click(getRadio());
        expect(onChange).not.toHaveBeenCalled();
        expect(getLabel()).toHaveClass(`${prefix}-disabled`);
    });

    it('onChange 事件的 target 只含 checked、value、name、disabled', async () => {
        const onChange = vi.fn<(event: RadioChangeEvent) => void>();
        render(Radio, { props: { value: 'v1', name: 'n1', onChange } });
        await click(getRadio());
        const [event] = onChange.mock.calls[0] as [RadioChangeEvent];
        expect(event.target).toEqual({ checked: true, value: 'v1', name: 'n1', disabled: false });
        expect(typeof event.stopPropagation).toBe('function');
        expect(typeof event.preventDefault).toBe('function');
    });

    it('高级模式：点击已选中项取消选中', async () => {
        const onChange = vi.fn<(event: RadioChangeEvent) => void>();
        render(Radio, { props: { mode: 'advanced', onChange } });
        await click(getRadio());
        expect(getRadio()).toBeChecked();
        await click(getRadio());
        expect(getRadio()).not.toBeChecked();
        expect(getLabel()).not.toHaveClass(`${prefix}-checked`);
        expect(onChange.mock.calls.map(([event]) => event.target.checked)).toEqual([true, false]);
    });

    it.each([
        ['button', `${prefix}-buttonRadioComponent`],
        ['card', `${prefix}-cardRadioGroup`],
        ['pureCard', `${prefix}-inner-pureCardRadio`],
    ] as const)('type=%s 样式', (type, cls) => {
        render(Radio, { props: { type } });
        expect(document.querySelector(`.${cls}`)).not.toBeNull();
    });

    it('displayMode 为 vertical', () => {
        render(Radio, { props: { displayMode: 'vertical' } });
        expect(document.querySelector(`.${prefix}-vertical`)).not.toBeNull();
    });

    it('value 进入原生 input，表单序列化得到该值', () => {
        render(Radio, { props: { name: 'fruit', value: 'apple', checked: true } });
        expect(getRadio()).toHaveAttribute('value', 'apple');
    });

    it('根元素上使用方的 onclick，点击文字时只调用一次', async () => {
        const onclick = vi.fn<() => void>();
        fixture({ onclick }, 'label');
        await click(screen.getByText('label'));
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(getRadio()).toBeChecked();
    });

    it('aria-label、id、tabindex 落在原生 input，data-* 与 title 落在 label', () => {
        render(Radio, { props: { 'aria-label': 'Test radio', id: 'r-id', tabindex: 0, title: 'tip', 'data-x': 'y' } as RadioProps });
        expect(getRadio()).toHaveAttribute('aria-label', 'Test radio');
        expect(getRadio()).toHaveAttribute('id', 'r-id');
        expect(getRadio()).toHaveAttribute('tabindex', '0');
        expect(getLabel()).not.toHaveAttribute('aria-label');
        expect(getLabel()).not.toHaveAttribute('id');
        expect(getLabel()).toHaveAttribute('title', 'tip');
        expect(getLabel()).toHaveAttribute('data-x', 'y');
    });

    it('name 作用于 input 而非 label', () => {
        render(Radio, { props: { name: 'n' } });
        expect(getRadio()).toHaveAttribute('name', 'n');
        expect(getLabel()).not.toHaveAttribute('name');
    });

    it('class、style、prefixCls 作用于根 label', () => {
        render(Radio, { props: { prefixCls: 'my-radio', class: 'c', style: 'color: red' } });
        expect(getLabel()).toHaveClass('c', 'my-radio');
        expect(getLabel()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.querySelector('.my-radio-inner')).not.toBeNull();
    });

    it('不输出 aria-invalid、aria-errormessage、aria-required，无效时错误信息进入描述', () => {
        render(Radio, { props: { 'aria-invalid': true, 'aria-errormessage': 'err', 'aria-required': true, 'aria-label': 'A' } as RadioProps });
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(getRadio()).not.toHaveAttribute(name));
        expect(getRadio()).toHaveAttribute('aria-describedby', 'err');
    });

    it('没有 children 或 extra 时，不包含 addon、extra 或 aria 引用', () => {
        render(Radio);
        expect(document.querySelector(`.${prefix}-content`)).toBeNull();
        expect(getRadio()).not.toHaveAttribute('aria-labelledby');
        expect(getRadio()).not.toHaveAttribute('aria-describedby');
    });

    it('extra 带 x-semi-prop，aria-labelledby 与 aria-describedby 指向 addon 与 extra', () => {
        fixture({}, 'Radio with extra', 'Extra information');
        const extra = document.querySelector(`.${prefix}-extra`) as HTMLElement;
        const addon = document.querySelector(`.${prefix}-addon`) as HTMLElement;
        expect(extra).toHaveTextContent(/^Extra information$/);
        expect(extra).toHaveAttribute('x-semi-prop', 'extra');
        expect(addon).toHaveAttribute('x-semi-prop', 'children');
        expect(getRadio()).toHaveAttribute('aria-describedby', extra.id);
        expect(getRadio()).toHaveAttribute('aria-labelledby', addon.id);
        expect(screen.getByRole('radio', { name: 'Radio with extra' })).toHaveAccessibleDescription('Extra information');
    });

    it('自定义 addonId、extraId，调用方的 aria-describedby 一并保留', () => {
        fixture({ addonId: 'my-addon', extraId: 'my-extra', 'aria-describedby': 'outer' } as RadioProps, 'A', 'more');
        expect(getRadio()).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(getRadio()).toHaveAttribute('aria-describedby', 'outer my-extra');
        expect(document.getElementById('my-addon')).toHaveTextContent('A');
    });

    it('button 类型隐藏 extra，应用 addonClassName 与 addonStyle，选中后带选中类名', async () => {
        fixture({ type: 'button', addonClassName: 'ac', addonStyle: 'color: red' }, 'A', 'more');
        const addon = document.querySelector(`.${prefix}-addon-buttonRadio`) as HTMLElement;
        expect(addon).toHaveClass('ac');
        expect(addon).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.querySelector(`.${prefix}-extra`)).toBeNull();
        expect(getRadio()).not.toHaveAttribute('aria-describedby');
        await click(getRadio());
        expect(addon).toHaveClass(`${prefix}-addon-buttonRadio-checked`);
    });

    it('card 类型的选中类名', async () => {
        fixture({ type: 'card' });
        await click(getRadio());
        expect(getLabel()).toHaveClass(`${prefix}-cardRadioGroup_checked`);
        expect(document.querySelector(`.${prefix}-isCardRadioGroup_content`)).not.toBeNull();
    });

    it('focus 与 blur 方法', () => {
        const { component } = render(Radio) as unknown as { component: { focus: () => void; blur: () => void } };
        component.focus();
        expect(getRadio()).toHaveFocus();
        component.blur();
        expect(getRadio()).not.toHaveFocus();
    });

    it('focus 将 preventScroll 传给原生 input', () => {
        const { component } = render(Radio, { props: { preventScroll: true } }) as unknown as { component: { focus: () => void } };
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        component.focus();
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        focus.mockRestore();
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { type: 'button' } };
        const first = render(Radio);
        expect(document.querySelector(`.${prefix}-buttonRadioComponent`)).not.toBeNull();
        first.unmount();
        render(Radio, { props: { type: 'card' } });
        expect(document.querySelector(`.${prefix}-buttonRadioComponent`)).toBeNull();
        expect(document.querySelector(`.${prefix}-cardRadioGroup`)).not.toBeNull();
    });

    it('全局默认值里的 addonId、extraId 不影响 Radio', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { addonId: 'addon-global', extraId: 'extra-global' } } as object;
        fixture({}, 'A', 'E');
        expect(document.getElementById('addon-global')).toBeNull();
        expect(document.getElementById('extra-global')).toBeNull();
    });
});
