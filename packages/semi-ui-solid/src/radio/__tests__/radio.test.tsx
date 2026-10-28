import { createSignal, onMount } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Radio, { type RadioChangeEvent, type RadioProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';

type Change = (event: RadioChangeEvent) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-radio`;

describe('Radio', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        vi.restoreAllMocks();
    });

    it('基础功能', () => {
        render(() => <Radio />);
        const input = screen.getByRole('radio');
        expect(input).not.toBeChecked();
        expect(input).not.toBeDisabled();
    });

    it('checked 与 disabled', () => {
        const first = render(() => <Radio checked />);
        expect(screen.getByRole('radio')).toBeChecked();
        first.unmount();
        render(() => <Radio disabled />);
        expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('onChange', async () => {
        const onChange = vi.fn<Change>();
        const onChange2 = vi.fn<Change>();
        render(() => (
            <>
                <Radio aria-label="plain" onChange={onChange} />
                <Radio aria-label="advanced" mode="advanced" onChange={onChange2} />
            </>
        ));
        await userEvent.click(screen.getByRole('radio', { name: 'plain' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);

        await userEvent.click(screen.getByRole('radio', { name: 'advanced' }));
        expect(onChange2).toHaveBeenCalledTimes(1);
        expect(onChange2.mock.calls[0][0].target.checked).toBe(true);
    });

    it('高级模式：点击已选中的 radio 取消选中', async () => {
        const onChange = vi.fn<Change>();
        const { container } = render(() => (
            <Radio mode="advanced" onChange={onChange}>
                允许取消选择
            </Radio>
        ));
        const input = screen.getByRole('radio');
        const label = container.querySelector(`.${prefixCls}`) as HTMLElement;

        await userEvent.click(input);
        expect(input).toBeChecked();
        expect(label).toHaveClass(`${prefixCls}-checked`);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);

        await userEvent.click(input);
        expect(input).not.toBeChecked();
        expect(label).not.toHaveClass(`${prefixCls}-checked`);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].target.checked).toBe(false);
    });

    it('高级模式下按 Space 取消选中', async () => {
        const onChange = vi.fn<Change>();
        render(() => <Radio defaultChecked mode="advanced" onChange={onChange} />);
        const input = screen.getByRole('radio');
        input.focus();
        await userEvent.keyboard(' ');
        expect(input).not.toBeChecked();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
    });

    it('受控的高级模式 radio：取消选中被拒绝时保持选中', async () => {
        const onChange = vi.fn<Change>();
        render(() => <Radio checked mode="advanced" onChange={onChange} />);
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('button 样式', () => {
        const { container } = render(() => <Radio type="button" />);
        expect(container.querySelector(`.${prefixCls}-buttonRadioComponent`)).not.toBeNull();
    });

    it('card 样式', () => {
        const { container } = render(() => <Radio type="card">Card Radio</Radio>);
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
    });

    it('pureCard 样式', () => {
        const { container } = render(() => <Radio type="pureCard">Pure Card Radio</Radio>);
        expect(container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-inner-pureCardRadio`)).not.toBeNull();
    });

    it('onMouseEnter 与 onMouseLeave 落在根 label', async () => {
        const onMouseEnter = vi.fn<(event: MouseEvent) => void>();
        const onMouseLeave = vi.fn<(event: MouseEvent) => void>();
        const { container } = render(() => (
            <Radio onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                Test
            </Radio>
        ));
        const label = container.querySelector('label') as HTMLLabelElement;
        await userEvent.hover(label);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        await userEvent.unhover(label);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('extra 属性', () => {
        const { container } = render(() => <Radio extra="Extra information">Radio with extra</Radio>);
        const extra = container.querySelector(`.${prefixCls}-extra`) as HTMLElement;
        expect(extra).toHaveTextContent(/^Extra information$/);
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', extra.id);
    });

    it('displayMode 为 vertical', () => {
        const { container } = render(() => <Radio displayMode="vertical">Vertical Radio</Radio>);
        expect(container.querySelector(`.${prefixCls}-vertical`)).not.toBeNull();
    });

    it('受控模式随 signal 更新，变为 undefined 后取消选中', () => {
        const [checked, setChecked] = createSignal<boolean | undefined>(true);
        const { container } = render(() => <Radio checked={checked()}>Controlled Radio</Radio>);
        expect(screen.getByRole('radio')).toBeChecked();

        setChecked(false);
        expect(screen.getByRole('radio')).not.toBeChecked();

        setChecked(true);
        expect(screen.getByRole('radio')).toBeChecked();

        setChecked(undefined);
        expect(screen.getByRole('radio')).not.toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-checked`);
    });

    it('父组件挂载时就把 checked 改为 undefined，取消选中', () => {
        function Demo() {
            const [checked, setChecked] = createSignal<boolean | undefined>(true);
            onMount(() => setChecked(undefined));
            return <Radio checked={checked()}>Radio</Radio>;
        }
        render(() => <Demo />);
        expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('value 与 aria-label 落在 input', () => {
        render(() => (
            <Radio value="test-value" aria-label="Test radio">
                Radio with value
            </Radio>
        ));
        expect(screen.getByRole('radio')).toHaveAttribute('value', 'test-value');
        expect(screen.getByRole('radio')).toHaveAttribute('aria-label', 'Test radio');
    });

    it('ref 指向根 label，其 focus 与 blur 作用于原生 input', () => {
        let ref: HTMLLabelElement | undefined;
        const { container } = render(() => <Radio ref={(node) => (ref = node)}>Test Radio</Radio>);
        expect(ref).toBe(container.querySelector('label'));
        ref?.focus();
        expect(screen.getByRole('radio')).toHaveFocus();
        ref?.blur();
        expect(screen.getByRole('radio')).not.toHaveFocus();
    });

    it('focus 将 preventScroll 传给原生 input', () => {
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        let ref: HTMLLabelElement | undefined;
        render(() => (
            <Radio ref={(node) => (ref = node)} preventScroll>
                Test Radio
            </Radio>
        ));
        ref?.focus();
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(screen.getByRole('radio')).toHaveFocus();
    });

    it('非受控：defaultChecked，点击后选中并保持选中', async () => {
        const onChange = vi.fn<Change>();
        const first = render(() => <Radio defaultChecked>A</Radio>);
        expect(screen.getByRole('radio')).toBeChecked();
        expect(first.container.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-checked`);
        first.unmount();

        const { container } = render(() => <Radio onChange={onChange}>B</Radio>);
        await userEvent.click(screen.getByRole('radio'));
        expect(screen.getByRole('radio')).toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-checked`);
        expect(container.querySelector(`.${prefixCls}-inner-checked`)).not.toBeNull();
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('受控：点击上报选中，但最终由属性决定', async () => {
        const onChange = vi.fn<Change>();
        const { container } = render(() => (
            <Radio checked={false} onChange={onChange}>
                A
            </Radio>
        ));
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(true);
        expect(screen.getByRole('radio')).not.toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-checked`);
    });

    it('checked={false} 与 defaultChecked 同时存在时，state 初值取受控值', () => {
        const [checked, setChecked] = createSignal<boolean | null>(false);
        render(() => (
            <Radio checked={checked() as boolean} defaultChecked>
                A
            </Radio>
        ));
        expect(screen.getByRole('radio')).not.toBeChecked();
        // a non-boolean checked is ignored, so the radio shows its state
        setChecked(null);
        expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('onChange 事件对象：target、preventDefault，stopPropagation 作用于原生 change 事件', async () => {
        const onChange = vi.fn<Change>();
        const parentChange = vi.fn<() => void>();
        const { container } = render(() => (
            <div>
                <Radio
                    name="n1"
                    value="v1"
                    onChange={(event) => {
                        onChange(event);
                        event.stopPropagation();
                    }}
                >
                    A
                </Radio>
            </div>
        ));
        container.firstElementChild?.addEventListener('change', parentChange);
        await userEvent.click(screen.getByRole('radio'));
        const event = onChange.mock.calls[0][0];
        expect(event.target.checked).toBe(true);
        expect(event.target.value).toBe('v1');
        expect(event.target.name).toBe('n1');
        expect(typeof event.preventDefault).toBe('function');
        expect(parentChange).not.toHaveBeenCalled();
    });

    it('onChange 事件的 target 不含 children、extra 与 ref', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <Radio value="v" extra="more" onChange={onChange}>
                A
            </Radio>
        ));
        await userEvent.click(screen.getByRole('radio'));
        const { target } = onChange.mock.calls[0][0];
        expect(target).toMatchObject({ value: 'v', checked: true, disabled: false });
        for (const key of ['children', 'extra', 'ref']) {
            expect(target).not.toHaveProperty(key);
        }
    });

    it('禁用时不改变状态', async () => {
        const onChange = vi.fn<Change>();
        const { container } = render(() => (
            <Radio disabled onChange={onChange}>
                A
            </Radio>
        ));
        await userEvent.click(screen.getByRole('radio'));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('radio')).not.toBeChecked();
        expect(container.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-disabled`);
    });

    it('name 与 autofocus 作用于 input', () => {
        const first = render(() => <Radio>A</Radio>);
        expect(screen.getByRole('radio')).not.toHaveAttribute('name');
        first.unmount();
        const { container } = render(() => (
            <Radio name="n" autofocus>
                A
            </Radio>
        ));
        expect(screen.getByRole('radio')).toHaveAttribute('name', 'n');
        expect(screen.getByRole('radio')).toHaveFocus();
        expect(container.querySelector('label')).not.toHaveAttribute('autofocus');
        expect(container.querySelector('label')).not.toHaveAttribute('name');
    });

    it('aria-labelledby 与 aria-describedby 指向 addon 与 extra', () => {
        const first = render(() => <Radio extra="more">A</Radio>);
        const addon = first.container.querySelector(`.${prefixCls}-addon`) as HTMLElement;
        expect(addon.id).toBeTruthy();
        expect(screen.getByRole('radio')).toHaveAttribute('aria-labelledby', addon.id);
        expect(screen.getByRole('radio', { name: 'A' })).toHaveAccessibleDescription('more');
        first.unmount();

        render(() => (
            <Radio addonId="my-addon" extraId="my-extra" extra="more">
                A
            </Radio>
        ));
        expect(screen.getByRole('radio')).toHaveAttribute('aria-labelledby', 'my-addon');
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'my-extra');
        expect(document.getElementById('my-addon')).toHaveTextContent('A');
    });

    it('没有 children 或 extra 时，radio 不包含 addon、extra 或 aria 引用', () => {
        const { container } = render(() => <Radio />);
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(screen.getByRole('radio')).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('radio')).not.toHaveAttribute('aria-describedby');
    });

    it('button 类型下 addonClassName、addonStyle 生效而 extra 隐藏', () => {
        const { container } = render(() => (
            <Radio type="button" addonClassName="ac" addonStyle={{ color: 'red' }} extra="more">
                A
            </Radio>
        ));
        const addon = container.querySelector(`.${prefixCls}-addon-buttonRadio`) as HTMLElement;
        expect(addon).toHaveClass('ac');
        expect(addon).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.querySelector(`.${prefixCls}-extra`)).toBeNull();
        expect(screen.getByRole('radio')).not.toHaveAttribute('aria-describedby');
    });

    it('button 类型的选中类名', async () => {
        const { container } = render(() => <Radio type="button">A</Radio>);
        const addon = container.querySelector(`.${prefixCls}-addon-buttonRadio`) as HTMLElement;
        await userEvent.click(screen.getByRole('radio'));
        expect(addon).toHaveClass(`${prefixCls}-addon-buttonRadio-checked`);
    });

    it('card 类型的选中类名', async () => {
        const { container } = render(() => <Radio type="card">A</Radio>);
        const label = container.querySelector('label') as HTMLLabelElement;
        await userEvent.click(screen.getByRole('radio'));
        expect(label).toHaveClass(`${prefixCls}-cardRadioGroup_checked`);
        expect(container.querySelector(`.${prefixCls}-isCardRadioGroup_content`)).not.toBeNull();
    });

    it('class、style、prefixCls 与 data-* 作用于根 label', () => {
        const { container } = render(() => (
            <Radio class="c" style={{ color: 'red' }} data-test="x" prefixCls="my-radio">
                A
            </Radio>
        ));
        const label = container.querySelector('label') as HTMLLabelElement;
        expect(label).toHaveClass('c', 'my-radio');
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(label).toHaveAttribute('data-test', 'x');
        expect(container.querySelector('.my-radio-inner')).not.toBeNull();
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Radio: { type: 'button' } };
        const first = render(() => <Radio>A</Radio>);
        expect(first.container.querySelector(`.${prefixCls}-buttonRadioComponent`)).not.toBeNull();
        first.unmount();
        const second = render(() => <Radio type="card">A</Radio>);
        expect(second.container.querySelector(`.${prefixCls}-buttonRadioComponent`)).toBeNull();
        expect(second.container.querySelector(`.${prefixCls}-cardRadioGroup`)).not.toBeNull();
    });

    it('未声明的属性透传到根 label', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = render(() => (
            <Radio title="tip" onClick={onClick}>
                A
            </Radio>
        ));
        const label = container.querySelector('label') as HTMLLabelElement;
        expect(label).toHaveAttribute('title', 'tip');
        await userEvent.click(label);
        expect(onClick).toHaveBeenCalled();
    });

    it('tabIndex、aria-* 与 onFocus、onBlur 作用于 input 而非 label', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const { container } = render(() => (
            <Radio tabIndex={-1} aria-describedby="desc" onFocus={onFocus} onBlur={onBlur}>
                A
            </Radio>
        ));
        const label = container.querySelector('label') as HTMLLabelElement;
        expect(label).not.toHaveAttribute('tabindex');
        expect(label).not.toHaveAttribute('aria-describedby');
        expect(screen.getByRole('radio')).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'desc');
        screen.getByRole('radio').focus();
        screen.getByRole('radio').blur();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('位于 Tooltip 中时，tabIndex 与 aria-describedby 作用于 input 而非 label', () => {
        const { container } = render(() => (
            <Tooltip content="tip" trigger="custom" visible>
                {(trigger) => <Radio {...trigger()}>A</Radio>}
            </Tooltip>
        ));
        const label = container.querySelector('label') as HTMLLabelElement;
        expect(label).not.toHaveAttribute('tabindex');
        expect(label).not.toHaveAttribute('aria-describedby');
        expect(screen.getByRole('radio')).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('radio')).toHaveAccessibleDescription('tip');
    });

    it('disabled 的 Radio 配 click 的 Tooltip：外包 span 是停靠点', async () => {
        const { container } = render(() => (
            <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                {(trigger) => (
                    <Radio disabled {...trigger()}>
                        A
                    </Radio>
                )}
            </Tooltip>
        ));
        const wrapper = container.querySelector('.probe') as HTMLElement;
        expect(wrapper).toContainElement(container.querySelector('label'));
        expect(wrapper).toHaveAttribute('tabindex', '0');
        await userEvent.click(wrapper);
        await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());
    });

    it('aria-invalid 的错误信息进入 input 的描述，不支持的 aria 不落到 DOM', () => {
        const { container } = render(() => (
            <>
                <p id="err">must be off</p>
                <Radio aria-invalid aria-errormessage="err" aria-required>
                    Agree
                </Radio>
            </>
        ));
        const input = screen.getByRole('radio');
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(input).not.toHaveAttribute(name));
        expect(input).toHaveAccessibleDescription('must be off');
        const label = container.querySelector('label') as HTMLLabelElement;
        ['aria-invalid', 'aria-errormessage', 'aria-required'].forEach((name) => expect(label).not.toHaveAttribute(name));
    });

    it('Form 注入的 validateStatus、insetLabel、insetLabelId 不进入 DOM', () => {
        const injected = { validateStatus: 'error', insetLabel: 'Label', insetLabelId: 'label-id' };
        const { container } = render(() => <Radio {...(injected as object)}>A</Radio>);
        for (const key of Object.keys(injected)) {
            expect(screen.getByRole('radio')).not.toHaveAttribute(key);
            expect(container.querySelector('label')).not.toHaveAttribute(key.toLowerCase());
        }
    });

    it('有 extra 时调用方的 aria-describedby 与 extra 都在描述中', () => {
        render(() => (
            <Radio aria-describedby="outer" extraId="ex" extra="more">
                A
            </Radio>
        ));
        expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'outer ex');
    });

    it('数字 0 作为 children 或 extra 时照常渲染并参与命名', () => {
        render(() => <Radio extra={0}>{0}</Radio>);
        expect(screen.getByRole('radio', { name: '0' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('0');
        expect(screen.getByRole('radio')).toHaveAccessibleDescription('0');
    });

    it('组外同名的非受控 Radio 互斥，先选中的那个取消选中状态与类名', async () => {
        const onChange = vi.fn<Change>();
        const { container } = render(() => (
            <>
                <Radio name="x" value="a" onChange={onChange}>
                    A
                </Radio>
                <Radio name="x" value="b">
                    B
                </Radio>
                <Radio name="y" value="c">
                    C
                </Radio>
            </>
        ));
        const [a, b, c] = Array.from(container.querySelectorAll(`.${prefixCls}`));
        await userEvent.click(screen.getByRole('radio', { name: 'A' }));
        await userEvent.click(screen.getByRole('radio', { name: 'C' }));
        await userEvent.click(screen.getByRole('radio', { name: 'B' }));
        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'C' })).toBeChecked();
        expect(a).not.toHaveClass(`${prefixCls}-checked`);
        expect(b).toHaveClass(`${prefixCls}-checked`);
        expect(c).toHaveClass(`${prefixCls}-checked`);
        // the native uncheck of the previous radio reports no change
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('根元素上使用方的 onClick，点击文字时只调用一次', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        render(() => <Radio onClick={onClick}>label</Radio>);
        await userEvent.click(screen.getByText('label'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('原生 input 带 value，id 落在 input 上，外部 label 的 for 可以指向它', async () => {
        render(() => (
            <form data-testid="form">
                <Radio id="r-id" name="fruit" value="apple">
                    apple
                </Radio>
            </form>
        ));
        const outerLabel = document.createElement('label');
        outerLabel.htmlFor = 'r-id';
        outerLabel.textContent = 'outer label';
        document.body.append(outerLabel);
        const input = screen.getByRole('radio');
        expect(input).toHaveAttribute('value', 'apple');
        expect(input).toHaveAttribute('id', 'r-id');
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveAttribute('id');
        await userEvent.click(screen.getByText('outer label'));
        expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('fruit')).toBe('apple');
        outerLabel.remove();
    });

    it('按钮式 Radio 不渲染 extra', () => {
        render(() => (
            <Radio type="button" extra="more">
                a
            </Radio>
        ));
        expect(document.querySelector(`.${prefixCls}-extra`)).toBeNull();
    });

    it('卸载后移除控件', () => {
        const { unmount } = render(() => <Radio />);
        unmount();
        expect(screen.queryByRole('radio')).toBeNull();
    });

    it('展开信号对象时，无关属性变化不重置非受控状态', async () => {
        const [props, setProps] = createSignal<RadioProps>({});
        render(() => <Radio {...props()}>one</Radio>);
        await userEvent.click(screen.getByRole('radio'));
        expect(screen.getByRole<HTMLInputElement>('radio').checked).toBe(true);
        setProps({ class: 'other' });
        expect(document.querySelector(`.${prefixCls}.other`)).toHaveClass(`${prefixCls}-checked`);
        expect(screen.getByRole<HTMLInputElement>('radio').checked).toBe(true);
    });
});
