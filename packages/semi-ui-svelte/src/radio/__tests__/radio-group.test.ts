import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { RadioChangeEvent, RadioGroupProps, RadioValue } from '../interface';
import RadioGroup from '../radio-group.svelte';
import GroupFixture from './group-fixture.svelte';
import GroupModes from './group-modes.svelte';

const prefix = `${BASE_CLASS_PREFIX}-radio`;
const groupCls = `${BASE_CLASS_PREFIX}-radioGroup`;
const getRadio = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name });
const states = () => ['A', 'B', 'C'].map((name) => getRadio(name).checked);
async function click(el: Element) {
    await fireEvent.click(el);
    flushSync();
}
function renderChildren(props: RadioGroupProps = {}) {
    const store = createStore({ props });
    render(GroupFixture, { props: { store } });
    return store;
}
const renderOptions = (props: RadioGroupProps = {}) => render(RadioGroup, { props: { options: ['A', 'B', 'C'], ...props } });

function setup(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: RadioValue, accept = true, extra: RadioGroupProps = {}) {
    const store = createStore<{ value: RadioValue | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(GroupModes, { props: { mode, store, extra } });
    return { store };
}

describe('Svelte RadioGroup 受控值（$bindable）', () => {
    it('非受控：点击选中，onChange 收到新值，点已选项不触发', async () => {
        const { store } = setup('uncontrolled');
        await click(getRadio('B'));
        expect(states()).toEqual([false, true, false]);
        await click(getRadio('B'));
        await click(getRadio('C'));
        expect(store.log).toEqual(['change B', 'change C']);
    });

    it('bind:value：点击写回父级，父级改值同步，重置为 undefined 后没有选中项', async () => {
        const { store } = setup('bind', 'A');
        expect(states()).toEqual([true, false, false]);
        await click(getRadio('B'));
        expect(store.value).toBe('B');
        store.value = 'C';
        flushSync();
        expect(states()).toEqual([false, false, true]);
        store.value = undefined;
        flushSync();
        expect(states()).toEqual([false, false, false]);
        await click(getRadio('A'));
        expect(states()).toEqual([true, false, false]);
    });

    it('函数绑定：setter 拒绝时保持原值，被浏览器取消的同名兄弟恢复为选中', async () => {
        const { store } = setup('function', 'A', false);
        await click(getRadio('C'));
        expect(store.log).toEqual(['set C', 'change C']);
        expect(store.value).toBe('A');
        expect(states()).toEqual([true, false, false]);
        await click(getRadio('B'));
        expect(states()).toEqual([true, false, false]);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store } = setup('function', 'A', true);
        await click(getRadio('C'));
        expect(store.value).toBe('C');
        expect(states()).toEqual([false, false, true]);
    });

    it('单向传值：组件在本地覆盖，父级再推值时以父级为准', async () => {
        const { store } = setup('one-way', 'A');
        await click(getRadio('B'));
        expect(store.value).toBe('A');
        expect(states()).toEqual([false, true, false]);
        store.value = 'C';
        flushSync();
        expect(states()).toEqual([false, false, true]);
    });

    it('高级模式 bind：取消选中报告 undefined 并写回', async () => {
        const { store } = setup('bind', 'A', true, { mode: 'advanced' });
        await click(getRadio('A'));
        expect(store.value).toBeUndefined();
        expect(store.log.at(-1)).toBe('change undefined');
        expect(states()).toEqual([false, false, false]);
        await click(getRadio('B'));
        expect(states()).toEqual([false, true, false]);
    });

    it('高级模式非受控：先选中、取消、再选另一项', async () => {
        const { store } = setup('uncontrolled', undefined, true, { mode: 'advanced' });
        await click(getRadio('A'));
        await click(getRadio('A'));
        expect(states()).toEqual([false, false, false]);
        await click(getRadio('B'));
        expect(states()).toEqual([false, true, false]);
        expect(store.log).toEqual(['change A', 'change undefined', 'change B']);
    });
});

