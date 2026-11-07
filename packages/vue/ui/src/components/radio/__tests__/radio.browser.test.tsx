/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Radio, { RadioGroup } from '..';
import GroupModel from './fixtures/group-model.vue';
import Model from './fixtures/model.vue';

const prefix = `${BASE_CLASS_PREFIX}-radio`;
const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;
const display = (el: Element) => el.querySelector(`.${prefix}-inner-display`) as Element;

describe('Radio（浏览器）', () => {
    // Chrome sends no click for Space on a checked radio; the jsdom tests that press Space simulate one and miss this.
    it('高级模式下，聚焦已选中的 Radio 按空格取消选中', async () => {
        const change = vi.fn<(event: { target: { checked: boolean } }) => void>();
        render(Radio, { props: { mode: 'advanced', defaultChecked: true, onChange: change }, attrs: { 'aria-label': 'advanced' } });
        screen.getByRole<HTMLInputElement>('radio').focus();
        await userEvent.keyboard(' ');
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0].target.checked).toBe(false);
        expect(screen.getByRole('radio')).not.toBeChecked();
    });
    it('radio 额外点击', async () => {
        const extra = '这是辅助的文本，同厂辅助文本会更长一些，甚至还可能换行';
        const { container } = render({
            render: () => (
                <>
                    <Radio name="demo-radio-1" value="1">
                        {{ default: () => '示例文本', extra: () => extra }}
                    </Radio>
                    <Radio name="demo-radio-2" value="1" style={{ width: '200px' }}>
                        {{ default: () => '示例文本', extra: () => extra }}
                    </Radio>
                </>
            ),
        });
        const radios = container.querySelectorAll(`.${prefix}`);
        const inputs = screen.getAllByRole('radio');

        await userEvent.click(radios[0] as Element);
        expect(inputs[0]).toBeChecked();
        await userEvent.keyboard('{Tab}');
        expect(inputs[1]).toHaveFocus();
        expectThemeFocusRing(display(radios[1] as Element));
        expect(outlineOf(display(radios[0] as Element))).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expect(inputs[0]).toBeChecked();
        expect(inputs[1]).not.toBeChecked();
    });

    it('键盘聚焦未选中的单选框，圆圈显示主题焦点环和悬停描边色', async () => {
        const { container } = render(Radio, { slots: { default: () => 'label' } });
        await userEvent.keyboard('{Tab}');
        expectThemeFocusRing(display(container));
        expect(getComputedStyle(display(container)).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    it('鼠标点击单选框后不显示焦点环，再按键后显示主题焦点环', async () => {
        const { container } = render(Radio, { slots: { default: () => 'label' } });
        await userEvent.click(container.querySelector(`.${prefix}`) as Element);
        expect(screen.getByRole('radio')).toHaveFocus();
        expect(outlineOf(display(container))).toBe('none');
        // Backspace does nothing on a radio, it only makes the browser treat the focus as keyboard focus
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(display(container));
    });

    it('card 与 button 类型的焦点环在外层，圆圈上没有', async () => {
        const { container } = render({
            render: () => (
                <>
                    <Radio type="card">{() => 'card'}</Radio>
                    <Radio type="button">{() => 'button'}</Radio>
                </>
            ),
        });
        const [card, button] = container.querySelectorAll<HTMLElement>('label') as unknown as HTMLElement[];
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'card' })).toHaveFocus();
        expectThemeFocusRing(card);
        expect(outlineOf(display(card))).toBe('none');
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'button' })).toHaveFocus();
        expectThemeFocusRing(button.querySelector(`.${prefix}-addon-buttonRadio`) as Element);
        expect(outlineOf(button)).toBe('none');
        expect(outlineOf(card)).toBe('none');
    });

    it('radio type button 类型', async () => {
        const { container } = render(GroupModel);
        const buttons = container.querySelectorAll('label');

        await userEvent.click(buttons[0] as Element);
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('radio', { name: 'design' })).toBeChecked();
        expect(buttons[1]?.querySelector(`.${prefix}-inner-checked`)).not.toBeNull();
        expect(buttons[0]?.querySelector(`.${prefix}-inner-checked`)).toBeNull();
    });

    it('advance 模式的 radio', async () => {
        const { container } = render(Model);
        expect(container.querySelector(`.${prefix} svg`)).not.toBeNull();

        await userEvent.click(container.querySelector(`.${prefix}`) as Element);
        await userEvent.keyboard('{Backspace}');
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
        const { container } = render({
            render: () => (
                <>
                    <Radio type="card">{() => 'card'}</Radio>
                    <Radio type="button">{() => 'button'}</Radio>
                </>
            ),
        });
        const [card, button] = container.querySelectorAll<HTMLElement>('label') as unknown as HTMLElement[];
        const addon = button.querySelector<HTMLElement>(`.${prefix}-addon-buttonRadio`) as HTMLElement;
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
        await userEvent.click(card.querySelector(`.${prefix}-addon`) as Element);
        expect(screen.getByRole('radio', { name: 'card' })).toBeChecked();
        expect(getComputedStyle(card).backgroundColor).not.toBe(probe('--semi-color-fill-0'));
    });

    it('RadioGroup blur：组内方向键移动不触发，Tab 离开整个组触发一次', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render({
            render: () => (
                <>
                    <RadioGroup options={['a', 'b']} onBlur={blur} />
                    <button type="button">after</button>
                </>
            ),
        });
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('radio', { name: 'a' })).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('radio', { name: 'b' })).toHaveFocus();
        expect(blur).not.toHaveBeenCalled();
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(blur).toHaveBeenCalledTimes(1);
    });

    it('advance 模式的 radio group', async () => {
        const { container } = render(RadioGroup, {
            props: { mode: 'advanced' },
            slots: {
                default: () => (
                    <>
                        <Radio value="1">{() => '111'}</Radio>
                        <Radio value="2">{() => '222'}</Radio>
                        <Radio value="3">{() => '333'}</Radio>
                    </>
                ),
            },
        });
        const radios = container.querySelectorAll(`.${prefix}`);

        await userEvent.click(radios[0] as Element);
        await userEvent.keyboard('{Backspace}');
        const checkedInner = radios[0]?.querySelector(`.${prefix}-inner-checked`);
        expect(checkedInner).not.toBeNull();
        await userEvent.click(checkedInner as Element);
        expect(radios[0]?.querySelector(`.${prefix}-inner-checked`)).toBeNull();
        expect(screen.getByRole('radio', { name: '111' })).not.toBeChecked();
    });

    it('按钮型 RadioGroup 在窄的弹性行里文字保持单行原宽，不按字换行', () => {
        const row = (width: number) => (
            <div style={{ display: 'flex', width: `${width}px` }}>
                <div style={{ flex: 'none', width: '260px' }} />
                <RadioGroup type="button" options={['本月', '自定义']} />
            </div>
        );
        const { container } = render({ render: () => [row(600), row(300)] });
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefix}-addon-buttonRadio`)].reduce<{ width: number; height: number }[][]>(
            (rows, el, i) => {
                const { width, height } = el.getBoundingClientRect();
                rows[Math.floor(i / 2)]?.push({ width, height });
                return rows;
            },
            [[], []]
        );
        expect(narrow).toEqual(roomy);
    });
});
