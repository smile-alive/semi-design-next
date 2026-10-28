/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import InputNumber from '..';
import Controlled from './fixtures/controlled.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-input-number`;

const getInput = () => screen.getByRole<HTMLInputElement>('spinbutton');
const getButton = (direction: 'up' | 'down') => document.querySelector(`.${prefixCls}-button-${direction}`) as HTMLElement;
const getButtons = () => document.querySelector(`.${prefixCls}-suffix-btns`);
const getWrapper = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input-number`) as HTMLElement;
const thousands = (value: number | string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const removeThousands = (value: string) => value.replace(/,/g, '');

describe('InputNumber（浏览器）', () => {
    it('修复精度删除问题', async () => {
        render(InputNumber, { props: { defaultValue: 10.0, precision: 2 } });
        const input = getInput();
        await userEvent.clear(input);
        await userEvent.type(input, 'aaa');
        await userEvent.tab();
        expect(input).toHaveValue('');
    });

    it('方向键与 Shift 方向键按 step、shiftStep 步进', async () => {
        render({
            render: () => (
                <>
                    <InputNumber aria-label="default" />
                    <InputNumber aria-label="step" step={5} shiftStep={100} />
                </>
            ),
        });
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

    it('点击 #prefix、#suffix 插槽使输入框获得焦点', async () => {
        render({
            render: () => (
                <>
                    <InputNumber>{{ prefix: () => '年龄', suffix: () => '岁' }}</InputNumber>
                    <button type="button">outside</button>
                </>
            ),
        });
        const input = getInput();
        const outside = screen.getByRole('button', { name: 'outside' });
        for (const part of ['prefix', 'suffix']) {
            await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-input-${part}`) as HTMLElement);
            expect(input).toHaveFocus();
            await userEvent.click(outside);
            expect(input).not.toHaveFocus();
        }
    });

    describe('v-model 下 formatter 与 parser 按倍率换算', () => {
        const minute = 60000;
        const attrs = {
            min: minute,
            step: minute,
            formatter: (value: number | string) => String(Number(`${value}`.replace(/\D/g, '')) / minute),
            parser: (value: string) => String(Number(`${value}`.replace(/\D/g, '')) * minute),
        };
        const clickButtons = async (input: HTMLInputElement) => {
            const steps = [
                ['up', '2'],
                ['up', '3'],
                ['down', '2'],
                ['down', '1'],
            ] as const;
            for (const [button, value] of steps) {
                await userEvent.click(getButton(button));
                expect(input).toHaveValue(value);
            }
        };

        it('点击按钮显示换算后的值', async () => {
            render(Controlled, { props: { initValue: minute }, attrs });
            expect(getInput()).toHaveValue('1');
            await clickButtons(getInput());
        });

        it('先聚焦输入框再点击按钮', async () => {
            render(Controlled, { props: { initValue: minute }, attrs });
            expect(getInput()).toHaveValue('1');
            await userEvent.click(getInput());
            await clickButtons(getInput());
        });
    });

    it('keepFocus 下点击加减按钮不发出 blur', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(InputNumber, { props: { defaultValue: 8, max: 10, keepFocus: true, onBlur } });
        const input = getInput();
        await userEvent.click(input);
        for (const value of ['9', '10']) {
            await userEvent.click(getButton('up'));
            expect(input).toHaveValue(value);
            expect(input).toHaveFocus();
        }
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('ShadowRoot 内 keepFocus 步进时已聚焦的输入框不再重复聚焦', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(InputNumber, { container: mount, props: { defaultValue: 1, keepFocus: true } });
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

    it('keepFocus 下已到 max 或 min 时点击按钮，输入框仍保持焦点', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(InputNumber, { props: { defaultValue: 10, max: 10, min: 10, keepFocus: true, onBlur } });
        const input = getInput();
        await userEvent.click(input);
        for (const direction of ['up', 'down'] as const) {
            await userEvent.click(getButton(direction));
            expect(input).toHaveValue('10');
            expect(input).toHaveFocus();
        }
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('keepFocus 下只读时点击按钮，输入框仍保持焦点', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(InputNumber, { props: { defaultValue: 5, keepFocus: true, readonly: true, onBlur } });
        const input = getInput();
        await userEvent.click(input);
        await userEvent.click(getButton('up'));
        expect(input).toHaveValue('5');
        expect(input).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it.each([{ keepFocus: true }, { innerButtons: true }])('按下步进按钮时 mousedown 仍冒泡到 window，输入框保持焦点 %o', async (props) => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        window.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => window.removeEventListener('mousedown', onMouseDown));
        render(InputNumber, { props: { defaultValue: 1, ...props } });
        const input = getInput();
        await userEvent.click(input);
        onMouseDown.mockClear();
        await userEvent.click(getButton('up'));
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('2');
        expect(input).toHaveFocus();
    });

    it('在按钮外松开按下会结束连续触发', async () => {
        render({
            render: () => (
                <div style={{ display: 'flex' }}>
                    <InputNumber defaultValue={1} />
                    <div style={{ width: '200px', height: '100px' }} data-testid="outside" />
                </div>
            ),
        });
        const input = getInput();
        const up = getButton('up');
        expect(getComputedStyle(up).touchAction).toBe('none');

        // A slow drag would let the real press timeout and repeats run before the release; frozen timers keep the
        // press at its single step, and advancing them afterwards shows whether the release stopped the repeat
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
        onTestFinished(() => {
            vi.useRealTimers();
        });
        await userEvent.dragAndDrop(up, screen.getByTestId('outside'));
        expect(input).toHaveValue('2');
        vi.advanceTimersByTime(1000);
        await nextTick();
        expect(input).toHaveValue('2');
    });

    it('innerButtons 悬停时显示按钮，移出后消失', async () => {
        render({
            render: () => (
                <>
                    <InputNumber defaultValue={1} innerButtons />
                    <button type="button">outside</button>
                </>
            ),
        });
        expect(getButtons()).toBeNull();
        await userEvent.hover(getWrapper());
        await vi.waitFor(() => expect(getButtons()).not.toBeNull());
        await userEvent.click(getButton('up'));
        expect(getInput()).toHaveValue('2');
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await vi.waitFor(() => expect(getButtons()).toBeNull());
    });

    it('hideButtons 与 innerButtons 同时设置时悬停与聚焦都没有按钮', async () => {
        render(InputNumber, { props: { defaultValue: 1, hideButtons: true, innerButtons: true } });
        await userEvent.hover(getWrapper());
        await userEvent.click(getInput());
        expect(getButtons()).toBeNull();
    });

    describe('格式化后的光标位置', () => {
        it('在中间输入时，光标留在后续数字之前', async () => {
            render(InputNumber, { props: { defaultValue: 100, formatter: thousands, parser: removeThousands } });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(1, 1);
            await userEvent.keyboard('5');
            expect(input).toHaveValue('1,500');
            expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
        });

        it('在开头输入时，光标留在原有数字之前', async () => {
            render(InputNumber, { props: { defaultValue: 100, formatter: thousands, parser: removeThousands } });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(0, 0);
            await userEvent.keyboard('9');
            expect(input).toHaveValue('9,100');
            expect(input.selectionStart).toBe(2);
        });

        it('v-model 写回后光标位置不变', async () => {
            render(Controlled, { props: { initValue: 100 }, attrs: { formatter: thousands, parser: removeThousands } });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(1, 1);
            await userEvent.keyboard('5');
            expect(input).toHaveValue('1,500');
            expect(input.selectionStart).toBe(3);
        });

        it('步进后光标相对不变的尾部保持位置', async () => {
            render(InputNumber, {
                props: { defaultValue: 1000, step: 1000, formatter: thousands, parser: removeThousands },
            });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(1, 1);
            await userEvent.keyboard('{ArrowUp}');
            expect(input).toHaveValue('2,000');
            expect(input.selectionStart).toBe(1);
        });
    });
});
