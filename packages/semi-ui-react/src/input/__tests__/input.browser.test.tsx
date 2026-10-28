import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Form, Input, TextArea, TimePicker } from '@fibrae/semi-ui-react';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import type { InputHandle } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-input`;
const longStr = 'semi design '.repeat(24).trim();
const mediumText = 'A modern, comprehensive, flexible design system that gives you all modular blocks you need to build sensible web apps & SaaS products.';
const longText =
    'Semi Design is a design system designed, developed and maintained by the Douyin front-end team and the MED product design team. As a comprehensive, easy-to-use, and high-quality modern enterprise-level application UI solution, it is refined from the complex scenes of Bytedance various business lines, supports nearly a thousand platform products, and serves 100,000+ internal and external users. After nearly two years of iteration, Semi Design has become a cross-departmental infrastructure after various types of business landing verification, and has formed a rich tool chain and ecology around the component library. In order to allow the increasingly mature design system to serve more users and to further explore the usage scenarios, we decided to open source Semi and use the power of the community to continuously improve and expand the capability boundary.';

const renderAutosizeTextAreas = async () => {
    render(
        <div style={{ width: 200 }}>
            <TextArea autosize />
            <TextArea autosize rows={2} />
            <TextArea autosize={false} rows={2} />
            <TextArea autosize={{ minRows: 1 }} />
            <TextArea autosize={{ minRows: 1, maxRows: 3 }} />
            <TextArea autosize={{ maxRows: 3 }} rows={1} />
        </div>
    );
    return screen.getAllByRole('textbox');
};
const styleOf = (el) => window.getComputedStyle(el);
const fitsContent = (el) => expect(el.scrollHeight).toBe(el.clientHeight);
// Firefox computes a textarea's own overflow as visible and scrolls an inner box, so the scrolling itself is checked
const expectScrollable = (el) => {
    el.scrollTop = el.scrollHeight;
    expect(el.scrollTop).toBeGreaterThan(0);
};

describe('Input（浏览器）', () => {
    it('只读 Input 整体显示默认光标，可编辑时为文本光标', () => {
        render(
            <>
                <Input aria-label="readonly" readonly />
                <Input aria-label="editable" />
            </>
        );
        const readonly = screen.getByRole('textbox', { name: 'readonly' });
        expect(getComputedStyle(readonly.closest(`.${prefix}-wrapper`)).cursor).toBe('default');
        expect(getComputedStyle(readonly).cursor).toBe('default');
        // WebKit's user agent sheet leaves `auto` on text fields, which the browser resolves to the I-beam; Chromium reports `text`
        expect(['text', 'auto']).toContain(getComputedStyle(screen.getByRole('textbox', { name: 'editable' })).cursor);
    });

    it('TimePicker inputReadOnly 的输入框显示指针光标', () => {
        render(<TimePicker aria-label="time" inputReadOnly />);
        const input = screen.getByRole('combobox', { name: 'time' });
        expect(input).toHaveAttribute('readonly');
        expect(getComputedStyle(input.closest(`.${prefix}-wrapper`)).cursor).toBe('pointer');
        expect(getComputedStyle(input).cursor).toBe('pointer');
    });

    it('原生 input 的垂直内边距显式为 0，不依赖 UA 的 1px', () => {
        render(<Input aria-label="plain" />);
        const style = getComputedStyle(screen.getByRole('textbox', { name: 'plain' }));
        expect([style.paddingTop, style.paddingBottom]).toEqual(['0px', '0px']);
    });

    // Guards the caret position users get with autoFocus. Chromium also moves the caret to the end when the value is
    // filled in after the focus, so this does not tell the #2193 mount order apart; the TextArea case below does.
    it('FixInputAutoFocus（#2193）：Input autoFocus 将光标放在默认值之后', () => {
        render(<Input style={{ width: 200 }} autoFocus defaultValue={longStr} />);
        const input = screen.getByRole<HTMLInputElement>('textbox');
        expect(input).toHaveFocus();
        expect(input.selectionStart).toBe(longStr.length);
        expect(input.selectionEnd).toBe(longStr.length);
    });

    it('FixTextAreaAutoFocus（#2193）：TextArea autoFocus 将原生光标保持在默认值开头', () => {
        render(<TextArea style={{ width: 200 }} autoFocus defaultValue={longStr} />);
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        expect(textarea).toHaveFocus();
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe(0);
    });

    // autosize used to re-measure only on window resize, so a narrower container left the wrapped text cut off
    it('TextAutoSizeResize（#2026）：容器变窄时 autosize 扩大 TextArea', async () => {
        const Demo = ({ width }) => (
            <div style={{ width }}>
                <TextArea defaultValue={longStr} autosize />
            </div>
        );
        const { rerender } = render(<Demo width={800} />);
        const textarea = screen.getByRole('textbox');
        await waitFor(() => expect(textarea.scrollHeight).toBe(textarea.clientHeight));
        const wideHeight = textarea.clientHeight;

        rerender(<Demo width={100} />);
        await waitFor(() => expect(textarea.clientHeight).toBeGreaterThan(wideHeight));
        expect(textarea.scrollHeight).toBe(textarea.clientHeight);
    });

    it('autosize', async () => {
        const [textarea] = await renderAutosizeTextAreas();
        await userEvent.type(textarea, 'semi design');
        expect(styleOf(textarea).fieldSizing).toBe('content');

        await userEvent.fill(textarea, `semi design${mediumText}`);
        await waitFor(() => fitsContent(textarea));
        await userEvent.fill(textarea, longText);
        await waitFor(() => fitsContent(textarea));
    });

    it('autosize 最小行数', async () => {
        const textareas = await renderAutosizeTextAreas();
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

    it('autosize 的最小高度为 minRows 行加内边距与描边，未设 maxRows 时没有最大高度', async () => {
        const textareas = await renderAutosizeTextAreas();
        const chrome = (el) => {
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
        const onResize = vi.fn<(size: { height: number }) => void>();
        render(<TextArea autosize={{ minRows: 1 }} onResize={onResize} />);
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

    it('showLineNumber 测量折行时不为任何一行创建 canvas', async () => {
        const createElement = vi.spyOn(document, 'createElement');
        const lines = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
        render(<TextArea defaultValue={lines} showLineNumber />);
        await waitFor(() => expect(document.querySelector<HTMLElement>(`.${prefix}-textarea-lineNumber`).style.height).not.toBe(''));
        const canvases = createElement.mock.calls.filter(([tag]) => tag === 'canvas');
        createElement.mockRestore();
        expect(canvases).toHaveLength(0);
    });

    it('showLineNumber 折行的行号项高度是行数乘行高', async () => {
        render(
            <div style={{ width: 200 }}>
                <TextArea defaultValue={'short\n' + 'word '.repeat(60)} showLineNumber />
            </div>
        );
        await waitFor(() => expect(document.querySelector<HTMLElement>(`.${prefix}-textarea-lineNumber`).style.height).not.toBe(''));
        const [short, long] = [...document.querySelectorAll<HTMLElement>(`.${prefix}-textarea-lineNumber-item`)];
        const lineHeight = parseFloat(short.style.lineHeight);
        expect(parseFloat(short.style.minHeight)).toBe(lineHeight);
        expect(parseFloat(long.style.minHeight)).toBeGreaterThan(lineHeight);
        expect(parseFloat(long.style.minHeight) % lineHeight).toBe(0);
    });

    it('showLineNumber 按词折行时，行号项高度等于该行实际的视觉行数乘行高', async () => {
        const words = ['semi', 'design', 'internationalization', 'a'];
        const line = Array.from({ length: 40 }, (_, i) => words[i % words.length]).join(' ');
        render(
            <div style={{ width: 300 }}>
                <TextArea defaultValue={line} showLineNumber />
            </div>
        );
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const style = getComputedStyle(textarea);
        const lineHeight = parseFloat(style.lineHeight);
        const contentHeight = textarea.scrollHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const rows = Math.round(contentHeight / lineHeight);
        // more rows than the textarea shows, so scrollHeight is the content and not the box
        expect(rows).toBeGreaterThan(4);
        const item = document.querySelector<HTMLElement>(`.${prefix}-textarea-lineNumber-item`);
        await expect.poll(() => item.getBoundingClientRect().height).toBeCloseTo(rows * lineHeight, 0);
    });

    it('autosize 最小与最大行数', async () => {
        const textareas = await renderAutosizeTextAreas();

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
        render(<Input style={{ width: 300 }} defaultValue="Semi Design" mode="password" />);
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

    it('input--forward-ref-focus', async () => {
        const objectRef = createRef<InputHandle>();
        let functionRef: InputHandle = null;
        const commonProps = { prefix: 'Prefix', suffix: 'Suffix', style: { width: 200 }, defaultValue: 'hi' };
        const { container } = render(
            <>
                <Input {...commonProps} />
                <Button onClick={() => objectRef.current.focus()}>object ref</Button>
                <Input ref={objectRef} {...commonProps} />
                <Button onClick={() => functionRef.focus()}>function ref</Button>
                <Input
                    ref={(node) => {
                        functionRef = node;
                    }}
                    {...commonProps}
                />
            </>
        );
        const wrappers = container.querySelectorAll(`.${prefix}-wrapper`);
        const expectFocusThenBlur = async (input) => {
            expect(input).toHaveFocus();
            await clickOutside();
            expect(input).not.toHaveFocus();
        };

        for (const [index, wrapper] of wrappers.entries()) {
            const input = wrapper.querySelector('input');
            await userEvent.click(wrapper.querySelector(`.${prefix}-prefix`));
            await expectFocusThenBlur(input);
            await userEvent.click(wrapper.querySelector(`.${prefix}-suffix`));
            await expectFocusThenBlur(input);
            if (index > 0) {
                await userEvent.click(screen.getByRole('button', { name: index === 1 ? 'object ref' : 'function ref' }));
                await expectFocusThenBlur(input);
            }
        }
    });

    it('Tab 可到达 Input 清除按钮，它显示主题焦点环并能把焦点交还', async () => {
        render(<Input defaultValue="semi" showClear />);
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
        render(<TextArea defaultValue="semi" showClear />);
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
        render(
            <>
                <Input defaultValue="semi" hideSuffix showClear suffix="suffix" />
                <Button>after</Button>
            </>
        );
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

describe.each([
    ['Input', Input, `${prefix}-wrapper-focus`],
    ['TextArea', TextArea, `${prefix}-textarea-wrapper-focus`],
])('%s 与其清除按钮之间的焦点移动保持在内部', (_, Component, focusCls) => {
    const renderWithSpies = (props?: object) => {
        const spies = { onFocus: vi.fn<() => void>(), onBlur: vi.fn<() => void>() };
        const result = render(
            <>
                {/* Firefox keeps focus on the first control when Shift+Tab has nowhere to go, so the field needs a stop before it */}
                <Button>before</Button>
                <Component defaultValue="semi" showClear {...spies} {...props} />
                <Button>after</Button>
            </>
        );
        return { ...spies, ...result };
    };
    const getClear = () => screen.getByRole('button', { name: '清空输入' });
    const getWrapper = () => screen.getByRole('textbox').closest(`[class*="-wrapper"]`);
    // the Input shows its clear button only while hovered or focused, so Tab goes through the input
    const tabToClear = async () => {
        await tabTo(screen.getByRole('textbox'));
        await tab();
        expect(getClear()).toHaveFocus();
    };

    it('Tab 到清除按钮再返回不触发 onBlur，也不二次触发 onFocus，焦点样式保持不变', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('textbox'));
        await tab();
        expect(getClear()).toHaveFocus();
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
        const { rerender, onBlur } = renderWithSpies({ value: 'semi', defaultValue: undefined });
        await tabToClear();
        rerender(
            <>
                <Button>before</Button>
                <Component value="" showClear onBlur={onBlur} />
                <Button>after</Button>
            </>
        );
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空输入' })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(getWrapper()).toHaveClass(focusCls);
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(focusCls);
    });
});

it('由 blur 触发的 Form.Input 在焦点离开后才校验一次，而非在移向清除按钮的途中校验', async () => {
    const validator = vi.fn<() => boolean>(() => true);
    render(
        <>
            <Form>
                <Form.Input field="name" initValue="semi" rules={[{ validator }]} showClear trigger="blur" />
            </Form>
            <Button>after</Button>
        </>
    );
    await tabTo(screen.getByRole('textbox'));
    await tab();
    expect(screen.getByRole('button', { name: '清空输入' })).toHaveFocus();
    await tab({ shift: true });
    expect(validator).not.toHaveBeenCalled();
    await tab();
    await tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    await waitFor(() => expect(validator).toHaveBeenCalledTimes(1));
});

it.each([
    ['Input', Input, 'input'],
    ['TextArea', TextArea, 'textarea'],
])('ShadowRoot 内 %s 的值被外部清空、清除按钮被移除时焦点交还输入框', async (_, Field, tag) => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.append(mount);
    const field = (value: string) => <Field aria-label="shadow field" value={value} showClear onChange={() => {}} />;
    const view = render(field('abc'), { container: mount });
    try {
        shadow.querySelector<HTMLElement>(`.${prefix}-clearbtn`).focus();
        view.rerender(field(''));
        await waitFor(() => expect(shadow.querySelector(`.${prefix}-clearbtn`)).toBeNull());
        expect(shadow.activeElement).toBe(shadow.querySelector(tag));
    } finally {
        view.unmount();
        host.remove();
    }
});
