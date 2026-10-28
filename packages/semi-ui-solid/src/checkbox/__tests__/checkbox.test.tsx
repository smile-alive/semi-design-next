import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Checkbox, { type CheckboxProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';

type Change = NonNullable<CheckboxProps['onChange']>;

const prefixCls = `${BASE_CLASS_PREFIX}-checkbox`;

function renderCb(props: CheckboxProps = {}) {
    return render(() => <Checkbox {...props}>Semi Design</Checkbox>);
}

const getWrapper = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('checkbox');

describe('Checkbox', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在根元素', () => {
        renderCb({ class: 'test', style: { color: 'red' } });
        const wrapper = document.querySelector(`.${prefixCls}.test`);
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('autofocus 在挂载后聚焦 input，不落到根元素', () => {
        render(() => <Checkbox autofocus>Semi Design</Checkbox>);
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).not.toHaveAttribute('autofocus');
    });

    it('点击内容里的链接与按钮不切换，点击普通文字仍切换', async () => {
        render(() => (
            <Checkbox extra={<a href="#extra">extra link</a>}>
                agree <a href="#terms">terms</a> <button type="button">more</button>
            </Checkbox>
        ));
        await userEvent.click(screen.getByRole('link', { name: 'terms' }));
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        await userEvent.click(screen.getByRole('link', { name: 'extra link' }));
        expect(getInput()).not.toBeChecked();
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
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

    it('点击原生 input 只切换一次', async () => {
        const onChange = vi.fn<Change>();
        renderCb({ onChange });
        await userEvent.click(getInput());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toBeChecked();
    });

    it('defaultChecked 生效', () => {
        renderCb({ defaultChecked: true });
        expect(getInput()).toBeChecked();
    });

    it('父组件挂载时就改了 checked，点击按新值切换', () => {
        const onChange = vi.fn<Change>();
        function Demo() {
            const [checked, setChecked] = createSignal(false);
            onMount(() => setChecked(true));
            return (
                <Checkbox checked={checked()} onChange={onChange}>
                    Semi Design
                </Checkbox>
            );
        }
        render(() => <Demo />);
        fireEvent.click(getInput());
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
    });

    it('checked 受控模式随 signal 更新', () => {
        const [checked, setChecked] = createSignal<boolean | undefined>(true);
        render(() => <Checkbox checked={checked()}>Semi Design</Checkbox>);
        const innerChecked = () => document.querySelector(`.${prefixCls}-inner-checked`);
        expect(getInput()).toBeChecked();
        expect(innerChecked()).not.toBeNull();

        setChecked(false);
        expect(getInput()).not.toBeChecked();
        expect(innerChecked()).toBeNull();

        setChecked(true);
        expect(getInput()).toBeChecked();
        expect(innerChecked()).not.toBeNull();

        setChecked(undefined);
        expect(getInput()).not.toBeChecked();
        expect(innerChecked()).toBeNull();
    });

    it('禁用状态', () => {
        const onChange = vi.fn<Change>();
        renderCb({ disabled: true, onChange });
        expect(getWrapper()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).not.toBeChecked();
        fireEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('onChange', async () => {
        const onChange = vi.fn<Change>();
        render(() => <Checkbox onChange={onChange} />);
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[0][0].target.checked).toEqual(true);
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[1][0].target.checked).toEqual(false);
    });

    it('extra 属性', () => {
        renderCb({ extra: 'abcd' });
        const extra = document.querySelector(`.${prefixCls}-extra`) as HTMLElement;
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
        const onChange = vi.fn<Change>();
        render(() => <Checkbox onChange={onChange} />);
        getInput().focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
    });

    it('onMouseEnter 与 onMouseLeave', () => {
        const onMouseEnter = vi.fn<(event: MouseEvent) => void>();
        const onMouseLeave = vi.fn<(event: MouseEvent) => void>();
        renderCb({ onMouseEnter, onMouseLeave });
        fireEvent.mouseEnter(getWrapper());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        fireEvent.mouseLeave(getWrapper());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('aria-labelledby 落在 input 并与 addon id 合并', () => {
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

    it('ref 指向根元素，其 focus 与 blur 作用于原生 input', async () => {
        let ref: HTMLSpanElement | undefined;
        renderCb({ ref: (node) => (ref = node) });
        expect(ref).toBe(getWrapper());
        ref?.focus();
        expect(getInput()).toHaveFocus();
        ref?.blur();
        expect(getInput()).not.toHaveFocus();
    });

    it('focus 将 preventScroll 传给原生 input', () => {
        let ref: HTMLSpanElement | undefined;
        renderCb({ ref: (node) => (ref = node), preventScroll: true });
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        try {
            ref?.focus();
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
            focus.mockRestore();
        }
    });

    it('onChange 事件中 stopPropagation 与 preventDefault', async () => {
        const onParentClick = vi.fn<() => void>();
        const onChange = vi.fn<Change>((event) => {
            event.stopPropagation();
            event.preventDefault();
        });
        render(() => (
            <div role="presentation" onClick={onParentClick}>
                <Checkbox onChange={onChange} />
            </div>
        ));
        await userEvent.click(getWrapper());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onParentClick).not.toHaveBeenCalled();
    });

    it('onChange 事件中调用 nativeEvent.stopImmediatePropagation', async () => {
        const onChange = vi.fn<Change>((event) => {
            event.nativeEvent.stopImmediatePropagation();
        });
        render(() => <Checkbox onChange={onChange} />);
        // Solid delegates to document ahead of this listener, so a stopped native event never reaches it
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

    it('点击后聚焦原生 input', async () => {
        renderCb();
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
        expect(getInput()).toHaveFocus();
    });
});

describe('Checkbox 行为基线', () => {
    it('onChange 的 target 只有 checked、value、name 与 disabled，nativeEvent 是点击事件', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <Checkbox value="v" name="agree" prefixCls={prefixCls} onChange={onChange} extra="e">
                label
            </Checkbox>
        ));
        await userEvent.click(getWrapper());
        const [event] = onChange.mock.calls[0];
        expect(event.target).toStrictEqual({ checked: true, value: 'v', name: 'agree', disabled: false });
        expect(event.nativeEvent).toBeInstanceOf(MouseEvent);
        expect(typeof event.stopPropagation).toBe('function');
        expect(typeof event.preventDefault).toBe('function');
    });

    it('非受控 checkbox 可反复切换', async () => {
        const onChange = vi.fn<Change>();
        renderCb({ onChange });
        await userEvent.click(getWrapper());
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls.map(([event]) => event.target.checked)).toEqual([true, false]);
        expect(getInput()).not.toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
    });

    it('受控 checkbox 只通知，原生 input 与类名保持不变，直到父组件更新 checked', async () => {
        const [checked, setChecked] = createSignal(false);
        const onChange = vi.fn<Change>();
        render(() => <Checkbox checked={checked()} onChange={onChange} />);
        await userEvent.click(getWrapper());
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
        expect(getInput()).not.toBeChecked();
        await userEvent.click(getInput());
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(getInput()).not.toBeChecked();
        expect(getWrapper()).toHaveClass(`${prefixCls}-unChecked`);
        setChecked(true);
        expect(getInput()).toBeChecked();
    });

    it('checked={undefined} 按非受控处理：取 defaultChecked，点击即切换', async () => {
        renderCb({ checked: undefined, defaultChecked: true });
        expect(getInput()).toBeChecked();
        await userEvent.click(getWrapper());
        expect(getInput()).not.toBeChecked();
    });

    it('受控转非受控后，checked 变回 undefined 即取消选中', async () => {
        const [checked, setChecked] = createSignal<boolean | undefined>(true);
        render(() => <Checkbox checked={checked()} />);
        setChecked(undefined);
        expect(getInput()).not.toBeChecked();
        await userEvent.click(getWrapper());
        expect(getInput()).toBeChecked();
    });

    it('聚焦的 checkbox 上按 Space 切换', async () => {
        const onChange = vi.fn<Change>();
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
        const onChange = vi.fn<Change>();
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

    it('aria 属性落在原生 input 上，aria-labelledby 与 addon id 合并', () => {
        render(() => (
            <Checkbox aria-describedby="desc" aria-errormessage="err" aria-invalid aria-label="agree" aria-labelledby="outer" aria-required>
                label
            </Checkbox>
        ));
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

    it('addonId 与 extraId 属性用作 id', () => {
        render(() => (
            <Checkbox addonId="my-addon" extraId="my-extra" extra="more">
                label
            </Checkbox>
        ));
        expect(document.querySelector(`.${prefixCls}-addon`)).toHaveAttribute('id', 'my-addon');
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveAttribute('id', 'my-extra');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(getInput()).toHaveAttribute('aria-describedby', 'my-extra');
    });

    it('无 children 与 extra 时不渲染 addon 或 extra 节点', () => {
        render(() => <Checkbox aria-label="bare" />);
        expect(document.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('x-semi-children-alias 指定 children 插槽名', () => {
        render(() => <Checkbox x-semi-children-alias="dataSource[0].label">label</Checkbox>);
        expect(document.querySelector(`.${prefixCls}-addon`)).toHaveAttribute('x-semi-prop', 'dataSource[0].label');
    });

    it('data-*、role 与 style 传到外层；id 与 name 传到 input，外部 label 的 for 可以指向它', async () => {
        render(() => (
            <Checkbox id="cb-id" name="agree" style={{ color: 'red' }} data-testid="cb" role="none">
                label
            </Checkbox>
        ));
        const outerLabel = document.createElement('label');
        outerLabel.htmlFor = 'cb-id';
        outerLabel.textContent = 'outer label';
        document.body.append(outerLabel);
        const wrapper = getWrapper();
        expect(wrapper).toHaveAttribute('data-testid', 'cb');
        expect(wrapper).not.toHaveAttribute('id');
        expect(getInput()).toHaveAttribute('id', 'cb-id');
        await userEvent.click(screen.getByText('outer label'));
        expect(getInput()).toBeChecked();
        expect(wrapper).toHaveAttribute('role', 'none');
        expect(getInput()).toHaveAttribute('name', 'agree');
        expect(wrapper).not.toHaveAttribute('name');
        outerLabel.remove();
    });

    it('未声明属性落在根元素，tabIndex 落在原生 input', () => {
        render(() => (
            <Checkbox tabIndex={-1} title="tip">
                label
            </Checkbox>
        ));
        expect(getWrapper()).toHaveAttribute('title', 'tip');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
    });

    it('onFocus 与 onBlur 收到原生 input 的事件', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        renderCb({ onFocus, onBlur });
        await userEvent.tab();
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].target).toBe(getInput());
    });

    it('Form 注入的 validateStatus、insetLabel、insetLabelId 不进入 DOM', () => {
        const injected = { validateStatus: 'error', insetLabel: 'Label', insetLabelId: 'label-id' };
        render(() => <Checkbox {...(injected as object)}>label</Checkbox>);
        for (const key of Object.keys(injected)) {
            expect(getInput()).not.toHaveAttribute(key);
            expect(getWrapper()).not.toHaveAttribute(key);
            expect(getWrapper()).not.toHaveAttribute(key.toLowerCase());
        }
    });

    it('点击时聚焦原生 input', async () => {
        renderCb();
        await userEvent.click(document.querySelector(`.${prefixCls}-addon`) as HTMLElement);
        expect(getInput()).toHaveFocus();
    });

    it('onClick 被调用且仍切换', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onChange = vi.fn<Change>();
        renderCb({ onClick, onChange });
        await userEvent.click(getWrapper());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toBeChecked();
    });

    it('半选状态暴露为原生 indeterminate，不输出 aria-checked', () => {
        const [checked, setChecked] = createSignal<boolean | undefined>(undefined);
        render(() => <Checkbox checked={checked()} indeterminate />);
        expect(getInput()).toBePartiallyChecked();
        expect(getInput()).not.toHaveAttribute('aria-checked');
        setChecked(true);
        expect(getInput()).not.toBePartiallyChecked();
        expect(getInput()).toBeChecked();
    });

    it('点击后受控半选仍保持 indeterminate', async () => {
        render(() => <Checkbox checked={false} indeterminate />);
        await userEvent.click(getWrapper());
        expect(getInput()).toBePartiallyChecked();
    });

    it('有 extra 时调用方的 aria-describedby 与 extra 都在描述中', () => {
        render(() => (
            <Checkbox aria-describedby="outer" extraId="ex" extra="more">
                label
            </Checkbox>
        ));
        expect(getInput()).toHaveAttribute('aria-describedby', 'outer ex');
    });

    it('数字 0 作为 children 或 extra 时照常渲染并参与命名', () => {
        render(() => <Checkbox extra={0}>{0}</Checkbox>);
        expect(screen.getByRole('checkbox', { name: '0' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('0');
        expect(getInput()).toHaveAccessibleDescription('0');
    });

    it('checked={false} 与 defaultChecked 同时存在时，初值取受控值并可以勾选', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <Checkbox checked={false} defaultChecked onChange={onChange}>
                Semi Design
            </Checkbox>
        ));
        expect(getInput()).not.toBeChecked();
        await userEvent.click(getInput());
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
    });

    it('原生 input 带 value，表单序列化得到使用方的 value', () => {
        render(() => (
            <form data-testid="form">
                <Checkbox name="fruit" defaultChecked value="apple">
                    apple
                </Checkbox>
            </form>
        ));
        expect(getInput()).toHaveAttribute('value', 'apple');
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('fruit')).toBe('apple');
    });

    it('卸载后移除控件', () => {
        const { unmount } = renderCb();
        unmount();
        expect(screen.queryByRole('checkbox')).toBeNull();
    });
});

describe('Checkbox 触发器与全局默认值', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Tooltip 内的 checkbox 只占一个 Tab 停靠点，由 tooltip 描述', async () => {
        render(() => <Tooltip content="tip">{(trigger) => <Checkbox {...trigger()}>label</Checkbox>}</Tooltip>);
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription('tip'));
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('disabled 的 checkbox 配 click 的 Tooltip：外包 span 是停靠点，checkbox 不接收指针', async () => {
        render(() => (
            <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                {(trigger) => (
                    <Checkbox disabled {...trigger()}>
                        label
                    </Checkbox>
                )}
            </Tooltip>
        ));
        const wrapper = document.querySelector('.probe') as HTMLElement;
        expect(wrapper).toContainElement(getWrapper());
        expect(wrapper).toHaveAttribute('tabindex', '0');
        expect(getWrapper().style.pointerEvents).toBe('none');
        await userEvent.click(wrapper);
        await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());
    });

    it('Checkbox 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Checkbox: { type: 'card' } };
        const { unmount } = renderCb();
        expect(getWrapper()).toHaveClass(`${prefixCls}-cardType`);
        unmount();
        renderCb({ type: 'default' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-cardType`);
    });

    it('各入口导出的 Checkbox 与 Checkbox.Group', async () => {
        const index = await import('..');
        expect(index.default.Group).toBe(index.CheckboxGroup);
        expect(index.default).not.toHaveProperty('elementType');
    });

    it('展开信号对象时，无关属性变化不重置非受控状态', async () => {
        const [props, setProps] = createSignal<CheckboxProps>({});
        render(() => <Checkbox {...props()}>agree</Checkbox>);
        await userEvent.click(getInput());
        expect(getInput().checked).toBe(true);
        setProps({ class: 'other' });
        expect(getWrapper()).toHaveClass('other', `${prefixCls}-checked`);
        expect(getInput().checked).toBe(true);
    });
});
