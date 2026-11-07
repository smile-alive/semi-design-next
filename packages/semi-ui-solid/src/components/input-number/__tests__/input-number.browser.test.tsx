import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import InputNumber, { type InputNumberProps } from '..';

const prefixCls = `${BASE_CLASS_PREFIX}-input-number`;
const button = (direction: 'up' | 'down') => document.querySelector(`.${prefixCls}-button-${direction}`) as HTMLElement;

describe('InputNumber（浏览器）', () => {
    it('删除精度值后输入非法字符，失焦后保持为空', async () => {
        render(() => <InputNumber defaultValue={10.0} precision={2} />);
        const input = screen.getByRole('spinbutton');
        await userEvent.clear(input);
        await userEvent.type(input, 'aaa');
        await userEvent.tab();
        expect(input).toHaveValue('');
    });

    it('方向键与 Shift 加方向键按 step、shiftStep 步进', async () => {
        render(() => (
            <>
                <InputNumber aria-label="default" />
                <InputNumber aria-label="step" step={5} shiftStep={100} />
            </>
        ));
        const steps = [
            ['default', '{ArrowUp}', '1'],
            ['default', '{Shift>}{ArrowUp}{/Shift}', '11'],
            ['default', '{ArrowDown}', '10'],
            ['step', '{ArrowUp}', '5'],
            ['step', '{Shift>}{ArrowUp}{/Shift}', '105'],
            ['step', '{Shift>}{ArrowDown}{/Shift}', '5'],
        ];
        for (const [label, keys, value] of steps) {
            const input = screen.getByLabelText(label);
            await userEvent.click(input);
            await userEvent.keyboard(keys);
            expect(input).toHaveValue(value);
        }
    });

    it('点击前缀、后缀时输入框获得焦点', async () => {
        const { container } = render(() => (
            <>
                <InputNumber prefix="年龄" suffix="岁" />
                <button type="button">outside</button>
            </>
        ));
        const input = screen.getByRole('spinbutton');
        const outside = screen.getByRole('button', { name: 'outside' });
        for (const part of ['prefix', 'suffix']) {
            await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-input-${part}`) as HTMLElement);
            expect(input).toHaveFocus();
            await userEvent.click(outside);
            expect(input).not.toHaveFocus();
        }
    });

    function Fix1772() {
        const [value, setValue] = createSignal<string | number>(60000);
        return <InputNumber min={60000} step={60000} value={value()} formatter={(v) => String(Number(`${v}`.replace(/\D/g, '')) / 60000)} parser={(v) => String(Number(`${v}`.replace(/\D/g, '')) * 60000)} onChange={setValue} />;
    }

    const clickButtons = async (input: HTMLElement) => {
        const steps = [
            ['up', '2'],
            ['up', '3'],
            ['down', '2'],
            ['down', '1'],
        ] as const;
        for (const [direction, value] of steps) {
            await userEvent.click(button(direction));
            expect(input).toHaveValue(value);
        }
    };

    it('受控模式下 formatter 与 parser 配合步进按钮', async () => {
        render(() => <Fix1772 />);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue('1');
        await clickButtons(input);
    });

    it('受控模式下 formatter 与 parser：聚焦后点击步进按钮', async () => {
        render(() => <Fix1772 />);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue('1');
        await userEvent.click(input);
        await clickButtons(input);
    });

    it('keepFocus 下点击加减按钮不触发 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<InputNumberProps['onBlur']>>();
        render(() => <InputNumber defaultValue={8} max={10} keepFocus onBlur={onBlur} />);
        const input = screen.getByRole('spinbutton');
        await userEvent.click(input);
        for (const value of ['9', '10']) {
            await userEvent.click(button('up'));
            expect(input).toHaveValue(value);
            expect(input).toHaveFocus();
        }
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('keepFocus 下已到 max 或 min 时点击按钮，输入框仍保持焦点', async () => {
        const onBlur = vi.fn<NonNullable<InputNumberProps['onBlur']>>();
        render(() => <InputNumber defaultValue={10} max={10} min={10} keepFocus onBlur={onBlur} />);
        const input = screen.getByRole('spinbutton');
        await userEvent.click(input);
        for (const direction of ['up', 'down'] as const) {
            await userEvent.click(button(direction));
            expect(input).toHaveValue('10');
            expect(input).toHaveFocus();
        }
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('keepFocus 下只读时点击按钮，输入框仍保持焦点', async () => {
        const onBlur = vi.fn<NonNullable<InputNumberProps['onBlur']>>();
        render(() => <InputNumber defaultValue={5} keepFocus readonly onBlur={onBlur} />);
        const input = screen.getByRole('spinbutton');
        await userEvent.click(input);
        await userEvent.click(button('up'));
        expect(input).toHaveValue('5');
        expect(input).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it.each([{ keepFocus: true }, { innerButtons: true }])('按下步进按钮时 mousedown 仍冒泡到 window，输入框保持焦点 %o', async (props) => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        window.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => window.removeEventListener('mousedown', onMouseDown));
        render(() => <InputNumber defaultValue={1} {...props} />);
        const input = screen.getByRole('spinbutton');
        await userEvent.click(input);
        onMouseDown.mockClear();
        await userEvent.click(button('up'));
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('2');
        expect(input).toHaveFocus();
    });

    it('在按钮外松开按下会结束连续触发', async () => {
        const { container } = render(() => (
            <div style={{ display: 'flex' }}>
                <InputNumber defaultValue={1} />
                <div style={{ width: '200px', height: '100px' }} data-testid="outside" />
            </div>
        ));
        const input = screen.getByRole('spinbutton');
        const up = button('up');
        expect(getComputedStyle(up).touchAction).toBe('none');

        // A slow drag would let the real press timeout and repeats run before the release; frozen timers keep the
        // press at its single step, and advancing them afterwards shows whether the release stopped the repeat
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
        onTestFinished(() => {
            vi.useRealTimers();
        });
        await userEvent.dragAndDrop(up, container.querySelector('[data-testid="outside"]') as HTMLElement);
        expect(input).toHaveValue('2');
        vi.advanceTimersByTime(1000);
        expect(input).toHaveValue('2');
    });

    it('ShadowRoot 内 keepFocus 步进时已聚焦的输入框不再重复聚焦', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(() => <InputNumber defaultValue={1} keepFocus />, { container: mount });
        try {
            const input = shadow.querySelector('input') as HTMLInputElement;
            input.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(input).toHaveValue('2');
            expect(shadow.activeElement).toBe(input);
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
