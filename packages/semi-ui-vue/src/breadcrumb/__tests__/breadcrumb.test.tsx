/** @jsxImportSource vue */
import { nextTick, toRaw, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconArticle, IconHome } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import elementType from '../../_base/element-type';
import semiGlobal, { semiGlobalKey } from '../../_utils/semi-global';
import Breadcrumb, { BreadcrumbItem } from '../index';
import type { BreadcrumbItemInfo, BreadcrumbItemProps, BreadcrumbMoreSlotProps, BreadcrumbProps, BreadcrumbRouteSlotProps, Route } from '../interface';
import Keyed from './fixtures/keyed.vue';
import Refs from './fixtures/refs.vue';

type Click = NonNullable<BreadcrumbProps['onClick']>;
type Child = [props: BreadcrumbItemProps & Record<string, unknown>, text: string | number];

const prefix = 'semi-breadcrumb';
const defaultChildren: Child[] = [
    [{}, 'semi'],
    [{}, 'design'],
    [{}, 'byde'],
];
const itemNodes = (children: Child[]) =>
    children.map(([props, text], index) => (
        <BreadcrumbItem key={index} {...props}>
            {{ default: () => text }}
        </BreadcrumbItem>
    ));

function getBr(props: BreadcrumbProps = {}, children: Child[] = defaultChildren) {
    return render(Breadcrumb, { props, slots: { default: () => itemNodes(children) } });
}

