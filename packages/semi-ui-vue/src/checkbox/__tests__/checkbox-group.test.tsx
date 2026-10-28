/** @jsxImportSource vue */
import { shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Checkbox, { CheckboxGroup } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { CheckboxEvent, CheckboxGroupEmits, CheckboxGroupProps, CheckboxGroupSlots, CheckboxOptionItem, CheckboxValue } from '../interface';
import Conditional from './fixtures/conditional.vue';
import GroupModel from './fixtures/group-model.vue';
import PopoverFixture from './fixtures/in-popover.vue';

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
const getCheckbox = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name });
const abc = () => ['A', 'B', 'C'].map((value) => <Checkbox value={value}>{() => value}</Checkbox>);
const renderOptions = (props: CheckboxGroupProps & { onChange?: GroupChange } = {}) => render(CheckboxGroup, { props: { options, ...props } });
const renderChildren = (props: CheckboxGroupProps & { onChange?: GroupChange } = {}) => render(CheckboxGroup, { props, slots: { default: abc } });

describe('CheckboxGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在 role=group 的根元素', () => {
        render(CheckboxGroup, { attrs: { class: 'cbg-test', style: { color: 'red' } }, props: { options } });
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

    it('通过默认插槽声明，子项的 Checkbox 无需 prop 下发', () => {
        const { container } = renderChildren();
        expect(container.querySelector(`.${groupCls}`)?.children).toHaveLength(3);
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        expect(getWrappers()).toHaveLength(3);
    });

    it('direction', () => {
        const { container } = renderOptions({ direction: 'horizontal' });
        expect(container.querySelector(`div.${groupCls}-horizontal`)).not.toBeNull();
        expect(screen.getByRole('group')).not.toHaveClass(`${groupCls}-vertical`);
    });

    it('垂直方向', () => {
        renderOptions({ direction: 'vertical' });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-vertical`);
    });

    it('name 下发给所有 input', () => {
        render(CheckboxGroup, { props: { name: 'checkboxgroup', options: ['Yes', 'No'] } });
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
        checkboxes.forEach((el) => expect(el).toHaveAttribute('name', 'checkboxgroup'));
    });

    it('未设置 name 的分组为其 checkbox 生成一个名称，且与其他分组不同', () => {
        render({
            render: () => (
                <>
                    <CheckboxGroup aria-label="one" options={['a', 'b']} />
                    <CheckboxGroup aria-label="two" options={['a', 'b']} />
                </>
            ),
        });
        const names = ['one', 'two'].map((groupName) => {
            const inputs = screen.getByRole('group', { name: groupName }).querySelectorAll('input');
            expect(inputs[0]?.name).toBeTruthy();
            expect(inputs[0]?.name).toBe(inputs[1]?.name);
            return inputs[0]?.name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('分组 change 报告新的数组，同时发出 update:modelValue', async () => {
        const change = vi.fn<GroupChange>();
        const update = vi.fn<GroupChange>();
        renderOptions({ onChange: change, 'onUpdate:modelValue': update } as CheckboxGroupProps);
        await userEvent.click(getCheckbox('Abc'));
        expect(change).toHaveBeenNthCalledWith(1, ['abc']);
        await userEvent.click(getCheckbox('Hotsoon'));
        expect(change).toHaveBeenNthCalledWith(2, ['abc', 'hotsoon']);
        await userEvent.click(getCheckbox('Pipixia'));
        expect(change).toHaveBeenNthCalledWith(3, ['abc', 'hotsoon', 'pipixia']);
        expect(change).toHaveBeenCalledTimes(3);
        expect(update).toHaveBeenLastCalledWith(['abc', 'hotsoon', 'pipixia']);
        expect(checkedStates()).toEqual([true, true, true, false]);
    });

    it('禁用分组不触发任何 change', async () => {
        const change = vi.fn<GroupChange>();
        const { container } = renderOptions({ onChange: change, disabled: true });
        expect(container.querySelectorAll(`.${prefixCls}-disabled`)).toHaveLength(4);
        screen.getAllByRole('checkbox').forEach((el) => expect(el).toBeDisabled());
        // The native input swallows clicks while disabled, so click the visible box the user sees.
        await userEvent.click(container.querySelector(`.${prefixCls}-inner`) as HTMLElement);
        expect(change).not.toHaveBeenCalled();
        expect(getCheckbox('Abc')).not.toBeChecked();
    });

    it('defaultValue', async () => {
        const change = vi.fn<GroupChange>();
        renderOptions({ onChange: change, defaultValue: ['hotsoon'] });
        expect(getCheckbox('Hotsoon')).toBeChecked();
        expect(getCheckbox('Abc')).not.toBeChecked();
        await userEvent.click(getCheckbox('Abc'));
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledWith(['hotsoon', 'abc']);
    });

    it('modelValue 受控，变化时当次渲染就生效', async () => {
        const view = renderChildren({ modelValue: ['A'] });
        expect(checkedStates()).toEqual([true, false, false]);
        await view.rerender({ modelValue: ['B', 'C'] });
        expect(checkedStates()).toEqual([false, true, true]);
        expect(screen.getAllByRole<HTMLInputElement>('checkbox').map((input) => input.checked)).toEqual([false, true, true]);
    });

    it('modelValue 内容相同的新数组不重置内部状态', async () => {
        const view = renderChildren({ modelValue: ['A'] });
        await view.rerender({ modelValue: ['A'] });
        expect(checkedStates()).toEqual([true, false, false]);
    });

    it('子 Checkbox 与分组都触发 change', async () => {
        const itemChange = vi.fn<(event: CheckboxEvent) => void>();
        const groupChange = vi.fn<GroupChange>();
        render(CheckboxGroup, {
            props: { onChange: groupChange },
            slots: { default: () => <Checkbox value="my" onChange={itemChange} /> },
        });
        await userEvent.click(screen.getByRole('checkbox'));
        expect(itemChange).toHaveBeenCalledTimes(1);
        expect(groupChange).toHaveBeenCalledTimes(1);
        expect(groupChange).toHaveBeenCalledWith(['my']);
    });

    it('card 类型', () => {
        const view = renderOptions({ type: 'card' });
        expect(document.querySelector(`.${prefixCls}-cardType`)).not.toBeNull();
        view.unmount();
        // a string instead of an array on purpose: the group must still mark the matching card checked
        renderOptions({ type: 'card', disabled: true, defaultValue: 'abc' as unknown as string[] });
        const cards = document.querySelectorAll(`.${prefixCls}-cardType`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardType_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardType_checked_disabled`);
    });

    it('pureCard 类型', () => {
        const view = renderOptions({ type: 'pureCard' });
        expect(document.querySelector(`.${prefixCls}-cardType`)).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
        view.unmount();
        renderOptions({ type: 'pureCard', disabled: true, defaultValue: 'abc' as unknown as string[] });
        const cards = document.querySelectorAll(`.${prefixCls}-cardType`);
        expect(cards[0]).toHaveClass(`${prefixCls}-cardType_checked_disabled`);
        expect(cards[1]).not.toHaveClass(`${prefixCls}-cardType_checked_disabled`);
    });

    it('pureCard 分组将子项标记为纯卡片并保留 direction 类名', () => {
        render(CheckboxGroup, { props: { type: 'pureCard', direction: 'horizontal', options: ['a'] } });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal-cardType`, `${groupCls}-horizontal-pureCardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
    });

    it('文本子节点原样渲染而不抛错', () => {
        render(CheckboxGroup, { slots: { default: () => ['plain text', <Checkbox value="a">{() => 'A'}</Checkbox>] } });
        expect(screen.getByText('plain text')).toBeInTheDocument();
        expect(getCheckbox('A')).toBeInTheDocument();
    });

    it('带 key 的子项条件插入后已有 Checkbox 的 DOM 节点保持不变', async () => {
        const view = render(Conditional, { props: { show: false } });
        const before = getCheckbox('A');
        await view.rerender({ show: true });
        expect(getCheckbox('A')).toBe(before);
        expect(getCheckbox('X')).toBeInTheDocument();
    });

    it('options 项的 class、style、extra、disabled 传给对应 checkbox，字符串项跟随分组', async () => {
        const change = vi.fn<GroupChange>();
        render(CheckboxGroup, {
            props: {
                onChange: change,
                options: ['plain', { label: 'A', value: 'a', extra: 'about a', class: 'opt-a', style: { color: 'red' } }, { label: 'B', value: 'b' }, { label: 'C', value: 'c', disabled: true }],
            },
        });
        const [plain, a, b, c] = getWrappers() as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
        expect(plain).toHaveTextContent('plain');
        expect(a).toHaveClass('opt-a');
        expect(a).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(a.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('about a');
        expect(c).toHaveClass(`${prefixCls}-disabled`);
        getWrappers().forEach((wrapper) => expect(wrapper).not.toHaveAttribute('role'));
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
                modelValue: [0],
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

    it('#label 与 #extra 作用域插槽覆盖所有选项，字符串选项归一为对象', () => {
        render(CheckboxGroup, {
            props: { options: ['plain', { label: 'B', value: 'b', extra: 'x' }] },
            slots: {
                label: ({ option, index }: { option: CheckboxOptionItem; index: number }) => <i>{`${index}:${option.label}`}</i>,
                extra: ({ option }: { option: CheckboxOptionItem }) => <b>{`extra-${String(option.value)}`}</b>,
            },
        });
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

    it('启用的分组中，禁用的子项保持禁用', () => {
        render(CheckboxGroup, {
            slots: {
                default: () => (
                    <>
                        <Checkbox value="a">{() => 'A'}</Checkbox>
                        <Checkbox disabled value="b">
                            {() => 'B'}
                        </Checkbox>
                    </>
                ),
            },
        });
        const [a, b] = getWrappers();
        expect(a).not.toHaveClass(`${prefixCls}-disabled`);
        expect(b).toHaveClass(`${prefixCls}-disabled`);
    });

    it('非受控分组可取消已选值', async () => {
        const change = vi.fn<GroupChange>();
        render(CheckboxGroup, { props: { defaultValue: ['a'], onChange: change, options: ['a', 'b'] } });
        expect(checkedStates()).toEqual([true, false]);
        await userEvent.click(getWrappers()[0] as HTMLElement);
        expect(change).toHaveBeenLastCalledWith([]);
        expect(checkedStates()).toEqual([false, false]);
    });

    it('受控分组只通知，modelValue 变为 undefined 时清空', async () => {
        const change = vi.fn<GroupChange>();
        const view = render(CheckboxGroup, { props: { modelValue: ['a'], onChange: change, options: ['a', 'b'] } });
        await userEvent.click(getWrappers()[1] as HTMLElement);
        expect(change).toHaveBeenLastCalledWith(['a', 'b']);
        expect(checkedStates()).toEqual([true, false]);
        await view.rerender({ modelValue: ['a', 'b'] });
        expect(checkedStates()).toEqual([true, true]);
        await view.rerender({ modelValue: undefined });
        expect(checkedStates()).toEqual([false, false]);
    });

    it('单向受控分组被拒绝后，原生 input 恢复为受控值', async () => {
        const view = render(CheckboxGroup, { props: { modelValue: ['a'], options: ['a', 'b'] } });
        await userEvent.click(getCheckbox('b'));
        await userEvent.click(getCheckbox('a'));
        expect(screen.getAllByRole<HTMLInputElement>('checkbox').map((input) => input.checked)).toEqual([true, false]);
        await view.rerender({ modelValue: ['a'], disabled: false });
        expect(screen.getAllByRole<HTMLInputElement>('checkbox').map((input) => input.checked)).toEqual([true, false]);
    });

    it('v-model 双向同步，变回 undefined 后清空为 []', async () => {
        const change = vi.fn<GroupChange>();
        render(GroupModel, { props: { onChange: change } });
        await userEvent.click(getCheckbox('b'));
        expect(change).toHaveBeenLastCalledWith(['a', 'b']);
        expect(screen.getByLabelText('model')).toHaveTextContent('["a","b"]');
        await userEvent.click(screen.getByRole('button', { name: 'pick c' }));
        expect(checkedStates()).toEqual([false, false, true]);
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(checkedStates()).toEqual([false, false, false]);
        await userEvent.click(getCheckbox('b'));
        expect(change).toHaveBeenLastCalledWith(['b']);
    });

    it('分组内没有 value 的 checkbox 独立工作', async () => {
        const change = vi.fn<GroupChange>();
        render(CheckboxGroup, {
            props: { modelValue: ['a'], onChange: change },
            slots: {
                default: () => (
                    <>
                        <Checkbox value="a">{() => 'A'}</Checkbox>
                        <Checkbox>{() => 'free'}</Checkbox>
                    </>
                ),
            },
        });
        await userEvent.click(getWrappers()[1] as HTMLElement);
        expect(change).not.toHaveBeenCalled();
        expect(getWrappers()[1]).toHaveClass(`${prefixCls}-checked`);
        expect(getCheckbox('free')).not.toHaveAttribute('name');
    });

    it('组件的 $el 是 role=group 的列表，未声明的属性落在其上', () => {
        const group = shallowRef<InstanceType<typeof CheckboxGroup> | null>(null);
        render(() => <CheckboxGroup ref={group} options={['a']} title="fruits" />);
        const list = screen.getByRole('group');
        expect(group.value?.$el).toBe(list);
        expect(list).toHaveAttribute('title', 'fruits');
    });

    it('id、data-*、aria-labelledby 与 aria-describedby 落在 role=group 的根元素', () => {
        render(CheckboxGroup, {
            attrs: {
                id: 'g-id',
                'data-testid': 'g',
                'aria-describedby': 'desc',
                'aria-labelledby': 'lbl',
                title: 'fruits',
            },
            props: { options: ['a'] },
        });
        const list = screen.getByRole('group');
        expect(list).toHaveAttribute('data-testid', 'g');
        expect(list).toHaveAttribute('id', 'g-id');
        expect(list).toHaveAttribute('aria-labelledby', 'lbl');
        expect(list).toHaveAttribute('aria-describedby', 'desc');
        expect(list).toHaveAttribute('title', 'fruits');
    });

    it('aria-label 命名 group', () => {
        render(CheckboxGroup, { attrs: { 'aria-label': 'Checkbox group' }, slots: { default: abc } });
        expect(screen.getByRole('group', { name: 'Checkbox group' })).toHaveClass(`${groupCls}-wrapper`);
    });

    it('作为 Popover 触发器时，分组根元素不带 aria-expanded、aria-haspopup、aria-controls 与 tabindex', async () => {
        render(PopoverFixture);
        const root = screen.getByRole('group', { name: 'x' });
        const absent = () => ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        absent();
        await userEvent.click(root);
        expect(await screen.findByText('popup')).toBeInTheDocument();
        absent();
    });

    it('aria-invalid 与 aria-errormessage 传给每个 input，aria-describedby 保留在根，aria-required 被丢弃', () => {
        render(CheckboxGroup, {
            attrs: {
                'aria-describedby': 'd',
                'aria-errormessage': 'em',
                'aria-invalid': true,
                'aria-label': 'x',
                'aria-required': true,
            },
            props: { options: ['a', { label: 'b', value: 'b' }] },
        });
        const root = screen.getByRole('group', { name: 'x' });
        expect(root).toHaveAttribute('aria-describedby', 'd');
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        screen.getAllByRole('checkbox').forEach((input) => {
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-errormessage', 'em');
            expect(input).not.toHaveAttribute('aria-required');
        });
    });

    it('分组 aria-invalid 在重新渲染后更新到各 input', async () => {
        const view = render(CheckboxGroup, { attrs: { 'aria-invalid': true }, props: { options: ['a'] } });
        expect(getCheckbox('a')).toHaveAttribute('aria-invalid', 'true');
        await view.rerender({ 'aria-invalid': false, 'aria-errormessage': 'em' });
        expect(getCheckbox('a')).toHaveAttribute('aria-invalid', 'false');
        expect(getCheckbox('a')).toHaveAttribute('aria-errormessage', 'em');
    });

    it('Checkbox 自身的 aria-invalid 优先于分组', () => {
        render(CheckboxGroup, {
            attrs: { 'aria-invalid': true },
            slots: {
                default: () => (
                    <>
                        <Checkbox value="a" aria-invalid={false}>
                            {() => 'a'}
                        </Checkbox>
                        <Checkbox value="b">{() => 'b'}</Checkbox>
                    </>
                ),
            },
        });
        expect(getCheckbox('a')).toHaveAttribute('aria-invalid', 'false');
        expect(getCheckbox('b')).toHaveAttribute('aria-invalid', 'true');
    });

    it('blur：组内两个框之间移动不触发，焦点离开整个组触发一次', async () => {
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
        const view = render(CheckboxGroup, { props: { options: ['a'] } });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-horizontal`);
        expect(getWrappers()[0]).toHaveClass(`${prefixCls}-cardType`);
        view.unmount();
        render(CheckboxGroup, { props: { options: ['a'], direction: 'vertical', type: 'default' } });
        expect(screen.getByRole('group')).toHaveClass(`${groupCls}-vertical`);
        expect(getWrappers()[0]).not.toHaveClass(`${prefixCls}-cardType`);
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { CheckboxGroup: { disabled: true, defaultValue: ['a'] } };
        render(CheckboxGroup, {
            props: { options: ['a', 'b'] },
            global: { provide: { [semiGlobalKey as symbol]: semi } },
        });
        expect(getCheckbox('a')).toBeChecked();
        expect(getCheckbox('b')).toBeDisabled();
    });

    it('options 与 value 的类型与运行时一致', () => {
        expectTypeOf<CheckboxGroupProps['options']>().toEqualTypeOf<Array<string | CheckboxOptionItem> | undefined>();
        expectTypeOf<{ label: string; value: boolean }>().toExtend<CheckboxOptionItem>();
        expectTypeOf<{ lable: string }>().not.toExtend<CheckboxOptionItem>();
        expectTypeOf<CheckboxOptionItem>().not.toHaveProperty('onChange');
        expectTypeOf<NonNullable<CheckboxGroupProps['modelValue']>>().toEqualTypeOf<Array<string | number | boolean>>();
        expectTypeOf<CheckboxOptionItem['label']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<CheckboxOptionItem['extra']>().toEqualTypeOf<string | number | undefined>();
    });

    it('事件与插槽的载荷类型', () => {
        expectTypeOf<CheckboxGroupEmits['change']>().toEqualTypeOf<[value: CheckboxValue[]]>();
        expectTypeOf<CheckboxGroupEmits['blur']>().toEqualTypeOf<[event: FocusEvent]>();
        expectTypeOf<Parameters<NonNullable<CheckboxGroupSlots['label']>>[0]>().toEqualTypeOf<{
            option: CheckboxOptionItem;
            index: number;
        }>();
    });
});
