import { createRef, StrictMode, type MouseEventHandler } from 'react';
import { renderToString } from 'react-dom/server';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Checkbox, Popover } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { Form } from '@fibrae/semi-ui-react/form';
import Tooltip from '@fibrae/semi-ui-react/tooltip';
import type { CheckboxEvent, CheckboxGroupProps, CheckboxHandle, CheckboxProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-checkbox`;

function renderCb(props: CheckboxProps = {}) {
    return render(<Checkbox {...props}>Semi Design</Checkbox>);
}

const getWrapper = () => document.querySelector(`.${prefixCls}`);
const getWrappers = () => Array.from(document.querySelectorAll(`.${prefixCls}`));
const getInput = () => screen.getByRole('checkbox');

describe('checkbox', () => {
    it('className 与 style', () => {
        renderCb({
            className: 'test',
            style: { color: 'red' },
        });
        const wrapper = document.querySelector(`.${prefixCls}.test`);
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('autoFocus 在挂载后聚焦 input', () => {
        render(<Checkbox autoFocus>Semi Design</Checkbox>);
        expect(getInput()).toHaveFocus();
    });

    it('点击内容里的链接与按钮不切换，点击普通文字仍切换', async () => {
        render(
            <Checkbox extra={<a href="#extra">extra link</a>}>
                agree <a href="#terms">terms</a> <button type="button">more</button>
            </Checkbox>
        );
        await userEvent.click(screen.getByRole('link', { name: 'terms' }));
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        await userEvent.click(screen.getByRole('link', { name: 'extra link' }));
        expect(getInput()).not.toBeChecked();
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`));
        expect(getInput()).toBeChecked();
    });

    it('基本功能与点击行为', async () => {
        renderCb();
        expect(getInput()).not.toBeChecked();
        expect(getInput()).toBeEnabled();
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-checked`);
    });

    it('defaultChecked 生效', () => {
        renderCb({ defaultChecked: true });
        expect(getInput()).toBeChecked();
    });

    it('checked 受控模式', () => {
        const { rerender } = renderCb({ checked: true });
        const innerChecked = () => document.querySelector(`.${prefixCls}-inner-checked`);
        expect(getInput()).toBeChecked();
        expect(innerChecked()).not.toBeNull();

        rerender(<Checkbox checked={false}>Semi Design</Checkbox>);
        expect(getInput()).not.toBeChecked();
        expect(innerChecked()).toBeNull();

        rerender(<Checkbox checked>Semi Design</Checkbox>);
        expect(getInput()).toBeChecked();
        expect(innerChecked()).not.toBeNull();

        rerender(<Checkbox checked={undefined}>Semi Design</Checkbox>);
        expect(getInput()).not.toBeChecked();
        expect(innerChecked()).toBeNull();
    });

    it('禁用状态', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        renderCb({ disabled: true, onChange });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).not.toBeChecked();
        fireEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('onChange', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        render(<Checkbox onChange={onChange} />);
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[0][0].target.checked).toEqual(true);
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[1][0].target.checked).toEqual(false);
    });

    it('extra 属性', () => {
        let text = 'abcd';
        renderCb({ extra: text });
        const extra = document.querySelector(`.${prefixCls}-extra`);
        expect(extra).toHaveTextContent(/^abcd$/);
        expect(getInput()).toHaveAttribute('aria-describedby', extra.id);
    });

    it('半选状态', () => {
        renderCb({ indeterminate: true });
        expect(getWrapper()).toHaveClass(`${prefixCls}-indeterminate`);
        expect(getInput()).not.toBeChecked();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_indeterminate`)).not.toBeNull();
    });

    it('半选与 checked 同时存在', () => {
        renderCb({ indeterminate: true, checked: true });
        expect(getWrapper()).toHaveClass(`${prefixCls}-indeterminate`);
        expect(getInput()).toBeChecked();
    });

    it('键盘 Enter 不切换，Space 切换', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        render(<Checkbox onChange={onChange} />);
        getInput().focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
    });

    it('onMouseEnter 与 onMouseLeave', () => {
        const onMouseEnter = vi.fn<MouseEventHandler<HTMLSpanElement>>();
        const onMouseLeave = vi.fn<MouseEventHandler<HTMLSpanElement>>();
        renderCb({ onMouseEnter, onMouseLeave });
        fireEvent.mouseEnter(getWrapper());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        fireEvent.mouseLeave(getWrapper());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('ARIA 属性 aria-labelledby', () => {
        renderCb({ 'aria-labelledby': 'label-id' });
        expect(getInput().getAttribute('aria-labelledby')).toMatch(/^label-id \S+$/);
        expect(getWrapper()).not.toHaveAttribute('aria-labelledby');
    });

    it('card 类型', () => {
        renderCb({ type: 'card' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).toBeNull();
    });

    it('pureCard 类型', () => {
        renderCb({ type: 'pureCard' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
    });

    it('focus 与 blur 方法', () => {
        const ref = createRef<CheckboxHandle>();
        renderCb({ defaultChecked: false, ref });
        ref.current.focus();
        expect(getInput()).toHaveFocus();
        ref.current.blur();
        expect(getInput()).not.toHaveFocus();
    });

    it('onChange 事件中 stopPropagation 与 preventDefault', async () => {
        const onParentClick = vi.fn<() => void>();
        const onChange = vi.fn<(e: CheckboxEvent) => void>((e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        render(
            <div role="presentation" onClick={onParentClick}>
                <Checkbox onChange={onChange} />
            </div>
        );
        await userEvent.click(getWrapper());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onParentClick).not.toHaveBeenCalled();
    });

    it('onChange 事件中调用 nativeEvent.stopImmediatePropagation', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>((e) => {
            e.nativeEvent.stopImmediatePropagation();
        });
        render(<Checkbox onChange={onChange} />);
        // React dispatches below document, so a stopped native event never reaches the document listener
        const onDocumentClick = vi.fn<() => void>();
        document.addEventListener('click', onDocumentClick);
        try {
            await userEvent.click(getWrapper());
        } finally {
            document.removeEventListener('click', onDocumentClick);
        }
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onDocumentClick).not.toHaveBeenCalled();
    });

    it('checkboxInner 的 blur 方法', async () => {
        const ref = createRef<CheckboxHandle>();
        renderCb({ defaultChecked: false, ref });
        await userEvent.click(getWrapper());
        expect(getInput()).toHaveFocus();
        ref.current.blur();
        expect(getInput()).not.toHaveFocus();
    });
});

describe('CheckboxGroup', () => {
    const { Group } = Checkbox;

    function renderCheckboxGroup(props: CheckboxGroupProps = {}) {
        return render(
            <Group {...props}>
                <Checkbox value="A">A</Checkbox>
                <Checkbox value="B">B</Checkbox>
                <Checkbox value="C">C</Checkbox>
            </Group>
        );
    }

    const checkedStates = () => getWrappers().map((cb) => cb.classList.contains(`${prefixCls}-checked`));

    it('基础渲染', () => {
        renderCheckboxGroup();
        expect(getWrappers()).toHaveLength(3);
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('defaultValue', () => {
        renderCheckboxGroup({ defaultValue: ['A', 'B'] });
        expect(checkedStates()).toEqual([true, true, false]);
    });

    it('受控 value', () => {
        const { rerender } = renderCheckboxGroup({ value: ['A'] });
        expect(checkedStates()).toEqual([true, false, false]);

        rerender(
            <Group value={['B', 'C']}>
                <Checkbox value="A">A</Checkbox>
                <Checkbox value="B">B</Checkbox>
                <Checkbox value="C">C</Checkbox>
            </Group>
        );
        expect(checkedStates()).toEqual([false, true, true]);
    });

    it('onChange 回调', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        renderCheckboxGroup({ onChange });
        await userEvent.click(getWrappers()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['A']);
        expect(checkedStates()).toEqual([true, false, false]);
    });

    it('禁用分组', () => {
        renderCheckboxGroup({ disabled: true });
        getWrappers().forEach((checkbox) => {
            expect(checkbox).toHaveClass(`${prefixCls}-disabled`);
        });
        screen.getAllByRole('checkbox').forEach((input) => expect(input).toBeDisabled());
    });

    it('direction 水平方向', () => {
        renderCheckboxGroup({ direction: 'horizontal' });
        expect(screen.getByRole('group')).toHaveClass(`${BASE_CLASS_PREFIX}-checkboxGroup-horizontal`);
    });

    it('direction 垂直方向', () => {
        renderCheckboxGroup({ direction: 'vertical' });
        expect(screen.getByRole('group')).toHaveClass(`${BASE_CLASS_PREFIX}-checkboxGroup-vertical`);
    });

    it('card 类型', () => {
        renderCheckboxGroup({ type: 'card' });
        getWrappers().forEach((checkbox) => expect(checkbox).toHaveClass(`${prefixCls}-cardType`));
    });

    it('options 属性', () => {
        const options = [
            { label: 'Option 1', value: '1' },
            { label: 'Option 2', value: '2' },
            { label: 'Option 3', value: '3', disabled: true },
        ];
        render(<Group options={options} />);
        expect(getWrappers()).toHaveLength(3);
        expect(getWrappers().map((cb) => cb.textContent)).toEqual(['Option 1', 'Option 2', 'Option 3']);
        expect(getWrappers()[2]).toHaveClass(`${prefixCls}-disabled`);
        expect(getWrappers()[0]).not.toHaveClass(`${prefixCls}-disabled`);
    });

    it('name 属性', () => {
        renderCheckboxGroup({ name: 'test-group' });
        const inputs = screen.getAllByRole('checkbox');
        expect(inputs).toHaveLength(3);
        inputs.forEach((input) => {
            expect(input).toHaveAttribute('name', 'test-group');
        });
    });

    it('ARIA 属性 aria-label', () => {
        renderCheckboxGroup({ 'aria-label': 'Checkbox group' });
        expect(screen.getByRole('group', { name: 'Checkbox group' })).toHaveClass(`${BASE_CLASS_PREFIX}-checkboxGroup-wrapper`);
    });
});

describe('checkbox 行为基线', () => {
    it('onChange 接收由 props 构造的事件对象', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        render(
            <Checkbox value="v" extra="e" onChange={onChange}>
                label
            </Checkbox>
        );
        await userEvent.click(getWrapper());
        const [event] = onChange.mock.calls[0];
        expect(event.target).toMatchObject({ checked: true, value: 'v', extra: 'e', children: 'label' });
        expect(typeof event.stopPropagation).toBe('function');
        expect(typeof event.preventDefault).toBe('function');
        expect(typeof event.nativeEvent.stopImmediatePropagation).toBe('function');
    });

    it('非受控 checkbox 可反复切换', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        renderCb({ onChange });
        await userEvent.click(getWrapper());
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls.map(([e]) => e.target.checked)).toEqual([true, false]);
        expect(getInput()).not.toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
    });

    it('受控 checkbox 只通知，直到父组件更新 checked', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        renderCb({ checked: false, onChange });
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
        expect(getInput()).not.toBeChecked();
    });

    it('checked={undefined} 按非受控处理：取 defaultChecked，点击即切换', async () => {
        renderCb({ checked: undefined, defaultChecked: true });
        expect(getInput()).toBeChecked();
        await userEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
    });

    it('聚焦的 checkbox 上按 Space 切换', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        renderCb({ onChange });
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toBeChecked();
        await userEvent.keyboard(' ');
        expect(getInput()).not.toBeChecked();
    });

    it('禁用的 checkbox 忽略 Enter', () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        renderCb({ disabled: true, onChange });
        fireEvent.keyDown(getWrapper(), { key: 'Enter' });
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toBeDisabled();
        expect(getInput()).not.toHaveAttribute('aria-disabled');
    });

    it('checked 后 indeterminate 显示勾选图标', () => {
        renderCb({ indeterminate: true, checked: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_tick`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-checkbox_indeterminate`)).toBeNull();
    });

    it('ARIA 属性落在原生 input 上，aria-labelledby 与 addon id 合并', () => {
        render(
            <Checkbox aria-describedby="desc" aria-errormessage="err" aria-invalid aria-label="agree" aria-labelledby="outer" aria-required>
                label
            </Checkbox>
        );
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'agree');
        expect(input).toHaveAttribute('aria-describedby', 'desc');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'err');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).not.toHaveAttribute('aria-checked');
        const addon = document.querySelector(`.${prefixCls}-addon`);
        expect(addon.id).not.toBe('');
        expect(input).toHaveAttribute('aria-labelledby', `outer ${addon.id}`);
        expect(getWrapper()).not.toHaveAttribute('aria-labelledby');
    });

    it('Form 标签通过 aria-labelledby 传到原生 input', () => {
        render(
            <Form>
                <Form.Checkbox field="agree" label="Terms">
                    accept
                </Form.Checkbox>
            </Form>
        );
        const input = getInput();
        const ids = input.getAttribute('aria-labelledby').split(' ');
        expect(ids).toHaveLength(2);
        expect(document.getElementById(ids[0])).toHaveTextContent('Terms');
        expect(document.getElementById(ids[1])).toHaveTextContent('accept');
    });

    it('addonId 与 extraId 属性用作 id', () => {
        render(
            <Checkbox addonId="my-addon" extraId="my-extra" extra="more">
                label
            </Checkbox>
        );
        expect(document.querySelector(`.${prefixCls}-addon`)).toHaveAttribute('id', 'my-addon');
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveAttribute('id', 'my-extra');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(getInput()).toHaveAttribute('aria-describedby', 'my-extra');
    });

    it('无 children 与 extra 时不渲染 addon 或 extra 节点', () => {
        render(<Checkbox aria-label="bare" />);
        expect(document.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('x-semi-children-alias 指定 children 插槽名', () => {
        render(<Checkbox x-semi-children-alias="dataSource[0].label">label</Checkbox>);
        expect(document.querySelector(`.${prefixCls}-addon`)).toHaveAttribute('x-semi-prop', 'dataSource[0].label');
    });

    it('data-*、role 与 style 传到外层；id 与 name 传到 input，外部 label 的 for 可以指向它', async () => {
        render(
            <>
                <label htmlFor="cb-id">outer label</label>
                <Checkbox id="cb-id" name="agree" style={{ color: 'red' }} data-testid="cb" role="none">
                    label
                </Checkbox>
            </>
        );
        const wrapper = getWrapper();
        expect(wrapper).toHaveAttribute('data-testid', 'cb');
        expect(wrapper).not.toHaveAttribute('id');
        expect(getInput()).toHaveAttribute('id', 'cb-id');
        await userEvent.click(screen.getByText('outer label'));
        expect(getInput()).toBeChecked();
        expect(wrapper).toHaveAttribute('role', 'none');
        expect(getInput()).toHaveAttribute('name', 'agree');
        expect(wrapper).not.toHaveAttribute('name');
    });

    it('focus 将 preventScroll 传给原生 input', () => {
        const ref = createRef<CheckboxHandle>();
        renderCb({ ref, preventScroll: true });
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        try {
            ref.current.focus();
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            focus.mockRestore();
        }
    });

    it('点击时聚焦原生 input', async () => {
        renderCb();
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`));
        expect(getInput()).toHaveFocus();
    });

    it('formApi.reset 后 Form.Checkbox 恢复未选中', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Checkbox field="agree" noLabel>
                    agree
                </Form.Checkbox>
            </Form>
        );
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
        expect(formApi.getValue('agree')).toBe(true);
        await act(() => formApi.reset());
        expect(getInput()).not.toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
    });

    it('formApi.reset 后 Form.CheckboxGroup 被清空', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.CheckboxGroup field="fruits" noLabel options={['apple', 'pear']} />
            </Form>
        );
        await userEvent.click(screen.getByRole('checkbox', { name: 'apple' }));
        expect(formApi.getValue('fruits')).toEqual(['apple']);
        expect(screen.getByRole('checkbox', { name: 'apple' })).toBeChecked();
        await act(() => formApi.reset());
        expect(screen.getByRole('checkbox', { name: 'apple' })).not.toBeChecked();
        await userEvent.click(screen.getByRole('checkbox', { name: 'pear' }));
        expect(formApi.getValue('fruits')).toEqual(['pear']);
    });

    it('StrictMode 下 checkbox 每次点击只切换一次', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        render(
            <StrictMode>
                <Checkbox onChange={onChange}>label</Checkbox>
            </StrictMode>
        );
        await userEvent.click(getWrapper());
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls.map(([e]) => e.target.checked)).toEqual([true, false]);
        expect(getInput()).not.toBeChecked();
    });
});

describe('CheckboxGroup 行为基线', () => {
    const { Group } = Checkbox;
    const checkedStates = () => getWrappers().map((cb) => cb.classList.contains(`${prefixCls}-checked`));

    it('options 将 extra、className、style、onChange 与 disabled 传给每个 checkbox', async () => {
        const onOptionChange = vi.fn<(e: CheckboxEvent) => void>();
        const onChange = vi.fn<(value: unknown[]) => void>();
        render(<Group options={['plain', { label: 'A', value: 'a', extra: 'about a', className: 'opt-a', style: { color: 'red' } }, { label: 'B', value: 'b', onChange: onOptionChange }, { label: 'C', value: 'c', disabled: true }]} onChange={onChange} />);
        const [plain, a, b, c] = getWrappers();
        expect(plain).toHaveTextContent('plain');
        expect(a).toHaveClass('opt-a');
        expect(a).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(a.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('about a');
        expect(c).toHaveClass(`${prefixCls}-disabled`);
        getWrappers().forEach((w) => expect(w).not.toHaveAttribute('role'));
        await userEvent.click(b);
        expect(onOptionChange).toHaveBeenCalledTimes(1);
        expect(onOptionChange.mock.calls[0][0].target).toMatchObject({ checked: true, value: 'b' });
        expect(onChange).toHaveBeenLastCalledWith(['b']);
        await userEvent.click(plain);
        expect(onChange).toHaveBeenLastCalledWith(['b', 'plain']);
        fireEvent.click(c);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('启用的分组中，禁用的子项保持禁用', () => {
        render(
            <Group>
                <Checkbox value="a">A</Checkbox>
                <Checkbox disabled value="b">
                    B
                </Checkbox>
            </Group>
        );
        const [a, b] = getWrappers();
        expect(a).not.toHaveClass(`${prefixCls}-disabled`);
        expect(b).toHaveClass(`${prefixCls}-disabled`);
    });

    it('非受控分组可取消已选值', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        render(
            <Group defaultValue={['a']} onChange={onChange}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox value="b">B</Checkbox>
            </Group>
        );
        expect(checkedStates()).toEqual([true, false]);
        await userEvent.click(getWrappers()[0]);
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(checkedStates()).toEqual([false, false]);
    });

    it('受控分组只通知，value 变为 undefined 时清空', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        const group = (value) => (
            <Group value={value} onChange={onChange}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox value="b">B</Checkbox>
            </Group>
        );
        const { rerender } = render(group(['a']));
        await userEvent.click(getWrappers()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(checkedStates()).toEqual([true, false]);
        rerender(group(['a', 'b']));
        expect(checkedStates()).toEqual([true, true]);
        rerender(group(undefined));
        expect(checkedStates()).toEqual([false, false]);
    });

    it('分组内没有 value 的 checkbox 独立工作', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        render(
            <Group value={['a']} onChange={onChange}>
                <Checkbox value="a">A</Checkbox>
                <Checkbox>free</Checkbox>
            </Group>
        );
        const free = getWrappers()[1];
        await userEvent.click(free);
        expect(onChange).not.toHaveBeenCalled();
        expect(free).toHaveClass(`${prefixCls}-checked`);
        expect(screen.getByRole('checkbox', { name: 'free' })).not.toHaveAttribute('name');
    });

    it('分组将 data-*、id、aria-labelledby 与 aria-describedby 传给列表', () => {
        render(<Group id="g-id" data-testid="g" aria-describedby="desc" aria-labelledby="lbl" options={['a']} />);
        const list = screen.getByRole('group');
        expect(list).toHaveAttribute('data-testid', 'g');
        expect(list).toHaveAttribute('id', 'g-id');
        expect(list).toHaveAttribute('aria-labelledby', 'lbl');
        expect(list).toHaveAttribute('aria-describedby', 'desc');
    });

    it('作为 Popover 触发器时，分组根元素不带 aria-expanded、aria-haspopup、aria-controls 与 tabIndex', async () => {
        render(
            <Popover content={<div>popup</div>} trigger="click">
                <Group aria-label="x" options={['a']} />
            </Popover>
        );
        const root = screen.getByRole('group', { name: 'x' });
        const absent = () => ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'].forEach((attr) => expect(root).not.toHaveAttribute(attr));
        absent();
        await userEvent.click(root);
        expect(await screen.findByText('popup')).toBeInTheDocument();
        absent();
    });

    it('未设置 name 的分组为其 checkbox 生成一个名称，且与其他分组不同', () => {
        render(
            <>
                <Group aria-label="one" options={['a', 'b']} />
                <Group aria-label="two" options={['a', 'b']} />
            </>
        );
        const names = ['one', 'two'].map((label) => {
            const inputs = screen.getByRole('group', { name: label }).querySelectorAll('input');
            expect(inputs[0].name).toBeTruthy();
            expect(inputs[0].name).toBe(inputs[1].name);
            return inputs[0].name;
        });
        expect(names[0]).not.toBe(names[1]);
    });

    it('分组将 aria-invalid 与 aria-errormessage 传给每个 input，aria-describedby 保留在根元素，并丢弃 aria-required', () => {
        render(<Group aria-describedby="d" aria-errormessage="em" aria-invalid aria-label="x" aria-required options={['a', { label: 'b', value: 'b' }]} />);
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
        render(
            <Group aria-invalid>
                <Checkbox aria-invalid={false} value="a">
                    a
                </Checkbox>
                <Checkbox value="b">b</Checkbox>
            </Group>
        );
        expect(screen.getByRole('checkbox', { name: 'a' })).toHaveAttribute('aria-invalid', 'false');
        expect(screen.getByRole('checkbox', { name: 'b' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('分组内没有 value 的 Checkbox 不继承分组的 aria-invalid 与 aria-errormessage', () => {
        render(
            <Group aria-errormessage="em" aria-invalid>
                <Checkbox>free</Checkbox>
            </Group>
        );
        expect(screen.getByRole('checkbox', { name: 'free' })).not.toHaveAttribute('aria-invalid');
        expect(screen.getByRole('checkbox', { name: 'free' })).not.toHaveAttribute('aria-errormessage');
    });

    it('pureCard 分组将子项标记为纯卡片并保留 direction 类名', () => {
        render(<Group type="pureCard" direction="horizontal" options={['a']} />);
        expect(screen.getByRole('group')).toHaveClass(`${BASE_CLASS_PREFIX}-checkboxGroup-horizontal-cardType`, `${BASE_CLASS_PREFIX}-checkboxGroup-horizontal-pureCardType`);
        expect(document.querySelector(`.${prefixCls}-inner-pureCardType`)).not.toBeNull();
    });

    it('StrictMode 下分组每次点击只通知一次', async () => {
        const onChange = vi.fn<(value: unknown[]) => void>();
        render(
            <StrictMode>
                <Group options={['a', 'b']} onChange={onChange} />
            </StrictMode>
        );
        await userEvent.click(getWrappers()[0]);
        await userEvent.click(getWrappers()[1]);
        expect(onChange.mock.calls).toEqual([[['a']], [['a', 'b']]]);
    });
});

describe('checkbox 函数组件', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('ref 为包含 focus 与 blur 的句柄', () => {
        const ref = createRef<CheckboxHandle>();
        renderCb({ ref });
        expect(Object.keys(ref.current).sort()).toEqual(['blur', 'focus']);
    });

    it('onChange 的 target 不携带 ref', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        render(<Checkbox ref={createRef<CheckboxHandle>()} onChange={onChange} />);
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[0][0].target).not.toHaveProperty('ref');
    });

    it('服务端渲染的 HTML 包含 addon 与 extra 的 id', () => {
        const html = renderToString(<Checkbox extra="more">label</Checkbox>);
        const container = document.createElement('div');
        container.innerHTML = html;
        const input = container.querySelector('input');
        expect(input.getAttribute('aria-labelledby')).toBe(container.querySelector(`.${prefixCls}-addon`).id);
        expect(input.getAttribute('aria-describedby')).toBe(container.querySelector(`.${prefixCls}-extra`).id);
        expect(input.getAttribute('aria-labelledby')).not.toBe('');
    });

    it('未知属性传到外层，tabIndex 传到原生 input', () => {
        render(
            <Checkbox tabIndex={-1} title="tip">
                label
            </Checkbox>
        );
        expect(getWrapper()).toHaveAttribute('title', 'tip');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
    });

    it('Tooltip 内的 checkbox 只占一个 Tab 停靠点，由 tooltip 描述', async () => {
        render(
            <Tooltip content="tip">
                <Checkbox>label</Checkbox>
            </Tooltip>
        );
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription('tip'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('Form.Checkbox 在 blur 时校验，且不把 Form 属性泄漏到 DOM', () => {
        const validate = vi.fn<() => string>(() => '');
        render(
            <Form>
                <Form.Checkbox field="agree" trigger="blur" validator={validate}>
                    agree
                </Form.Checkbox>
            </Form>
        );
        act(() => getInput().focus());
        act(() => getInput().blur());
        expect(validate).toHaveBeenCalled();
        expect(getWrapper()).not.toHaveAttribute('validatestatus');
        expect(getWrapper()).not.toHaveAttribute('validateStatus');
    });

    it('Form.CheckboxGroup 在 blur 时校验，且不把 Form 属性泄漏到 DOM', () => {
        const validate = vi.fn<() => string>(() => '');
        render(
            <Form>
                <Form.CheckboxGroup field="fruits" options={['apple', 'pear']} trigger="blur" validator={validate} />
            </Form>
        );
        const [apple, pear] = screen.getAllByRole('checkbox');
        act(() => apple.focus());
        act(() => pear.focus());
        expect(validate).not.toHaveBeenCalled();
        act(() => pear.blur());
        expect(validate).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('group')).not.toHaveAttribute('validatestatus');
        expect(screen.getByRole('group')).not.toHaveAttribute('aria-required');
    });

    it('CheckboxGroup 的 ref 指向列表，未知属性传到列表', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Checkbox.Group ref={ref} title="fruits" options={['a']} />);
        expect(ref.current).toBe(screen.getByRole('group'));
        expect(ref.current).toHaveAttribute('title', 'fruits');
    });

    it('CheckboxGroup 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { CheckboxGroup: { direction: 'horizontal', type: 'card' } };
        render(<Checkbox.Group options={['a']} />);
        expect(screen.getByRole('group')).toHaveClass(`${BASE_CLASS_PREFIX}-checkboxGroup-horizontal`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
    });

    it('Checkbox 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Checkbox: { type: 'card' } };
        const { unmount } = renderCb();
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        unmount();
        renderCb({ type: 'default' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-cardType`);
    });

    it('各入口导出的 Checkbox 与 Checkbox.Group 为同一对象', async () => {
        const index = await import('../index');
        expect(index.Checkbox).toBe(index.default);
        expect(index.CheckboxWithGroup).toBe(index.default);
        expect(index.default.Group).toBeTypeOf('function');
        expect(index.default).not.toHaveProperty('elementType');
    });
});

