import { render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tab } from '@test/utils/browser';
import { sleep } from '@test/utils/function';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { AnchorProps } from '../interface';
import AnchorFixture from './anchor-fixture.svelte';
import DocBox from './doc-box.svelte';
import { collapsible, flat, type Fixture } from './fixture-data';
import FocusButton from './focus-button.svelte';
import NestedScroll from './nested-scroll.svelte';
import ShadowTarget from './shadow-target.svelte';

const prefix = 'semi-anchor';
const longTitle = '工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。';
const activeTitle = () => document.querySelector(`.${prefix}-link-title-active`);

function setup(props: AnchorProps, extra: Partial<Fixture> = {}) {
    const store = createStore<Fixture>({ props, sections: [], ...extra });
    render(AnchorFixture, { props: { store } });
    return store;
}

const tooltipLinks = (href: string) => [
    { href: '#组件', title: '组件' },
    { href, title: longTitle },
];

describe('Svelte Anchor（浏览器）', () => {
    it('在链接上按 Enter 不会按下 click 中移走焦点的那个按钮', async () => {
        const onConfirm = vi.fn<() => void>();
        render(FocusButton, { props: { onConfirm } });
        screen.getByRole('link', { name: 'Section A' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('Tab 依次到达每个链接，禁用的链接仍可聚焦', async () => {
        setup({
            links: [
                { href: '#a', title: 'a' },
                { href: '#b', title: 'b', disabled: true },
                { href: '#c', title: 'c' },
            ],
        });
        await tab();
        expect(screen.getByRole('link', { name: 'a' })).toHaveFocus();
        await tab();
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
        await tab();
        expect(screen.getByRole('link', { name: 'c' })).toHaveFocus();
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
        setup({ showTooltip: true, links: tooltipLinks('#显示工具提示') });
        setup({ position: 'right', showTooltip: true, links: tooltipLinks('#工具提示位置') });
        const [first, second] = screen.getAllByRole('link', { name: longTitle });
        await userEvent.hover(first);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-wrapper')).toHaveTextContent(longTitle));
        await userEvent.unhover(first);

        await userEvent.hover(second);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-wrapper[x-placement="right"]')).toHaveTextContent(longTitle));
    });

    it('显示 tooltip：链接内的省略号文本不是 Tab 停靠点', async () => {
        setup({ showTooltip: true, links: tooltipLinks('#显示工具提示') });
        const links = screen.getAllByRole('link');
        const text = links[1].querySelector(`.${prefix}-link-tooltip`);
        const stops: (Element | null)[] = [];
        for (let i = 0; i < 3; i++) {
            await userEvent.keyboard('{Tab}');
            stops.push(document.activeElement);
        }
        expect(stops.slice(0, 2)).toEqual(links);
        expect(stops).not.toContain(text);
    });

    it('按键：Enter 激活焦点所在的链接并滚动到目标，方向键不滚动', async () => {
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

    it('滚动：高亮跟随容器滚动位置，回到顶部时清空', async () => {
        render(DocBox, { props: { fixedBar: true, scrollMotion: true, targetOffset: 100 } });
        const box = document.getElementById('box') as HTMLElement;
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('点击：目标滚动到 targetOffset 指定的位置', async () => {
        render(DocBox, { props: { fixedBar: true, scrollMotion: true, targetOffset: 100 } });
        const box = document.getElementById('box') as HTMLElement;
        await userEvent.click(screen.getByRole('link', { name: 'api too much to show' }));
        await waitFor(() => {
            const offset = (document.getElementById('api') as HTMLElement).getBoundingClientRect().top - box.getBoundingClientRect().top;
            expect(Math.abs(offset - 100)).toBeLessThanOrEqual(2);
        });
    });

    it('展开与收起子链接后，rail 高度跟随链接列表', async () => {
        setup({ links: collapsible, autoCollapse: true });
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

    it('CssOnlyRailHeight：新增链接后同一帧内 rail 高度已等于列表高度', async () => {
        const store = setup({ style: 'width: 160px', links: flat('welcome') });
        const slide = () => document.querySelector(`.${prefix}-slide`) as HTMLElement;
        const wrapper = () => document.querySelector(`.${prefix}-link-wrapper`) as HTMLElement;

        store.props.links = [...flat('welcome'), { href: '#long', title: '一行放不下、会在渲染时立即换行撑高列表的很长很长的标题' }];
        await waitFor(() => expect(wrapper().querySelectorAll(`.${prefix}-link`)).toHaveLength(2));
        expect(slide().getBoundingClientRect().height).toBe(wrapper().getBoundingClientRect().height);
    });

    it('maxHeight 限制列表可滚动时，rail 高度等于内容总高且随内容整体滚动，滑块与激活链接对齐', async () => {
        setup({ defaultAnchor: '#l14', maxHeight: 100, links: Array.from({ length: 15 }, (_, i) => ({ href: `#l${i}`, title: `l${i}` })) });
        const nav = screen.getByRole('navigation');
        const slide = document.querySelector(`.${prefix}-slide`) as HTMLElement;
        const wrapper = document.querySelector(`.${prefix}-link-wrapper`) as HTMLElement;
        const bar = document.querySelector(`.${prefix}-slide-bar`) as HTMLElement;
        const activeTitleTop = () => screen.getByRole('link', { name: 'l14' }).getBoundingClientRect().top;
        await waitFor(() => expect(bar).toHaveClass(`${prefix}-slide-bar-active`));

        // the rail spans the full (unclipped) content height, not just the visible viewport cut by maxHeight
        expect(slide.getBoundingClientRect().height).toBe(wrapper.getBoundingClientRect().height);
        expect(slide.getBoundingClientRect().height).toBeGreaterThan(nav.getBoundingClientRect().height);
        await waitFor(() => expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0));

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

    it('自动折叠：点击展开分支，不折叠时全部可见', async () => {
        setup({ links: collapsible, autoCollapse: true });
        const titles = () => [...document.querySelectorAll(`.${prefix}-link-title`)].map((el) => el.textContent);
        expect(titles()).not.toContain('1.1 组件');
        await userEvent.click(within(document.body).getByRole('link', { name: '1. Semi Design' }));
        await waitFor(() => expect(titles()).toEqual(expect.arrayContaining(['1.1 组件', '1.2 物料', '1.3 主题商店'])));
    });

    it('ShadowRoot 内点击链接滚动到同一 ShadowRoot 内的目标', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(ShadowTarget, { target: mount });
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
