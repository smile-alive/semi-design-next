import { For, createSignal, type JSX } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconArticle, IconHome } from '@fibrae/semi-icons-solid';
import Breadcrumb, { type BreadcrumbItemInfo, type BreadcrumbItemProps, type BreadcrumbProps, type RouteProps } from '..';
import semiGlobal from '../../_utils/semi-global';

type RouteClick = NonNullable<BreadcrumbProps['onClick']>;
type BrProps = Omit<BreadcrumbProps, 'ref' | 'children'> & { children?: BreadcrumbItemProps[] };

function getBr({ children, ...props }: BrProps = {}) {
    const items = children ?? [{ children: 'semi' }, { children: 'design' }, { children: 'byde' }];
    return render(() => (
        <Breadcrumb {...props}>
            <For each={items}>{(item) => <Breadcrumb.Item {...item} />}</For>
        </Breadcrumb>
    ));
}

const getItemWraps = (container: HTMLElement) => container.querySelectorAll('.semi-breadcrumb-item-wrap');
const getSeparatorTexts = (container: HTMLElement) => Array.from(container.querySelectorAll('.semi-breadcrumb-separator')).map((el) => el.textContent);
const navOf = (container: HTMLElement) => container.querySelector('.semi-breadcrumb-wrapper') as HTMLElement;

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Breadcrumb', () => {
    it('Fragment 里的 Item 参与当前项与分隔符的计算', () => {
        const { container } = render(() => (
            <Breadcrumb>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <>
                    <Breadcrumb.Item>b</Breadcrumb.Item>
                    <Breadcrumb.Item>c</Breadcrumb.Item>
                </>
            </Breadcrumb>
        ));
        const wraps = getItemWraps(container);
        expect(wraps).toHaveLength(3);
        expect(wraps[2]).toHaveAttribute('aria-current', 'page');
        expect(wraps[1]).not.toHaveAttribute('aria-current');
        expect(getSeparatorTexts(container)).toHaveLength(2);
    });

    it('onClick 显式为 null 时，无 href 的项不是键盘链接，点击不抛错', async () => {
        render(() => (
            <Breadcrumb onClick={null as never}>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <Breadcrumb.Item onClick={null as never}>b</Breadcrumb.Item>
                <Breadcrumb.Item>c</Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(screen.queryByRole('link')).toBeNull();
        await userEvent.click(screen.getByText('a'));
    });

    it('自定义 class 与 style', () => {
        getBr({ class: 'test', style: { color: 'red' } });
        const nav = screen.getByRole('navigation', { name: zh_CN.Breadcrumb.label });
        expect(nav).toHaveClass('test');
        expect(nav).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('compact = false', () => {
        const { container, unmount } = getBr({ compact: false });
        expect(container.querySelector('.semi-breadcrumb-wrapper-loose')).not.toBeNull();
        expect(container.querySelector('.semi-breadcrumb-wrapper-compact')).toBeNull();
        unmount();
        const { container: container2 } = getBr();
        expect(container2.querySelector('.semi-breadcrumb-wrapper-compact')).not.toBeNull();
        expect(container2.querySelector('.semi-breadcrumb-wrapper-loose')).toBeNull();
    });

    it('separator', () => {
        const { container } = getBr({ separator: '>' });
        expect(getSeparatorTexts(container)).toEqual(['>', '>']);
    });

    it('maxItemCount', () => {
        const { container } = getBr({ maxItemCount: 3, children: [{ children: 'semi' }, { children: 'design' }, { children: 'powered' }, { children: 'by' }, { children: 'douyin' }] });
        expect(navOf(container).children).toHaveLength(4); // semi/.../by/douyin
        const texts = Array.from(container.querySelectorAll('.semi-breadcrumb-item-wrap .semi-typography')).map((el) => el.textContent);
        expect(texts).toEqual(['semi', 'by', 'douyin']);
        expect(container.querySelector('.semi-breadcrumb-collapse .semi-icon-more')).not.toBeNull();
    });

    it('Item 的 icon、href、noLink、separator', () => {
        const href = 'https://semi.design';
        const { container } = getBr({
            children: [
                { icon: <IconHome />, separator: '???', children: 'semi' },
                { icon: <IconArticle />, children: 'design', href },
                { children: 'system', href: undefined },
            ],
        });
        expect(container.querySelector('.semi-icon-home')).not.toBeNull();
        expect(container.querySelector('.semi-icon-article')).not.toBeNull();
        const links = container.querySelectorAll('.semi-breadcrumb-item-wrap a');
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', href);
        expect(getItemWraps(container)[0].childNodes[1].textContent).toEqual('???');
        expect(getSeparatorTexts(container)).toEqual(['/']);
    });

    it('onClick 与 item.onClick', async () => {
        const spyClick = vi.fn<RouteClick>();
        const spyItemClick = vi.fn<NonNullable<BreadcrumbItemProps['onClick']>>();
        getBr({ onClick: spyClick, children: [{ onClick: spyItemClick, children: 'semi' }, { children: 'design' }] });
        await userEvent.click(screen.getByText('semi'));
        expect(spyItemClick).toHaveBeenCalledTimes(1);
        expect(spyClick).toHaveBeenCalledTimes(1);

        const firstArgs = spyClick.mock.calls[0];
        expect(firstArgs).toHaveLength(2);
        expect(firstArgs[0]).toMatchObject({ name: 'semi' });
        expect(firstArgs[1]).toBeInstanceOf(MouseEvent);

        const itemArgs = spyItemClick.mock.calls[0];
        expect(itemArgs).toHaveLength(2);
        expect(itemArgs[0]).toMatchObject({ name: 'semi' });
        expect(itemArgs[1]).toBe(firstArgs[1]);

        await userEvent.click(screen.getByText('design'));
        expect(spyItemClick).toHaveBeenCalledTimes(1);
        expect(spyClick).toHaveBeenCalledTimes(2);
        expect(spyClick.mock.calls[1][0]).toMatchObject({ name: 'design' });
    });

    it('routes', () => {
        const { container } = getBr({
            routes: [{ path: '/', href: '/' }, { path: '/breadcrumb', href: '/components/breadcrumb', name: 'breadcrumb' }, 'string only'],
            renderIcon: (route) => (route.path === '/' ? <IconHome /> : route.path === '/breadcrumb' ? <IconArticle /> : undefined),
        });
        const [firstItem, secondItem, thirdItem] = getItemWraps(container);
        expect(firstItem.querySelector('.semi-icon-home')).not.toBeNull();
        expect(secondItem.querySelector('.semi-icon-article')).not.toBeNull();

        expect(firstItem.querySelector('a')).toHaveAttribute('href', '/');
        expect(secondItem.querySelector('a')).toHaveAttribute('href', '/components/breadcrumb');

        expect(secondItem.querySelector('.semi-typography')).toHaveTextContent(/^breadcrumb$/);
        expect(thirdItem.querySelector('.semi-typography')).toHaveTextContent(/^string only$/);
    });

    it('renderItem', () => {
        const { container } = getBr({
            routes: [{ path: 'path', href: 'href', name: 'test' }],
            renderItem: (route) => (
                <>
                    <div class="path">{route.path}</div>
                    <div class="href">{route.href}</div>
                    <div class="name">{route.name}</div>
                </>
            ),
        });
        const item = container.querySelector('.semi-breadcrumb-item-title') as HTMLElement;
        expect(item.querySelector('.path')).toHaveTextContent(/^path$/);
        expect(item.querySelector('.href')).toHaveTextContent(/^href$/);
        expect(item.querySelector('.name')).toHaveTextContent(/^test$/);
    });

    it('渲染带 aria-label 的导航地标，并将最后一项标记为当前项', () => {
        const { container } = getBr();
        expect(screen.getByRole('navigation', { name: zh_CN.Breadcrumb.label })).toBe(container.firstElementChild);
        const wraps = getItemWraps(container);
        expect([...wraps].map((el) => el.getAttribute('aria-current'))).toEqual([null, null, 'page']);
        expect(wraps[2].firstElementChild).toHaveClass('semi-breadcrumb-item-active');
        expect(getSeparatorTexts(container)).toEqual(['/', '/']);
    });

    it('activeIndex 选中当前项', () => {
        const { container } = getBr({ activeIndex: 0 });
        const wraps = getItemWraps(container);
        expect([...wraps].map((el) => el.getAttribute('aria-current'))).toEqual(['page', null, null]);
        expect(wraps[0].firstElementChild).toHaveClass('semi-breadcrumb-item-active');
        expect(wraps[2].firstElementChild).not.toHaveClass('semi-breadcrumb-item-active');
    });

    it('除非是当前项，否则 href 渲染为 a 标签', () => {
        const { container } = getBr({
            children: [
                { children: 'a', href: '/a' },
                { children: 'b', noLink: true },
                { children: 'c', href: '/c' },
            ],
        });
        const [a, b, c] = [...getItemWraps(container)].map((el) => el.firstElementChild as HTMLElement);
        expect(a.tagName).toBe('A');
        expect(a).toHaveAttribute('href', '/a');
        expect(a).toHaveClass('semi-breadcrumb-item-link');
        expect(b.tagName).toBe('SPAN');
        expect(b).not.toHaveClass('semi-breadcrumb-item-link');
        expect(c.tagName).toBe('SPAN');
    });

    it('将 data-* 属性传给 nav 与 Item 外层包裹元素', () => {
        render(() => (
            <Breadcrumb data-foo="bar" data-testid="root">
                <Breadcrumb.Item data-testid="item">semi</Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(screen.getByTestId('root').tagName).toBe('NAV');
        expect(screen.getByTestId('root')).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByTestId('item')).toHaveClass('semi-breadcrumb-item-wrap');
    });

    it('自定义 aria-label', () => {
        getBr({ 'aria-label': 'Path' });
        expect(screen.getByRole('navigation', { name: 'Path' })).toBeInTheDocument();
    });

    it('JSX 形式的 separator 与 Item 的 separator', () => {
        const { container } = render(() => (
            <Breadcrumb separator={<b class="sep">|</b>}>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <Breadcrumb.Item separator={<i class="own">~</i>}>b</Breadcrumb.Item>
                <Breadcrumb.Item>c</Breadcrumb.Item>
            </Breadcrumb>
        ));
        const wraps = getItemWraps(container);
        expect(wraps[0].querySelector('.semi-breadcrumb-separator .sep')).not.toBeNull();
        expect(wraps[1].querySelector('.own')).not.toBeNull();
        expect(wraps[1].querySelector('.semi-breadcrumb-separator')).toBeNull();
        expect(wraps[2].children).toHaveLength(1);
    });

    it('routes：字符串路由，onClick 传入原始路由', async () => {
        const onClick = vi.fn<RouteClick>();
        const home = { path: '/', name: 'home', key: 'h' };
        const { container } = getBr({ routes: [home, 'list', 'detail'], onClick });
        expect(getItemWraps(container)).toHaveLength(3);
        await userEvent.click(screen.getByText('home'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe(home);
        expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
        await userEvent.click(screen.getByText('list'));
        expect(onClick.mock.calls[1][0]).toEqual({ name: 'list' });
    });

    it('onClick 收到 children 写法的 BreadcrumbItemInfo 或路由，name 为 JSX.Element', () => {
        type ClickedItem = Parameters<RouteClick>[0];
        expectTypeOf<ClickedItem>().toEqualTypeOf<BreadcrumbItemInfo | RouteProps>();
        expectTypeOf<ClickedItem['name']>().toEqualTypeOf<JSX.Element | string | undefined>();
        expectTypeOf<Parameters<NonNullable<BreadcrumbItemProps['onClick']>>[0]>().toEqualTypeOf<ClickedItem>();
    });

    it('字符串子节点原样渲染', () => {
        render(() => (
            <Breadcrumb>
                <Breadcrumb.Item>semi</Breadcrumb.Item>
                plain
            </Breadcrumb>
        ));
        expect(screen.getByRole('navigation')).toHaveTextContent(/plain$/);
    });

    it('routes 优先于 children', () => {
        const { container } = render(() => (
            <Breadcrumb routes={['r1', 'r2']}>
                <Breadcrumb.Item>c1</Breadcrumb.Item>
            </Breadcrumb>
        ));
        const texts = [...getItemWraps(container)].map((el) => el.firstElementChild?.textContent);
        expect(texts).toEqual(['r1', 'r2']);
    });

    it('空 routes 时回退为 children', () => {
        const { container } = getBr({ routes: [] });
        expect(getItemWraps(container)).toHaveLength(3);
    });

    it('routes 超过 maxItemCount 时折叠', () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        const nav = navOf(container);
        expect(nav.children).toHaveLength(5);
        expect(nav.children[1]).toHaveClass('semi-breadcrumb-collapse');
        const texts = [...nav.querySelectorAll('.semi-typography')].map((el) => el.textContent);
        expect(texts).toEqual(['a', 'd', 'e', 'f']);
    });

    it('点击 more 展开全部项', async () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'], maxItemCount: 2 });
        const more = screen.getByRole('button', { name: zh_CN.Breadcrumb.expand });
        expect(more).toHaveClass('semi-breadcrumb-item-more');
        expect(more.parentElement?.querySelector('.semi-breadcrumb-separator')).toHaveTextContent('/');
        await userEvent.click(more);
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
        expect(getItemWraps(container)).toHaveLength(6);
    });

    it('在 more 上按 Enter 展开，其他键不展开', async () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('a');
        expect(container.querySelector('.semi-breadcrumb-collapse')).not.toBeNull();
        await userEvent.keyboard('{Enter}');
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
        expect(getItemWraps(container)).toHaveLength(6);
    });

    it('用键盘展开后，焦点移到被折叠区间的第一个可聚焦项', async () => {
        const routes = ['a', 'b', 'c', 'd', 'e', 'f'].map((name) => ({ name, href: `#${name}` }));
        getBr({ routes });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('link', { name: 'b' })).toHaveFocus());
    });

    it('用键盘展开后，被折叠的项都不可聚焦时焦点落到 nav', async () => {
        getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('navigation')).toHaveFocus());
    });

    it('在 more 上按 Space 展开', async () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard(' ');
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
    });

    it('autoCollapse = false 时显示全部项', () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'], autoCollapse: false });
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
        expect(getItemWraps(container)).toHaveLength(6);
    });

    it('renderMore 接收被隐藏的路由数据', () => {
        const renderMore = vi.fn<NonNullable<BreadcrumbProps['renderMore']>>((rest) => <span class="custom-more">{rest.map((item) => (item as RouteProps).name).join(',')}</span>);
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e'], maxItemCount: 3, renderMore });
        expect(container.querySelector('.semi-breadcrumb-item-more .custom-more')).toHaveTextContent('b,c');
        expect(container.querySelector('.semi-breadcrumb-item-more .semi-icon-more')).toBeNull();
        expect(renderMore.mock.calls.at(-1)?.[0]).toEqual([{ name: 'b' }, { name: 'c' }]);
    });

    it('children 写法下 renderMore 接收被隐藏的 Item 的 props', () => {
        const renderMore = (rest: Array<RouteProps | BreadcrumbItemProps>) => (
            <span class="custom-more">
                <For each={rest}>{(item) => <i>{(item as BreadcrumbItemProps).children}</i>}</For>
            </span>
        );
        const { container } = render(() => (
            <Breadcrumb maxItemCount={3} renderMore={renderMore}>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <Breadcrumb.Item>b</Breadcrumb.Item>
                <Breadcrumb.Item>c</Breadcrumb.Item>
                <Breadcrumb.Item>d</Breadcrumb.Item>
                <Breadcrumb.Item>e</Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect([...container.querySelectorAll('.custom-more i')].map((el) => el.textContent)).toEqual(['b', 'c']);
    });

    it('被隐藏的项变化时 renderMore 收到新的项', () => {
        const [routes, setRoutes] = createSignal(['a', 'b', 'c', 'd', 'e']);
        const { container } = render(() => <Breadcrumb maxItemCount={3} renderMore={(rest) => <span class="custom-more">{rest.length}</span>} routes={routes()} />);
        expect(container.querySelector('.custom-more')).toHaveTextContent('2');
        setRoutes(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        expect(container.querySelector('.custom-more')).toHaveTextContent('4');
    });

    it('展开信号对象时，无关属性变化不重建项', () => {
        const routes = ['a', 'b'];
        const renderItem = (route: RouteProps) => <b>{route.name}</b>;
        const [props, setProps] = createSignal<BreadcrumbProps>({ routes, renderItem, 'aria-label': '甲' });
        render(() => <Breadcrumb {...props()} />);
        const title = screen.getByText('a');
        setProps({ routes, renderItem, 'aria-label': '乙' });
        expect(screen.getByRole('navigation')).toHaveAccessibleName('乙');
        expect(screen.getByText('a')).toBe(title);
    });

    it('moreType 为 popover 时在气泡中显示被隐藏的项', async () => {
        const { container } = render(() => (
            <Breadcrumb maxItemCount={2} moreType="popover" separator=">">
                <Breadcrumb.Item>one</Breadcrumb.Item>
                <Breadcrumb.Item>two</Breadcrumb.Item>
                <Breadcrumb.Item>three</Breadcrumb.Item>
                <Breadcrumb.Item>four</Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(navOf(container).children).toHaveLength(3);
        await userEvent.hover(container.querySelector('.semi-breadcrumb-item-more .semi-icon-more') as Element);
        const content = await waitFor(() => {
            const popup = document.querySelector('.semi-popover-content');
            expect(popup).not.toBeNull();
            return popup as HTMLElement;
        });
        const hidden = content.querySelectorAll(':scope > .semi-breadcrumb-item-wrap');
        expect([...hidden].map((el) => el.textContent)).toEqual(['two', 'three']);
        expect([...content.querySelectorAll('.semi-breadcrumb-restItem')].map((el) => el.textContent)).toEqual(['>']);
    });

    it('moreType 为 popover 时，在气泡内按键不会展开，也不会被吞掉', async () => {
        const { container } = render(() => (
            <Breadcrumb maxItemCount={2} moreType="popover">
                <Breadcrumb.Item href="https://semi.design/">one</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">two</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">three</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">four</Breadcrumb.Item>
            </Breadcrumb>
        ));
        await userEvent.hover(container.querySelector('.semi-breadcrumb-item-more .semi-icon-more') as Element);
        const link = await screen.findByText('two', { selector: '.semi-popover-content a *, .semi-popover-content a' });
        expect(fireEvent.keyDown(link, { key: ' ' })).toBe(true);
        fireEvent.keyDown(link, { key: 'Enter' });
        expect(container.querySelector('.semi-breadcrumb-collapse')).not.toBeNull();
        fireEvent.keyDown(screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }), { key: ' ' });
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
    });

    it('showTooltip 设置截断宽度与 tooltip', () => {
        const width = (container: HTMLElement) => (container.querySelector('.semi-typography') as HTMLElement).style.maxWidth;
        const { container, unmount } = getBr();
        expect(width(container)).toBe('150px');
        unmount();
        const { container: c2, unmount: u2 } = getBr({ showTooltip: { width: 80, ellipsisPos: 'middle' } });
        expect(width(c2)).toBe('80px');
        u2();
        const { container: c3 } = getBr({ showTooltip: false });
        expect(width(c3)).toBe('150px');
    });

    it('compact 设置图标尺寸', () => {
        const { container, unmount } = getBr({ children: [{ icon: <IconHome />, children: 'semi' }] });
        expect(container.querySelector('.semi-icon-home')).toHaveClass('semi-icon-small', 'semi-breadcrumb-item-icon');
        unmount();
        const { container: c2 } = getBr({ compact: false, children: [{ icon: <IconHome />, children: 'semi' }] });
        expect(c2.querySelector('.semi-icon-home')).toHaveClass('semi-icon-default');
    });

    it('compact 切换时图标尺寸随之更新', () => {
        const [compact, setCompact] = createSignal(true);
        const { container } = render(() => (
            <Breadcrumb compact={compact()}>
                <Breadcrumb.Item icon={<IconHome />}>semi</Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(container.querySelector('.semi-icon-home')).toHaveClass('semi-icon-small');
        setCompact(false);
        expect(container.querySelector('.semi-icon-home')).toHaveClass('semi-icon-default');
        expect(container.querySelector('.semi-icon-home')).not.toHaveClass('semi-icon-small');
    });

    it('icon 保留自带的 class；非 Semi 图标的元素只加 class，不加 size', () => {
        const { container } = getBr({
            children: [
                { icon: <IconHome class="mine" />, children: 'semi' },
                { icon: <i class="custom" data-testid="plain" />, children: 'design' },
            ],
        });
        expect(container.querySelector('.semi-icon-home')).toHaveClass('mine', 'semi-breadcrumb-item-icon', 'semi-icon-small');
        const plain = screen.getByTestId('plain');
        expect(plain).toHaveClass('custom', 'semi-breadcrumb-item-icon');
        expect(plain).not.toHaveAttribute('size');
    });

    it('Semi 图标自带 size 时保持不变', () => {
        const { container } = getBr({ children: [{ icon: <IconHome size="large" />, children: 'semi' }] });
        expect(container.querySelector('.semi-icon-home')).toHaveClass('semi-icon-large');
        expect(container.querySelector('.semi-icon-home')).not.toHaveClass('semi-icon-small');
    });

    it('非字符串 children 原样内联渲染', () => {
        const { container } = render(() => (
            <Breadcrumb>
                <Breadcrumb.Item>
                    <b>bold</b>
                </Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(container.querySelector('.semi-breadcrumb-item-title-inline b')).toHaveTextContent('bold');
        expect(container.querySelector('.semi-typography')).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Breadcrumb: { separator: '>', maxItemCount: 2 } };
        const { container, unmount } = getBr({ routes: ['a', 'b', 'c', 'd'] });
        expect(navOf(container).children).toHaveLength(3);
        expect(getSeparatorTexts(container)).toEqual(['>', '>']);
        unmount();
        const { container: c2 } = getBr({ routes: ['a', 'b', 'c', 'd'], separator: '|', maxItemCount: 5 });
        expect(c2.querySelector('.semi-breadcrumb-collapse')).toBeNull();
        expect(getSeparatorTexts(c2)).toEqual(['|', '|', '|']);
    });

    it('ref 指向 nav 与 Item 外层包裹元素', () => {
        let navRef: HTMLElement | undefined;
        let itemRef: HTMLSpanElement | undefined;
        const { container } = render(() => (
            <Breadcrumb ref={(el) => (navRef = el)}>
                <Breadcrumb.Item ref={(el) => (itemRef = el)}>semi</Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(navRef).toBe(container.querySelector('nav'));
        expect(itemRef).toBe(container.querySelector('.semi-breadcrumb-item-wrap'));
    });

    it('将未声明的属性传给 nav 与 Item 外层包裹元素', () => {
        render(() => (
            <Breadcrumb id="bc" title="path">
                <Breadcrumb.Item id="it" class="mine" style={{ color: 'red' }}>
                    semi
                </Breadcrumb.Item>
            </Breadcrumb>
        ));
        expect(screen.getByRole('navigation')).toHaveAttribute('id', 'bc');
        expect(screen.getByRole('navigation')).toHaveAttribute('title', 'path');
        const item = document.getElementById('it');
        expect(item).toHaveClass('semi-breadcrumb-item-wrap', 'mine');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('routes 中非 Item 属性的字段不会进入 DOM', () => {
        const { container } = getBr({ routes: [{ name: 'a', path: '/a', meta: 'x', 'data-id': 'r' }, 'b'] });
        const wrap = getItemWraps(container)[0];
        expect(wrap).toHaveAttribute('data-id', 'r');
        expect(wrap).not.toHaveAttribute('path');
        expect(wrap).not.toHaveAttribute('name');
        expect(wrap).not.toHaveAttribute('meta');
    });

    it('无 href 且有点击处理的项可用键盘聚焦并按 Enter 触发 onClick', async () => {
        const onClick = vi.fn<RouteClick>();
        getBr({ onClick });
        const links = screen.getAllByRole('link');
        expect(links.map((link) => link.textContent)).toEqual(['semi', 'design']);
        await userEvent.tab();
        expect(links[0]).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toMatchObject({ name: 'semi' });
    });

    it('没有点击处理的项不是 Tab 停靠点', () => {
        getBr();
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('maxItemCount 小于 2 时仍显示最后一项', () => {
        getBr({ maxItemCount: 1, children: [{ children: 'semi' }, { children: 'design' }, { children: 'byde' }] });
        expect(screen.getByText('byde').closest('.semi-breadcrumb-item-wrap')).toHaveAttribute('aria-current', 'page');
    });

    it('带 key 的子项重排时，子组件状态随项移动', async () => {
        function Counter(props: { id: string }) {
            const [count, setCount] = createSignal(0);
            return (
                <button type="button" onClick={() => setCount(count() + 1)}>
                    {props.id}:{count()}
                </button>
            );
        }
        const [order, setOrder] = createSignal(['a', 'b', 'c']);
        render(() => (
            <Breadcrumb>
                <For each={order()}>
                    {(id) => (
                        <Breadcrumb.Item>
                            <Counter id={id} />
                        </Breadcrumb.Item>
                    )}
                </For>
            </Breadcrumb>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'a:0' }));
        setOrder(['c', 'a', 'b']);
        expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(['c:0', 'a:1', 'b:0']);
    });

    it('动态增加的项重新计算当前项与分隔符', () => {
        const [names, setNames] = createSignal(['a', 'b']);
        const { container } = render(() => (
            <Breadcrumb>
                <For each={names()}>{(name) => <Breadcrumb.Item>{name}</Breadcrumb.Item>}</For>
            </Breadcrumb>
        ));
        expect(getSeparatorTexts(container)).toHaveLength(1);
        setNames(['a', 'b', 'c']);
        expect(getSeparatorTexts(container)).toHaveLength(2);
        expect([...getItemWraps(container)].map((el) => el.getAttribute('aria-current'))).toEqual([null, null, 'page']);
    });

    it('数字 0 照常渲染，数字与字符串同样走截断', () => {
        const { container } = render(() => (
            <Breadcrumb>
                <Breadcrumb.Item>{0}</Breadcrumb.Item>
                <Breadcrumb.Item>{12}</Breadcrumb.Item>
            </Breadcrumb>
        ));
        const titles = [...container.querySelectorAll('.semi-breadcrumb-item-title')];
        expect(titles.map((el) => el.textContent)).toEqual(['0', '12']);
        expect(titles.every((el) => el.querySelector('.semi-typography') !== null)).toBe(true);
    });

    it('非 Breadcrumb.Item 的元素原样渲染并给出警告，Breadcrumb.Item 与文本不警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => (
            <Breadcrumb>
                <Breadcrumb.Item>semi</Breadcrumb.Item>
                plain
            </Breadcrumb>
        ));
        expect(warn).not.toHaveBeenCalled();
        render(() => (
            <Breadcrumb>
                <Breadcrumb.Item>semi</Breadcrumb.Item>
                <i data-testid="plain">plain</i>
            </Breadcrumb>
        ));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Only accepts Breadcrumb.Item'));
        expect(screen.getByTestId('plain').attributes).toHaveLength(1);
    });

    it('单独使用的 Breadcrumb.Item 不渲染任何内容', () => {
        const { container } = render(() => <Breadcrumb.Item>alone</Breadcrumb.Item>);
        expect(container).toBeEmptyDOMElement();
    });

    it('activeIndex 指向会被折叠的项时，当前项保持可见，折叠其后的项', () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'], activeIndex: 2 });
        const nav = navOf(container);
        expect(nav.children[3]).toHaveClass('semi-breadcrumb-collapse');
        const texts = [...nav.querySelectorAll('.semi-typography')].map((el) => el.textContent);
        expect(texts).toEqual(['a', 'b', 'c', 'f']);
        expect(screen.getByText('c').closest('.semi-breadcrumb-item-wrap')).toHaveAttribute('aria-current', 'page');
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
        const routes = 'abcdefghij'.slice(0, n).split('');
        const { container } = getBr({ routes, maxItemCount, activeIndex });
        expect([...navOf(container).children].map((el) => (el.classList.contains('semi-breadcrumb-collapse') ? 'more' : el.querySelector('.semi-typography')?.textContent))).toEqual(row);
        expect(screen.getByText(routes[activeIndex]).closest('.semi-breadcrumb-item-wrap')).toHaveAttribute('aria-current', 'page');
    });
});
