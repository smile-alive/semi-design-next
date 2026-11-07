import type { SubmitEvent } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, preventBackspaceNavigation, tab } from '@test/utils/browser';
import type { CheckboxEvent, CheckboxProps, CheckboxType } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-checkbox`;
const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;

describe('Checkbox', () => {
    it.each(['box', 'text'])('鼠标点击%s后焦点进入勾选框但不显示焦点环', async (part) => {
        const { container } = render(<Checkbox>agree</Checkbox>);
        const display = container.querySelector(`.${prefix}-inner-display`);
        await userEvent.click(part === 'box' ? display : screen.getByText('agree'));
        expect(screen.getByRole('checkbox')).toHaveFocus();
        expect(outlineOf(display)).toBe('none');
    });

    it('键盘聚焦后按空格切换状态，焦点环保持显示', async () => {
        const { container } = render(<Checkbox>agree</Checkbox>);
        await tab();
        await userEvent.keyboard(' ');
        expect(screen.getByRole('checkbox')).toBeChecked();
        expectThemeFocusRing(container.querySelector(`.${prefix}-inner-display`));
    });

    it('checkbox Tab 测试', async () => {
        preventBackspaceNavigation();
        const { container } = render(
            <CheckboxGroup direction="horizontal">
                <Checkbox value="dy">抖音</Checkbox>
                <Checkbox value="hotsoon">火山</Checkbox>
                <Checkbox value="toutiao">今日头条</Checkbox>
                <Checkbox value="xigua">西瓜视频</Checkbox>
            </CheckboxGroup>
        );
        const checkboxes = container.querySelectorAll(`.${prefix}`);

        await userEvent.click(checkboxes[0]);
        expect(checkboxes[0]).toHaveClass(`${prefix}-checked`);
        await tab();
        expect(screen.getByRole('checkbox', { name: '火山' })).toHaveFocus();
        expectThemeFocusRing(checkboxes[1].querySelector(`.${prefix}-inner-display`));
        expect(outlineOf(checkboxes[0].querySelector(`.${prefix}-inner-display`))).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expect(checkboxes[1]).toHaveClass(`${prefix}-unChecked`);
        await userEvent.keyboard('{Backspace}');
        expect(checkboxes[1]).toHaveClass(`${prefix}-unChecked`);
        expect(checkboxes[0]).toHaveClass(`${prefix}-checked`);
    });

    it('checkbox 禁用', async () => {
        const { container } = render(
            <div>
                <Checkbox value={1}>hello</Checkbox>
                <Checkbox checked>这是一个受控的checked=true的checkbox,没有配onChange</Checkbox>
                <Checkbox defaultChecked>这是一个不受控的defaultChecked=true的checkbox</Checkbox>
                <Checkbox disabled>这是一个受控的disabled=true的checkbox</Checkbox>
                <Checkbox checked disabled>
                    既checked又disabled
                </Checkbox>
                <Checkbox indeterminate>indeterminate</Checkbox>
                <Checkbox value={1} />
            </div>
        );
        const displays = container.querySelectorAll(`.${prefix}-inner-display`);

        await userEvent.click(container.querySelector(`.${prefix}`));
        await tab();
        await tab();
        await tab();
        expect(screen.getByRole('checkbox', { name: 'indeterminate' })).toHaveFocus();
        expectThemeFocusRing(displays[5]);
        expect(Array.from(displays).filter((display) => outlineOf(display) !== 'none')).toEqual([displays[5]]);
    });

    it('受控半选的 checkbox 点击后仍是 :indeterminate，原生 input 保持 mixed', async () => {
        const onChange = vi.fn<NonNullable<CheckboxProps['onChange']>>();
        render(
            <Checkbox checked={false} indeterminate onChange={onChange}>
                partial
            </Checkbox>
        );
        const input = screen.getByRole<HTMLInputElement>('checkbox', { name: 'partial' });
        expect(input.matches(':indeterminate')).toBe(true);
        // the native input is visually hidden, so the click goes to the wrapper like a pointer would
        await userEvent.click(input.closest(`.${prefix}`));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input.matches(':indeterminate')).toBe(true);
        expect(input).toBePartiallyChecked();
    });

    it.each<[string, CheckboxType]>([
        ['checkbox card', 'card'],
        ['checkbox pureCard', 'pureCard'],
    ])('%s', async (_, type) => {
        preventBackspaceNavigation();
        const { container } = render(
            <CheckboxGroup type={type} defaultValue={['1']} direction="horizontal">
                <Checkbox style={{ width: 280 }} value="1" extra="Semi Design">
                    多选框标题
                </Checkbox>
                <Checkbox style={{ width: 280 }} value="2" extra="Semi Design">
                    多选框标题
                </Checkbox>
                <Checkbox style={{ width: 280 }} value="3" extra="Semi Design">
                    多选框标题
                </Checkbox>
            </CheckboxGroup>
        );
        const cards = container.querySelectorAll(`.${prefix}`);
        const tick = (card) => card.querySelector(`.${prefix}-inner-display .${BASE_CLASS_PREFIX}-icon-checkbox_tick`);
        expect(tick(cards[0])).not.toBeNull();

        await userEvent.click(cards[0]);
        expect(tick(cards[0])).toBeNull();
        await tab();
        expectThemeFocusRing(cards[1]);
        expect(Array.from(cards).filter((card) => outlineOf(card) !== 'none')).toEqual([cards[1]]);
        expect(outlineOf(cards[1].querySelector(`.${prefix}-inner-display`))).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expect(tick(cards[1])).toBeNull();
        await userEvent.keyboard('{Space}');
        expect(tick(cards[1])).not.toBeNull();
    });

    it('Enter 不切换状态，隐式表单提交交由浏览器处理', async () => {
        const onChange = vi.fn<(e: CheckboxEvent) => void>();
        const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <Checkbox onChange={onChange}>agree</Checkbox>
                <button type="submit">submit</button>
            </form>
        );
        screen.getByRole('checkbox').focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('Enter 不执行会把焦点移到按钮上的 onChange，因此该按钮不会被按下', async () => {
        const onConfirm = vi.fn<() => void>();
        render(
            <>
                <Checkbox onChange={() => screen.getByRole('button', { name: 'confirm' }).focus()}>agree</Checkbox>
                <button onClick={onConfirm}>confirm</button>
            </>
        );
        screen.getByRole('checkbox').focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('checkbox')).toHaveFocus();
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
