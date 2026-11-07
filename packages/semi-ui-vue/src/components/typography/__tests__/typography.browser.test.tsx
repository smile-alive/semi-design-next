/** @jsxImportSource vue */
import { cleanup, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconSetting } from '@fibrae/semi-icons-vue';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render, sleep } from '@test/utils/vue';
import type { Ellipsis } from '../interface';
import Paragraph from '../paragraph.vue';
import Text from '../text.vue';
import Title from '../title.vue';

const prefix = `${BASE_CLASS_PREFIX}-typography`;
const longText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。'.repeat(4);
const element = (container: Element, selector: string) => container.querySelector(selector) as HTMLElement;

// headless Chromium denies clipboard writes without a granted permission
function mockClipboard() {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    onTestFinished(() => writeText.mockRestore());
    return writeText;
}

describe('Typography（浏览器）', () => {
    it('code 显式声明等宽字体栈和跟随上下文的字号，不依赖 UA 或宿主重置', () => {
        // a host reset below Semi's layer that disagrees with the UA default
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { code { font-family: Georgia, serif; font-size: 3em; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(Text, {
            props: { code: true },
            attrs: { style: { fontSize: '20px' } },
            slots: { default: () => 'code' },
        });
        const style = getComputedStyle(element(container, 'code'));
        expect(style.fontSize).toBe('20px');
        expect(style.fontFamily).toContain('monospace');
    });

    it('mark 的文字色跟随主题 token，不是 UA 的 MarkText', () => {
        const { container } = render(Text, {
            props: { mark: true },
            attrs: { style: { '--semi-color-text-0': 'rgb(1, 2, 3)' } },
            slots: { default: () => 'mark' },
        });
        expect(getComputedStyle(element(container, 'mark')).color).toBe('rgb(1, 2, 3)');
    });

    it('省略', async () => {
        const { container } = render(Paragraph, {
            props: { ellipsis: { rows: 3, expandable: true, collapsible: true } },
            attrs: { style: { width: '300px' } },
            slots: {
                default: () =>
                    'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。 区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有四大优势。',
            },
        });
        const paragraph = element(container, `.${prefix}`);
        await waitFor(() => expect(paragraph).toMatchTextContent('...'));
        expect(paragraph).not.toMatchTextContent('四大优势');

        await userEvent.click(screen.getByRole('button', { name: '展开' }));
        await waitFor(() => expect(paragraph).toMatchTextContent('四大优势'));

        await userEvent.click(screen.getByRole('button', { name: '收起' }));
        await waitFor(() => expect(paragraph).toMatchTextContent('...'));
        expect(paragraph).not.toMatchTextContent('四大优势');
    });

    it('宿主清空 body 后，JS 省略仍能截断', async () => {
        const renderParagraph = () =>
            render(Paragraph, {
                props: { ellipsis: { rows: 1, expandable: true } },
                attrs: { style: { width: '300px' } },
                slots: {
                    default: () => 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。'.repeat(3),
                },
            });
        const first = renderParagraph();
        await waitFor(() => expect(first.container).toMatchTextContent('...'));
        // a micro-frontend host unmounting its app empties body, the measuring container included
        cleanup();
        document.body.replaceChildren();
        const second = renderParagraph();
        await waitFor(() => expect(second.container).toMatchTextContent('...'));
    });

    it('可复制', async () => {
        const writeText = mockClipboard();
        const onCopy = vi.fn<(e: MouseEvent, content: string, res: boolean) => void>();
        const { container } = render({
            setup: () => () => (
                <div>
                    <Paragraph copyable onCopy={onCopy}>
                        {() => '点击右边的图标复制文本。'}
                    </Paragraph>
                    <Paragraph copyable spacing="extended">
                        {{
                            default: () => '测试 copyIcon 插槽',
                            copyIcon: () => <IconSetting />,
                        }}
                    </Paragraph>
                </div>
            ),
        });
        await userEvent.click(element(container, `.${prefix}-action-copy`));
        await waitFor(() => expect(onCopy).toHaveBeenCalledWith(expect.anything(), '点击右边的图标复制文本。', true));
        expect(writeText).toHaveBeenCalledWith('点击右边的图标复制文本。');
        expect(screen.getByText('复制成功')).toBeInTheDocument();

        await userEvent.click(element(container, `.${BASE_CLASS_PREFIX}-icon-setting`));
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-action-copied`)).toHaveLength(2));
        expect(container.querySelectorAll(`.${prefix}-action-copied`)[1]).toHaveTextContent('复制成功');
    });

    it('复制按钮的间距只在文字的行内起始侧，RTL 下不会两侧都有', () => {
        const { container } = render({
            setup: () => () => (
                <div dir="rtl">
                    <Text copyable>{() => 'text'}</Text>
                </div>
            ),
        });
        const style = getComputedStyle(element(container, `.${prefix}-action-copy`));
        expect(style.marginRight).toBe('4px');
        expect(style.marginLeft).toBe('0px');
    });

    it('悬停复制按钮并点击后，不再显示「复制」提示', async () => {
        mockClipboard();
        render(Paragraph, { props: { copyable: { duration: 5 } }, slots: { default: () => '点击复制' } });
        const button = screen.getByRole('button', { name: '复制' });
        await userEvent.hover(button);
        await waitFor(() => expect(document.querySelector('[role="tooltip"].semi-tooltip-wrapper-show')).not.toBeNull());
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveTextContent('复制成功'));
        await waitFor(() => expect(document.querySelector('[role="tooltip"].semi-tooltip-wrapper-show')).toBeNull());
    });

    it('复制按钮变为已复制提示时保持焦点', async () => {
        mockClipboard();
        render(Paragraph, { props: { copyable: { duration: 0.3 } }, slots: { default: () => '点击复制' } });
        const button = screen.getByRole('button', { name: '复制' });
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveTextContent('复制成功'));
        expect(document.activeElement).toBe(button);
        expectThemeFocusRing(button);
        await waitFor(() => expect(button).toHaveAccessibleName('复制'));
        expect(document.activeElement).toBe(button);
    });

    it('复制按钮的焦点环贴合图标，键盘聚焦不移动文字', async () => {
        const { container } = render(Paragraph, { props: { copyable: true }, slots: { default: () => '点击复制' } });
        const paragraph = element(container, `.${prefix}`);
        const button = screen.getByRole('button', { name: '复制' });
        const icon = button.querySelector('svg') as SVGElement;
        const rect = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
        const before = { paragraph: rect(paragraph), button: rect(button) };
        const buttonRect = button.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        for (const side of ['left', 'top', 'right', 'bottom'] as const) {
            expect(Math.abs(buttonRect[side] - iconRect[side])).toBeLessThanOrEqual(1);
        }
        await tabTo(button);
        expectThemeFocusRing(button);
        expect({ paragraph: rect(paragraph), button: rect(button) }).toEqual(before);
    });

    it('边界情况', async () => {
        const width = { style: { width: '300px' } };
        const { container } = render({
            setup: () => () => (
                <>
                    <Text {...width} ellipsis={{ rows: 3, pos: 'middle', expandable: true }} />
                    <Text {...width} ellipsis={{ rows: 1 }} />
                    <Paragraph
                        {...width}
                        ellipsis={{
                            pos: 'middle',
                            rows: 3,
                            expandable: true,
                            collapsible: true,
                            collapseText: '折叠我吧',
                        }}
                    >
                        {() => 'case 3：长度刚好符合预期，不应该省略，不应该显示展开按钮。长度刚好符合预期，不应该省略，不应该显示展开按钮。不应该显示展开的。'}
                    </Paragraph>
                </>
            ),
        });
        const ellipsis = container.querySelectorAll(`.${prefix}-ellipsis`);
        expect(ellipsis).toHaveLength(3);
        // let the resize-observer driven truncation settle before asserting an absence
        await sleep(300);
        expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        expect(ellipsis[2]).toMatchTextContent('不应该显示展开的。');
    });

    it('js 省略，不截断，不显示 tooltip', async () => {
        const { container } = render(Title, {
            props: { heading: 5, ellipsis: { showTooltip: true, suffix: ' ' } },
            attrs: { style: { width: '250px', wordBreak: 'break-all' } },
            slots: { default: () => 'data_tns' },
        });
        await userEvent.hover(element(container, `.${prefix}`));
        // wait past the tooltip's open delay before asserting it stayed closed
        await sleep(500);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-content`)).toBeNull();
    });

    it.each<[string, Ellipsis | undefined, { copyable?: boolean }, string]>([
        ['the expand button', { rows: 2, expandable: true }, {}, `button.${prefix}-ellipsis-expand`],
        ['the copy button', undefined, { copyable: true }, `button.${prefix}-action-copy-icon`],
        ['the truncated text with a tooltip', { rows: 1, showTooltip: true }, {}, `.${prefix}-ellipsis[tabindex="0"]`],
        ['the truncated text with a popover', { rows: 1, showTooltip: { type: 'popover' } }, {}, `.${prefix}-ellipsis[tabindex="0"]`],
    ])('%s 显示主题焦点环', async (_, ellipsis, props, selector) => {
        const { container } = render(Paragraph, {
            props: { ellipsis, ...props },
            attrs: { style: { width: '300px' } },
            slots: { default: () => longText },
        });
        const el = await waitFor(() => {
            const found = container.querySelector(selector);
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it('不可收起的展开按钮激活后，焦点移到展开的文字上', async () => {
        const { container } = render(Paragraph, {
            props: { ellipsis: { rows: 2, expandable: true } },
            attrs: { style: { width: '300px' } },
            slots: { default: () => longText },
        });
        const button = await screen.findByRole('button', { name: '展开' });
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        const paragraph = element(container, `.${prefix}`);
        await waitFor(() => expect(paragraph).toHaveFocus());
        expect(paragraph).toHaveAttribute('tabindex', '-1');
        expect(screen.queryByRole('button', { name: '展开' })).toBeNull();
    });

    it('ShadowRoot 内不可收起的展开按钮激活后，焦点移到展开的文字上', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(Paragraph, {
            container: mount,
            props: { ellipsis: { rows: 2, expandable: true } },
            attrs: { style: { width: '300px' } },
            slots: { default: () => longText },
        });
        try {
            const button = await waitFor(() => {
                const found = shadow.querySelector<HTMLElement>(`.${prefix}-ellipsis-expand`);
                expect(found).not.toBeNull();
                return found as HTMLElement;
            });
            button.focus();
            await userEvent.keyboard('{Enter}');
            const paragraph = shadow.querySelector(`.${prefix}`);
            await waitFor(() => expect(shadow.activeElement).toBe(paragraph));
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
