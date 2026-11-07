/** @jsxImportSource vue */
import { screen, waitFor, within } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render, sleep } from '@test/utils/vue';
import Anchor, { AnchorLink } from '../index';
import Collapsible from './fixtures/collapsible.vue';
import DocBox from './fixtures/doc-box.vue';
import FocusButton from './fixtures/focus-button.vue';
import NestedScroll from './fixtures/nested-scroll.vue';
import RailGrow from './fixtures/rail-grow.vue';

const prefix = 'semi-anchor';
const longTitle = '工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。';
const tooltipLinks = (href: string) => () => (
    <>
        <AnchorLink title="组件" href="#组件" />
        <AnchorLink title={longTitle} href={href} />
    </>
);
const activeTitle = () => document.querySelector(`.${prefix}-link-title-active`);

describe('Anchor（浏览器）', () => {
    it('在链接上按 Enter 不会按下 click 中移走焦点的那个按钮', async () => {
        const onConfirm = vi.fn<() => void>();
        render(FocusButton, { attrs: { onConfirm } });
        screen.getByRole('link', { name: 'Section A' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('FixContainerScrollBug1158：点击链接只滚动目标容器，不滚动其可滚动祖先', async () => {
        render(NestedScroll);
        const outer = screen.getByTestId('outer');
        const box = document.getElementById('box') as HTMLElement;
        expect(outer.scrollHeight).toBeGreaterThan(outer.clientHeight);
        expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);

        await userEvent.click(screen.getByRole('link', { name: 'docs' }));

        await waitFor(() => expect(box.scrollTop).toBe(300));
        expect((document.getElementById('docs') as HTMLElement).getBoundingClientRect().top).toBeCloseTo(box.getBoundingClientRect().top, 0);
        expect(outer.scrollTop).toBe(0);
    });

    it('显示 tooltip', async () => {
        render(Anchor, { props: { showTooltip: true }, slots: { default: tooltipLinks('#显示工具提示') } });
        render(Anchor, {
            props: { position: 'right', showTooltip: true },
            slots: { default: tooltipLinks('#工具提示位置') },
        });
        // Hover the links: once its tooltip is open, the vitest locator generator cannot build a selector for the
        // ellipsis text span inside them
        const [first, second] = screen.getAllByRole('link', { name: longTitle });
        await userEvent.hover(first);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-wrapper')).toHaveTextContent(longTitle));
        await userEvent.unhover(first);

        await userEvent.hover(second);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-wrapper[x-placement="right"]')).toHaveTextContent(longTitle));
    });

    it('显示 tooltip：链接内的省略号文本不是 Tab 停靠点', async () => {
        render(Anchor, { props: { showTooltip: true }, slots: { default: tooltipLinks('#显示工具提示') } });
        const links = screen.getAllByRole('link');
        const getText = () => links[1].querySelector(`.${prefix}-link-tooltip`);
        await waitFor(() => expect(getText()).toHaveAttribute('data-popupid'));
        const text = getText();
        const stops: (Element | null)[] = [];
        for (let i = 0; i < 3; i++) {
            await userEvent.keyboard('{Tab}');
            stops.push(document.activeElement);
        }
        expect(stops.slice(0, 2)).toEqual(links);
        expect(stops).not.toContain(text);
    });

    it('按键', async () => {
        render(DocBox);
        const box = document.getElementById('box') as HTMLElement;
        screen.getByRole('link', { name: 'contact' }).focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(box.scrollTop).toBe(0);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(box.scrollTop).toBe(box.scrollHeight - box.clientHeight));
        const contact = screen.getByRole('heading', { name: 'Contact me' }).getBoundingClientRect();
        expect(contact.bottom).toBeLessThanOrEqual(box.getBoundingClientRect().bottom);
    });

    it('滚动', async () => {
        render(DocBox, { props: { fixedBar: true, scrollMotion: true, targetOffset: 100 } });
        const box = document.getElementById('box') as HTMLElement;
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('点击', async () => {
        render(DocBox, { props: { fixedBar: true, scrollMotion: true, targetOffset: 100 } });
        const box = document.getElementById('box') as HTMLElement;
        await userEvent.click(screen.getByRole('link', { name: 'api too much to show' }));
        await waitFor(() => {
            const offset = (document.getElementById('api') as HTMLElement).getBoundingClientRect().top - box.getBoundingClientRect().top;
            expect(Math.abs(offset - 100)).toBeLessThanOrEqual(2);
        });
    });

    it('展开与收起子链接后，rail 高度跟随链接列表', async () => {
        render(Collapsible, { props: { autoCollapse: true } });
        const slide = () => document.querySelector(`.${prefix}-slide`) as HTMLElement;
        const wrapper = () => document.querySelector(`.${prefix}-link-wrapper`) as HTMLElement;
        const railHeight = () => slide().getBoundingClientRect().height;
        const listHeight = () => wrapper().getBoundingClientRect().height;
        const collapsedHeight = listHeight();
        expect(railHeight()).toBe(collapsedHeight);

        await userEvent.click(screen.getByRole('link', { name: '1. Semi Design' }));
        await waitFor(() => expect(listHeight()).toBeGreaterThan(collapsedHeight));
        expect(railHeight()).toBe(listHeight());

        await userEvent.click(screen.getByRole('link', { name: '2. 设计语言' }));
        await waitFor(() => expect(listHeight()).toBe(collapsedHeight));
        expect(railHeight()).toBe(collapsedHeight);
    });

    it('CssOnlyRailHeight：新增链接后同一帧内 rail 高度已等于列表高度，无需等待任何回调', async () => {
        const view = render(RailGrow);
        const slide = () => document.querySelector(`.${prefix}-slide`) as HTMLElement;
        const wrapper = () => document.querySelector(`.${prefix}-link-wrapper`) as HTMLElement;

        await view.rerender({ wide: true });
        // no waitFor/sleep: a ResizeObserver-based rail would still show the previous height here, because its
        // callback has not run a frame yet; a pure-CSS rail is already correct the instant layout is read
        expect(slide().getBoundingClientRect().height).toBe(wrapper().getBoundingClientRect().height);
    });

    it('maxHeight 限制列表可滚动时，rail 高度等于内容总高且随内容整体滚动，滑块与激活链接对齐', async () => {
        render(Anchor, {
            props: { defaultAnchor: '#l14', maxHeight: 100 },
            slots: {
                default: () => Array.from({ length: 15 }, (_, i) => <AnchorLink key={i} title={`l${i}`} href={`#l${i}`} />),
            },
        });
        const nav = screen.getByRole('navigation');
        const slide = document.querySelector(`.${prefix}-slide`) as HTMLElement;
        const wrapper = document.querySelector(`.${prefix}-link-wrapper`) as HTMLElement;
        const bar = document.querySelector(`.${prefix}-slide-bar`) as HTMLElement;
        const activeTitleTop = () => screen.getByRole('link', { name: 'l14' }).getBoundingClientRect().top;
        await waitFor(() => expect(bar).toHaveClass(`${prefix}-slide-bar-active`));

        // the rail spans the full (unclipped) content height, not just the visible viewport cut by maxHeight
        expect(slide.getBoundingClientRect().height).toBe(wrapper.getBoundingClientRect().height);
        expect(slide.getBoundingClientRect().height).toBeGreaterThan(nav.getBoundingClientRect().height);
        expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0);

        nav.scrollTop = nav.scrollHeight - nav.clientHeight;
        await waitFor(() => expect(nav.scrollTop).toBeGreaterThan(0));
        // the rail is a descendant of the scrolling root, so it (and the indicator inside it) scrolls with it
        expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0);
    });

    it('容器已滚到底后点击底部链接，再向上滚动时高亮仍更新', async () => {
        render(DocBox);
        const box = document.getElementById('box') as HTMLElement;
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        // the container is already at the bottom, so the click scrolls nothing
        await userEvent.click(screen.getByRole('link', { name: 'contact' }));
        await waitFor(() => expect(activeTitle()).toHaveTextContent('contact'));
        // longer than the 100ms debounce that ends a click without a scroll
        await sleep(250);

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('自动折叠', async () => {
        const collapse = render(Collapsible, { props: { autoCollapse: true } });
        const noCollapse = render(Collapsible);
        const linkTitles = (root: Element) => [...root.querySelectorAll(`.${prefix}-link-title`)].map((el) => el.textContent);

        expect(linkTitles(collapse.container)).not.toContain('1.1 组件');
        await userEvent.click(within(collapse.container as HTMLElement).getByRole('link', { name: '1. Semi Design' }));
        await waitFor(() => expect(linkTitles(collapse.container)).toEqual(expect.arrayContaining(['1.1 组件', '1.2 物料', '1.3 主题商店'])));

        expect(linkTitles(noCollapse.container)).toEqual(expect.arrayContaining(['1.1 组件', '1.1.1 Avatar', '1.1.2 Button', '1.1.3 Icon']));
    });

    it('ShadowRoot 内点击链接滚动到同一 ShadowRoot 内的目标', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            () => (
                <>
                    <Anchor>
                        {{
                            default: () => <AnchorLink title="target" href="#shadow-target" />,
                        }}
                    </Anchor>
                    <div style={{ height: '3000px' }} />
                    <div id="shadow-target">target content</div>
                </>
            ),
            { container: mount }
        );
        try {
            await userEvent.click(shadow.querySelector(`.${prefix}-link-title`) as Element);
            await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
        } finally {
            view.unmount();
            host.remove();
            window.scrollTo(0, 0);
        }
    });
});
