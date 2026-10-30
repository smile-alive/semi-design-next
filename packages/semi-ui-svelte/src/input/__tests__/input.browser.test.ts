import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { clickOutside, disableFieldSizing, expectThemeFocusRing, isChromium, tab, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import InputCase from './input-case.svelte';
import TextAreaCase from './textarea-case.svelte';

type InputStore = NonNullable<Parameters<typeof InputCase>[1]>['store'];
type TextAreaStore = NonNullable<Parameters<typeof TextAreaCase>[1]>['store'];

const prefix = `${BASE_CLASS_PREFIX}-input`;
const clearName = zh_CN.Input.clear;
const longStr = 'semi design '.repeat(24).trim();
const styleOf = (el: Element) => getComputedStyle(el);
const fitsContent = (el: Element) => expect(el.scrollHeight).toBe(el.clientHeight);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const lineNumberPanel = () => document.querySelector<HTMLElement>(`.${prefix}-textarea-lineNumber`) as HTMLElement;

function renderInput(props: NonNullable<InputStore['props']> = {}, slots: InputStore['slots'] = {}) {
    const store = createStore<InputStore>({ props, slots, handle: {} });
    render(InputCase, { props: { store } });
    return store;
}
function renderTextArea(props: NonNullable<TextAreaStore['props']> = {}) {
    const store = createStore<TextAreaStore>({ props, handle: {} });
    render(TextAreaCase, { props: { store } });
    return store;
}
function renderAutosizeTextAreas() {
    for (const props of [{ autosize: true }, { autosize: true, rows: 2 }, { autosize: false, rows: 2 }, { autosize: { minRows: 1 } }, { autosize: { minRows: 1, maxRows: 3 } }, { autosize: { maxRows: 3 }, rows: 1 }]) {
        renderTextArea({ ...props, style: 'width: 200px' });
    }
    return screen.getAllByRole<HTMLTextAreaElement>('textbox');
}
// Firefox computes a textarea's own overflow as visible and scrolls an inner box, so the scrolling itself is checked
function expectScrollable(el: Element) {
    el.scrollTop = el.scrollHeight;
    expect(el.scrollTop).toBeGreaterThan(0);
}

describe('Svelte Input（浏览器）', () => {
    it('原生 input 的垂直内边距显式为 0，不依赖 UA 的 1px', () => {
        renderInput({ 'aria-label': 'plain' });
        const style = styleOf(screen.getByRole('textbox', { name: 'plain' }));
        expect([style.paddingTop, style.paddingBottom]).toEqual(['0px', '0px']);
    });

    it('FixInputAutoFocus（#2193）：Input autofocus 将光标放在初值之后', () => {
        renderInput({ autofocus: true, value: longStr, style: 'width: 200px' });
        const input = screen.getByRole<HTMLInputElement>('textbox');
        expect(input).toHaveFocus();
        expect([input.selectionStart, input.selectionEnd]).toEqual([longStr.length, longStr.length]);
    });

    it('FixTextAreaAutoFocus（#2193）：TextArea autofocus 将原生光标保持在初值开头', () => {
        renderTextArea({ autofocus: true, value: longStr, style: 'width: 200px' });
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        expect(textarea).toHaveFocus();
        expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([0, 0]);
    });

    it('TextAutoSizeResize（#2026）：容器变窄时 autosize 扩大 TextArea', async () => {
        const store = renderTextArea({ value: longStr, autosize: true, style: 'width: 800px' });
        const textarea = screen.getByRole('textbox');
        await vi.waitFor(() => fitsContent(textarea));
        const wideHeight = textarea.clientHeight;
        // the width lives on the wrapper, which the textarea fills
        (store.props as { style: string }).style = 'width: 100px';
        flushSync();
        await vi.waitFor(() => expect(textarea.clientHeight).toBeGreaterThan(wideHeight));
        fitsContent(textarea);
    });

    it('autosize 随内容增长', async () => {
        const [textarea] = renderAutosizeTextAreas();
        await userEvent.type(textarea, 'semi design');
        expect(styleOf(textarea).fieldSizing).toBe('content');
        await userEvent.fill(textarea, longStr);
        await vi.waitFor(() => fitsContent(textarea));
    });

    it('autosize 最小行数，autosize=false 时固定高度并可滚动', async () => {
        const textareas = renderAutosizeTextAreas();
        const textarea = textareas[1];
        const minHeight = textarea.clientHeight;
        fitsContent(textarea);
        await userEvent.fill(textarea, '111\n222\n333\n444');
        await vi.waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(minHeight));
        await vi.waitFor(() => fitsContent(textarea));
        await userEvent.fill(textarea, '111\n222');
        await vi.waitFor(() => expect(textarea.scrollHeight).toBe(minHeight));
        expect(styleOf(textareas[2]).fieldSizing).toBe('fixed');
        await userEvent.fill(textareas[2], '111\n222\n333\n444');
        expectScrollable(textareas[2]);
    });

    it('autosize 的最小高度为 minRows 行加内边距与描边，未设 maxRows 时没有最大高度', () => {
        const textareas = renderAutosizeTextAreas();
        const chrome = (el: Element) => {
            const s = styleOf(el);
            return parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) + parseFloat(s.borderTopWidth) * 2;
        };
        for (const [index, rows] of [
            [0, 4],
            [1, 2],
            [3, 1],
        ]) {
            const el = textareas[index];
            expect(parseFloat(styleOf(el).minHeight)).toBeCloseTo(rows * parseFloat(styleOf(el).lineHeight) + chrome(el), 1);
            expect(styleOf(el).maxHeight).toBe('none');
        }
        const bounded = textareas[4];
        expect(parseFloat(styleOf(bounded).maxHeight)).toBeCloseTo(3 * parseFloat(styleOf(bounded).lineHeight) + chrome(bounded), 1);
        expect(bounded.offsetHeight).toBeCloseTo(parseFloat(styleOf(bounded).minHeight), 1);
    });

    it('autosize 最小与最大行数', async () => {
        const textareas = renderAutosizeTextAreas();
        for (const textarea of textareas.slice(4)) {
            fitsContent(textarea);
            const minHeight = textarea.clientHeight;
            await userEvent.fill(textarea, '111\n222\n333');
            await vi.waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(minHeight));
            await vi.waitFor(() => fitsContent(textarea));
            await userEvent.fill(textarea, '111\n222\n333\n444');
            await vi.waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight));
            expectScrollable(textarea);
            await userEvent.fill(textarea, '111');
            await vi.waitFor(() => expect(textarea.scrollHeight).toBe(minHeight));
        }
    });

    it('autosize 高度变化时发出 onResize，首次观察不发出，参数为 border-box 高度', async () => {
        const onResize = vi.fn<(size: { height: number; width?: number }) => void>();
        renderTextArea({ autosize: { minRows: 1 }, onResize });
        const textarea = screen.getByRole('textbox');
        await wait(100);
        expect(onResize).not.toHaveBeenCalled();
        await userEvent.fill(textarea, '1\n2\n3\n4');
        await vi.waitFor(() => expect(onResize).toHaveBeenCalled());
        expect(onResize).toHaveBeenLastCalledWith({ height: textarea.getBoundingClientRect().height });
        const grown = onResize.mock.calls.length;
        await userEvent.type(textarea, 'a');
        await wait(100);
        expect(onResize).toHaveBeenCalledTimes(grown);
        await userEvent.fill(textarea, '1');
        await vi.waitFor(() => expect(onResize).toHaveBeenCalledTimes(grown + 1));
        expect(onResize).toHaveBeenLastCalledWith({ height: textarea.getBoundingClientRect().height });
    });

    it('showLineNumber 折行的行号项高度是行数乘行高，且不为任何一行创建 canvas', async () => {
        const createElement = vi.spyOn(document, 'createElement');
        renderTextArea({ value: `short\n${'word '.repeat(60)}`, showLineNumber: true, style: 'width: 200px' });
        await vi.waitFor(() => expect(lineNumberPanel().style.height).not.toBe(''));
        const [short, long] = [...document.querySelectorAll<HTMLElement>(`.${prefix}-textarea-lineNumber-item`)];
        const lineHeight = parseFloat(short.style.lineHeight);
        expect(parseFloat(short.style.minHeight)).toBe(lineHeight);
        expect(parseFloat(long.style.minHeight)).toBeGreaterThan(lineHeight);
        expect(parseFloat(long.style.minHeight) % lineHeight).toBe(0);
        expect(createElement.mock.calls.filter(([tag]) => tag === 'canvas')).toHaveLength(0);
    });

    it('触发密码按钮', async () => {
        renderInput({ value: 'Semi Design', mode: 'password', style: 'width: 300px' });
        const input = screen.getByDisplayValue('Semi Design');
        const modeButton = document.querySelector(`.${prefix}-modebtn`);
        await userEvent.click(input);
        await tab();
        expect(modeButton).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveValue('Semi Design');
        await tab();
        expect(modeButton).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveValue('Semi Design');
    });

    it('点击前后缀或经句柄都能聚焦输入框', async () => {
        const store = renderInput({ value: 'hi', style: 'width: 200px' }, { prefix: 'Prefix', suffix: 'Suffix' });
        const input = screen.getByRole('textbox');
        const expectFocusThenBlur = async () => {
            expect(input).toHaveFocus();
            await clickOutside();
            expect(input).not.toHaveFocus();
        };
        await userEvent.click(document.querySelector(`.${prefix}-prefix`) as Element);
        await expectFocusThenBlur();
        await userEvent.click(document.querySelector(`.${prefix}-suffix`) as Element);
        await expectFocusThenBlur();
        store.handle?.current?.focus();
        await expectFocusThenBlur();
    });

    it('Tab 可到达 Input 清除按钮，它显示主题焦点环并能把焦点交还', async () => {
        renderInput({ value: 'semi', showClear: true });
        await tabTo(screen.getByRole('textbox'));
        await tab();
        const clear = screen.getByRole('button', { name: clearName });
        expect(clear).toHaveFocus();
        expectThemeFocusRing(clear);
        await userEvent.keyboard('{Enter}');
        await vi.waitFor(() => expect(screen.queryByRole('button', { name: clearName })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('TextArea 清除按钮在悬停和焦点在内部时显示', async () => {
        renderTextArea({ value: 'semi', showClear: true });
        const clear = () => document.querySelector(`.${prefix}-clearbtn`);
        expect(clear()).not.toBeVisible();
        await userEvent.hover(screen.getByRole('textbox'));
        expect(clear()).toBeVisible();
        await userEvent.unhover(screen.getByRole('textbox'));
        expect(clear()).not.toBeVisible();
        await tabTo(screen.getByRole('textbox'));
        await tab();
        const button = screen.getByRole('button', { name: clearName });
        expect(button).toHaveFocus();
        expect(button).toBeVisible();
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await vi.waitFor(() => expect(clear()).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('Input 有值即渲染清除按钮，只在悬停和焦点在内部时显示，并在那时替换 hideSuffix 的后缀', async () => {
        renderInput({ value: 'semi', hideSuffix: true, showClear: true }, { suffix: 'suffix' });
        const trailing = document.createElement('button');
        trailing.textContent = 'after';
        document.body.append(trailing);
        onTestFinished(() => trailing.remove());
        const clear = document.querySelector(`.${prefix}-clearbtn`);
        const suffix = screen.getByText('suffix');
        expect(clear).not.toBeNull();
        expect(clear).not.toBeVisible();
        expect(suffix).toBeVisible();
        await userEvent.hover(screen.getByRole('textbox'));
        expect(clear).toBeVisible();
        expect(suffix).not.toBeVisible();
        await userEvent.unhover(screen.getByRole('textbox'));
        expect(clear).not.toBeVisible();
        expect(suffix).toBeVisible();
        await tabTo(screen.getByRole('textbox'));
        expect(clear).toBeVisible();
        expect(suffix).not.toBeVisible();
        await tab();
        expect(clear).toHaveFocus();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(clear).not.toBeVisible();
    });

    it('在中间插入字符，光标停在插入点之后（bind:value 往返）', async () => {
        const store = createStore<InputStore>({ props: { 'aria-label': 'model' }, handle: {} });
        render(InputCase, { props: { store } });
        const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'model' });
        await userEvent.type(input, 'abcd');
        input.setSelectionRange(2, 2);
        await userEvent.keyboard('X');
        expect(input).toHaveValue('abXcd');
        expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
    });

    // Playwright has no IME, so the composition goes through CDP Input.imeSetComposition, which only Chromium has
    it.skipIf(!isChromium)('输入法组合中不回写 DOM，组合结束后回到父组件未接受的值', async () => {
        const onChange = vi.fn<(value: string) => void>();
        renderInput({ value: '', onChange });
        const input = screen.getByRole<HTMLInputElement>('textbox');
        await userEvent.click(input);
        await cdp().send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
        await wait(0);
        expect(onChange).toHaveBeenLastCalledWith('ni', expect.anything());
        expect(input).toHaveValue('ni');
        await cdp().send('Input.insertText', { text: '你' });
        await vi.waitFor(() => expect(input).toHaveValue('你'));
    });
});

describe('Svelte TextArea autosize（不支持 field-sizing）', () => {
    it('高度随行数增长，并受 maxRows 限制', async () => {
        disableFieldSizing();
        renderTextArea({ 'aria-label': 'content', autosize: { minRows: 1, maxRows: 3 } });
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const heightOf = async (rows: number) => {
            await userEvent.fill(textarea, Array.from({ length: rows }, (_, i) => `line ${i}`).join('\n'));
            return textarea.getBoundingClientRect().height;
        };

        expect(textarea.style.height).not.toBe('');
        const one = textarea.getBoundingClientRect().height;
        const two = await heightOf(2);
        expect(two).toBeGreaterThan(one);
        const three = await heightOf(3);
        expect(three).toBeGreaterThan(two);
        const six = await heightOf(6);
        expect(six).toBe(three);
        expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
    });

    it('清空内容后高度回到 minRows', async () => {
        disableFieldSizing();
        renderTextArea({ 'aria-label': 'content', autosize: { minRows: 2 }, value: 'a\nb\nc\nd\ne' });
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const tall = textarea.getBoundingClientRect().height;
        await userEvent.clear(textarea);
        await waitFor(() => expect(textarea.getBoundingClientRect().height).toBeLessThan(tall));
    });
});

describe.each([
    ['Input', 'input', `${prefix}-wrapper-focus`],
    ['TextArea', 'textarea', `${prefix}-textarea-wrapper-focus`],
] as const)('%s 与其清除按钮之间的焦点移动保持在内部', (name, _, focusCls) => {
    const renderWithSpies = (props: Record<string, unknown> = { value: 'semi' }) => {
        const spies = { onFocus: vi.fn<() => void>(), onBlur: vi.fn<() => void>() };
        // Firefox keeps focus on the first control when Shift+Tab has nowhere to go, so the field needs a stop before it
        const before = document.body.appendChild(document.createElement('button'));
        before.textContent = 'before';
        const full = { showClear: true, ...spies, ...props };
        const store = name === 'Input' ? renderInput(full) : renderTextArea(full);
        const after = document.body.appendChild(document.createElement('button'));
        after.textContent = 'after';
        onTestFinished(() => {
            before.remove();
            after.remove();
        });
        return { ...spies, store, after };
    };
    const getClear = () => screen.getByRole('button', { name: clearName });
    const getWrapper = () => screen.getByRole('textbox').closest(`[class*="-wrapper"]`);
    // the Input shows its clear button only while hovered or focused, so Tab goes through the input
    const tabToClear = async () => {
        await tabTo(screen.getByRole('textbox'));
        await tab();
        expect(getClear()).toHaveFocus();
    };

    it('Tab 到清除按钮再返回不触发 onBlur，也不二次触发 onFocus，焦点样式保持不变', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabToClear();
        expect(getWrapper()).toHaveClass(focusCls);
        await tab({ shift: true });
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('Tab 移出组件时只触发一次 onBlur，来源可以是输入框或清除按钮', async () => {
        const { onBlur, after } = renderWithSpies();
        await tabTo(screen.getByRole('textbox'));
        await tab({ shift: true });
        expect(onBlur).toHaveBeenCalledTimes(1);
        await tabToClear();
        await tab();
        expect(after).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(2);
        expect(getWrapper()).not.toHaveClass(focusCls);
    });

    it('用键盘清空时不触发 onBlur，也不二次触发 onFocus', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabToClear();
        await userEvent.keyboard('{Enter}');
        await vi.waitFor(() => expect(screen.queryByRole('button', { name: clearName })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清除按钮有焦点时，值在别处被清空，焦点交给输入框', async () => {
        const { onBlur, store } = renderWithSpies({ value: 'semi' });
        await tabToClear();
        (store.props as { value: string }).value = '';
        flushSync();
        await vi.waitFor(() => expect(screen.queryByRole('button', { name: clearName })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(getWrapper()).toHaveClass(focusCls);
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(focusCls);
    });
});
