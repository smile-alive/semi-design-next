import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { PinCodeProps } from '../interface';
import PinCodeFixture from './pincode-fixture.svelte';
import PinCodeModes from './pincode-modes.svelte';

const digit = (index: number, count = 4) => zh_CN.PinCode.digit.replace('${index}', String(index)).replace('${count}', String(count));
const input = (index: number, count = 4) => screen.getByRole<HTMLInputElement>('textbox', { name: digit(index, count) });
const values = () => screen.getAllByRole<HTMLInputElement>('textbox').map((cell) => cell.value);

// Vitest's userEvent.paste takes no text and reads the system clipboard, which a test cannot fill without a grant; a
// real ClipboardEvent with a real DataTransfer reaches the same listener
function paste(text: string) {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text', text);
    document.activeElement?.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
}

function mount(props: PinCodeProps = {}) {
    const store = createStore<{ props: PinCodeProps }>({ props });
    render(PinCodeFixture, { props: { store } });
    flushSync();
    return store;
}

describe('Svelte PinCode（浏览器）', () => {
    it('输入时焦点向后移动，Backspace 向前移动，聚焦的数字位显示主题焦点边框', async () => {
        mount({ count: 4, 'aria-label': 'code' } as PinCodeProps);
        await tabTo(input(1));
        const probe = document.createElement('span');
        probe.style.color = 'var(--semi-color-focus-border)';
        document.body.append(probe);
        const focusBorder = getComputedStyle(probe).color;
        probe.remove();
        expect(getComputedStyle(input(1).closest('.semi-input-wrapper') as Element).borderColor).toBe(focusBorder);

        await userEvent.keyboard('1');
        expect(input(2)).toHaveFocus();
        await userEvent.keyboard('2');
        expect(input(3)).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        expect(input(2)).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        expect(input(1)).toHaveFocus();
        expect(input(2)).toHaveValue('');
    });

    it('自动跳格：连续输入逐格填入，填满后最后一格失焦并发出 onComplete', async () => {
        const onComplete = vi.fn<(value: string) => void>();
        mount({ count: 4, onComplete, 'aria-label': 'code' } as PinCodeProps);
        await userEvent.click(input(1));
        await userEvent.keyboard('1234');
        expect(values()).toEqual(['1', '2', '3', '4']);
        await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith('1234'));
        expect(input(4)).not.toHaveFocus();
    });

    it('粘贴：从当前格填满，焦点离开最后一格；中途遇到非法字符停止', async () => {
        const onChange = vi.fn<(value: string) => void>();
        mount({ count: 4, onChange, 'aria-label': 'code' } as PinCodeProps);
        await userEvent.click(input(1));
        paste('12a4');
        await vi.waitFor(() => expect(values()).toEqual(['1', '2', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('12');
        await vi.waitFor(() => expect(input(3)).toHaveFocus());
        paste('34');
        await vi.waitFor(() => expect(values()).toEqual(['1', '2', '3', '4']));
    });

    it('bind:value 下粘贴、输入与退格得到整串', async () => {
        const store = createStore<{ value: string | undefined; accept: boolean; log: string[] }>({ value: '', accept: true, log: [] });
        render(PinCodeModes, { props: { mode: 'bind', store, props: { count: 4, 'aria-label': 'code' } as PinCodeProps } });
        await userEvent.click(input(1));
        await userEvent.keyboard('12');
        await vi.waitFor(() => expect(store.value).toBe('12'));
        paste('34');
        await vi.waitFor(() => expect(store.value).toBe('1234'));
        await userEvent.click(input(4));
        await userEvent.keyboard('{Backspace}');
        await vi.waitFor(() => expect(store.value).toBe('123'));
        expect(values()).toEqual(['1', '2', '3', '']);
    });

    it('退格回退：已填的中间格清除后面前移，焦点回到上一格', async () => {
        mount({ value: '123', count: 4, 'aria-label': 'code' } as PinCodeProps);
        await userEvent.click(input(2));
        await userEvent.keyboard('{Backspace}');
        await vi.waitFor(() => expect(values()).toEqual(['1', '3', '', '']));
        expect(input(1)).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        await vi.waitFor(() => expect(values()).toEqual(['3', '', '', '']));
        expect(input(1)).toHaveFocus();
    });

    it('光标在已填字符之前输入时，写入的是新输入的字符', async () => {
        const onChange = vi.fn<(value: string) => void>();
        mount({ value: '1', count: 4, onChange, 'aria-label': 'code' } as PinCodeProps);
        await userEvent.click(input(1));
        input(1).setSelectionRange(0, 0);
        await userEvent.keyboard('2');
        expect(onChange).toHaveBeenLastCalledWith('2');
        expect(input(1)).toHaveValue('2');
    });

    it('焦点离开整个验证码时 onBlur 只发出一次，在数字位之间移动时不发出', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        mount({ count: 4, onBlur, 'aria-label': 'code' } as PinCodeProps);
        const after = document.createElement('button');
        after.textContent = 'after';
        document.body.append(after);
        try {
            await tabTo(input(1));
            await userEvent.keyboard('1');
            await userEvent.keyboard('2');
            expect(input(3)).toHaveFocus();
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.keyboard('{Tab}{Tab}');
            expect(after).toHaveFocus();
            expect(onBlur).toHaveBeenCalledTimes(1);
        } finally {
            after.remove();
        }
    });

    // Playwright has no IME, so the composition goes through the Chromium input domain
    it('输入法组合提交一个字符时只发出一次 onChange，焦点移到下一格', async () => {
        const onChange = vi.fn<(value: string) => void>();
        mount({ count: 4, format: 'mixed', onChange, 'aria-label': 'code' } as PinCodeProps);
        await userEvent.click(input(1));
        await cdp().send('Input.imeSetComposition', { text: 'a', selectionStart: 1, selectionEnd: 1 });
        expect(onChange).not.toHaveBeenCalled();
        await cdp().send('Input.insertText', { text: 'b' });
        await vi.waitFor(() => expect(input(2)).toHaveFocus());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('b');
        expect(input(1)).toHaveValue('b');
    });
});
