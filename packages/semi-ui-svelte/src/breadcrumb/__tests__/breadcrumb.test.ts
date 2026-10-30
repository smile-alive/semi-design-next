import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { BreadcrumbClick, BreadcrumbProps } from '../interface';
import BreadcrumbFixture from './breadcrumb-fixture.svelte';

type Store = { props?: BreadcrumbProps; icon?: boolean; item?: boolean; more?: boolean; separator?: boolean };

const prefix = 'semi-breadcrumb';
const routesOf = (count: number) => 'abcdefghij'.slice(0, count).split('');

function setup(props: BreadcrumbProps = {}, extra: Omit<Store, 'props'> = {}) {
    const store = createStore<Store>({ props: { routes: routesOf(3), ...props }, ...extra });
    const view = render(BreadcrumbFixture, { props: { store } });
    return { store, view };
}

const nav = () => screen.getByRole('navigation');
const getItemWraps = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-item-wrap`)];
const getSeparatorTexts = () => [...document.querySelectorAll(`.${prefix}-separator`)].map((el) => el.textContent);
const typographyTexts = () => [...document.querySelectorAll('.semi-typography')].map((el) => el.textContent);
const itemOf = (wrap: Element) => wrap.firstElementChild as HTMLElement;
// the visible row: item texts, with the more button as 'more'
const visibleRow = () => [...nav().children].map((el) => (el.classList.contains(`${prefix}-collapse`) ? 'more' : el.querySelector('.semi-typography')?.textContent));
const expandButton = () => screen.getByRole('button', { name: zh_CN.Breadcrumb.expand });

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Breadcrumb', () => {
    it('自定义 class、style 与其他属性落在 nav', () => {
        setup({ class: 'test', style: 'color: red', id: 'bc', title: 'path', 'data-foo': 'bar' } as BreadcrumbProps);
        const root = screen.getByRole('navigation', { name: zh_CN.Breadcrumb.label });
        expect(root).toHaveClass('test', `${prefix}-wrapper`);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('id', 'bc');
        expect(root).toHaveAttribute('title', 'path');
        expect(root).toHaveAttribute('data-foo', 'bar');
    });

    it('自定义 aria-label', () => {
        setup({ 'aria-label': 'Path' });
        expect(screen.getByRole('navigation', { name: 'Path' })).toBeInTheDocument();
    });

    it('compact = false', () => {
        const { store } = setup({ compact: false });
        expect(nav()).toHaveClass(`${prefix}-wrapper-loose`);
        expect(nav()).not.toHaveClass(`${prefix}-wrapper-compact`);
        store.props = { routes: routesOf(3) };
        flushSync();
        expect(nav()).toHaveClass(`${prefix}-wrapper-compact`);
        expect(nav()).not.toHaveClass(`${prefix}-wrapper-loose`);
    });

    it('separator 与 separator snippet，snippet 优先', () => {
        const { store } = setup({ separator: '>' });
        expect(getSeparatorTexts()).toEqual(['>', '>']);
        store.separator = true;
        flushSync();
        expect(document.querySelectorAll(`.${prefix}-separator .sep`)).toHaveLength(2);
        expect(getItemWraps()[0].textContent).toBe('a|');
    });

    it('渲染带 aria-label 的导航地标，并将最后一项标记为当前项', () => {
        setup();
        const wraps = getItemWraps();
        expect(wraps.map((el) => el.getAttribute('aria-current'))).toEqual([null, null, 'page']);
        expect(itemOf(wraps[2])).toHaveClass(`${prefix}-item-active`);
        expect(getSeparatorTexts()).toEqual(['/', '/']);
    });

    it('activeIndex 选中当前项', () => {
        setup({ activeIndex: 0 });
        const wraps = getItemWraps();
        expect(wraps.map((el) => el.getAttribute('aria-current'))).toEqual(['page', null, null]);
        expect(itemOf(wraps[0])).toHaveClass(`${prefix}-item-active`);
        expect(itemOf(wraps[2])).not.toHaveClass(`${prefix}-item-active`);
    });

    it('maxItemCount 小于 2 时仍显示最后一项', () => {
        setup({ maxItemCount: 1 });
        expect(screen.getByText('c').closest(`.${prefix}-item-wrap`)).toHaveAttribute('aria-current', 'page');
    });

    it('routes 超过 maxItemCount 时折叠', () => {
        setup({ routes: routesOf(6) });
        // default maxItemCount 4: first item, more, then the last 3
        expect(nav().children).toHaveLength(5);
        expect(nav().children[1]).toHaveClass(`${prefix}-collapse`);
        expect(typographyTexts()).toEqual(['a', 'd', 'e', 'f']);
        expect(document.querySelector(`.${prefix}-collapse .semi-icon-more`)).not.toBeNull();
    });

    it('activeIndex 指向会被折叠的项时，当前项保持可见，折叠其后的项', () => {
        setup({ routes: routesOf(6), activeIndex: 2, moreType: 'popover' });
        expect(screen.getByText('c').closest(`.${prefix}-item-wrap`)).toHaveAttribute('aria-current', 'page');
        // a, b, c (current), more, f: the hidden items are d and e, the last item stays
        expect(typographyTexts()).toEqual(['a', 'b', 'c', 'f']);
        expect(nav().children[3]).toHaveClass(`${prefix}-collapse`);
    });

    // n items, maxItemCount m, r = n - m hidden by default at [1, r]. A current item k inside it hides the larger of
    // [1, k - 1] and [k + 1, min(k + r, n - 2)], the one before it on a tie, and nothing when that one is empty.
    it.each([
        { n: 10, maxItemCount: 4, activeIndex: 6, row: ['a', 'more', 'g', 'h', 'i', 'j'] },
        { n: 7, maxItemCount: 2, activeIndex: 3, row: ['a', 'more', 'd', 'e', 'f', 'g'] },
        { n: 6, maxItemCount: 2, activeIndex: 4, row: ['a', 'more', 'e', 'f'] },
        { n: 6, maxItemCount: 4, activeIndex: 1, row: ['a', 'b', 'more', 'e', 'f'] },
        { n: 6, maxItemCount: 4, activeIndex: 4, row: ['a', 'more', 'd', 'e', 'f'] },
        { n: 3, maxItemCount: 2, activeIndex: 1, row: ['a', 'b', 'c'] },
    ])('$n 项、maxItemCount $maxItemCount、activeIndex $activeIndex 时显示 $row', ({ n, maxItemCount, activeIndex, row }) => {
        setup({ routes: routesOf(n), maxItemCount, activeIndex });
        expect(visibleRow()).toEqual(row);
        expect(screen.getByText(routesOf(n)[activeIndex]).closest(`.${prefix}-item-wrap`)).toHaveAttribute('aria-current', 'page');
    });

    it('autoCollapse = false 时显示全部项', () => {
        setup({ routes: routesOf(6), autoCollapse: false });
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getItemWraps()).toHaveLength(6);
    });

    it('点击 more 展开全部项', async () => {
        setup({ routes: routesOf(6), maxItemCount: 2 });
        const more = expandButton();
        expect(more).toHaveClass(`${prefix}-item-more`);
        expect(more.parentElement?.querySelector(`.${prefix}-separator`)).toHaveTextContent('/');
        await userEvent.click(more);
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getItemWraps()).toHaveLength(6);
    });

    it('在 more 上按 Enter 与 Space 展开，其他键不展开', async () => {
        const { view } = setup({ routes: routesOf(6) });
        expandButton().focus();
        await userEvent.keyboard('a');
        expect(document.querySelector(`.${prefix}-collapse`)).not.toBeNull();
        await userEvent.keyboard('{Enter}');
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        view.unmount();
        setup({ routes: routesOf(6) });
        expandButton().focus();
        await userEvent.keyboard(' ');
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
    });

    it('用键盘展开后，焦点移到被折叠区间的第一个可聚焦项', async () => {
        setup({ routes: routesOf(6).map((name) => ({ name, href: `#${name}` })) });
        expandButton().focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });

    it('用键盘展开后，被折叠的项都不可聚焦时焦点落到 nav', async () => {
        setup({ routes: routesOf(6) });
        expandButton().focus();
        await userEvent.keyboard('{Enter}');
        expect(nav()).toHaveFocus();
    });

    it('more snippet 收到被隐藏的项，取代默认图标', () => {
        setup({ routes: routesOf(5), maxItemCount: 3 }, { more: true });
        expect(document.querySelector(`.${prefix}-item-more .custom-more`)).toHaveTextContent('2:b,c');
        expect(document.querySelector(`.${prefix}-item-more .semi-icon-more`)).toBeNull();
        // a custom more area owns the hidden items: the item before it drops its separator
        expect(getSeparatorTexts()).toEqual(['/', '/', '/']);
    });

    it('moreType 为 popover 时在气泡中显示被隐藏的项，以 restItem 分隔', async () => {
        setup({ routes: ['one', 'two', 'three', 'four'], maxItemCount: 2, moreType: 'popover', separator: '>' });
        expect(nav().children).toHaveLength(3);
        await userEvent.hover(document.querySelector(`.${prefix}-item-more .semi-icon-more`) as HTMLElement);
        const content = await screen.findByText('two', { selector: '.semi-popover-content *' }).then(() => document.querySelector('.semi-popover-content') as HTMLElement);
        const hidden = content.querySelectorAll(`:scope > .${prefix}-item-wrap`);
        expect([...hidden].map((el) => el.textContent)).toEqual(['two', 'three']);
        expect([...content.querySelectorAll(`.${prefix}-restItem`)].map((el) => el.textContent)).toEqual(['>']);
    });

    it('moreType 为 popover 时，气泡内的链接点击仍调用 onClick，且不展开', async () => {
        const onClick = vi.fn<BreadcrumbClick>();
        setup({ routes: ['one', 'two', 'three', 'four'].map((name) => ({ name, href: 'https://semi.design/' })), maxItemCount: 2, moreType: 'popover', onClick });
        await userEvent.hover(document.querySelector(`.${prefix}-item-more .semi-icon-more`) as HTMLElement);
        const link = (await screen.findByText('two', { selector: '.semi-popover-content *' })).closest('a') as HTMLElement;
        // dispatchEvent returns false when a handler called preventDefault
        expect(link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))).toBe(true);
        link.addEventListener('click', (event) => event.preventDefault());
        link.click();
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'two' }), expect.any(MouseEvent));
        expect(document.querySelector(`.${prefix}-collapse`)).not.toBeNull();
    });

    it('图标 snippet 收到路由、下标与 compact 对应的 size、class', () => {
        const routes = [{ path: '/', href: '/' }, { path: '/breadcrumb', href: '/components/breadcrumb', name: 'breadcrumb' }, 'string only'];
        const { store } = setup({ routes }, { icon: true });
        const [first, second, third] = getItemWraps();
        expect(first.querySelector('.semi-icon-home')).toHaveClass('semi-icon-small', `${prefix}-item-icon`);
        expect(second.querySelector('.semi-icon-article')).not.toBeNull();
        expect(third.querySelector('.semi-icon')).toBeNull();
        expect(first.querySelector('a')).toHaveAttribute('href', '/');
        expect(second.querySelector('a')).toHaveAttribute('href', '/components/breadcrumb');
        expect(second.querySelector('.semi-typography')).toHaveTextContent(/^breadcrumb$/);
        expect(third.querySelector('.semi-typography')).toHaveTextContent(/^string only$/);
        // a route without a name renders no title
        expect(first.querySelector(`.${prefix}-item-title`)).toBeNull();
        (store.props as BreadcrumbProps).compact = false;
        flushSync();
        expect(document.querySelector('.semi-icon-home')).toHaveClass('semi-icon-default');
    });

    it('item snippet 收到路由与下标，内容内联渲染', () => {
        setup({ routes: [{ path: 'path', href: 'href', name: 'test' }] }, { item: true });
        const title = document.querySelector(`.${prefix}-item-title`) as HTMLElement;
        expect(title).toHaveClass(`${prefix}-item-title-inline`);
        expect(title.querySelector('.path')).toHaveTextContent(/^path$/);
        expect(title.querySelector('.href')).toHaveTextContent(/^href$/);
        expect(title.querySelector('.name')).toHaveTextContent(/^test-0$/);
        expect(document.querySelector('.semi-typography')).toBeNull();
    });

    it('除非是当前项，否则 href 渲染为 a 标签', () => {
        setup({
            routes: [
                { name: 'a', href: '/a' },
                { name: 'b', href: '/b', noLink: true },
                { name: 'c', href: '/c' },
            ],
        });
        const [a, b, c] = getItemWraps().map(itemOf);
        expect(a.tagName).toBe('A');
        expect(a).toHaveAttribute('href', '/a');
        expect(a).toHaveClass(`${prefix}-item-link`);
        expect(b.tagName).toBe('A');
        expect(b).not.toHaveClass(`${prefix}-item-link`);
        // the active last item stays a span even with href
        expect(c.tagName).toBe('SPAN');
        expect(c).not.toHaveAttribute('href');
    });

    it('route 的 separator 只替换该项的分隔符，且不带 separator 包裹', () => {
        setup({ routes: [{ name: 'a', separator: '???' }, 'b', 'c'] });
        const [first] = getItemWraps();
        expect(first.textContent).toBe('a???');
        expect(first.querySelector(`.${prefix}-separator`)).toBeNull();
        expect(getSeparatorTexts()).toEqual(['/']);
    });

    it('字符串路由，key 取自路由，onClick 收到原始路由与 MouseEvent', async () => {
        const onClick = vi.fn<BreadcrumbClick>();
        setup({ routes: [{ path: '/', name: 'home', key: 'h' }, 'list', 'detail'], onClick });
        expect(getItemWraps()).toHaveLength(3);
        await userEvent.click(screen.getByText('home'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toEqual({ path: '/', name: 'home', key: 'h' });
        expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
        await userEvent.click(screen.getByText('list'));
        expect(onClick.mock.calls[1][0]).toEqual({ name: 'list' });
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('点击 more 只展开，不调用 onClick', async () => {
        const onClick = vi.fn<BreadcrumbClick>();
        setup({ routes: routesOf(5), onClick });
        await userEvent.click(expandButton());
        expect(getItemWraps()).toHaveLength(5);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('点击 nav 本身不触发 onClick', async () => {
        const onClick = vi.fn<BreadcrumbClick>();
        setup({ onClick });
        await userEvent.click(nav());
        expect(onClick).not.toHaveBeenCalled();
    });

    it('无 href 且有点击处理的项可用键盘聚焦，Enter 以 MouseEvent 触发 onClick', async () => {
        const onClick = vi.fn<BreadcrumbClick>();
        setup({ onClick });
        // the last item is the current page, not a link
        const links = screen.getAllByRole('link');
        expect(links.map((link) => link.textContent?.trim())).toEqual(['a', 'b']);
        await userEvent.tab();
        expect(links[0]).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toEqual({ name: 'a' });
        expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
    });

    it('没有点击处理的项不是 Tab 停靠点', () => {
        setup();
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('showTooltip 设置截断宽度，且不改写传入的对象', () => {
        const width = () => (document.querySelector('.semi-typography') as HTMLElement).style.maxWidth;
        const { store } = setup();
        expect(width()).toBe('150px');
        const showTooltip = { width: 80, opts: { mouseEnterDelay: 10 } };
        (store.props as BreadcrumbProps).showTooltip = showTooltip;
        flushSync();
        expect(width()).toBe('80px');
        expect(showTooltip).toEqual({ width: 80, opts: { mouseEnterDelay: 10 } });
        (store.props as BreadcrumbProps).showTooltip = { width: '6em' };
        flushSync();
        expect(width()).toBe('6em');
        (store.props as BreadcrumbProps).showTooltip = false;
        flushSync();
        expect(width()).toBe('150px');
    });

    it('routes 中非 data-* 的字段不会进入 DOM', () => {
        setup({ routes: [{ name: 'a', path: '/a', meta: 'x', 'data-id': 'r' }, 'b'] });
        const wrap = getItemWraps()[0];
        expect(wrap).toHaveAttribute('data-id', 'r');
        expect(wrap).not.toHaveAttribute('path');
        expect(wrap).not.toHaveAttribute('name');
        expect(wrap).not.toHaveAttribute('meta');
    });

    it('routes 变化时按 key 更新，空 routes 不渲染项', () => {
        const { store } = setup({ routes: ['a', 'b'] });
        expect(getItemWraps()).toHaveLength(2);
        (store.props as BreadcrumbProps).routes = ['a', 'b', 'c', 'd'];
        flushSync();
        expect(getItemWraps()).toHaveLength(4);
        (store.props as BreadcrumbProps).routes = [];
        flushSync();
        expect(getItemWraps()).toHaveLength(0);
    });

    it('没有 name 的路由不渲染标题', () => {
        setup({ routes: [{ path: '/' }, 'x'] });
        expect(typographyTexts()).toEqual(['x']);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式 prop 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Breadcrumb: { separator: '>', maxItemCount: 2 } };
        const { view } = setup({ routes: routesOf(4) });
        expect(nav().children).toHaveLength(3);
        expect(getSeparatorTexts()).toEqual(['>', '>']);
        view.unmount();
        setup({ routes: routesOf(4), separator: '|', maxItemCount: 5 });
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getSeparatorTexts()).toEqual(['|', '|', '|']);
    });
});