describe('checkbox 审计修复', () => {
    it('onClick 被调用且仍切换', async () => {
        const onClick = vi.fn<MouseEventHandler<HTMLSpanElement>>();
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        renderCb({ onClick, onChange });
        await userEvent.click(getWrapper());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toBeChecked();
    });

    it('半选状态暴露为原生 indeterminate，不再输出重复的 aria-checked', () => {
        const { rerender } = render(<Checkbox indeterminate />);
        expect(getInput()).toBePartiallyChecked();
        expect(getInput()).not.toHaveAttribute('aria-checked');
        rerender(<Checkbox checked indeterminate />);
        expect(getInput()).not.toBePartiallyChecked();
        expect(getInput()).toBeChecked();
    });

    it('点击后受控半选仍保持 indeterminate', async () => {
        render(<Checkbox checked={false} indeterminate />);
        await userEvent.click(getWrapper());
        expect(getInput()).toBePartiallyChecked();
    });

    it('有 extra 时调用方的 aria-describedby 与 extra 都在描述中', () => {
        render(
            <Checkbox aria-describedby="outer" extraId="ex" extra="more">
                label
            </Checkbox>
        );
        expect(getInput()).toHaveAttribute('aria-describedby', 'outer ex');
    });

    it('数字 0 作为 children 或 extra 时照常渲染并参与命名', () => {
        render(<Checkbox extra={0}>{0}</Checkbox>);
        expect(screen.getByRole('checkbox', { name: '0' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('0');
        expect(getInput()).toHaveAccessibleDescription('0');
    });

    it('checked={false} 与 defaultChecked 同时存在时，初值取受控值并可以勾选', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        render(
            <Checkbox checked={false} defaultChecked onChange={onChange}>
                Semi Design
            </Checkbox>
        );
        await userEvent.click(getInput());
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
    });

    it('原生 input 带 value，表单序列化得到使用方的 value', () => {
        render(
            <form data-testid="form">
                <Checkbox name="fruit" defaultChecked value="apple">
                    apple
                </Checkbox>
            </form>
        );
        expect(getInput()).toHaveAttribute('value', 'apple');
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('fruit')).toBe('apple');
    });

    it('Form.Checkbox 的 helpText 与 extra 同时出现在描述中', () => {
        render(
            <Form>
                <Form.Checkbox field="agree" helpText="help" extra="more">
                    accept
                </Form.Checkbox>
            </Form>
        );
        expect(getInput()).toHaveAccessibleDescription(expect.stringContaining('help'));
        expect(getInput()).toHaveAccessibleDescription(expect.stringContaining('more'));
    });
});
