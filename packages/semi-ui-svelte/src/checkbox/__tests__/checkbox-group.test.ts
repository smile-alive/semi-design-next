import { type ComponentProps, flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import CheckboxGroup from '../checkbox-group.svelte';
import type { CheckboxGroupProps, CheckboxValue } from '../interface';
import GroupModes from './group-modes.svelte';
import Scenes from './scenes.svelte';

type GroupChange = (value: CheckboxValue[]) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-checkbox`;
const groupCls = `${BASE_CLASS_PREFIX}-checkboxGroup`;
const options = [
    { label: 'Abc', value: 'abc' },
    { label: 'Hotsoon', value: 'hotsoon' },
    { label: 'Pipixia', value: 'pipixia' },
    { label: 'Toutiao', value: 'toutiao' },
];
const getWrappers = () => Array.from(document.querySelectorAll<HTMLElement>(`.${prefixCls}`));
const checkedStates = () => getWrappers().map((wrapper) => wrapper.classList.contains(`${prefixCls}-checked`));
const inputStates = () => screen.getAllByRole<HTMLInputElement>('checkbox').map((input) => input.checked);
const getCheckbox = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name });
const renderOptions = (props: CheckboxGroupProps = {}) => render(CheckboxGroup, { props: { options, ...props } });

function scene(name: ComponentProps<typeof Scenes>['scene']) {
    const store = createStore({ log: [] as string[], show: false });
    render(Scenes, { props: { scene: name, store } });
    return store;
}

function setup(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: CheckboxValue[], accept = true) {
    const store = createStore<{ value: CheckboxValue[] | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(GroupModes, { props: { mode, store } });
    const click = async (name: string) => {
        await userEvent.click(getCheckbox(name));
        flushSync();
    };
    return { store, click };
}

describe('Svelte CheckboxGroup 受控值（$bindable）', () => {
    it('非受控：点击累加，再点取消，onChange 收到新数组', async () => {
        const { store, click } = setup('uncontrolled');
        await click('a');
        await click('b');
        await click('a');
        expect(store.log).toEqual(['change ["a"]', 'change ["a","b"]', 'change ["b"]']);
        expect(inputStates()).toEqual([false, true, false]);
    });

    it('bind:value：点击写回父级，父级改值同步，重置为 undefined 后清空', async () => {
        const { store, click } = setup('bind', ['a']);
        await click('b');
        expect(store.value).toEqual(['a', 'b']);
        store.value = ['c'];
        flushSync();
        expect(inputStates()).toEqual([false, false, true]);
        store.value = undefined;
        flushSync();
        expect(inputStates()).toEqual([false, false, false]);
        await click('b');
        expect(store.value).toEqual(['b']);
    });

    it('函数绑定：setter 拒绝时分组与原生 input 保持原值', async () => {
        const { store, click } = setup('function', ['a'], false);
        await click('b');
        expect(store.log).toEqual(['set ["a","b"]', 'change ["a","b"]']);
        expect(store.value).toEqual(['a']);
        expect(inputStates()).toEqual([true, false, false]);
        await click('a');
        expect(inputStates()).toEqual([true, false, false]);
    });

    it('函数绑定：setter 接受时分组跟随', async () => {
        const { store, click } = setup('function', ['a'], true);
        await click('b');
        expect(store.value).toEqual(['a', 'b']);
        expect(inputStates()).toEqual([true, true, false]);
    });

    it('单向传值：分组在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, click } = setup('one-way', ['a']);
        await click('b');
        expect(store.value).toEqual(['a']);
        expect(inputStates()).toEqual([true, true, false]);
        store.value = ['c'];
        flushSync();
        expect(inputStates()).toEqual([false, false, true]);
    });
});

describe('Svelte CheckboxGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在 role=group 的根元素', () => {
        render(CheckboxGroup, { props: { class: 'cbg-test', style: 'color: red', options } });
        const group = screen.getByRole('group');
        expect(group).toHaveClass(groupCls, `${groupCls}-wrapper`, `${groupCls}-vertical`, 'cbg-test');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('通过 options 声明', () => {
        const { container } = renderOptions();
        expect(container.querySelector(`.${groupCls}`)?.children).toHaveLength(4);
        const labels = Array.from(container.querySelectorAll(`.${prefixCls}-addon`), (node) => node.textContent);
        expect(labels).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'Toutiao']);
    });

    it('通过 children 声明，子项经 context 读取分组状态；子项与分组都触发 onChange', async () => {
        const store = scene('group-children');
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        expect(checkedStates()).toEqual([true, false, false]);
        await userEvent.click(getCheckbox('B'));
        flushSync();
        expect(store.log).toEqual(['item B', '["A","B"]']);
    });

    it('direction 与 card 类型的类名', () => {
        const view = renderOptions({ direction: 'horizontal' });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal`);
        expect(screen.getByRole('group')).not.toHaveClass(`${groupCls}-vertical`);
        view.unmount();
        render(CheckboxGroup, { props: { type: 'pureCard', direction: 'horizontal', options: ['a'] } });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal-cardType`, `${groupCls}-horizontal-pureCardType`);
        expect(document.querySelector(`.${prefixCls}-cardType`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
    });

    it('card 分组的已选禁用项带 cardType_checked_disabled', () => {
        renderOptions({ type: 'card', disabled: true, value: ['abc'] });
        const cards = document.querySelectorAll(`.${prefixCls}-cardType`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardType_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardType_checked_disabled`);
    });

    it('name 下发给所有 input；未设置时每组生成不同的名称', () => {
        const view = render(CheckboxGroup, { props: { name: 'checkboxgroup', options: ['Yes', 'No'] } });
        screen.getAllByRole('checkbox').forEach((el) => expect(el).toHaveAttribute('name', 'checkboxgroup'));
        view.unmount();
        render(CheckboxGroup, { props: { 'aria-label': 'one', options: ['a', 'b'] } });
        render(CheckboxGroup, { props: { 'aria-label': 'two', options: ['a', 'b'] } });
        const names = ['one', 'two'].map((groupName) => {
            const inputs = screen.getByRole('group', { name: groupName }).querySelectorAll('input');
            expect(inputs[0]?.name).toBeTruthy();
            expect(inputs[0]?.name).toBe(inputs[1]?.name);
            return inputs[0]?.name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('禁用分组不触发任何 onChange', async () => {
        const change = vi.fn<GroupChange>();
        const { container } = renderOptions({ onChange: change, disabled: true });
        expect(container.querySelectorAll(`.${prefixCls}-disabled`)).toHaveLength(4);
        screen.getAllByRole('checkbox').forEach((el) => expect(el).toBeDisabled());
        await userEvent.click(container.querySelector(`.${prefixCls}-inner`) as HTMLElement);
        expect(change).not.toHaveBeenCalled();
    });

    it('options 项的 class、style、extra、disabled 传给对应 checkbox，字符串项跟随分组', async () => {
        const change = vi.fn<GroupChange>();
        render(CheckboxGroup, {
            props: {
                onChange: change,
                options: ['plain', { label: 'A', value: 'a', extra: 'about a', class: 'opt-a', style: 'color: red' }, { label: 'B', value: 'b' }, { label: 'C', value: 'c', disabled: true }],
            },
        });
        const [plain, a, b, c] = getWrappers() as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
        expect(plain).toHaveTextContent('plain');
        expect(a).toHaveClass('opt-a');
        expect(a).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(a.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('about a');
        expect(c).toHaveClass(`${prefixCls}-disabled`);
        await userEvent.click(b);
        expect(change).toHaveBeenLastCalledWith(['b']);
        await userEvent.click(plain);
        expect(change).toHaveBeenLastCalledWith(['b', 'plain']);
        await fireEvent.click(c);
        expect(change).toHaveBeenCalledTimes(2);
    });

    it('options 项的 value 可以是 0 与 false', async () => {
        const change = vi.fn<GroupChange>();
        render(CheckboxGroup, {
            props: {
                value: [0],
                onChange: change,
                options: [
                    { label: 'zero', value: 0 },
                    { label: 'no', value: false },
                ],
            },
        });
        expect(getCheckbox('zero')).toBeChecked();
        expect(getCheckbox('no')).not.toBeChecked();
        await userEvent.click(getCheckbox('no'));
        expect(change).toHaveBeenLastCalledWith([0, false]);
    });

    it('label 与 extra 片段覆盖所有选项，字符串选项归一为对象', () => {
        scene('group-labels');
        expect(screen.getByText('0:plain').tagName).toBe('I');
        expect(screen.getByText('1:B')).toBeInTheDocument();
        expect(screen.getByText('extra-plain')).toBeInTheDocument();
        expect(screen.getByText('extra-b')).toBeInTheDocument();
    });

    it('没有 label 与 extra 时不渲染 content 与 addon', () => {
        render(CheckboxGroup, { props: { options: [{ value: 'a' }] } });
        expect(document.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-addon`)).toBeNull();
    });

    it('分组内没有 value 的 checkbox 独立工作，且不继承分组的 aria-invalid', async () => {
        const store = scene('group-mixed');
        expect(getCheckbox('A')).toHaveAttribute('aria-invalid', 'true');
        expect(getCheckbox('B')).toHaveAttribute('aria-invalid', 'false');
        const free = getCheckbox('free');
        expect(free).not.toHaveAttribute('name');
        expect(free).not.toHaveAttribute('aria-invalid');
        await userEvent.click(free);
        expect(free).toBeChecked();
        expect(store.log).toEqual(['free']);
    });

    it('aria-invalid 与 aria-errormessage 传给每个 input，aria-describedby 保留在根，aria-required 与 tabindex 被丢弃', () => {
        render(CheckboxGroup, {
            props: { 'aria-describedby': 'd', 'aria-errormessage': 'em', 'aria-invalid': true, 'aria-label': 'x', 'aria-required': true, tabindex: 0, options: ['a', { label: 'b', value: 'b' }] },
        });
        const root = screen.getByRole('group', { name: 'x' });
        expect(root).toHaveAttribute('aria-describedby', 'd');
        ['aria-invalid', 'aria-errormessage', 'aria-required', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        screen.getAllByRole('checkbox').forEach((input) => {
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-errormessage', 'em');
            expect(input).not.toHaveAttribute('aria-required');
        });
    });

    it('id、data-*、aria-labelledby 落在根元素', () => {
        render(CheckboxGroup, { props: { id: 'g-id', 'data-testid': 'g', 'aria-labelledby': 'lbl', title: 'fruits', options: ['a'] } });
        const list = screen.getByRole('group');
        expect(list).toHaveAttribute('id', 'g-id');
        expect(list).toHaveAttribute('data-testid', 'g');
        expect(list).toHaveAttribute('aria-labelledby', 'lbl');
        expect(list).toHaveAttribute('title', 'fruits');
    });

    it('onBlur：组内两个框之间移动不触发，焦点离开整个组触发一次', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(CheckboxGroup, { props: { options: ['a', 'b'], onBlur: blur } });
        await userEvent.tab();
        await userEvent.tab();
        expect(getCheckbox('b')).toHaveFocus();
        expect(blur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(blur).toHaveBeenCalledTimes(1);
        expect(blur.mock.calls[0]?.[0]).toBeInstanceOf(FocusEvent);
    });

    it('全局默认值生效，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { CheckboxGroup: { direction: 'horizontal', type: 'card' } };
        const view = renderOptions({ options: ['a'] });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal`);
        expect(getWrappers()[0]).toHaveClass(`${prefixCls}-cardType`);
        view.unmount();
        renderOptions({ options: ['a'], direction: 'vertical', type: 'default' });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-vertical`);
        expect(getWrappers()[0]).not.toHaveClass(`${prefixCls}-cardType`);
    });
});
