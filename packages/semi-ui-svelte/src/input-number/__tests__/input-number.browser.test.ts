import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { mouse } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { InputNumberProps } from '../interface';
import InputNumberFixture from './input-number-fixture.svelte';
import InputNumberModes from './input-number-modes.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-input-number`;

const getInput = () => screen.getByRole<HTMLInputElement>('spinbutton');
const getButton = (direction: 'up' | 'down') => document.querySelector(`.${prefixCls}-button-${direction}`) as HTMLElement;
const getButtons = () => document.querySelector(`.${prefixCls}-suffix-btns`);
const getWrapper = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input-number`) as HTMLElement;
const thousands = (value: number | string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const removeThousands = (value: string) => value.replace(/,/g, '');

function mount(props: InputNumberProps = {}, slots = false) {
    const store = createStore<{ props: InputNumberProps; slots: boolean }>({ props, slots });
    render(InputNumberFixture, { props: { store } });
    return store;
}

function center(element: Element) {
    const { left, top, width, height } = element.getBoundingClientRect();
    return { x: left + width / 2, y: top + height / 2 };
}

// A real pointer press: pointerdown with capture on the button, as a finger or mouse gives it
async function pressAt(element: Element) {
    const { x, y } = center(element);
    await mouse('move', x, y);
    await mouse('down', x, y);
    return { x, y };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Svelte InputNumber（浏览器）', () => {
    it('修复精度删除问题', async () => {
        mount({ value: 10.0, precision: 2 });
        const input = getInput();
        await userEvent.clear(input);
        await userEvent.type(input, 'aaa');
        await userEvent.tab();
        expect(input).toHaveValue('');
    });

    it('方向键与 Shift 方向键按 step、shiftStep 步进', async () => {
        mount({ 'aria-label': 'default' } as InputNumberProps);
        mount({ 'aria-label': 'step', step: 5, shiftStep: 100 } as InputNumberProps);
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

    it('按住方向键连续步进，按住期间值持续增加', async () => {
        mount({ value: 0 });
        await userEvent.click(getInput());
        await userEvent.keyboard('{ArrowUp>5/}{/ArrowUp}');
        expect(Number(getInput().value)).toBeGreaterThanOrEqual(5);
    });

    it('长按步进按钮：先步进一次，超时后连发，松开停止', async () => {
        mount({ value: 0, pressTimeout: 60, pressInterval: 30 });
        const input = getInput();
        const up = getButton('up');
        const { x, y } = await pressAt(up);
        await vi.waitFor(() => expect(Number(input.value)).toBeGreaterThanOrEqual(4));
        await mouse('up', x, y);
        const stopped = input.value;
        await sleep(300);
        expect(input).toHaveValue(stopped);
    });

    it('长按下方向按钮连续递减，到 min 后停止', async () => {
        mount({ value: 3, min: 0, pressTimeout: 40, pressInterval: 20 });
        const input = getInput();
        const { x, y } = await pressAt(getButton('down'));
        await vi.waitFor(() => expect(input).toHaveValue('0'));
        await sleep(150);
        expect(input).toHaveValue('0');
        await mouse('up', x, y);
        expect(getButton('down')).toHaveClass(`${prefixCls}-button-down-not-allowed`);
    });

    it('在按钮外松开按下会结束连续触发', async () => {
        mount({ value: 1, pressTimeout: 60, pressInterval: 30 });
        const outside = document.createElement('div');
        outside.style.cssText = 'position:fixed;right:0;bottom:0;width:60px;height:60px';
        document.body.append(outside);
        onTestFinished(() => outside.remove());
        const input = getInput();
        expect(getComputedStyle(getButton('up')).touchAction).toBe('none');
        await pressAt(getButton('up'));
        const target = center(outside);
        await mouse('move', target.x, target.y);
        await mouse('up', target.x, target.y);
        const stopped = input.value;
        await sleep(300);
        expect(input).toHaveValue(stopped);
    });

    it('滚轮不改变数值', async () => {
        mount({ value: 5 });
        const input = getInput();
        await userEvent.click(input);
        await userEvent.wheel(input, { delta: { y: 100 } });
        await userEvent.wheel(input, { delta: { y: -100 } });
        expect(input).toHaveValue('5');
    });

    it('点击 prefix、suffix 使输入框获得焦点', async () => {
        mount({}, true);
        const outside = document.createElement('button');
        outside.textContent = 'outside';
        document.body.append(outside);
        onTestFinished(() => outside.remove());
        const input = getInput();
        for (const part of ['prefix', 'suffix']) {
            await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-input-${part}`) as HTMLElement);
            expect(input).toHaveFocus();
            await userEvent.click(outside);
            expect(input).not.toHaveFocus();
        }
    });

    it('keepFocus 下点击加减按钮不发出 blur，输入框保持焦点', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        mount({ value: 8, max: 10, keepFocus: true, onBlur });
        const input = getInput();
        await userEvent.click(input);
        for (const value of ['9', '10']) {
            await userEvent.click(getButton('up'));
            expect(input).toHaveValue(value);
            expect(input).toHaveFocus();
        }
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('keepFocus 下已到 max 或 min、或只读时点击按钮，输入框仍保持焦点', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        mount({ value: 10, max: 10, min: 10, keepFocus: true, onBlur });
        const input = getInput();
        await userEvent.click(input);
        for (const direction of ['up', 'down'] as const) {
            await userEvent.click(getButton(direction));
            expect(input).toHaveValue('10');
            expect(input).toHaveFocus();
        }
        expect(onBlur).not.toHaveBeenCalled();
    });

    it.each([{ keepFocus: true }, { innerButtons: true }])('按下步进按钮时 mousedown 仍冒泡到 window，输入框保持焦点 %o', async (props) => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        window.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => window.removeEventListener('mousedown', onMouseDown));
        mount({ value: 1, ...props });
        const input = getInput();
        await userEvent.click(input);
        onMouseDown.mockClear();
        await userEvent.click(getButton('up'));
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('2');
        expect(input).toHaveFocus();
    });

    it('innerButtons 悬停时显示按钮，移出后消失', async () => {
        mount({ value: 1, innerButtons: true });
        const outside = document.createElement('button');
        outside.textContent = 'outside';
        document.body.append(outside);
        onTestFinished(() => outside.remove());
        expect(getButtons()).toBeNull();
        await userEvent.hover(getWrapper());
        await vi.waitFor(() => expect(getButtons()).not.toBeNull());
        await userEvent.click(getButton('up'));
        expect(getInput()).toHaveValue('2');
        await userEvent.click(outside);
        await vi.waitFor(() => expect(getButtons()).toBeNull());
    });

    it('函数绑定拒绝输入时，失焦恢复原值', async () => {
        const store = createStore<{ value: number | string | undefined; accept: boolean; log: string[] }>({ value: 5, accept: false, log: [] });
        render(InputNumberModes, { props: { mode: 'function', store, props: {} } });
        const input = getInput();
        await userEvent.click(input);
        await userEvent.keyboard('{End}9');
        expect(store.value).toBe(5);
        await userEvent.tab();
        flushSync();
        expect(input).toHaveValue('5');
    });

    describe('格式化后的光标位置', () => {
        it('在中间输入时，光标留在后续数字之前', async () => {
            mount({ value: 100, formatter: thousands, parser: removeThousands });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(1, 1);
            await userEvent.keyboard('5');
            expect(input).toHaveValue('1,500');
            expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
        });

        it('在开头输入时，光标留在原有数字之前', async () => {
            mount({ value: 100, formatter: thousands, parser: removeThousands });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(0, 0);
            await userEvent.keyboard('9');
            expect(input).toHaveValue('9,100');
            expect(input.selectionStart).toBe(2);
        });

        it('bind:value 写回后光标位置不变', async () => {
            const store = createStore<{ value: number | string | undefined; accept: boolean; log: string[] }>({ value: 100, accept: true, log: [] });
            render(InputNumberModes, { props: { mode: 'bind', store, props: { formatter: thousands, parser: removeThousands } } });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(1, 1);
            await userEvent.keyboard('5');
            expect(input).toHaveValue('1,500');
            expect(input.selectionStart).toBe(3);
        });

        it('步进后光标相对不变的尾部保持位置', async () => {
            mount({ value: 1000, step: 1000, formatter: thousands, parser: removeThousands });
            const input = getInput();
            await userEvent.click(input);
            input.setSelectionRange(1, 1);
            await userEvent.keyboard('{ArrowUp}');
            expect(input).toHaveValue('2,000');
            expect(input.selectionStart).toBe(1);
        });
    });
});
