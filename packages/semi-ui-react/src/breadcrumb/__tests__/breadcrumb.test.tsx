import { StrictMode, createRef, useState, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconHome, IconArticle } from '@fibrae/semi-icons-react';
import { Breadcrumb } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { BreadcrumbItemInfo, BreadcrumbItemProps, BreadcrumbProps, RouteProps } from '../index';

type RouteClick = NonNullable<BreadcrumbProps['onClick']>;
type BrProps = Omit<BreadcrumbProps, 'ref' | 'children'> & { children?: BreadcrumbItemProps[] };

function getBr(props: BrProps = {}) {
    let children: ReactNode[];
    if (props.children) {
        children = props.children.map((childProp, index) => <Breadcrumb.Item key={index} {...childProp} />);
    } else {
        children = [<Breadcrumb.Item key="semi">semi</Breadcrumb.Item>, <Breadcrumb.Item key="design">design</Breadcrumb.Item>, <Breadcrumb.Item key="byde">byde</Breadcrumb.Item>];
    }

    return render(<Breadcrumb {...props}>{children}</Breadcrumb>);
}

const getItemWraps = (container: HTMLElement) => container.querySelectorAll('.semi-breadcrumb-item-wrap');
const getSeparatorTexts = (container: HTMLElement) => Array.from(container.querySelectorAll('.semi-breadcrumb-separator')).map((el) => el.textContent);

