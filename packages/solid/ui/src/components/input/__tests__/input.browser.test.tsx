import { type Component, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import Input, { type InputProps, type TextAreaProps, TextArea } from '..';
import Button from '../../button';

const prefix = `${BASE_CLASS_PREFIX}-input`;
const longStr = 'semi design '.repeat(24).trim();
const mediumText = 'A modern, comprehensive, flexible design system that gives you all modular blocks you need to build sensible web apps & SaaS products.';
const longText = `${mediumText} `.repeat(8).trim();

function renderAutosizeTextAreas() {
    render(() => (
        <div style={{ width: '200px' }}>
            <TextArea autosize />
            <TextArea autosize rows={2} />
            <TextArea autosize={false} rows={2} />
            <TextArea autosize={{ minRows: 1 }} />
            <TextArea autosize={{ minRows: 1, maxRows: 3 }} />
            <TextArea autosize={{ maxRows: 3 }} rows={1} />
        </div>
    ));
    return screen.getAllByRole<HTMLTextAreaElement>('textbox');
}
const styleOf = (el: Element) => getComputedStyle(el);
const fitsContent = (el: HTMLElement) => expect(el.scrollHeight).toBe(el.clientHeight);
// Firefox computes a textarea's own overflow as visible and scrolls an inner box, so the scrolling itself is checked
function expectScrollable(el: HTMLElement) {
    el.scrollTop = el.scrollHeight;
    expect(el.scrollTop).toBeGreaterThan(0);
}

describe('Input（浏览器）', () => {
    it('只读 Input 整体显示默认光标，可编辑时为文本光标', () => {
        render(() => (
            <>
                <Input aria-label="readonly" readonly />
                <Input aria-label="editable" />
            </>
        ));
        const readonly = screen.getByRole('textbox', { name: 'readonly' });
        expect(styleOf(readonly.closest(`.${prefix}-wrapper`) as HTMLElement).cursor).toBe('default');
        expect(styleOf(readonly).cursor).toBe('default');
        // WebKit's user agent sheet leaves `auto` on text fields, which the browser resolves to the I-beam; Chromium reports `text`
        expect(['text', 'auto']).toContain(styleOf(screen.getByRole('textbox', { name: 'editable' })).cursor);
    });

    it('原生 input 的垂直内边距显式为 0，不依赖 UA 的 1px', () => {
        render(() => <Input aria-label="plain" />);
        const style = styleOf(screen.getByRole('textbox', { name: 'plain' }));
        expect([style.paddingTop, style.paddingBottom]).toEqual(['0px', '0px']);
    });

    it('Input autofocus 将光标放在默认值之后', () => {
        render(() => <Input style={{ width: '200px' }} autofocus defaultValue={longStr} />);
        const input = screen.getByRole<HTMLInputElement>('textbox');
        expect(input).toHaveFocus();
        expect(input.selectionStart).toBe(longStr.length);
        expect(input.selectionEnd).toBe(longStr.length);
    });

    it('TextArea autofocus 将原生光标保持在默认值开头', () => {
        render(() => <TextArea style={{ width: '200px' }} autofocus defaultValue={longStr} />);
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        expect(textarea).toHaveFocus();
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe(0);
    });

    it('容器变窄时 autosize 扩大 TextArea', async () => {
        const [width, setWidth] = createSignal(800);
        render(() => (
            <div style={{ width: `${width()}px` }}>
                <TextArea defaultValue={longStr} autosize />
            </div>
        ));
        const textarea = screen.getByRole('textbox');
        await waitFor(() => fitsContent(textarea));
        const wideHeight = textarea.clientHeight;
        setWidth(100);
        await waitFor(() => expect(textarea.clientHeight).toBeGreaterThan(wideHeight));
        expect(textarea.scrollHeight).toBe(textarea.clientHeight);
    });

    it('autosize', async () => {
        const [textarea] = renderAutosizeTextAreas();
        await userEvent.type(textarea, 'semi design');
        expect(styleOf(textarea).fieldSizing).toBe('content');
        await userEvent.fill(textarea, `semi design${mediumText}`);
        await waitFor(() => fitsContent(textarea));
        await userEvent.fill(textarea, longText);
        await waitFor(() => fitsContent(textarea));
    });

    it('autosize 最小行数', async () => {
        const textareas = renderAutosizeTextAreas();
        const textarea = textareas[1];
        const minHeight = textarea.clientHeight;
        fitsContent(textarea);
        await userEvent.fill(textarea, '111\n222\n333\n444');
        await waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(minHeight));
        await waitFor(() => fitsContent(textarea));
        await userEvent.fill(textarea, '111\n222');
        await waitFor(() => expect(textarea.scrollHeight).toBe(minHeight));
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

    it('autosize 高度变化时触发 onResize，首次观察不触发，参数为 border-box 高度', async () => {
        const onResize = vi.fn<NonNullable<TextAreaProps['onResize']>>();
        render(() => <TextArea autosize={{ minRows: 1 }} onResize={onResize} />);
        const textarea = screen.getByRole('textbox');
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(onResize).not.toHaveBeenCalled();
        await userEvent.fill(textarea, '1\n2\n3\n4');
        await waitFor(() => expect(onResize).toHaveBeenCalled());
        expect(onResize).toHaveBeenLastCalledWith({ height: textarea.getBoundingClientRect().height });
        const grown = onResize.mock.calls.length;
        await userEvent.type(textarea, 'a');
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(onResize).toHaveBeenCalledTimes(grown);
        await userEvent.fill(textarea, '1');
        await waitFor(() => expect(onResize).toHaveBeenCalledTimes(grown + 1));
        expect(onResize).toHaveBeenLastCalledWith({ height: textarea.getBoundingClientRect().height });
    });

    it('showLineNumber 折行的行号项高度是行数乘行高', async () => {
        render(() => (
            <div style={{ width: '200px' }}>
                <TextArea defaultValue={`short\n${'word '.repeat(60)}`} showLineNumber />
            </div>
        ));
        await waitFor(() => expect((document.querySelector(`.${prefix}-textarea-lineNumber`) as HTMLElement).style.height).not.toBe(''));
        const [short, long] = [...document.querySelectorAll<HTMLElement>(`.${prefix}-textarea-lineNumber-item`)];
        await waitFor(() => expect(short.style.lineHeight).not.toBe(''));
        const lineHeight = parseFloat(short.style.lineHeight);
        expect(parseFloat(short.style.minHeight)).toBe(lineHeight);
        expect(parseFloat(long.style.minHeight)).toBeGreaterThan(lineHeight);
        expect(parseFloat(long.style.minHeight) % lineHeight).toBe(0);
    });

    it('showLineNumber 测量折行时不为任何一行创建 canvas', async () => {
        const createElement = vi.spyOn(document, 'createElement');
        const lines = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
        render(() => <TextArea defaultValue={lines} showLineNumber />);
        await waitFor(() => expect((document.querySelector(`.${prefix}-textarea-lineNumber`) as HTMLElement).style.height).not.toBe(''));
        const canvases = createElement.mock.calls.filter(([tag]) => tag === 'canvas');
        createElement.mockRestore();
        expect(canvases).toHaveLength(0);
    });

    it('showLineNumber 按词折行时，行号项高度等于该行实际的视觉行数乘行高', async () => {
        const words = ['semi', 'design', 'internationalization', 'a'];
        const line = Array.from({ length: 40 }, (_, i) => words[i % words.length]).join(' ');
        render(() => (
            <div style={{ width: '300px' }}>
                <TextArea defaultValue={line} showLineNumber />
            </div>
        ));
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const style = getComputedStyle(textarea);
        const lineHeight = parseFloat(style.lineHeight);
        const contentHeight = textarea.scrollHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const rows = Math.round(contentHeight / lineHeight);
        // more rows than the textarea shows, so scrollHeight is the content and not the box
        expect(rows).toBeGreaterThan(4);
        const item = document.querySelector<HTMLElement>(`.${prefix}-textarea-lineNumber-item`) as HTMLElement;
        await expect.poll(() => item.getBoundingClientRect().height).toBeCloseTo(rows * lineHeight, 0);
    });

    it('autosize 最小与最大行数', async () => {
        const textareas = renderAutosizeTextAreas();
        for (const textarea of textareas.slice(4)) {
            fitsContent(textarea);
            const minHeight = textarea.clientHeight;
            await userEvent.fill(textarea, '111\n222\n333');
            await waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(minHeight));
            await waitFor(() => fitsContent(textarea));
            await userEvent.fill(textarea, '111\n222\n333\n444');
            await waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight));
            expectScrollable(textarea);
            await userEvent.fill(textarea, '111');
            await waitFor(() => expect(textarea.scrollHeight).toBe(minHeight));
        }
    });

    it('触发密码按钮', async () => {
        render(() => <Input style={{ width: '300px' }} defaultValue="Semi Design" mode="password" />);
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

    it('点击 prefix、suffix 或经 inputRef 聚焦输入框', async () => {
        let input: HTMLInputElement | undefined;
        const { container } = render(() => (
            <>
                <Button onClick={() => input?.focus()}>focus</Button>
                <Input style={{ width: '200px' }} defaultValue="hi" inputRef={(node) => (input = node)} prefix="Prefix" suffix="Suffix" />
            </>
        ));
        const wrapper = container.querySelector(`.${prefix}-wrapper`) as HTMLElement;
        const expectFocusThenBlur = async () => {
            expect(input).toHaveFocus();
            await clickOutside();
            expect(input).not.toHaveFocus();
        };
        await userEvent.click(wrapper.querySelector(`.${prefix}-prefix`) as HTMLElement);
        await expectFocusThenBlur();
        await userEvent.click(wrapper.querySelector(`.${prefix}-suffix`) as HTMLElement);
        await expectFocusThenBlur();
        await userEvent.click(screen.getByRole('button', { name: 'focus' }));
        await expectFocusThenBlur();
    });

    it('Tab 可到达 Input 清除按钮，它显示主题焦点环并能把焦点交还', async () => {
        render(() => <Input defaultValue="semi" showClear />);
        await tabTo(screen.getByRole('textbox'));
        await tab();
        const clear = screen.getByRole('button', { name: '清空输入' });
        expect(clear).toHaveFocus();
        expectThemeFocusRing(clear);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空输入' })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('TextArea 清除按钮在悬停和焦点在内部时显示', async () => {
        render(() => <TextArea defaultValue="semi" showClear />);
        const clear = () => document.querySelector(`.${prefix}-clearbtn`);
        expect(clear()).not.toBeVisible();
        await userEvent.hover(screen.getByRole('textbox'));
        expect(clear()).toBeVisible();
        await userEvent.unhover(screen.getByRole('textbox'));
        expect(clear()).not.toBeVisible();
        await tabTo(screen.getByRole('textbox'));
        await tab();
        const button = screen.getByRole('button', { name: '清空输入' });
        expect(button).toHaveFocus();
        expect(button).toBeVisible();
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(clear()).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('Input 有值即渲染清除按钮，只在悬停和焦点在内部时显示，并在那时替换 hideSuffix 的后缀', async () => {
        render(() => (
            <>
                <Input defaultValue="semi" hideSuffix showClear suffix="suffix" />
                <Button>after</Button>
            </>
        ));
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
});

type Field = Component<InputProps> | Component<TextAreaProps>;

describe.each([
    ['Input', Input as Field, `${prefix}-wrapper-focus`],
    ['TextArea', TextArea as Field, `${prefix}-textarea-wrapper-focus`],
])('%s 与其清除按钮之间的焦点移动保持在内部', (_, Control, focusCls) => {
    const renderWithSpies = (controlled = false) => {
        const [value, setValue] = createSignal('semi');
        const spies = { onFocus: vi.fn<() => void>(), onBlur: vi.fn<() => void>(), setValue };
        render(() => (
            <>
                {/* Firefox keeps focus on the first control when Shift+Tab has nowhere to go, so the field needs a stop before it */}
                <Button>before</Button>
                <Dynamic component={Control} defaultValue="semi" value={controlled ? value() : undefined} showClear onFocus={spies.onFocus} onBlur={spies.onBlur} />
                <Button>after</Button>
            </>
        ));
        return spies;
    };
    const getClear = () => screen.getByRole('button', { name: '清空输入' });
    const getWrapper = () => screen.getByRole('textbox').closest('[class*="-wrapper"]');
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
        const { onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('textbox'));
        await tab({ shift: true });
        expect(onBlur).toHaveBeenCalledTimes(1);
        await tabToClear();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(2);
        expect(getWrapper()).not.toHaveClass(focusCls);
    });

    it('用键盘清空时不触发 blur，也不二次触发 focus', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabToClear();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空输入' })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清除按钮有焦点时，受控值在别处被清空，焦点交给输入框', async () => {
        const { onBlur, setValue } = renderWithSpies(true);
        await tabToClear();
        setValue('');
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空输入' })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(getWrapper()).toHaveClass(focusCls);
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(focusCls);
    });
});

it.each([
    ['Input', Input as Field, 'input'],
    ['TextArea', TextArea as Field, 'textarea'],
])('ShadowRoot 内 %s 的值被外部清空、清除按钮被移除时焦点交还输入框', async (_, Control, tag) => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.append(mount);
    const [value, setValue] = createSignal('abc');
    const view = render(() => <Dynamic component={Control} aria-label="shadow field" value={value()} showClear onChange={() => {}} />, { container: mount });
    try {
        (shadow.querySelector(`.${prefix}-clearbtn`) as HTMLElement).focus();
        setValue('');
        await waitFor(() => expect(shadow.querySelector(`.${prefix}-clearbtn`)).toBeNull());
        expect(shadow.activeElement).toBe(shadow.querySelector(tag));
    } finally {
        view.unmount();
        host.remove();
    }
});
