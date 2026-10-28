/** @jsxImportSource vue */
import { createApp, defineComponent, h, shallowRef, type Component, type VNode } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { clickOutside, expectThemeFocusRing, isChromium, tab, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Input, { TextArea, type InputHandle } from '..';
import Model from './fixtures/model.vue';

const prefix = `${BASE_CLASS_PREFIX}-input`;
const clearName = zh_CN.Input.clear;
const longStr = 'semi design '.repeat(24).trim();
const mediumText = 'A modern, comprehensive, flexible design system that gives you all modular blocks you need to build sensible web apps & SaaS products.';
const longText =
    'Semi Design is a design system designed, developed and maintained by the Douyin front-end team and the MED product design team. As a comprehensive, easy-to-use, and high-quality modern enterprise-level application UI solution, it is refined from the complex scenes of Bytedance various business lines, supports nearly a thousand platform products, and serves 100,000+ internal and external users. After nearly two years of iteration, Semi Design has become a cross-departmental infrastructure after various types of business landing verification, and has formed a rich tool chain and ecology around the component library. In order to allow the increasingly mature design system to serve more users and to further explore the usage scenarios, we decided to open source Semi and use the power of the community to continuously improve and expand the capability boundary.';

const renderAutosizeTextAreas = () => {
    render({
        render: () => (
            <div style={{ width: '200px' }}>
                <TextArea autosize />
                <TextArea autosize rows={2} />
                <TextArea autosize={false} rows={2} />
                <TextArea autosize={{ minRows: 1 }} />
                <TextArea autosize={{ minRows: 1, maxRows: 3 }} />
                <TextArea autosize={{ maxRows: 3 }} rows={1} />
            </div>
        ),
    });
    return screen.getAllByRole<HTMLTextAreaElement>('textbox');
};
const renderInBox = (width: number, child: () => VNode) => render({ render: () => <div style={{ width: `${width}px` }}>{child()}</div> });
const styleOf = (el: Element) => getComputedStyle(el);
const fitsContent = (el: Element) => expect(el.scrollHeight).toBe(el.clientHeight);
// Firefox computes a textarea's own overflow as visible and scrolls an inner box, so the scrolling itself is checked
const expectScrollable = (el: Element) => {
    el.scrollTop = el.scrollHeight;
    expect(el.scrollTop).toBeGreaterThan(0);
};
const lineNumberPanel = () => document.querySelector<HTMLElement>(`.${prefix}-textarea-lineNumber`) as HTMLElement;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Input（浏览器）', () => {
    it('原生 input 的垂直内边距显式为 0，不依赖 UA 的 1px', () => {
        render(Input, { attrs: { 'aria-label': 'plain' } });
        const style = styleOf(screen.getByRole('textbox', { name: 'plain' }));
        expect([style.paddingTop, style.paddingBottom]).toEqual(['0px', '0px']);
    });

    // Test Utils mounts into a detached node and attaches it afterwards, which drops a mount-time focus
    const mountAttached = (component: Component, props: Record<string, unknown>) => {
        const host = document.body.appendChild(document.createElement('div'));
        const app = createApp(component, props);
        app.mount(host);
        onTestFinished(() => {
            app.unmount();
            host.remove();
        });
    };

    it('FixInputAutoFocus（#2193）：Input autofocus 将光标放在默认值之后', () => {
        mountAttached(Input, { autofocus: true, defaultValue: longStr, style: { width: '200px' } });
        const input = screen.getByRole<HTMLInputElement>('textbox');
        expect(input).toHaveFocus();
        expect([input.selectionStart, input.selectionEnd]).toEqual([longStr.length, longStr.length]);
    });

    it('FixTextAreaAutoFocus（#2193）：TextArea autofocus 将原生光标保持在默认值开头', () => {
        mountAttached(TextArea, { autofocus: true, defaultValue: longStr, style: { width: '200px' } });
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        expect(textarea).toHaveFocus();
        expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([0, 0]);
    });

    it('TextAutoSizeResize（#2026）：容器变窄时 autosize 扩大 TextArea', async () => {
        const Demo = (props: { width: number }) => (
            <div style={{ width: `${props.width}px` }}>
                <TextArea defaultValue={longStr} autosize />
            </div>
        );
        const view = render(Demo, { props: { width: 800 } });
        const textarea = screen.getByRole('textbox');
        await vi.waitFor(() => fitsContent(textarea));
        const wideHeight = textarea.clientHeight;
        await view.rerender({ width: 100 });
        await vi.waitFor(() => expect(textarea.clientHeight).toBeGreaterThan(wideHeight));
        fitsContent(textarea);
    });

    it('autosize', async () => {
        const [textarea] = renderAutosizeTextAreas();
        await userEvent.type(textarea, 'semi design');
        expect(styleOf(textarea).fieldSizing).toBe('content');
        await userEvent.fill(textarea, `semi design${mediumText}`);
        await vi.waitFor(() => fitsContent(textarea));
        await userEvent.fill(textarea, longText);
        await vi.waitFor(() => fitsContent(textarea));
    });

    it('autosize 最小行数', async () => {
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

    it('autosize 高度变化时发出 resize，首次观察不发出，参数为 border-box 高度', async () => {
        const resize = vi.fn<(size: { height: number; width?: number }) => void>();
        render(TextArea, { props: { autosize: { minRows: 1 }, onResize: resize } });
        const textarea = screen.getByRole('textbox');
        await wait(100);
        expect(resize).not.toHaveBeenCalled();
        await userEvent.fill(textarea, '1\n2\n3\n4');
        await vi.waitFor(() => expect(resize).toHaveBeenCalled());
        expect(resize).toHaveBeenLastCalledWith({ height: textarea.getBoundingClientRect().height });
        const grown = resize.mock.calls.length;
        await userEvent.type(textarea, 'a');
        await wait(100);
        expect(resize).toHaveBeenCalledTimes(grown);
        await userEvent.fill(textarea, '1');
        await vi.waitFor(() => expect(resize).toHaveBeenCalledTimes(grown + 1));
        expect(resize).toHaveBeenLastCalledWith({ height: textarea.getBoundingClientRect().height });
    });

    it('showLineNumber 测量折行时不为任何一行创建 canvas', async () => {
        const createElement = vi.spyOn(document, 'createElement');
        const lines = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
        render(TextArea, { props: { defaultValue: lines, showLineNumber: true } });
        await vi.waitFor(() => expect(lineNumberPanel().style.height).not.toBe(''));
        expect(createElement.mock.calls.filter(([tag]) => tag === 'canvas')).toHaveLength(0);
    });

    it('showLineNumber 折行的行号项高度是行数乘行高', async () => {
        renderInBox(200, () => <TextArea defaultValue={`short\n${'word '.repeat(60)}`} showLineNumber />);
        await vi.waitFor(() => expect(lineNumberPanel().style.height).not.toBe(''));
        const [short, long] = [...document.querySelectorAll<HTMLElement>(`.${prefix}-textarea-lineNumber-item`)];
        const lineHeight = parseFloat(short.style.lineHeight);
        expect(parseFloat(short.style.minHeight)).toBe(lineHeight);
        expect(parseFloat(long.style.minHeight)).toBeGreaterThan(lineHeight);
        expect(parseFloat(long.style.minHeight) % lineHeight).toBe(0);
    });

    it('showLineNumber 按词折行时，行号项高度等于该行实际的视觉行数乘行高', async () => {
        const words = ['semi', 'design', 'internationalization', 'a'];
        const line = Array.from({ length: 40 }, (_, i) => words[i % words.length]).join(' ');
        renderInBox(300, () => <TextArea defaultValue={line} showLineNumber />);
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const style = styleOf(textarea);
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
            await vi.waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(minHeight));
            await vi.waitFor(() => fitsContent(textarea));
            await userEvent.fill(textarea, '111\n222\n333\n444');
            await vi.waitFor(() => expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight));
            expectScrollable(textarea);
            await userEvent.fill(textarea, '111');
            await vi.waitFor(() => expect(textarea.scrollHeight).toBe(minHeight));
        }
    });

    it('触发密码按钮', async () => {
        render(Input, {
            props: { defaultValue: 'Semi Design', mode: 'password' },
            attrs: { style: { width: '300px' } },
        });
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

    it('点击前后缀或经模板 ref 句柄都能聚焦输入框', async () => {
        const common = { defaultValue: 'hi', style: { width: '200px' } };
        const slots = { prefix: () => 'Prefix', suffix: () => 'Suffix' };
        const Demo = defineComponent(() => {
            const handle = shallowRef<InputHandle | null>(null);
            return () => (
                <>
                    <Input {...common}>{slots}</Input>
                    <button type="button" onClick={() => handle.value?.focus()}>
                        template ref
                    </button>
                    <Input {...common} ref={handle}>
                        {slots}
                    </Input>
                </>
            );
        });
        const { container } = render(Demo);
        const expectFocusThenBlur = async (input: Element) => {
            expect(input).toHaveFocus();
            await clickOutside();
            expect(input).not.toHaveFocus();
        };
        for (const [index, wrapper] of container.querySelectorAll(`.${prefix}-wrapper`).entries()) {
            const input = wrapper.querySelector('input') as HTMLInputElement;
            await userEvent.click(wrapper.querySelector(`.${prefix}-prefix`) as Element);
            await expectFocusThenBlur(input);
            await userEvent.click(wrapper.querySelector(`.${prefix}-suffix`) as Element);
            await expectFocusThenBlur(input);
            if (index > 0) {
                await userEvent.click(screen.getByRole('button', { name: 'template ref' }));
                await expectFocusThenBlur(input);
            }
        }
    });

    it('Tab 可到达 Input 清除按钮，它显示主题焦点环并能把焦点交还', async () => {
        render(Input, { props: { defaultValue: 'semi', showClear: true } });
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

    it.each([
        ['Input', Input, 'input'],
        ['TextArea', TextArea, 'textarea'],
    ])('ShadowRoot 内 %s 的值被外部清空、清除按钮被移除时焦点交还输入框', async (_, Field, tag) => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(Field as Component, { container: mount, props: { modelValue: 'abc', showClear: true } });
        try {
            shadow.querySelector<HTMLElement>(`.${prefix}-clearbtn`)?.focus();
            await view.rerender({ modelValue: '' });
            await vi.waitFor(() => expect(shadow.querySelector(`.${prefix}-clearbtn`)).toBeNull());
            expect(shadow.activeElement).toBe(shadow.querySelector(tag));
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('ShadowRoot 内 number 修饰符的 v-model 输入 "1." 时保留正在输入的文本', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const Demo = defineComponent(() => {
            const value = shallowRef<number | string>('');
            return () => <Input modelValue={value.value} modelModifiers={{ number: true }} onUpdate:modelValue={(next: number | string) => (value.value = next)} />;
        });
        const view = render(Demo, { container: mount });
        try {
            const input = shadow.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await userEvent.keyboard('1.');
            await vi.waitFor(() => expect(input).toHaveValue('1.'));
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('TextArea 清除按钮在悬停和焦点在内部时显示', async () => {
        render(TextArea, { props: { defaultValue: 'semi', showClear: true } });
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
        render({
            render: () => (
                <>
                    <Input defaultValue="semi" hideSuffix showClear>
                        {{ suffix: () => 'suffix' }}
                    </Input>
                    <button type="button">after</button>
                </>
            ),
        });
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

    it('v-model 往返时在中间插入字符，光标停在插入点之后', async () => {
        render(Model);
        const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'model' });
        await userEvent.type(input, 'abcd');
        input.setSelectionRange(2, 2);
        await userEvent.keyboard('X');
        expect(input).toHaveValue('abXcd');
        expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
    });

    // Playwright has no IME, so the composition goes through CDP Input.imeSetComposition, which only Chromium has
    it.skipIf(!isChromium)('输入法组合中不回写 DOM，组合结束后回到父组件未接受的值', async () => {
        const change = vi.fn<(value: string) => void>();
        render(Input, { props: { modelValue: '', onChange: change } });
        const input = screen.getByRole<HTMLInputElement>('textbox');
        await userEvent.click(input);
        await cdp().send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
        await wait(0);
        expect(change).toHaveBeenLastCalledWith('ni', expect.anything());
        expect(input).toHaveValue('ni');
        await cdp().send('Input.insertText', { text: '你' });
        await vi.waitFor(() => expect(input).toHaveValue(''));
    });
});

describe.each([
    ['Input', Input, `${prefix}-wrapper-focus`],
    ['TextArea', TextArea, `${prefix}-textarea-wrapper-focus`],
] as [string, Component, string][])('%s 与其清除按钮之间的焦点移动保持在内部', (_, Field, focusCls) => {
    const renderWithSpies = (props: Record<string, unknown> = { defaultValue: 'semi' }) => {
        const spies = { onFocus: vi.fn<() => void>(), onBlur: vi.fn<() => void>() };
        const Demo = (demoProps: Record<string, unknown>) => (
            <>
                {/* Firefox keeps focus on the first control when Shift+Tab has nowhere to go, so the field needs a stop before it */}
                <button type="button">before</button>
                {h(Field, { showClear: true, ...spies, ...demoProps })}
                <button type="button">after</button>
            </>
        );
        return { ...spies, ...render(Demo, { props }) };
    };
    const getClear = () => screen.getByRole('button', { name: clearName });
    const getWrapper = () => screen.getByRole('textbox').closest(`[class*="-wrapper"]`);
    // the Input shows its clear button only while hovered or focused, so Tab goes through the input
    const tabToClear = async () => {
        await tabTo(screen.getByRole('textbox'));
        await tab();
        expect(getClear()).toHaveFocus();
    };

    it('Tab 到清除按钮再返回不发出 blur，也不二次发出 focus，焦点样式保持不变', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabToClear();
        expect(getWrapper()).toHaveClass(focusCls);
        await tab({ shift: true });
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('Tab 移出组件时只发出一次 blur，来源可以是输入框或清除按钮', async () => {
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

    it('用键盘清空时不发出 blur，也不二次发出 focus', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabToClear();
        await userEvent.keyboard('{Enter}');
        await vi.waitFor(() => expect(screen.queryByRole('button', { name: clearName })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清除按钮有焦点时，受控值在别处被清空，焦点交给输入框', async () => {
        const view = renderWithSpies({ modelValue: 'semi' });
        const { onBlur } = view;
        await tabToClear();
        await view.rerender({ modelValue: '' });
        await vi.waitFor(() => expect(screen.queryByRole('button', { name: clearName })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(getWrapper()).toHaveClass(focusCls);
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(focusCls);
    });
});