describe('Breadcrumb', () => {
    it('Fragment 里的 Item 参与当前项与分隔符的计算', () => {
        const { container } = render(
            <Breadcrumb>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <>
                    <Breadcrumb.Item>b</Breadcrumb.Item>
                    <Breadcrumb.Item>c</Breadcrumb.Item>
                </>
            </Breadcrumb>
        );
        const wraps = getItemWraps(container);
        expect(wraps).toHaveLength(3);
        expect(wraps[2]).toHaveAttribute('aria-current', 'page');
        expect(wraps[1]).not.toHaveAttribute('aria-current');
        expect(getSeparatorTexts(container)).toHaveLength(2);
    });

    it('onClick 显式为 null 时，无 href 的项不是键盘链接，点击不抛错', async () => {
        render(
            <Breadcrumb onClick={null}>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <Breadcrumb.Item onClick={null}>b</Breadcrumb.Item>
                <Breadcrumb.Item>c</Breadcrumb.Item>
            </Breadcrumb>
        );
        expect(screen.queryByRole('link')).toBeNull();
        await userEvent.click(screen.getByText('a'));
    });

    it('自定义 className 与 style', () => {
        let props = {
            className: 'test',
            style: {
                color: 'red',
            },
        };
        getBr(props);
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
        let props = {
            maxItemCount: 3,
            children: [{ children: 'semi' }, { children: 'design' }, { children: 'powered' }, { children: 'by' }, { children: 'douyin' }],
        };
        const { container } = getBr(props);
        expect(container.querySelector('.semi-breadcrumb-wrapper').children).toHaveLength(4); // semi/.../by/douyin
        const texts = Array.from(container.querySelectorAll('.semi-breadcrumb-item-wrap .semi-typography')).map((el) => el.textContent);
        expect(texts).toEqual(['semi', 'by', 'douyin']);
        expect(container.querySelector('.semi-breadcrumb-collapse .semi-icon-more')).not.toBeNull();
    });

    it('Item 的 icon、href、noLink、separator', () => {
        let href = 'https://semi.design';
        let props = {
            children: [
                { icon: <IconHome />, separator: '???', children: 'semi' },
                { icon: <IconArticle />, children: 'design', href },
                { children: 'system', href: null },
            ],
        };
        const { container } = getBr(props);
        expect(container.querySelector('.semi-icon-home')).not.toBeNull();
        expect(container.querySelector('.semi-icon-article')).not.toBeNull();
        const links = container.querySelectorAll('.semi-breadcrumb-item-wrap a');
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', href);
        expect(getItemWraps(container)[0].childNodes[1].textContent).toEqual('???');
        expect(getSeparatorTexts(container)).toEqual(['/']);
    });

    it('onClick 与 item.onClick', async () => {
        // the event is typed by shape only, so reading its methods back is not an unbound method reference
        type SpiedClick = (route: BreadcrumbItemInfo | RouteProps, event: { nativeEvent: unknown; isDefaultPrevented: unknown }) => void;
        const spyClick = vi.fn<SpiedClick>();
        const spyItemClick = vi.fn<SpiedClick>();
        let props = {
            onClick: spyClick,
            children: [{ onClick: spyItemClick, children: 'semi' }, { children: 'design' }],
        };
        getBr(props);
        await userEvent.click(screen.getByText('semi'));
        expect(spyItemClick).toHaveBeenCalledTimes(1);
        expect(spyClick).toHaveBeenCalledTimes(1);

        // the second argument is React's synthetic click event (pooled, so only its shape is checked)
        const firstArgs = spyClick.mock.calls[0];
        expect(firstArgs).toHaveLength(2);
        expect(firstArgs[0]).toEqual({ name: 'semi' });
        expect(firstArgs[1]).toHaveProperty('nativeEvent');
        expect(firstArgs[1].isDefaultPrevented).toEqual(expect.any(Function));

        const itemArgs = spyItemClick.mock.calls[0];
        expect(itemArgs).toHaveLength(2);
        expect(itemArgs[0]).toEqual({ name: 'semi' });
        expect(itemArgs[1]).toBe(firstArgs[1]);

        await userEvent.click(screen.getByText('design'));
        expect(spyItemClick).toHaveBeenCalledTimes(1);
        expect(spyClick).toHaveBeenCalledTimes(2);
        expect(spyClick.mock.calls[1][0]).toEqual({ name: 'design' });
    });

    it('routes', () => {
        const objRoutes = [
            {
                path: '/',
                href: '/',
                icon: <IconHome />,
            },
            {
                path: '/breadcrumb',
                href: '/components/breadcrumb',
                name: 'breadcrumb',
                icon: <IconArticle />,
            },
            'string only',
        ];
        const { container } = getBr({ routes: objRoutes });
        const [fisrtItem, secondItem, thirdItem] = getItemWraps(container);
        expect(fisrtItem.querySelector('.semi-icon-home')).not.toBeNull();
        expect(secondItem.querySelector('.semi-icon-article')).not.toBeNull();

        expect(fisrtItem.querySelector('a')).toHaveAttribute('href', '/');
        expect(secondItem.querySelector('a')).toHaveAttribute('href', '/components/breadcrumb');

        expect(secondItem.querySelector('.semi-typography')).toHaveTextContent(/^breadcrumb$/);
        expect(thirdItem.querySelector('.semi-typography')).toHaveTextContent(/^string only$/);
    });

    it('renderItem', () => {
        const objRoutes = [
            {
                path: 'path',
                href: 'href',
                name: 'test',
                icon: <IconHome />,
            },
        ];

        let props = {
            routes: objRoutes,
            renderItem: (route) => (
                <>
                    <div className="path">{route.path}</div>
                    <div className="href">{route.href}</div>
                    <div className="name">{route.name}</div>
                </>
            ),
        };
        const { container } = getBr(props);
        const item = container.querySelector('.semi-breadcrumb-item-title');
        expect(item.querySelector('.path')).toHaveTextContent(/^path$/);
        expect(item.querySelector('.href')).toHaveTextContent(/^href$/);
        expect(item.querySelector('.name')).toHaveTextContent(/^test$/);
    });

    it('渲染带 aria-label 的导航地标，并将最后一项标记为当前项', () => {
        const { container } = getBr();
        expect(screen.getByRole('navigation', { name: zh_CN.Breadcrumb.label })).toBe(container.firstChild);
        const wraps = getItemWraps(container);
        expect([...wraps].map((el) => el.getAttribute('aria-current'))).toEqual([null, null, 'page']);
        expect(wraps[2].firstChild).toHaveClass('semi-breadcrumb-item-active');
        expect(getSeparatorTexts(container)).toEqual(['/', '/']);
    });

    it('activeIndex 选中当前项', () => {
        const { container } = getBr({ activeIndex: 0 });
        const wraps = getItemWraps(container);
        expect([...wraps].map((el) => el.getAttribute('aria-current'))).toEqual(['page', null, null]);
        expect(wraps[0].firstChild).toHaveClass('semi-breadcrumb-item-active');
        expect(wraps[2].firstChild).not.toHaveClass('semi-breadcrumb-item-active');
    });

    it('除非是当前项，否则 href 渲染为 a 标签', () => {
        const { container } = getBr({
            children: [
                { children: 'a', href: '/a' },
                { children: 'b', noLink: true },
                { children: 'c', href: '/c' },
            ],
        });
        const [a, b, c] = [...getItemWraps(container)].map((el) => el.firstChild as HTMLElement);
        expect(a.tagName).toBe('A');
        expect(a).toHaveAttribute('href', '/a');
        expect(a).toHaveClass('semi-breadcrumb-item-link');
        expect(b.tagName).toBe('SPAN');
        expect(b).not.toHaveClass('semi-breadcrumb-item-link');
        expect(c.tagName).toBe('SPAN');
    });

    it('将 data-* 属性传给 nav 与 Item 外层包裹元素', () => {
        render(
            <Breadcrumb data-foo="bar" data-testid="root">
                <Breadcrumb.Item data-testid="item">semi</Breadcrumb.Item>
            </Breadcrumb>
        );
        expect(screen.getByTestId('root').tagName).toBe('NAV');
        expect(screen.getByTestId('root')).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByTestId('item')).toHaveClass('semi-breadcrumb-item-wrap');
    });

    it('自定义 aria-label', () => {
        getBr({ 'aria-label': 'Path' });
        expect(screen.getByRole('navigation', { name: 'Path' })).toBeInTheDocument();
    });

    it('JSX 形式的 separator 与 Item 的 separator', () => {
        const { container } = render(
            <Breadcrumb separator={<b className="sep">|</b>}>
                <Breadcrumb.Item>a</Breadcrumb.Item>
                <Breadcrumb.Item separator={<i className="own">~</i>}>b</Breadcrumb.Item>
                <Breadcrumb.Item>c</Breadcrumb.Item>
            </Breadcrumb>
        );
        const wraps = getItemWraps(container);
        expect(wraps[0].querySelector('.semi-breadcrumb-separator .sep')).not.toBeNull();
        expect(wraps[1].querySelector('.own')).not.toBeNull();
        expect(wraps[1].querySelector('.semi-breadcrumb-separator')).toBeNull();
        expect(wraps[2].childNodes).toHaveLength(1);
    });

    it('routes：字符串路由，key 取自路由，onClick 传入原始路由', async () => {
        const onClick = vi.fn<RouteClick>();
        const home = { path: '/', name: 'home', key: 'h' };
        const { container } = getBr({ routes: [home, 'list', 'detail'], onClick });
        expect(getItemWraps(container)).toHaveLength(3);
        await userEvent.click(screen.getByText('home'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe(home);
        expect(onClick.mock.calls[0][1]).toHaveProperty('nativeEvent');
        await userEvent.click(screen.getByText('list'));
        expect(onClick.mock.calls[1][0]).toEqual({ name: 'list' });
    });

    it('onClick 收到 children 写法的 BreadcrumbItemInfo 或路由，name 为 ReactNode', () => {
        type ClickedItem = Parameters<RouteClick>[0];
        expectTypeOf<ClickedItem>().toEqualTypeOf<BreadcrumbItemInfo | RouteProps>();
        expectTypeOf<ClickedItem['name']>().toEqualTypeOf<ReactNode>();
        expectTypeOf<Parameters<NonNullable<BreadcrumbItemProps['onClick']>>[0]>().toEqualTypeOf<ClickedItem>();
    });

    it('非元素的子节点原样渲染', () => {
        render(
            <Breadcrumb>
                <Breadcrumb.Item>semi</Breadcrumb.Item>
                plain
            </Breadcrumb>
        );
        expect(screen.getByRole('navigation')).toHaveTextContent(/plain$/);
    });

    it('routes 优先于 children', () => {
        const { container } = render(
            <Breadcrumb routes={['r1', 'r2']}>
                <Breadcrumb.Item>c1</Breadcrumb.Item>
            </Breadcrumb>
        );
        const texts = [...getItemWraps(container)].map((el) => el.firstChild.textContent);
        expect(texts).toEqual(['r1', 'r2']);
    });

    it('空 routes 时回退为 children', () => {
        const { container } = getBr({ routes: [] });
        expect(getItemWraps(container)).toHaveLength(3);
    });

    it('routes 超过 maxItemCount 时折叠', () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        const nav = container.querySelector('.semi-breadcrumb-wrapper');
        expect(nav.children).toHaveLength(5);
        expect(nav.children[1]).toHaveClass('semi-breadcrumb-collapse');
        const texts = [...nav.querySelectorAll('.semi-typography')].map((el) => el.textContent);
        expect(texts).toEqual(['a', 'd', 'e', 'f']);
    });

    it('点击 more 展开全部项', async () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'], maxItemCount: 2 });
        const more = screen.getByRole('button', { name: zh_CN.Breadcrumb.expand });
        expect(more).toHaveClass('semi-breadcrumb-item-more');
        expect(more.parentElement.querySelector('.semi-breadcrumb-separator')).toHaveTextContent('/');
        await userEvent.click(more);
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
        expect(getItemWraps(container)).toHaveLength(6);
    });

    it('在 more 上按 Enter 展开，其他键不展开', async () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        const more = screen.getByRole('button', { name: zh_CN.Breadcrumb.expand });
        more.focus();
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
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });

    it('用键盘展开后，被折叠的项都不可聚焦时焦点落到 nav', async () => {
        getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'] });
        screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }).focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('navigation')).toHaveFocus();
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

    it('renderMore 接收被隐藏的项，且其分隔符被去掉', () => {
        const renderMore = vi.fn<NonNullable<BreadcrumbProps['renderMore']>>((rest) => <span className="custom-more">{rest.length}</span>);
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e'], maxItemCount: 3, renderMore });
        expect(container.querySelector('.semi-breadcrumb-item-more .custom-more')).toHaveTextContent('2');
        expect(container.querySelector('.semi-breadcrumb-item-more .semi-icon-more')).toBeNull();
        const hidden = renderMore.mock.calls.at(-1)[0];
        expect(hidden).toHaveLength(2);
        const { container: c2 } = render(<div>{hidden}</div>);
        expect([...c2.querySelectorAll('.semi-breadcrumb-item-wrap')].map((el) => el.textContent)).toEqual(['b', 'c']);
    });

    it('moreType 为 popover 时在气泡中显示被隐藏的项', async () => {
        const { container } = render(
            <Breadcrumb maxItemCount={2} moreType="popover" separator=">">
                <Breadcrumb.Item>one</Breadcrumb.Item>
                <Breadcrumb.Item>two</Breadcrumb.Item>
                <Breadcrumb.Item>three</Breadcrumb.Item>
                <Breadcrumb.Item>four</Breadcrumb.Item>
            </Breadcrumb>
        );
        const nav = container.querySelector('.semi-breadcrumb-wrapper');
        expect(nav.children).toHaveLength(3);
        await userEvent.hover(container.querySelector('.semi-breadcrumb-item-more .semi-icon-more'));
        const content = await screen.findByText('two', { selector: '.semi-popover-content *' }).then(() => document.querySelector('.semi-popover-content'));
        const hidden = content.querySelectorAll(':scope > .semi-breadcrumb-item-wrap');
        expect([...hidden].map((el) => el.textContent)).toEqual(['two', 'three']);
        expect([...content.querySelectorAll('.semi-breadcrumb-restItem')].map((el) => el.textContent)).toEqual(['>']);
    });

    it('moreType 为 popover 时，在气泡内按键不会展开，也不会被吞掉', async () => {
        const { container } = render(
            <Breadcrumb maxItemCount={2} moreType="popover">
                <Breadcrumb.Item href="https://semi.design/">one</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">two</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">three</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">four</Breadcrumb.Item>
            </Breadcrumb>
        );
        await userEvent.hover(container.querySelector('.semi-breadcrumb-item-more .semi-icon-more'));
        const link = await screen.findByText('two', { selector: '.semi-popover-content a *, .semi-popover-content a' });
        expect(fireEvent.keyDown(link, { key: ' ' })).toBe(true);
        fireEvent.keyDown(link, { key: 'Enter' });
        expect(container.querySelector('.semi-breadcrumb-collapse')).not.toBeNull();
        const more = screen.getByRole('button', { name: zh_CN.Breadcrumb.expand });
        fireEvent.keyDown(more, { key: ' ' });
        expect(container.querySelector('.semi-breadcrumb-collapse')).toBeNull();
    });

    it('showTooltip 设置截断宽度与 tooltip', () => {
        const width = (container) => container.querySelector('.semi-typography').style.maxWidth;
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
        expect(container.querySelector('.semi-icon-home')).toHaveClass('semi-icon-small');
        expect(container.querySelector('.semi-icon-home')).toHaveClass('semi-breadcrumb-item-icon');
        unmount();
        const { container: c2 } = getBr({ compact: false, children: [{ icon: <IconHome />, children: 'semi' }] });
        expect(c2.querySelector('.semi-icon-home')).toHaveClass('semi-icon-default');
    });

    it('icon 保留自带的 className；非 Semi 图标的元素只加 class，不加 size', () => {
        const { container } = getBr({
            children: [
                { icon: <IconHome className="mine" />, children: 'semi' },
                { icon: <i className="custom" data-testid="plain" />, children: 'design' },
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
        const { container } = render(
            <Breadcrumb>
                <Breadcrumb.Item>
                    <b>bold</b>
                </Breadcrumb.Item>
            </Breadcrumb>
        );
        expect(container.querySelector('.semi-breadcrumb-item-title-inline b')).toHaveTextContent('bold');
        expect(container.querySelector('.semi-typography')).toBeNull();
    });

    it('Breadcrumb.Item 以 elementType 标识自身', () => {
        expect(Breadcrumb.Item.elementType).toBe('Breadcrumb.Item');
        // @ts-expect-error Breadcrumb.Item has no isBreadcrumbItem marker
        expect(Breadcrumb.Item.isBreadcrumbItem).toBeUndefined();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Breadcrumb: { separator: '>', maxItemCount: 2 } };
        try {
            const { container, unmount } = getBr({ routes: ['a', 'b', 'c', 'd'] });
            expect(container.querySelector('.semi-breadcrumb-wrapper').children).toHaveLength(3);
            expect(getSeparatorTexts(container)).toEqual(['>', '>']);
            unmount();
            const { container: c2 } = getBr({ routes: ['a', 'b', 'c', 'd'], separator: '|', maxItemCount: 5 });
            expect(c2.querySelector('.semi-breadcrumb-collapse')).toBeNull();
            expect(getSeparatorTexts(c2)).toEqual(['|', '|', '|']);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('ref 指向 nav 与 Item 外层包裹元素', () => {
        const ref = createRef<HTMLElement>();
        const itemRef = createRef<HTMLSpanElement>();
        const { container } = render(
            <Breadcrumb ref={ref}>
                <Breadcrumb.Item ref={itemRef}>semi</Breadcrumb.Item>
            </Breadcrumb>
        );
        expect(ref.current).toBe(container.querySelector('nav'));
        expect(itemRef.current).toBe(container.querySelector('.semi-breadcrumb-item-wrap'));
    });

    it('将未声明的属性传给 nav 与 Item 外层包裹元素', () => {
        render(
            <Breadcrumb id="bc" title="path">
                <Breadcrumb.Item id="it" className="mine" style={{ color: 'red' }}>
                    semi
                </Breadcrumb.Item>
            </Breadcrumb>
        );
        expect(screen.getByRole('navigation')).toHaveAttribute('id', 'bc');
        expect(screen.getByRole('navigation')).toHaveAttribute('title', 'path');
        const item = document.getElementById('it');
        expect(item).toHaveClass('semi-breadcrumb-item-wrap', 'mine');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('routes 中非 Item 属性的字段不会进入 DOM', () => {
        const route = { name: 'a', path: '/a', meta: 'x', 'data-id': 'r' };
        const { container } = getBr({ routes: [route, 'b'] });
        const wrap = getItemWraps(container)[0];
        expect(wrap).toHaveAttribute('data-id', 'r');
        expect(wrap).not.toHaveAttribute('path');
        expect(wrap).not.toHaveAttribute('name');
        expect(wrap).not.toHaveAttribute('meta');
    });

    it('单独使用的 Breadcrumb.Item 可点击', async () => {
        const onClick = vi.fn<RouteClick>();
        render(<Breadcrumb.Item onClick={onClick}>alone</Breadcrumb.Item>);
        await userEvent.click(screen.getByText('alone'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toEqual({ name: 'alone' });
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
        expect(onClick.mock.calls[0][0]).toEqual({ name: 'semi' });
    });

    it('没有点击处理的项不是 Tab 停靠点', () => {
        getBr();
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('单独使用的带 onClick 的 Item 可用 Enter 触发', async () => {
        const onClick = vi.fn<RouteClick>();
        render(<Breadcrumb.Item onClick={onClick}>alone</Breadcrumb.Item>);
        await userEvent.tab();
        expect(screen.getByRole('link', { name: 'alone' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('maxItemCount 小于 2 时仍显示最后一项', () => {
        getBr({
            maxItemCount: 1,
            children: [{ children: 'semi' }, { children: 'design' }, { children: 'byde' }],
        });
        const last = screen.getByText('byde').closest('.semi-breadcrumb-item-wrap');
        expect(last).toHaveAttribute('aria-current', 'page');
    });

    it('StrictMode 下点击只展开一次，且每次点击只调用一次 onClick', async () => {
        const onClick = vi.fn<RouteClick>();
        const { container } = render(
            <StrictMode>
                <Breadcrumb routes={['a', 'b', 'c', 'd', 'e']} onClick={onClick} />
            </StrictMode>
        );
        await userEvent.click(screen.getByText('a'));
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Breadcrumb.expand }));
        expect(getItemWraps(container)).toHaveLength(5);
    });

    it('带 key 的子项重排时，子组件状态随 key 移动', async () => {
        function Counter({ id }: { id: string }) {
            const [count, setCount] = useState(0);
            return (
                <button type="button" onClick={() => setCount(count + 1)}>
                    {id}:{count}
                </button>
            );
        }
        const renderOrder = (order: string[]) => (
            <Breadcrumb>
                {order.map((id) => (
                    <Breadcrumb.Item key={id}>
                        <Counter id={id} />
                    </Breadcrumb.Item>
                ))}
            </Breadcrumb>
        );
        const { rerender } = render(renderOrder(['a', 'b', 'c']));
        await userEvent.click(screen.getByRole('button', { name: 'a:0' }));
        rerender(renderOrder(['c', 'a', 'b']));
        expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(['c:0', 'a:1', 'b:0']);
    });

    it('数字 0 照常渲染，数字与字符串同样走截断', () => {
        const { container } = render(
            <Breadcrumb>
                <Breadcrumb.Item>{0}</Breadcrumb.Item>
                <Breadcrumb.Item>{12}</Breadcrumb.Item>
            </Breadcrumb>
        );
        const titles = [...container.querySelectorAll('.semi-breadcrumb-item-title')];
        expect(titles.map((el) => el.textContent)).toEqual(['0', '12']);
        expect(titles.every((el) => el.querySelector('.semi-typography') !== null)).toBe(true);
    });

    it('非 Breadcrumb.Item 的元素原样渲染，不被注入 Item 的属性，并给出警告', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <Breadcrumb>
                <i data-testid="plain">plain</i>
            </Breadcrumb>
        );
        const injected = error.mock.calls.filter((args) => args.join(' ').includes('shouldRenderSeparator'));
        const warned = warn.mock.calls.filter((args) => args.join(' ').includes('Only accepts Breadcrumb.Item'));
        error.mockRestore();
        warn.mockRestore();
        expect(injected).toEqual([]);
        expect(warned).toHaveLength(1);
        expect(screen.getByTestId('plain').attributes).toHaveLength(1);
    });

    it('只有 Breadcrumb.Item 与文本子节点时不给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <Breadcrumb>
                <Breadcrumb.Item>semi</Breadcrumb.Item>
                plain
            </Breadcrumb>
        );
        const warned = warn.mock.calls.length;
        warn.mockRestore();
        expect(warned).toBe(0);
    });

    it('activeIndex 指向会被折叠的项时，当前项保持可见，折叠其后的项', () => {
        const { container } = getBr({ routes: ['a', 'b', 'c', 'd', 'e', 'f'], activeIndex: 2 });
        const nav = container.querySelector('.semi-breadcrumb-wrapper');
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
        const nav = container.querySelector('.semi-breadcrumb-wrapper');
        expect([...nav.children].map((el) => (el.classList.contains('semi-breadcrumb-collapse') ? 'more' : el.querySelector('.semi-typography')?.textContent))).toEqual(row);
        expect(screen.getByText(routes[activeIndex]).closest('.semi-breadcrumb-item-wrap')).toHaveAttribute('aria-current', 'page');
    });
});