describe('Svelte RadioGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('radio 与 radioGroup 同时存在时都触发 change', async () => {
        const groupChange = vi.fn<(event: RadioChangeEvent) => void>();
        renderChildren({ value: 'B', onChange: groupChange });
        await click(getRadio('A'));
        expect(groupChange).toHaveBeenCalledTimes(1);
        expect(groupChange.mock.calls[0]?.[0].target).toEqual({ checked: true, value: 'A', name: expect.any(String), disabled: false });
        expect(Object.keys(groupChange.mock.calls[0]?.[0].target ?? {}).sort()).toEqual(['checked', 'disabled', 'name', 'value']);
    });

    it('使用 options 的 group 中 onChange 只触发一次', async () => {
        const onChange = vi.fn<(event: RadioChangeEvent) => void>();
        renderOptions({ onChange });
        await click(getRadio('A'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('没有 value 的 radio 在组内不被选中', () => {
        render(RadioGroup, { props: { options: [{ label: 'x' }, { label: 'y' }] } });
        expect(getRadio('x')).not.toBeChecked();
        expect(getRadio('y')).not.toBeChecked();
    });

    it('options：字符串与带单项属性的对象', () => {
        render(RadioGroup, {
            props: {
                value: 2,
                options: [
                    { label: 'One', value: 1, extra: 'first', class: 'opt1', style: 'color: red', addonId: 'a1', extraId: 'e1', addonClass: 'ac1', addonStyle: 'color: blue' },
                    { label: 'Two', value: 2, disabled: true },
                ],
            },
        });
        const one = getRadio('One');
        expect(one).toHaveAttribute('aria-labelledby', 'a1');
        expect(one).toHaveAttribute('aria-describedby', 'e1');
        expect(document.getElementById('e1')).toHaveTextContent('first');
        const label = document.querySelector('.opt1');
        expect(label).toHaveClass(prefix);
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.getElementById('a1')).toHaveClass('ac1');
        expect(getRadio('Two')).toBeDisabled();
        expect(getRadio('Two')).toBeChecked();
        expect(one).not.toBeDisabled();
    });

    it('options 项的 value 可以是 0 与 false', async () => {
        const onChange = vi.fn<(event: RadioChangeEvent) => void>();
        render(RadioGroup, {
            props: {
                value: false,
                onChange,
                options: [
                    { label: 'zero', value: 0 },
                    { label: 'no', value: false },
                ],
            },
        });
        expect(getRadio('no')).toBeChecked();
        expect(getRadio('zero')).not.toBeChecked();
        await click(getRadio('zero'));
        expect(onChange.mock.calls[0]?.[0].target.value).toBe(0);
    });

    it('label 与 extra snippet 覆盖所有选项，字符串选项归一为对象', () => {
        const store = createStore({ props: { options: ['plain', { label: 'B', value: 'b', extra: 'x' }] } as RadioGroupProps });
        render(GroupFixture, { props: { store, snippets: true } });
        expect(screen.getByText('0:plain').tagName).toBe('I');
        expect(screen.getByText('1:B')).toBeInTheDocument();
        expect(screen.getByText('extra-plain')).toBeInTheDocument();
        expect(screen.getByText('extra-b')).toBeInTheDocument();
    });

    it('button 类型的 group 不渲染 extra snippet', () => {
        const store = createStore({ props: { type: 'button', options: ['plain'] } as RadioGroupProps });
        render(GroupFixture, { props: { store, snippets: true } });
        expect(screen.queryByText('extra-plain')).toBeNull();
    });

    it('所有子项都有 name，未传时同组共用生成的 name 且与其他组不同', () => {
        renderChildren({ name: 'radiogroup' });
        screen.getAllByRole('radio').forEach((el) => expect(el).toHaveAttribute('name', 'radiogroup'));
        document.body.innerHTML = '';
        render(RadioGroup, { props: { options: ['A', 'B'], 'aria-label': 'one' } });
        render(RadioGroup, { props: { options: ['A', 'B'], 'aria-label': 'two' } });
        const names = ['one', 'two'].map((label) => {
            const radios = screen.getByRole('radiogroup', { name: label }).querySelectorAll('input');
            expect(radios[0]?.name).toBeTruthy();
            expect(radios[0]?.name).toBe(radios[1]?.name);
            return radios[0]?.name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('button 与 card 样式', async () => {
        const first = renderChildren({ type: 'button', value: 'B', buttonSize: 'large' });
        expect(document.querySelectorAll(`.${prefix}-addon-buttonRadio-large`)).toHaveLength(3);
        expect(document.querySelectorAll(`.${prefix}-addon-buttonRadio`)[1]).toHaveClass(`${prefix}-addon-buttonRadio-checked`);
        expect(screen.getByRole('radiogroup')).toHaveClass(`${groupCls}-buttonRadio`);
        expect(screen.getByRole('radiogroup')).not.toHaveClass(`${groupCls}-horizontal`);
        first.props.type = 'card';
        first.props.direction = 'vertical';
        flushSync();
        await click(getRadio('C'));
        expect(document.querySelectorAll(`.${prefix}-cardRadioGroup`)[2]).toHaveClass(`${prefix}-cardRadioGroup_checked`);
        expect(document.querySelector(`.${groupCls}-vertical-card`)).not.toBeNull();
    });

    it('disabled group 与 card 的选中禁用类名', () => {
        renderChildren({ disabled: true, type: 'pureCard', value: 'A' });
        screen.getAllByRole('radio').forEach((input) => expect(input).toBeDisabled());
        const cards = document.querySelectorAll(`.${prefix}-cardRadioGroup`);
        expect(cards[0]).toHaveClass(`${prefix}-cardRadioGroup_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefix}-cardRadioGroup_checked_disabled`);
        expect(document.querySelector(`.${prefix}-inner-pureCardRadio`)).not.toBeNull();
    });

    it('direction 为 horizontal 与 vertical', () => {
        const store = renderChildren({ direction: 'horizontal' });
        expect(document.querySelector(`.${groupCls}-horizontal`)).not.toBeNull();
        store.props.direction = 'vertical';
        flushSync();
        expect(document.querySelector(`.${groupCls}-vertical`)).not.toBeNull();
    });

    it('value 为 NaN 时没有选中项', () => {
        renderChildren({ value: NaN as unknown as number });
        expect(document.querySelector(`.${prefix}-checked`)).toBeNull();
    });

    it('根元素是 radiogroup，id、aria-*、data-*、class、style 与 onclick 落在根元素，去掉 aria-expanded、aria-haspopup、aria-controls、tabindex', async () => {
        const onclick = vi.fn<() => void>();
        renderChildren({ id: 'gid', 'aria-label': 'x', 'aria-required': true, 'aria-invalid': true, 'data-test': 'x', class: 'gc', style: 'color: red', title: 'tip', onclick, 'aria-expanded': true, 'aria-haspopup': 'dialog', 'aria-controls': 'c', tabindex: 0 } as RadioGroupProps);
        const root = screen.getByRole('radiogroup', { name: 'x' });
        expect(root).toHaveAttribute('id', 'gid');
        expect(root).toHaveAttribute('aria-required', 'true');
        expect(root).toHaveAttribute('aria-invalid', 'true');
        expect(root).toHaveAttribute('data-test', 'x');
        expect(root).toHaveAttribute('title', 'tip');
        expect(root).toHaveClass('gc', groupCls);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        screen.getAllByRole('radio').forEach((radio) => {
            ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(radio).not.toHaveAttribute(name));
        });
        await click(root);
        expect(onclick).toHaveBeenCalledOnce();
    });

    it('Radio 的 name 优先于 group 的 name', () => {
        const store = createStore({ props: { name: 'g', options: [{ label: 'A', value: 'A' }] } as RadioGroupProps });
        render(GroupFixture, { props: { store } });
        expect(getRadio('A')).toHaveAttribute('name', 'g');
    });

    it('group 的 prefixCls 作用于各 radio 的根，且优先于 Radio 的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { prefixCls: 'gx' } };
        renderChildren({ prefixCls: 'my-group' });
        expect(screen.getByRole('radiogroup')).toHaveClass('my-group', 'my-group-wrapper');
        const labels = document.querySelectorAll('label.my-group');
        expect(labels).toHaveLength(3);
        expect(document.querySelector('label.gx')).toBeNull();
    });

    it('全局默认值生效，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { RadioGroup: { type: 'button', buttonSize: 'small' } };
        const first = renderChildren();
        expect(document.querySelectorAll(`.${prefix}-addon-buttonRadio-small`)).toHaveLength(3);
        first.props.type = 'default';
        flushSync();
        expect(document.querySelectorAll(`.${prefix}-addon-buttonRadio-small`)).toHaveLength(0);
    });
});

describe('Svelte RadioGroup 使用方监听', () => {
    it('传入 onfocusout 时与 onBlur 同时触发，且组内移动焦点不触发 onBlur', async () => {
        const onfocusout = vi.fn<() => void>();
        const onBlur = vi.fn<() => void>();
        renderOptions({ onfocusout, onBlur } as RadioGroupProps);
        await fireEvent.focusOut(getRadio('A'), { relatedTarget: getRadio('B') });
        expect(onfocusout).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await fireEvent.focusOut(getRadio('A'), { relatedTarget: document.body });
        expect(onfocusout).toHaveBeenCalledTimes(2);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});
