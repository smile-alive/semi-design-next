import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconSetting } from '@fibrae/semi-icons-solid';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/solid';
import Typography from '..';
import type { CopyableConfig, Ellipsis } from '../interface';

const { Title, Text, Paragraph } = Typography;
const prefix = `${BASE_CLASS_PREFIX}-typography`;
const longText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。'.repeat(4);

function must<T>(value?: T | null): T {
    if (value == null) {
        throw new Error('expected a value');
    }
    return value;
}

describe('Typography（浏览器）', () => {
    it('code 显式声明等宽字体栈和跟随上下文的字号，不依赖 UA 或宿主重置', () => {
        // a host reset below Semi's layer that disagrees with the UA default
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { code { font-family: Georgia, serif; font-size: 3em; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(() => (
            <Text style={{ 'font-size': '20px' }} code>
                code
            </Text>
        ));
        const style = getComputedStyle(must(container.querySelector('code')));
        expect(style.fontSize).toBe('20px');
        expect(style.fontFamily).toContain('monospace');
    });

    it('mark 的文字色跟随主题 token，不是 UA 的 MarkText', () => {
        const { container } = render(() => (
            <Text style={{ '--semi-color-text-0': 'rgb(1, 2, 3)' }} mark>
                mark
            </Text>
        ));
        expect(getComputedStyle(must(container.querySelector('mark'))).color).toBe('rgb(1, 2, 3)');
    });

    it('省略', async () => {
        const { container } = render(() => (
            <Paragraph style={{ width: '300px' }} ellipsis={{ rows: 3, expandable: true, collapsible: true }}>
                Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。 区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有四大优势。
            </Paragraph>
        ));
        const paragraph = container.querySelector(`.${prefix}`);
        await waitFor(() => expect(paragraph).toMatchTextContent('...'));
        expect(paragraph).not.toMatchTextContent('四大优势');

        await userEvent.click(screen.getByText('展开'));
        await waitFor(() => expect(paragraph).toMatchTextContent('四大优势'));

        await userEvent.click(screen.getByText('收起'));
        await waitFor(() => expect(paragraph).toMatchTextContent('...'));
        expect(paragraph).not.toMatchTextContent('四大优势');
    });

    it('宿主清空 body 后，JS 省略仍能截断', async () => {
        const renderParagraph = () =>
            render(() => (
                <Paragraph style={{ width: '300px' }} ellipsis={{ rows: 1, expandable: true }}>
                    {'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。'.repeat(3)}
                </Paragraph>
            ));
        const first = renderParagraph();
        await waitFor(() => expect(first.container).toMatchTextContent('...'));
        // a micro-frontend host unmounting its app empties body, the measuring container included
        cleanup();
        document.body.replaceChildren();
        const second = renderParagraph();
        await waitFor(() => expect(second.container).toMatchTextContent('...'));
    });

    it('可复制', async () => {
        // headless Chromium denies clipboard writes without a granted permission
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        const onCopy = vi.fn<NonNullable<CopyableConfig['onCopy']>>();
        const { container } = render(() => (
            <div>
                <Paragraph copyable={{ onCopy }}>点击右边的图标复制文本。</Paragraph>
                <Paragraph copyable={{ icon: () => <IconSetting /> }} spacing="extended">
                    测试 renderCopyNode 属性
                </Paragraph>
            </div>
        ));
        await userEvent.click(must(container.querySelector(`.${prefix}-action-copy`)));
        await waitFor(() => expect(onCopy).toHaveBeenCalledWith(expect.anything(), '点击右边的图标复制文本。', true));
        expect(writeText).toHaveBeenCalledWith('点击右边的图标复制文本。');
        expect(screen.getByText('复制成功')).toBeInTheDocument();

        await userEvent.click(must(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-setting`)));
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-action-copied`)).toHaveLength(2));
        expect(container.querySelectorAll(`.${prefix}-action-copied`)[1]).toHaveTextContent('复制成功');
    });

    it('复制按钮的间距只在文字的行内起始侧，RTL 下不会两侧都有', () => {
        const { container } = render(() => (
            <div dir="rtl">
                <Text copyable>text</Text>
            </div>
        ));
        const style = getComputedStyle(must(container.querySelector(`.${prefix}-action-copy`)));
        expect(style.marginRight).toBe('4px');
        expect(style.marginLeft).toBe('0px');
    });

    it('悬停复制按钮并点击后，不再显示「复制」提示', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        render(() => <Paragraph copyable={{ duration: 5 }}>点击复制</Paragraph>);
        const button = screen.getByRole('button', { name: '复制' });
        await userEvent.hover(button);
        await waitFor(() => expect(document.querySelector('[role="tooltip"].semi-tooltip-wrapper-show')).not.toBeNull());
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveTextContent('复制成功'));
        await waitFor(() => expect(document.querySelector('[role="tooltip"].semi-tooltip-wrapper-show')).toBeNull());
    });

    it('复制按钮变为已复制提示时保持焦点', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        render(() => <Paragraph copyable={{ duration: 0.3 }}>点击复制</Paragraph>);
        const button = screen.getByRole('button', { name: '复制' });
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveTextContent('复制成功'));
        expect(document.activeElement).toBe(button);
        expectThemeFocusRing(button);
        await waitFor(() => expect(button).toHaveAccessibleName('复制'));
        expect(document.activeElement).toBe(button);
    });

    it('copyable 复制按钮是唯一的 Tab 停靠点，其 Tooltip 描述了该按钮', async () => {
        render(() => <Text copyable={{ copyTip: 'Copy the text' }}>Semi Design</Text>);
        await userEvent.tab();
        const button = must(document.activeElement);
        expect(button.tagName).toBe('BUTTON');
        await waitFor(() => expect(button).toHaveAccessibleDescription('Copy the text'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('JS 省略加 copyable：复制成功后更宽的提示不使段落多出一行', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        const { container } = render(() => (
            <Paragraph style={{ width: '300px' }} copyable={{ duration: 5 }} ellipsis={{ rows: 1 }}>
                {'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。'.repeat(3)}
            </Paragraph>
        ));
        const paragraph = must(container.querySelector<HTMLElement>(`.${prefix}`));
        await waitFor(() => expect(paragraph).toMatchTextContent('...'));
        await sleep(100);
        const height = paragraph.offsetHeight;
        await userEvent.click(screen.getByRole('button', { name: '复制' }));
        await waitFor(() => expect(paragraph).toMatchTextContent('复制成功'));
        await sleep(100);
        expect(paragraph.offsetHeight).toBe(height);
    });

    it('复制按钮的焦点环贴合图标，键盘聚焦不移动文字', async () => {
        const { container } = render(() => <Paragraph copyable>点击复制</Paragraph>);
        const paragraph = must(container.querySelector(`.${prefix}`));
        const button = screen.getByRole('button', { name: '复制' });
        const icon = must(button.querySelector('svg'));
        const rect = (el: Element) => el.getBoundingClientRect().toJSON();
        const before = { paragraph: rect(paragraph), button: rect(button) };
        // the button adds no box of its own, so the ring is drawn around the icon
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
        const { container } = render(() => (
            <>
                <Text style={{ width: '300px' }} ellipsis={{ rows: 3, pos: 'middle', expandable: true }} />
                <Text style={{ width: '300px' }} ellipsis={{ rows: 1 }} />
                <Paragraph style={{ width: '300px' }} ellipsis={{ pos: 'middle', rows: 3, expandable: true, collapsible: true, collapseText: '折叠我吧' }}>
                    case 3：长度刚好符合预期，不应该省略，不应该显示展开按钮。长度刚好符合预期，不应该省略，不应该显示展开按钮。不应该显示展开的。
                </Paragraph>
            </>
        ));
        const ellipsis = container.querySelectorAll(`.${prefix}-ellipsis`);
        expect(ellipsis).toHaveLength(3);
        // Asserting an absence: let the resize-observer driven truncation settle first
        await sleep(300);
        expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        expect(ellipsis[2]).toMatchTextContent('不应该显示展开的。');
    });

    it('js 省略，不截断，不显示 tooltip', async () => {
        const { container } = render(() => (
            <Title style={{ width: '250px', 'word-break': 'break-all' }} ellipsis={{ showTooltip: true, suffix: ' ' }} heading={5}>
                data_tns
            </Title>
        ));
        await userEvent.hover(must(container.querySelector(`.${prefix}`)));
        // Asserting an absence: give the tooltip longer than its open delay before checking it stayed closed
        await sleep(500);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-content`)).toBeNull();
    });

    it.each<[string, Ellipsis | undefined, { copyable?: boolean }, string]>([
        ['the expand button', { rows: 2, expandable: true }, {}, `button.${prefix}-ellipsis-expand`],
        ['the copy button', undefined, { copyable: true }, `button.${prefix}-action-copy-icon`],
        ['the truncated text with a tooltip', { rows: 1, showTooltip: true }, {}, `.${prefix}-ellipsis[tabindex="0"]`],
    ])('%s 显示主题焦点环', async (_, ellipsis, props, selector) => {
        const { container } = render(() => (
            <Paragraph style={{ width: '300px' }} ellipsis={ellipsis} {...props}>
                {longText}
            </Paragraph>
        ));
        // truncation and the tooltip's tabindex arrive after layout
        const el = await waitFor(() => {
            const found = container.querySelector<HTMLElement>(selector);
            expect(found).not.toBeNull();
            return must(found);
        });
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it('CSS 省略号在行溢出时显示包含完整文本的 Tooltip', async () => {
        render(() => (
            <Text style={{ width: '100px', display: 'inline-block' }} ellipsis={{ showTooltip: true }}>
                overflowing text that does not fit
            </Text>
        ));
        await sleep(50);
        await userEvent.hover(must(screen.getByText('overflowing text that does not fit').closest(`.${prefix}`)));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).not.toBeNull());
        expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text that does not fit');
        expect(document.querySelector('.semi-popover-content')).toBeNull();
    });

    it('showTooltip 的 popover 合并自身 opts 并保留箭头', async () => {
        render(() => (
            <Text
                style={{ width: '100px', display: 'inline-block' }}
                ellipsis={{
                    showTooltip: { type: 'Popover', opts: { class: 'user-pop', style: { color: 'red' } } },
                }}
            >
                popover text that does not fit
            </Text>
        ));
        await sleep(50);
        await userEvent.hover(must(screen.getByText('popover text that does not fit').closest(`.${prefix}`)));
        await waitFor(() => expect(document.querySelector('.semi-popover-content')).not.toBeNull());
        const popover = must(document.querySelector<HTMLElement>(`.${prefix}-ellipsis-popover`));
        expect(popover).toHaveClass('user-pop');
        expect(popover).toHaveTextContent('popover text that does not fit');
        expect(popover.style.color).toBe('red');
        expect(document.querySelector('.semi-popover-icon-arrow')).not.toBeNull();
    });

    it('省略且 showTooltip 的文字位于 activedescendant 条目内时不注入 tabIndex，提示仍可悬停显示', async () => {
        // the option of a listbox that keeps DOM focus and points at its options with aria-activedescendant
        const option = document.createElement('div');
        option.setAttribute('role', 'option');
        document.body.append(option);
        onTestFinished(() => option.remove());
        const { container } = render(
            () => (
                <Text style={{ width: '100px', display: 'inline-block' }} ellipsis={{ showTooltip: true }}>
                    option text that does not fit
                </Text>
            ),
            { container: option }
        );
        await sleep(50);
        const text = must(container.querySelector<HTMLElement>(`.${prefix}`));
        await userEvent.hover(text);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('option text that does not fit'));
        expect(text).not.toHaveAttribute('tabindex');
    });

    it('省略加 showTooltip 的文字含 href 链接时，提示的 aria-describedby 落在链接上而不是根元素', async () => {
        const { container } = render(() => (
            <Text style={{ width: '100px', display: 'inline-block' }} ellipsis={{ showTooltip: true }} link={{ href: '#' }}>
                link text that does not fit
            </Text>
        ));
        await sleep(50);
        await userEvent.hover(screen.getByRole('link'));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('aria-describedby', tip.id));
        expect(container.querySelector(`.${prefix}`)).not.toHaveAttribute('aria-describedby');
    });

    it('省略加 showTooltip 的文字没有可聚焦的链接时，aria-describedby 仍在根元素上', async () => {
        const { container } = render(() => (
            <Text style={{ width: '100px', display: 'inline-block' }} ellipsis={{ showTooltip: true }}>
                plain text that does not fit
            </Text>
        ));
        await sleep(50);
        const text = must(container.querySelector(`.${prefix}`));
        await userEvent.hover(text);
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(text).toHaveAttribute('aria-describedby', tip.id));
    });

    it('省略加 showTooltip 的文字含按钮但没有 link 装饰时，aria-describedby 仍在根元素上', async () => {
        const { container } = render(() => (
            <Text style={{ width: '100px', display: 'inline-block' }} ellipsis={{ showTooltip: true }}>
                text that does not fit <button type="button">action</button>
            </Text>
        ));
        await sleep(50);
        const text = must(container.querySelector(`.${prefix}`));
        await userEvent.hover(text);
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(text).toHaveAttribute('aria-describedby', tip.id));
    });
});
