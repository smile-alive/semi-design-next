import { createSignal, For, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Checkbox, { CheckboxGroup, type CheckboxGroupProps, type CheckboxOptionItem, type CheckboxProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Popover from '../../popover';

const prefixCls = `${BASE_CLASS_PREFIX}-checkbox`;
const groupCls = `${BASE_CLASS_PREFIX}-checkboxGroup`;

type GroupChange = NonNullable<CheckboxGroupProps['onChange']>;
type ItemChange = NonNullable<CheckboxProps['onChange']>;

const options = [
    { label: 'Abc', value: 'abc' },
    { label: 'Hotsoon', value: 'hotsoon' },
    { label: 'Pipixia', value: 'pipixia' },
    { label: 'Toutiao', value: 'toutiao' },
];

const getCheckbox = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name });
const getWrappers = () => Array.from(document.querySelectorAll<HTMLElement>(`.${prefixCls}`));
const checkedStates = () => getWrappers().map((cb) => cb.classList.contains(`${prefixCls}-checked`));

describe('CheckboxGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在根元素，role 为 group', () => {
        render(() => <CheckboxGroup options={options} style={{ color: 'red' }} class="cbg-test" />);
        const group = screen.getByRole('group');
        expect(group).toHaveClass(groupCls, `${groupCls}-wrapper`, 'cbg-test');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('ref 指向根元素，未声明属性落在根元素', () => {
        let ref: HTMLDivElement | undefined;
        render(() => <CheckboxGroup ref={(node) => (ref = node)} title="fruits" options={['a']} />);
        expect(ref).toBe(screen.getByRole('group'));
        expect(ref).toHaveAttribute('title', 'fruits');
    });

    it('通过 options 声明', () => {
        render(() => <CheckboxGroup options={options} />);
        expect(screen.getByRole('group').children).toHaveLength(4);
        const labels = Array.from(document.querySelectorAll(`.${prefixCls}-addon`), (label) => label.textContent);
        expect(labels).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'Toutiao']);
    });

    it('通过 children 声明', () => {
        render(() => (
            <CheckboxGroup>
                <For each={options}>{(item) => <Checkbox value={item.value}>{item.label}</Checkbox>}</For>
            </CheckboxGroup>
        ));
        expect(screen.getByRole('group').children).toHaveLength(4);
        const labels = Array.from(document.querySelectorAll(`.${prefixCls}-addon`), (label) => label.textContent);
        expect(labels).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'Toutiao']);
    });

    it('基础渲染', () => {
        render(() => (
            <CheckboxGroup>
                <Checkbox value="A">A</Checkbox>
                <Checkbox value="B">B</Checkbox>
                <Checkbox value="C">C</Checkbox>
            </CheckboxGroup>
        ));
        expect(getWrappers()).toHaveLength(3);
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it.each(['horizontal', 'vertical'] as const)('direction %s', (direction) => {
        render(() => <CheckboxGroup direction={direction} options={['a']} />);
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-${direction}`);
    });

    it('name 传给每个 checkbox', () => {
        render(() => <CheckboxGroup name="checkboxgroup" options={['Yes', 'No']} />);
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
        checkboxes.forEach((el) => expect(el).toHaveAttribute('name', 'checkboxgroup'));
    });

    it('分组 onChange', async () => {
        const onChange = vi.fn<GroupChange>();
        render(() => <CheckboxGroup options={options} onChange={onChange} />);
        await userEvent.click(getCheckbox('Abc'));
        expect(onChange).toHaveBeenNthCalledWith(1, ['abc']);
        await userEvent.click(getCheckbox('Hotsoon'));
        expect(onChange).toHaveBeenNthCalledWith(2, ['abc', 'hotsoon']);
        await userEvent.click(getCheckbox('Pipixia'));
        expect(onChange).toHaveBeenNthCalledWith(3, ['abc', 'hotsoon', 'pipixia']);
        expect(onChange).toHaveBeenCalledTimes(3);
        expect(checkedStates()).toEqual([true, true, true, false]);
    });

    it('点击 checkbox 外层同样切换，只通知一次', async () => {
        const onChange = vi.fn<GroupChange>();
        render(() => <CheckboxGroup options={options} onChange={onChange} />);
        await userEvent.click(getWrappers()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['abc']);
    });

    it('禁用分组', async () => {
        const onChange = vi.fn<GroupChange>();
        render(() => <CheckboxGroup disabled options={options} onChange={onChange} />);
        expect(document.querySelectorAll(`.${prefixCls}-disabled`)).toHaveLength(4);
        screen.getAllByRole('checkbox').forEach((el) => expect(el).toBeDisabled());
        // the native input swallows clicks while disabled, so click the visible box
        await userEvent.click(document.querySelector(`.${prefixCls}-inner`) as HTMLElement);
        expect(onChange).not.toHaveBeenCalled();
        expect(getCheckbox('Abc')).not.toBeChecked();
    });

    it('defaultValue', async () => {
        const onChange = vi.fn<GroupChange>();
        render(() => <CheckboxGroup options={options} defaultValue={['hotsoon']} onChange={onChange} />);
        expect(getCheckbox('Hotsoon')).toBeChecked();
        expect(getCheckbox('Abc')).not.toBeChecked();
        await userEvent.click(getCheckbox('Abc'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['hotsoon', 'abc']);
    });

    it('受控 value 随 signal 更新', () => {
        const [value, setValue] = createSignal<string[] | undefined>(['A']);
        render(() => (
            <CheckboxGroup value={value()}>
                <Checkbox value="A">A</Checkbox>
                <Checkbox value="B">B</Checkbox>
                <Checkbox value="C">C</Checkbox>
            </CheckboxGroup>
        ));
        expect(checkedStates()).toEqual([true, false, false]);
        setValue(['B', 'C']);
        expect(checkedStates()).toEqual([false, true, true]);
    });

    it('受控分组只通知，value 变为 undefined 时清空', async () => {
        const onChange = vi.fn<GroupChange>();
        const [value, setValue] = createSignal<string[] | undefined>(['a']);
        render(() => (
            <CheckboxGroup value={value()} onChange={onChange}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox value="b">B</Checkbox>
            </CheckboxGroup>
        ));
        await userEvent.click(getWrappers()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(checkedStates()).toEqual([true, false]);
        expect(getCheckbox('B')).not.toBeChecked();
        setValue(['a', 'b']);
        expect(checkedStates()).toEqual([true, true]);
        setValue(undefined);
        expect(checkedStates()).toEqual([false, false]);
    });

    it('受控 value 每次传内容相同的新数组时不重置', async () => {
        const [value, setValue] = createSignal(['a']);
        render(() => (
            <CheckboxGroup value={value()}>
                <Checkbox value="a">A</Checkbox>
            </CheckboxGroup>
        ));
        setValue(['a']);
        expect(checkedStates()).toEqual([true]);
    });

    it('父组件挂载时就把 value 改为 undefined，组内清空', () => {
        function Demo() {
            const [value, setValue] = createSignal<string[] | undefined>(['a']);
            onMount(() => setValue(undefined));
            return (
                <CheckboxGroup value={value()}>
                    <Checkbox value="a">A</Checkbox>
                </CheckboxGroup>
            );
        }
        render(() => <Demo />);
        expect(checkedStates()).toEqual([false]);
    });

    it('非受控分组可取消已选值', async () => {
        const onChange = vi.fn<GroupChange>();
        render(() => (
            <CheckboxGroup defaultValue={['a']} onChange={onChange}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox value="b">B</Checkbox>
            </CheckboxGroup>
        ));
        expect(checkedStates()).toEqual([true, false]);
        await userEvent.click(getWrappers()[0]);
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(checkedStates()).toEqual([false, false]);
    });

    it('子 Checkbox 与分组都触发 onChange', async () => {
        const onItemChange = vi.fn<ItemChange>();
        const onGroupChange = vi.fn<GroupChange>();
        render(() => (
            <CheckboxGroup onChange={onGroupChange}>
                <Checkbox value="my" onChange={onItemChange} />
            </CheckboxGroup>
        ));
        await userEvent.click(screen.getByRole('checkbox'));
        expect(onItemChange).toHaveBeenCalledTimes(1);
        expect(onGroupChange).toHaveBeenCalledTimes(1);
        expect(onGroupChange).toHaveBeenCalledWith(['my']);
    });

    it('card 类型，禁用且选中的卡片带 cardType_checked_disabled', () => {
        const { unmount } = render(() => <CheckboxGroup type="card" options={options} />);
        expect(document.querySelector(`.${prefixCls}-cardType`)).not.toBeNull();
        unmount();

        // a string instead of an array on purpose: the group must still mark the matching card checked
        render(() => <CheckboxGroup type="card" disabled defaultValue={'abc' as unknown as string[]} options={options} />);
        const cards = document.querySelectorAll(`.${prefixCls}-cardType`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardType_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardType_checked_disabled`);
    });

    it('pureCard 类型将子项标记为纯卡片并保留 direction 类名', () => {
        render(() => <CheckboxGroup type="pureCard" direction="horizontal" options={['a']} />);
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal-cardType`, `${groupCls}-horizontal-pureCardType`);
        expect(document.querySelector(`.${prefixCls}-cardType`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
    });

    it('文本子节点原样渲染而不抛错', () => {
        render(() => (
            <CheckboxGroup>
                plain text
                <Checkbox value="a">A</Checkbox>
            </CheckboxGroup>
        ));
        expect(screen.getByText('plain text', { exact: false })).toBeInTheDocument();
        expect(getCheckbox('A')).toBeInTheDocument();
    });

    it('条件插入子项后已有 Checkbox 的 DOM 节点保持不变', () => {
        const [show, setShow] = createSignal(false);
        render(() => (
            <CheckboxGroup>
                {show() ? <Checkbox value="x">X</Checkbox> : null}
                <Checkbox value="a">A</Checkbox>
            </CheckboxGroup>
        ));
        const before = getCheckbox('A');
        setShow(true);
        expect(getCheckbox('X')).toBeInTheDocument();
        expect(getCheckbox('A')).toBe(before);
    });

    it('options 将 extra、class、style、onChange 与 disabled 传给每个 checkbox', async () => {
        const onOptionChange = vi.fn<ItemChange>();
        const onChange = vi.fn<GroupChange>();
        render(() => <CheckboxGroup options={['plain', { label: 'A', value: 'a', extra: 'about a', class: 'opt-a', style: { color: 'red' } }, { label: 'B', value: 'b', onChange: onOptionChange }, { label: 'C', value: 'c', disabled: true }]} onChange={onChange} />);
        const [plain, a, b, c] = getWrappers();
        expect(plain).toHaveTextContent('plain');
        expect(a).toHaveClass('opt-a');
        expect(a).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(a.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('about a');
        expect(c).toHaveClass(`${prefixCls}-disabled`);
        getWrappers().forEach((wrapper) => expect(wrapper).not.toHaveAttribute('role'));
        await userEvent.click(b);
        expect(onOptionChange).toHaveBeenCalledTimes(1);
        expect(onOptionChange.mock.calls[0][0].target).toStrictEqual({ checked: true, value: 'b', name: b.querySelector('input')?.name, disabled: false });
        expect(b.querySelector('input')?.name).toBeTruthy();
        expect(onChange).toHaveBeenLastCalledWith(['b']);
        await userEvent.click(plain);
        expect(onChange).toHaveBeenLastCalledWith(['b', 'plain']);
        fireEvent.click(c);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('options 随 signal 更新', () => {
        const [list, setList] = createSignal<string[]>(['a', 'b']);
        render(() => <CheckboxGroup options={list()} />);
        expect(getWrappers()).toHaveLength(2);
        setList(['a', 'b', 'c']);
        expect(getWrappers().map((cb) => cb.textContent)).toEqual(['a', 'b', 'c']);
    });

    it('启用的分组中，禁用的子项保持禁用', () => {
        render(() => (
            <CheckboxGroup>
                <Checkbox value="a">A</Checkbox>
                <Checkbox disabled value="b">
                    B
                </Checkbox>
            </CheckboxGroup>
        ));
        const [a, b] = getWrappers();
        expect(a).not.toHaveClass(`${prefixCls}-disabled`);
        expect(b).toHaveClass(`${prefixCls}-disabled`);
    });

    it('分组内没有 value 的 checkbox 独立工作', async () => {
        const onChange = vi.fn<GroupChange>();
        render(() => (
            <CheckboxGroup value={['a']} onChange={onChange}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox>free</Checkbox>
            </CheckboxGroup>
        ));
        const free = getWrappers()[1];
        await userEvent.click(free);
        expect(onChange).not.toHaveBeenCalled();
        expect(free).toHaveClass(`${prefixCls}-checked`);
        expect(getCheckbox('free')).not.toHaveAttribute('name');
    });

    it('aria-label、id、data-* 与 aria-describedby 落在根元素', () => {
        render(() => <CheckboxGroup id="g-id" data-testid="g" aria-label="Checkbox group" aria-describedby="desc" aria-labelledby="lbl" options={['a']} />);
        const list = screen.getByRole('group');
        expect(list).toHaveAttribute('data-testid', 'g');
        expect(list).toHaveAttribute('id', 'g-id');
        expect(list).toHaveAttribute('aria-label', 'Checkbox group');
        expect(list).toHaveAttribute('aria-labelledby', 'lbl');
        expect(list).toHaveAttribute('aria-describedby', 'desc');
    });

    it('作为 Popover 触发器时，根元素不带 aria-expanded、aria-haspopup、aria-controls 与 tabIndex', async () => {
        render(() => (
            <Popover content={<div>popup</div>} trigger="click">
                {(trigger) => <CheckboxGroup aria-label="x" options={['a']} {...trigger()} />}
            </Popover>
        ));
        const root = screen.getByRole('group', { name: 'x' });
        const absent = () => ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        absent();
        await userEvent.click(root);
        expect(await screen.findByText('popup')).toBeInTheDocument();
        absent();
    });

    it('未设置 name 的分组为其 checkbox 生成一个名称，且与其他分组不同', () => {
        render(() => (
            <>
                <CheckboxGroup aria-label="one" options={['a', 'b']} />
                <CheckboxGroup aria-label="two" options={['a', 'b']} />
            </>
        ));
        const names = ['one', 'two'].map((label) => {
            const inputs = screen.getByRole('group', { name: label }).querySelectorAll('input');
            expect(inputs[0].name).toBeTruthy();
            expect(inputs[0].name).toBe(inputs[1].name);
            return inputs[0].name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('分组将 aria-invalid 与 aria-errormessage 传给每个 input，aria-describedby 保留在根元素，并丢弃 aria-required', () => {
        render(() => <CheckboxGroup aria-describedby="d" aria-errormessage="em" aria-invalid aria-label="x" aria-required options={['a', { label: 'b', value: 'b' }]} />);
        const root = screen.getByRole('group', { name: 'x' });
        expect(root).toHaveAttribute('aria-describedby', 'd');
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        screen.getAllByRole('checkbox').forEach((input) => {
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-errormessage', 'em');
            expect(input).not.toHaveAttribute('aria-required');
        });
    });

    it('Checkbox 自身的 aria-invalid 优先于分组', () => {
        render(() => (
            <CheckboxGroup aria-invalid>
                <Checkbox aria-invalid={false} value="a">
                    a
                </Checkbox>
                <Checkbox value="b">b</Checkbox>
            </CheckboxGroup>
        ));
        expect(getCheckbox('a')).toHaveAttribute('aria-invalid', 'false');
        expect(getCheckbox('b')).toHaveAttribute('aria-invalid', 'true');
    });

    it('onBlur 在焦点移出分组时调用一次，组内移动不调用', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(() => (
            <>
                <CheckboxGroup onBlur={onBlur} options={['a', 'b']} />
                <button type="button">outside</button>
            </>
        ));
        await userEvent.tab();
        await userEvent.tab();
        expect(getCheckbox('b')).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
        await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1));
    });

    it('Form 注入的 validateStatus 不进入 DOM', () => {
        render(() => <CheckboxGroup {...({ validateStatus: 'error' } as object)} options={['a']} />);
        expect(screen.getByRole('group')).not.toHaveAttribute('validatestatus');
        expect(screen.getByRole('group')).not.toHaveAttribute('validateStatus');
    });

    it('CheckboxGroup 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { CheckboxGroup: { direction: 'horizontal', type: 'card' } };
        render(() => <CheckboxGroup options={['a']} />);
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal`);
        expect(getWrappers()[0]).toHaveClass(`${prefixCls}-cardType`);
    });

    it('options 与 value 的类型', () => {
        expectTypeOf<CheckboxGroupProps['options']>().toEqualTypeOf<Array<string | CheckboxOptionItem> | undefined>();
        expectTypeOf<{ label: string; value: boolean }>().toExtend<CheckboxOptionItem>();
        expectTypeOf<{ lable: string }>().not.toExtend<CheckboxOptionItem>();
        expectTypeOf<NonNullable<CheckboxGroupProps['value']>>().toEqualTypeOf<Array<string | number | boolean>>();
        expectTypeOf<CheckboxProps['name']>().toEqualTypeOf<string | undefined>();
    });

    it('展开信号对象时，无关属性变化不重置非受控的选中项', async () => {
        const [props, setProps] = createSignal<CheckboxGroupProps>({ options });
        render(() => <CheckboxGroup {...props()} />);
        await userEvent.click(getCheckbox(options[1].label));
        expect(getCheckbox(options[1].label).checked).toBe(true);
        setProps({ options, class: 'other' });
        expect(document.querySelector(`.${groupCls}.other`)).not.toBeNull();
        expect(getCheckbox(options[1].label).checked).toBe(true);
    });
});