const nav = () => screen.getByRole('navigation');
const getItemWraps = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-item-wrap`)];
const getSeparatorTexts = () => [...document.querySelectorAll(`.${prefix}-separator`)].map((el) => el.textContent);
const typographyTexts = () => [...document.querySelectorAll('.semi-typography')].map((el) => el.textContent);
// the item element is the wrap's first element; Vue fragments add empty text anchors around children
const itemOf = (wrap: Element) => wrap.firstElementChild as HTMLElement;
const routesOf = (count: number) => 'abcdefghij'.slice(0, count).split('');
// the visible row: item texts, with the more button as 'more'
const visibleRow = () => [...nav().children].map((el) => (el.classList.contains(`${prefix}-collapse`) ? 'more' : el.querySelector('.semi-typography')?.textContent));

afterEach(() => {
    semiGlobal.config = {};
});

describe('Breadcrumb', () => {
    it('自定义 class 与 style', () => {
        render(Breadcrumb, {
            attrs: { class: 'test', style: { color: 'red' } },
            slots: { default: () => itemNodes(defaultChildren) },
        });
        const root = screen.getByRole('navigation', { name: zh_CN.Breadcrumb.label });
        expect(root).toHaveClass('test', `${prefix}-wrapper`);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('compact = false', () => {
        const view = getBr({ compact: false });
        expect(nav()).toHaveClass(`${prefix}-wrapper-loose`);
        expect(nav()).not.toHaveClass(`${prefix}-wrapper-compact`);
        view.unmount();
        getBr();
        expect(nav()).toHaveClass(`${prefix}-wrapper-compact`);
        expect(nav()).not.toHaveClass(`${prefix}-wrapper-loose`);
    });

    it('separator', () => {
        getBr({ separator: '>' });
        expect(getSeparatorTexts()).toEqual(['>', '>']);
    });

    it('maxItemCount', () => {
        getBr({ maxItemCount: 3 }, [
            [{}, 'semi'],
            [{}, 'design'],
            [{}, 'powered'],
            [{}, 'by'],
            [{}, 'douyin'],
        ]);
        expect(nav().children).toHaveLength(4);
        expect(typographyTexts()).toEqual(['semi', 'by', 'douyin']);
        expect(document.querySelector(`.${prefix}-collapse .semi-icon-more`)).not.toBeNull();
    });

    it('Item 的 #icon、href、noLink、separator', () => {
        const href = 'https://semi.design';
        render(Breadcrumb, {
            slots: {
                default: () => (
                    <>
                        <BreadcrumbItem separator="???">
                            {{
                                default: () => 'semi',
                                icon: () => <IconHome />,
                            }}
                        </BreadcrumbItem>
                        <BreadcrumbItem href={href}>
                            {{
                                default: () => 'design',
                                icon: () => <IconArticle />,
                            }}
                        </BreadcrumbItem>
                        <BreadcrumbItem href={undefined}>{{ default: () => 'system' }}</BreadcrumbItem>
                    </>
                ),
            },
        });
        expect(document.querySelector('.semi-icon-home')).not.toBeNull();
        expect(document.querySelector('.semi-icon-article')).not.toBeNull();
        const links = document.querySelectorAll(`.${prefix}-item-wrap a`);
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', href);
        // an Item's own separator is not wrapped in .semi-breadcrumb-separator
        const [first] = getItemWraps();
        expect(first.textContent).toBe('semi???');
        expect(first.querySelector(`.${prefix}-separator`)).toBeNull();
        expect(getSeparatorTexts()).toEqual(['/']);
    });

    it('onClick 与 Item 的 onClick 各调用一次，载荷为文字与同一个原生 MouseEvent', async () => {
        const onClick = vi.fn<Click>();
        const onItemClick = vi.fn<Click>();
        getBr({ onClick }, [
            [{ onClick: onItemClick }, 'semi'],
            [{}, 'design'],
        ]);
        await userEvent.click(screen.getByText('semi'));
        expect(onItemClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        const [info, event] = onClick.mock.calls[0];
        expect(info).toEqual({ name: 'semi' });
        expect(event).toBeInstanceOf(MouseEvent);
        expect(onItemClick.mock.calls[0][0]).toEqual({ name: 'semi' });
        expect(onItemClick.mock.calls[0][1]).toBe(event);

        await userEvent.click(screen.getByText('design'));
        expect(onItemClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[1][0]).toEqual({ name: 'design' });
    });

    it('routes：图标来自 #icon 插槽', () => {
        const routes: Route[] = [
            { path: '/', href: '/' },
            { path: '/breadcrumb', href: '/components/breadcrumb', name: 'breadcrumb' },
        ];
        const icon = vi.fn<(scope: BreadcrumbRouteSlotProps) => VNode | VNode[]>(({ route }) => (route.path === '/' ? <IconHome /> : route.path ? <IconArticle /> : []));
        render(Breadcrumb, { props: { routes: [...routes, 'string only'] }, slots: { icon } });
        // each call receives its own route's index; a string route arrives as { name }
        expect(new Set(icon.mock.calls.map(([{ route, index }]) => `${index}:${route.path ?? route.name}`))).toEqual(new Set(['0:/', '1:/breadcrumb', '2:string only']));
        const [first, second, third] = getItemWraps();
        expect(first.querySelector('.semi-icon-home')).not.toBeNull();
        expect(second.querySelector('.semi-icon-article')).not.toBeNull();
        expect(third.querySelector('.semi-icon')).toBeNull();
        expect(first.querySelector('a')).toHaveAttribute('href', '/');
        expect(second.querySelector('a')).toHaveAttribute('href', '/components/breadcrumb');
        expect(second.querySelector('.semi-typography')).toHaveTextContent(/^breadcrumb$/);
        expect(third.querySelector('.semi-typography')).toHaveTextContent(/^string only$/);
        // a route without a name renders no title
        expect(first.querySelector(`.${prefix}-item-title`)).toBeNull();
    });

    it('#item 插槽收到原始路由与下标', () => {
        const route = { path: 'path', href: 'href', name: 'test' };
        const item = vi.fn<(scope: BreadcrumbRouteSlotProps) => VNode[]>(({ route: r, index }) => [<div class="path">{r.path}</div>, <div class="href">{r.href}</div>, <div class="name">{`${r.name}-${index}`}</div>]);
        render(Breadcrumb, { props: { routes: [route] }, slots: { item } });
        const title = document.querySelector(`.${prefix}-item-title`) as HTMLElement;
        expect(title).toHaveClass(`${prefix}-item-title-inline`);
        expect(title.querySelector('.path')).toHaveTextContent(/^path$/);
        expect(title.querySelector('.href')).toHaveTextContent(/^href$/);
        expect(title.querySelector('.name')).toHaveTextContent(/^test-0$/);
        // the test renderer passes props through reactive(), so the route arrives as a proxy of the same object
        expect(toRaw(item.mock.calls[0][0].route)).toBe(route);
    });

    it('渲染带 aria-label 的导航地标，并将最后一项标记为当前项', () => {
        const view = getBr();
        expect(screen.getByRole('navigation', { name: zh_CN.Breadcrumb.label })).toBe(view.container.firstElementChild);
        const wraps = getItemWraps();
        expect(wraps.map((el) => el.getAttribute('aria-current'))).toEqual([null, null, 'page']);
        expect(itemOf(wraps[2])).toHaveClass(`${prefix}-item-active`);
        expect(getSeparatorTexts()).toEqual(['/', '/']);
    });

    it('activeIndex 选中当前项', () => {
        getBr({ activeIndex: 0 });
        const wraps = getItemWraps();
        expect(wraps.map((el) => el.getAttribute('aria-current'))).toEqual(['page', null, null]);
        expect(itemOf(wraps[0])).toHaveClass(`${prefix}-item-active`);
        expect(itemOf(wraps[2])).not.toHaveClass(`${prefix}-item-active`);
    });

    it('activeIndex 指向会被折叠的项时，当前项保持可见，折叠其后的项', async () => {
        getBr({ routes: routesOf(6), activeIndex: 2, moreType: 'popover' });
        const current = screen.getByText('c').closest(`.${prefix}-item-wrap`) as HTMLElement;
        expect(current).toHaveAttribute('aria-current', 'page');
        // a, b, c (current), more, f: the hidden items are d and e, the last item stays
        expect(typographyTexts()).toEqual(['a', 'b', 'c', 'f']);
        expect(nav().children[3]).toHaveClass(`${prefix}-collapse`);
        await userEvent.hover(document.querySelector(`.${prefix}-item-more .semi-icon-more`) as HTMLElement);
        const content = await screen.findByText('d', { selector: '.semi-popover-content *' }).then(() => document.querySelector('.semi-popover-content') as HTMLElement);
        expect([...content.querySelectorAll(`.${prefix}-item-wrap`)].map((el) => el.textContent)).toEqual(['d', 'e']);
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
        getBr({ routes: routesOf(n), maxItemCount, activeIndex });
        expect(visibleRow()).toEqual(row);
        expect(screen.getByText(routesOf(n)[activeIndex]).closest(`.${prefix}-item-wrap`)).toHaveAttribute('aria-current', 'page');
    });

    it('不改写使用方传入的 showTooltip 对象', () => {
        const showTooltip = { width: 80, opts: { mouseEnterDelay: 10 } };
        getBr({ showTooltip });
        expect(showTooltip).toEqual({ width: 80, opts: { mouseEnterDelay: 10 } });
        expect((document.querySelector('.semi-typography') as HTMLElement).style.maxWidth).toBe('80px');
    });

    it('除非是当前项，否则 href 渲染为 a 标签', () => {
        getBr({}, [
            [{ href: '/a' }, 'a'],
            [{ noLink: true }, 'b'],
            [{ href: '/c' }, 'c'],
        ]);
        const [a, b, c] = getItemWraps().map(itemOf);
        expect(a.tagName).toBe('A');
        expect(a).toHaveAttribute('href', '/a');
        expect(a).toHaveClass(`${prefix}-item-link`);
        expect(b.tagName).toBe('SPAN');
        expect(b).not.toHaveClass(`${prefix}-item-link`);
        // the active last item stays a span even with href
        expect(c.tagName).toBe('SPAN');
        expect(c).not.toHaveAttribute('href');
    });

    it('将 data-* 属性传给 nav 与 Item 外层包裹元素', () => {
        render(Breadcrumb, {
            attrs: { 'data-foo': 'bar', 'data-testid': 'root' },
            slots: { default: () => <BreadcrumbItem data-testid="item">{{ default: () => 'semi' }}</BreadcrumbItem> },
        });
        expect(screen.getByTestId('root').tagName).toBe('NAV');
        expect(screen.getByTestId('root')).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByTestId('item')).toHaveClass(`${prefix}-item-wrap`);
    });

    it('自定义 aria-label', () => {
        render(Breadcrumb, { attrs: { 'aria-label': 'Path' }, slots: { default: () => itemNodes(defaultChildren) } });
        expect(screen.getByRole('navigation', { name: 'Path' })).toBeInTheDocument();
    });

    it('Breadcrumb 与 Item 的 #separator 插槽，插槽优先于 separator prop', () => {
        render(Breadcrumb, {
            props: { separator: '>' },
            slots: {
                default: () => (
                    <>
                        <BreadcrumbItem>{{ default: () => 'a' }}</BreadcrumbItem>
                        <BreadcrumbItem separator="-">
                            {{
                                default: () => 'b',
                                separator: () => <i class="own">~</i>,
                            }}
                        </BreadcrumbItem>
                        <BreadcrumbItem>{{ default: () => 'c' }}</BreadcrumbItem>
                    </>
                ),
                separator: () => <b class="sep">|</b>,
            },
        });
        const wraps = getItemWraps();
        expect(wraps[0].querySelector(`.${prefix}-separator .sep`)).not.toBeNull();
        expect(wraps[0].textContent).toBe('a|');
        expect(wraps[1].querySelector('.own')).not.toBeNull();
        expect(wraps[1].textContent).toBe('b~');
        expect(wraps[1].querySelector(`.${prefix}-separator`)).toBeNull();
        expect(wraps[2].textContent).toBe('c');
    });

    it('routes：字符串路由，key 取自路由，onClick 传入原始路由', async () => {
        const onClick = vi.fn<Click>();
        const home = { path: '/', name: 'home', key: 'h' };
        getBr({ routes: [home, 'list', 'detail'], onClick });
        expect(getItemWraps()).toHaveLength(3);
        await userEvent.click(screen.getByText('home'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(toRaw(onClick.mock.calls[0][0])).toBe(home);
        expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
        await userEvent.click(screen.getByText('list'));
        expect(onClick.mock.calls[1][0]).toEqual({ name: 'list' });
    });

    it('onClick 第一参数为 BreadcrumbItemInfo 或路由，name 为字符串；Item 与 Breadcrumb 相同', () => {
        type ClickedItem = Parameters<Click>[0];
        expectTypeOf<ClickedItem>().toEqualTypeOf<BreadcrumbItemInfo | Route>();
        expectTypeOf<BreadcrumbItemInfo['name']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<Parameters<Click>[1]>().toEqualTypeOf<MouseEvent>();
        expectTypeOf<NonNullable<BreadcrumbItemProps['onClick']>>().toEqualTypeOf<Click>();
    });

    it('非组件的子节点原样渲染，且不收到注入的属性', () => {
        render(Breadcrumb, {
            slots: {
                // Breadcrumb inspects the direct slot array, so a fragment would hide the mixed children.
                default: () => [<BreadcrumbItem>{{ default: () => 'semi' }}</BreadcrumbItem>, <span class="plain">x</span>, 'plain'],
            },
        });
        expect(nav()).toHaveTextContent(/xplain$/);
        const span = document.querySelector('.plain') as HTMLElement;
        expect(span.getAttributeNames()).toEqual(['class']);
    });

    it('routes 优先于默认插槽', () => {
        render(Breadcrumb, {
            props: { routes: ['r1', 'r2'] },
            slots: { default: () => <BreadcrumbItem>{{ default: () => 'c1' }}</BreadcrumbItem> },
        });
        expect(getItemWraps().map((el) => itemOf(el).textContent)).toEqual(['r1', 'r2']);
    });

    it('空 routes 时回退为默认插槽', () => {
        getBr({ routes: [] });
        expect(getItemWraps()).toHaveLength(3);
    });

    it('routes 超过 maxItemCount 时折叠', () => {
        getBr({ routes: routesOf(6) });
        // default maxItemCount 4: first item, more, then the last 3
        expect(nav().children).toHaveLength(5);
        expect(nav().children[1]).toHaveClass(`${prefix}-collapse`);
        expect(typographyTexts()).toEqual(['a', 'd', 'e', 'f']);
    });

    it('点击 more 展开全部项', async () => {
        getBr({ routes: routesOf(6), maxItemCount: 2 });
        const more = screen.getByRole('button', { name: zh_CN.Breadcrumb.expand });
        expect(more).toHaveClass(`${prefix}-item-more`);
        expect(more.parentElement?.querySelector(`.${prefix}-separator`)).toHaveTextContent('/');
        await userEvent.click(more);
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getItemWraps()).toHaveLength(6);
    });

    it('在 more 上按 Enter 展开，其他键不展开', async () => {
        getBr({ routes: routesOf(6) });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('a');
        expect(document.querySelector(`.${prefix}-collapse`)).not.toBeNull();
        await userEvent.keyboard('{Enter}');
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getItemWraps()).toHaveLength(6);
    });

    it('用键盘展开后，焦点移到被折叠区间的第一个可聚焦项', async () => {
        getBr({ routes: routesOf(6).map((name) => ({ name, href: `#${name}` })) });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('{Enter}');
        await nextTick();
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });

    it('用键盘展开后，被折叠的项都不可聚焦时焦点落到 nav', async () => {
        getBr({ routes: routesOf(6) });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('{Enter}');
        await nextTick();
        expect(nav()).toHaveFocus();
    });

    it('在 more 上按 Space 展开', async () => {
        getBr({ routes: routesOf(6) });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard(' ');
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
    });

    it('autoCollapse = false 时显示全部项', () => {
        getBr({ routes: routesOf(6), autoCollapse: false });
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getItemWraps()).toHaveLength(6);
    });

    it('#more 收到被隐藏的项，可挂载，分隔符被去掉，点击其中的项仍调用 onClick', async () => {
        const onClick = vi.fn<Click>();
        const more = vi.fn<(scope: BreadcrumbMoreSlotProps) => VNode>(({ restItems }) => (
            <span class="custom-more">
                {String(restItems.length)}
                <span class="hidden">{restItems}</span>
            </span>
        ));
        render(Breadcrumb, { props: { routes: routesOf(5), maxItemCount: 3, onClick }, slots: { more } });
        const custom = document.querySelector(`.${prefix}-item-more .custom-more`) as HTMLElement;
        expect(custom).toHaveTextContent(/^2/);
        expect(document.querySelector(`.${prefix}-item-more .semi-icon-more`)).toBeNull();
        expect(more.mock.calls.at(-1)?.[0].restItems).toHaveLength(2);
        const hidden = custom.querySelectorAll(`.hidden > .${prefix}-item-wrap`);
        expect([...hidden].map((el) => el.textContent)).toEqual(['b', 'c']);
        expect(custom.querySelector(`.${prefix}-separator`)).toBeNull();
        await userEvent.click(screen.getByText('b'));
        expect(onClick).toHaveBeenCalledWith({ name: 'b' }, expect.any(MouseEvent));
    });

    it('moreType 为 popover 时在气泡中显示被隐藏的项', async () => {
        render(Breadcrumb, {
            props: { maxItemCount: 2, moreType: 'popover', separator: '>' },
            slots: {
                default: () =>
                    itemNodes([
                        [{}, 'one'],
                        [{}, 'two'],
                        [{}, 'three'],
                        [{}, 'four'],
                    ]),
            },
        });
        expect(nav().children).toHaveLength(3);
        await userEvent.hover(document.querySelector(`.${prefix}-item-more .semi-icon-more`) as HTMLElement);
        const content = await screen.findByText('two', { selector: '.semi-popover-content *' }).then(() => document.querySelector('.semi-popover-content') as HTMLElement);
        const hidden = content.querySelectorAll(`:scope > .${prefix}-item-wrap`);
        expect([...hidden].map((el) => el.textContent)).toEqual(['two', 'three']);
        // hidden items drop their own separator; the popover joins them with restItem separators
        expect([...content.querySelectorAll(`.${prefix}-restItem`)].map((el) => el.textContent)).toEqual(['>']);
    });

    it('moreType 为 popover 时，在气泡内按键或点击不会展开，也不会被吞掉', async () => {
        const onClick = vi.fn<Click>();
        render(Breadcrumb, {
            props: { maxItemCount: 2, moreType: 'popover', onClick },
            slots: {
                default: () => itemNodes(['one', 'two', 'three', 'four'].map((text): Child => [{ href: 'https://semi.design/' }, text])),
            },
        });
        await userEvent.hover(document.querySelector(`.${prefix}-item-more .semi-icon-more`) as HTMLElement);
        const link = (await screen.findByText('two', { selector: '.semi-popover-content *' })).closest('a') as HTMLElement;
        // dispatchEvent returns false when a handler called preventDefault
        expect(link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))).toBe(true);
        link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        link.addEventListener('click', (e) => e.preventDefault());
        await userEvent.click(link);
        await nextTick();
        expect(onClick).toHaveBeenCalledWith({ name: 'two', href: 'https://semi.design/' }, expect.any(MouseEvent));
        expect(document.querySelector(`.${prefix}-collapse`)).not.toBeNull();
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard(' ');
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
    });

    it('showTooltip 设置截断宽度', () => {
        const width = () => (document.querySelector('.semi-typography') as HTMLElement).style.maxWidth;
        const view = getBr();
        expect(width()).toBe('150px');
        view.unmount();
        const view2 = getBr({ showTooltip: { width: 80, ellipsisPos: 'middle' } });
        expect(width()).toBe('80px');
        view2.unmount();
        const view3 = getBr({ showTooltip: { width: '6em' } });
        expect(width()).toBe('6em');
        view3.unmount();
        getBr({ showTooltip: false });
        expect(width()).toBe('150px');
    });

    it('compact 设置图标尺寸', () => {
        const slots = {
            default: () => (
                <BreadcrumbItem>
                    {{
                        default: () => 'semi',
                        icon: () => <IconHome />,
                    }}
                </BreadcrumbItem>
            ),
        };
        const view = render(Breadcrumb, { slots });
        const icon = () => document.querySelector('.semi-icon-home');
        expect(icon()).toHaveClass('semi-icon-small', `${prefix}-item-icon`);
        view.unmount();
        render(Breadcrumb, { props: { compact: false }, slots });
        expect(icon()).toHaveClass('semi-icon-default');
    });

    it('onClick 为 null 时纯文本项不是 link', () => {
        getBr({ onClick: null as unknown as Click }, [
            [{ onClick: null as unknown as Click }, 'semi'],
            [{}, 'design'],
        ]);
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('图标自带的 size 优先于 compact', () => {
        render(Breadcrumb, {
            slots: {
                default: () => (
                    <BreadcrumbItem>
                        {{
                            default: () => 'semi',
                            icon: () => <IconHome size="large" />,
                        }}
                    </BreadcrumbItem>
                ),
            },
        });
        expect(document.querySelector('.semi-icon-home')).toHaveClass('semi-icon-large');
    });

    it('图标插槽保留自带的 class', () => {
        render(BreadcrumbItem, { slots: { default: () => 'semi', icon: () => <IconHome class="mine" /> } });
        expect(document.querySelector('.semi-icon-home')).toHaveClass('mine', `${prefix}-item-icon`);
    });

    it('图标插槽中的原生元素只加 class，不加 size', () => {
        render(BreadcrumbItem, { slots: { default: () => 'semi', icon: () => <img alt="" /> } });
        const img = document.querySelector('img') as HTMLElement;
        expect(img).toHaveClass(`${prefix}-item-icon`);
        expect(img).not.toHaveAttribute('size');
    });

    it('非文字内容原样内联渲染', () => {
        render(Breadcrumb, {
            slots: {
                default: () => (
                    <BreadcrumbItem>
                        {{
                            default: () => <b>bold</b>,
                        }}
                    </BreadcrumbItem>
                ),
            },
        });
        expect(document.querySelector(`.${prefix}-item-title-inline b`)).toHaveTextContent('bold');
        expect(document.querySelector('.semi-typography')).toBeNull();
    });

    it('数字内容（含 0）按文字渲染并截断', () => {
        getBr({}, [
            [{}, 0],
            [{}, 12],
        ]);
        expect(typographyTexts()).toEqual(['0', '12']);
    });

    it('Breadcrumb.Item 即 BreadcrumbItem，并以 elementType 识别', () => {
        expect(Breadcrumb.Item).toBe(BreadcrumbItem);
        expect(elementType(<BreadcrumbItem />)).toBe('Breadcrumb.Item');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式 prop 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Breadcrumb: { separator: '>', maxItemCount: 2 } };
        const view = getBr({ routes: routesOf(4) });
        expect(nav().children).toHaveLength(3);
        expect(getSeparatorTexts()).toEqual(['>', '>']);
        view.unmount();
        getBr({ routes: routesOf(4), separator: '|', maxItemCount: 5 });
        expect(document.querySelector(`.${prefix}-collapse`)).toBeNull();
        expect(getSeparatorTexts()).toEqual(['|', '|', '|']);
    });

    it('app 注入的全局配置优先于模块配置', () => {
        semiGlobal.config.overrideDefaultProps = { Breadcrumb: { separator: '>' } };
        render(Breadcrumb, {
            props: { routes: routesOf(2) },
            global: {
                provide: {
                    [semiGlobalKey as symbol]: { config: { overrideDefaultProps: { Breadcrumb: { separator: '~' } } } },
                },
            },
        });
        expect(getSeparatorTexts()).toEqual(['~']);
    });

    it('ref 的 $el 指向 nav 与 Item 外层包裹元素', () => {
        const ready = vi.fn<(nav: Element, item: Element) => void>();
        render(Refs, { attrs: { onReady: ready } });
        expect(ready).toHaveBeenCalledWith(document.querySelector('nav'), document.querySelector(`.${prefix}-item-wrap`));
    });

    it('将未声明的属性传给 nav 与 Item 外层包裹元素，@click 不是 nav 的原生监听', async () => {
        const onClick = vi.fn<Click>();
        render(Breadcrumb, {
            props: { onClick },
            attrs: { id: 'bc', title: 'path' },
            slots: {
                default: () => (
                    <BreadcrumbItem id="it" class="mine" style={{ color: 'red' }}>
                        {{ default: () => 'semi' }}
                    </BreadcrumbItem>
                ),
            },
        });
        expect(nav()).toHaveAttribute('id', 'bc');
        expect(nav()).toHaveAttribute('title', 'path');
        const item = document.getElementById('it') as HTMLElement;
        expect(item).toHaveClass(`${prefix}-item-wrap`, 'mine');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await userEvent.click(nav());
        expect(onClick).not.toHaveBeenCalled();
    });

    it('routes 中非 Item 属性的字段不会进入 DOM', () => {
        getBr({ routes: [{ name: 'a', path: '/a', meta: 'x', 'data-id': 'r' }, 'b'] });
        const wrap = getItemWraps()[0];
        expect(wrap).toHaveAttribute('data-id', 'r');
        expect(wrap).not.toHaveAttribute('path');
        expect(wrap).not.toHaveAttribute('name');
        expect(wrap).not.toHaveAttribute('meta');
    });

    it('单独使用的 Breadcrumb.Item 可点击，有 href 时载荷含 href', async () => {
        const onClick = vi.fn<Click>();
        const view = render(BreadcrumbItem, { props: { onClick }, slots: { default: () => 'alone' } });
        await userEvent.click(screen.getByText('alone'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toEqual({ name: 'alone' });
        await view.rerender({ onClick, href: '#here' });
        await userEvent.click(screen.getByText('alone'));
        expect(onClick.mock.calls[1][0]).toEqual({ name: 'alone', href: '#here' });
    });

    it('无 href 且有点击处理的项可用键盘聚焦，Enter 以 MouseEvent 触发 onClick', async () => {
        const onClick = vi.fn<Click>();
        getBr({ onClick });
        // the last item is the current page, not a link
        const links = screen.getAllByRole('link');
        expect(links.map((link) => link.textContent)).toEqual(['semi', 'design']);
        await userEvent.tab();
        expect(links[0]).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toEqual({ name: 'semi' });
        expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
    });

    it('没有点击处理的项不是 Tab 停靠点', () => {
        getBr();
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('单独使用的带 onClick 的 Item 可用 Enter 触发', async () => {
        const onClick = vi.fn<Click>();
        render(BreadcrumbItem, { props: { onClick }, slots: { default: () => 'alone' } });
        await userEvent.tab();
        expect(screen.getByRole('link', { name: 'alone' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('maxItemCount 小于 2 时仍显示最后一项', () => {
        getBr({ maxItemCount: 1 });
        expect(screen.getByText('byde').closest(`.${prefix}-item-wrap`)).toHaveAttribute('aria-current', 'page');
    });

    it('每次点击只调用一次 onClick，点击 more 只展开一次', async () => {
        const onClick = vi.fn<Click>();
        getBr({ routes: routesOf(5), onClick });
        await userEvent.click(screen.getByText('a'));
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }));
        expect(getItemWraps()).toHaveLength(5);
    });

    it('带 key 的子项重排时，子组件状态随 key 移动', async () => {
        const view = render(Keyed, { props: { order: ['a', 'b', 'c'] } });
        await userEvent.click(screen.getByRole('button', { name: 'a:0' }));
        await view.rerender({ order: ['c', 'a', 'b'] });
        const states = Object.fromEntries(screen.getAllByRole('button').map((button) => [button.textContent?.split(':')[0], button.textContent]));
        expect(states).toEqual({ a: 'a:1', b: 'b:0', c: 'c:0' });
        // the current page follows the position
        expect(screen.getByRole('button', { name: 'b:0' }).closest(`.${prefix}-item-wrap`)).toHaveAttribute('aria-current', 'page');
    });

    it('展开折叠项后，尾部项内的组件状态保留', async () => {
        render(Keyed, { props: { order: ['a', 'b', 'c', 'd', 'e'], maxItemCount: 2 } });
        await userEvent.click(screen.getByRole('button', { name: 'e:0' }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }));
        expect(getItemWraps()).toHaveLength(5);
        expect(screen.getByRole('button', { name: 'e:1' })).toBeInTheDocument();
    });
});
