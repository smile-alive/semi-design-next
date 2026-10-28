import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing } from '@test/utils/browser';
import Radio, { RadioGroup, type RadioChangeEvent } from '..';

const prefix = `${BASE_CLASS_PREFIX}-radio`;
const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;

describe('Radio（浏览器）', () => {
    // Chrome sends no click for Space on a checked radio; the jsdom tests that press Space simulate one and miss this.
    it('高级模式下，聚焦已选中的 Radio 按空格取消选中', async () => {
        const onChange = vi.fn<(event: RadioChangeEvent) => void>();
        render(() => <Radio aria-label="advanced" defaultChecked mode="advanced" onChange={onChange} />);
        screen.getByRole('radio').focus();
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.checked).toBe(false);
        expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('radio extra：点击选中，Tab 移到下一个并显示焦点环', async () => {
        const extra = '这是辅助的文本，同厂辅助文本会更长一些，甚至还可能换行';
        const { container } = render(() => (
            <>
                <Radio name="demo-radio-1" value="1" extra={extra}>
                    示例文本
                </Radio>
                <Radio name="demo-radio-2" style={{ width: '200px' }} value="1" extra={extra}>
                    示例文本
                </Radio>
            </>
        ));
        const radios = container.querySelectorAll(`.${prefix}`);
        const inputs = screen.getAllByRole('radio');

        await userEvent.click(radios[0]);
        expect(inputs[0]).toBeChecked();
        await userEvent.keyboard('{Tab}');
        expect(inputs[1]).toHaveFocus();
        expectThemeFocusRing(radios[1].querySelector(`.${prefix}-inner-display`) as HTMLElement);
        expect(outlineOf(radios[0].querySelector(`.${prefix}-inner-display`) as HTMLElement)).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expect(inputs[0]).toBeChecked();
        expect(inputs[1]).not.toBeChecked();
    });

    it('键盘聚焦未选中的单选框，圆圈显示主题焦点环和悬停描边色', async () => {
        const { container } = render(() => <Radio>label</Radio>);
        const display = container.querySelector(`.${prefix}-inner-display`) as HTMLElement;
        await userEvent.keyboard('{Tab}');
        expectThemeFocusRing(display);
        expect(getComputedStyle(display).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    it('鼠标点击单选框后不显示焦点环，再按键后显示主题焦点环', async () => {
        const { container } = render(() => <Radio>label</Radio>);
        const display = container.querySelector(`.${prefix}-inner-display`) as HTMLElement;
        await userEvent.click(container.querySelector(`.${prefix}`) as HTMLElement);
        expect(screen.getByRole('radio')).toHaveFocus();
        expect(outlineOf(display)).toBe('none');
        // Backspace does nothing on a radio, it only makes the browser treat the focus as keyboard focus
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(display);
    });

    it('card 与 button 类型的焦点环在外层，圆圈上没有', async () => {
        const { container } = render(() => (
            <>
                <Radio type="card">card</Radio>
                <Radio type="button">button</Radio>
            </>
        ));
        const [card, button] = container.querySelectorAll<HTMLElement>('label');
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'card' })).toHaveFocus();
        expectThemeFocusRing(card);
        expect(outlineOf(card.querySelector(`.${prefix}-inner-display`) as HTMLElement)).toBe('none');
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'button' })).toHaveFocus();
        expectThemeFocusRing(button.querySelector(`.${prefix}-addon-buttonRadio`) as HTMLElement);
        expect(outlineOf(button)).toBe('none');
        expect(outlineOf(card)).toBe('none');
    });

    it('radio type button 类型：方向键移动选中项', async () => {
        const [value, setValue] = createSignal(1);
        const options = [
            { label: 'semi', value: 1 },
            { label: 'design', value: 2 },
            { label: 'designToCode', value: 3 },
            { label: 'dsm', value: 4 },
        ];
        const { container } = render(() => <RadioGroup name="demo-radio-button-1" type="button" value={value()} buttonSize="small" options={options} onChange={(event) => setValue(event.target.value)} />);
        const buttons = container.querySelectorAll(`.${prefix}-buttonRadioGroup-small`);

        await userEvent.click(buttons[0]);
        // Native radio-group arrow navigation checks the next radio with the same name
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('radio', { name: 'design' })).toBeChecked();
        expect(buttons[1].querySelector(`.${prefix}-inner-checked`)).not.toBeNull();
        expect(buttons[0].querySelector(`.${prefix}-inner-checked`)).toBeNull();
    });

    it('advance 模式的 radio', async () => {
        const [checked, setChecked] = createSignal(true);
        const { container } = render(() => (
            <Radio
                checked={checked()}
                mode="advanced"
                onChange={(event) => {
                    setChecked(event.target.checked);
                    event.stopPropagation();
                    event.preventDefault();
                }}
            >
                111
            </Radio>
        ));
        expect(container.querySelector(`.${prefix} svg`)).not.toBeNull();

        await userEvent.click(container.querySelector(`.${prefix}`) as HTMLElement);
        await userEvent.keyboard('{Backspace}');
        // asserts the rendered mark only: preventDefault in onChange makes the browser restore the native state
        expect(container.querySelector(`.${prefix} svg`)).toBeNull();
        expect(container.querySelector(`.${prefix}`)).not.toHaveClass(`${prefix}-checked`);
    });

    it('悬停未选中的卡片或按钮选项显示悬停背景，选中后悬停不再显示', async () => {
        const probe = (token: string) => {
            const span = document.createElement('span');
            span.style.backgroundColor = `var(${token})`;
            document.body.append(span);
            const color = getComputedStyle(span).backgroundColor;
            span.remove();
            return color;
        };
        const { container } = render(() => (
            <>
                <Radio type="card">card</Radio>
                <Radio type="button">button</Radio>
            </>
        ));
        const [card, button] = container.querySelectorAll('label');
        const addon = button.querySelector(`.${prefix}-addon-buttonRadio`) as HTMLElement;
        // the transition would leave the computed value between the two colors right after the pointer moves
        card.style.transition = 'none';
        addon.style.transition = 'none';

        await userEvent.hover(card);
        expect(getComputedStyle(card).backgroundColor).toBe(probe('--semi-color-fill-0'));
        await userEvent.hover(button);
        expect(getComputedStyle(card).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(addon).backgroundColor).toBe(probe('--semi-color-fill-1'));

        await userEvent.click(addon);
        expect(screen.getByRole('radio', { name: 'button' })).toBeChecked();
        expect(getComputedStyle(addon).backgroundColor).not.toBe(probe('--semi-color-fill-1'));
        await userEvent.click(card.querySelector(`.${prefix}-addon`) as HTMLElement);
        expect(screen.getByRole('radio', { name: 'card' })).toBeChecked();
        expect(getComputedStyle(card).backgroundColor).not.toBe(probe('--semi-color-fill-0'));
    });

    it('advance 模式的 radio group', async () => {
        const { container } = render(() => (
            <RadioGroup mode="advanced">
                <Radio value="1">111</Radio>
                <Radio value="2">222</Radio>
                <Radio value="3">333</Radio>
            </RadioGroup>
        ));
        const radios = container.querySelectorAll(`.${prefix}`);

        await userEvent.click(radios[0]);
        await userEvent.keyboard('{Backspace}');
        const checkedInner = radios[0].querySelector(`.${prefix}-inner-checked`);
        expect(checkedInner).not.toBeNull();
        await userEvent.click(checkedInner as HTMLElement);
        expect(radios[0].querySelector(`.${prefix}-inner-checked`)).toBeNull();
        expect(screen.getByRole('radio', { name: '111' })).not.toBeChecked();
    });

    it('按钮型 RadioGroup 在窄的弹性行里文字保持单行原宽，不按字换行', () => {
        const row = (width: number) => (
            <div style={{ display: 'flex', width: `${width}px` }}>
                <div style={{ flex: 'none', width: '260px' }} />
                <RadioGroup type="button" options={['本月', '自定义']} />
            </div>
        );
        const { container } = render(() => (
            <>
                {row(600)}
                {row(300)}
            </>
        ));
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefix}-addon-buttonRadio`)].reduce<{ width: number; height: number }[][]>(
            (rows, el, i) => {
                const { width, height } = el.getBoundingClientRect();
                rows[Math.floor(i / 2)].push({ width, height });
                return rows;
            },
            [[], []]
        );
        expect(narrow).toEqual(roomy);
    });
});
