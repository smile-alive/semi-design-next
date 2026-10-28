import { StrictMode, createRef, type MouseEventHandler } from 'react';
import { createPortal } from 'react-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { List, Avatar, Button, ButtonGroup } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import type { ListProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-list`;

const dataSource = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];

function renderList(props: Partial<ListProps<any>> = {}) {
    const realProps = {
        dataSource,
        renderItem: (item) => <List.Item>{item}</List.Item>,
        ...props,
    };
    return render(<List {...realProps} />);
}

const getItems = (container: HTMLElement) => container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`);

describe('List', () => {
    it('使用 JSX 的 List', () => {
        const { container } = render(
            <List>
                <List.Item>从明天起，做一个幸福的人</List.Item>
                <List.Item>喂马，劈柴，周游世界</List.Item>
                <List.Item>从明天起，关心粮食和蔬菜</List.Item>
                <List.Item>我有一所房子，面朝大海，春暖花开菜</List.Item>
            </List>
        );
        const items = getItems(container);
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent(/^从明天起，做一个幸福的人$/);
    });

    it('基础 renderItem 的 List', () => {
        const { container } = renderList();
        const items = getItems(container);
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent(/^从明天起，做一个幸福的人$/);
    });

    it('renderItem 含 header、main 与 extra 的 List', () => {
        const { container } = renderList({
            renderItem: (item) => (
                <List.Item
                    header={<Avatar color="blue">SE</Avatar>}
                    main={
                        <div>
                            <span style={{ color: 'var(--semi-color-text-0)', fontWeight: 500 }}>示例标题</span>
                            {item}
                        </div>
                    }
                    extra={
                        <ButtonGroup theme="borderless">
                            <Button>编辑</Button>
                            <Button>更多</Button>
                        </ButtonGroup>
                    }
                />
            ),
        });
        expect(container.querySelector(`.${prefixCls}-item-body-header .${BASE_CLASS_PREFIX}-avatar-label`)).toHaveTextContent(/^SE$/);
        expect(container.querySelector(`.${prefixCls}-item-body-main span`)).toHaveTextContent(/^示例标题$/);
        expect(container.querySelector(`.${prefixCls}-item-extra .${BASE_CLASS_PREFIX}-button-group`)).not.toBeNull();
    });

    it('自定义 className / style 的 List', () => {
        const { container } = renderList({ className: 'test', style: { height: 420 } });
        const list = container.firstChild;
        expect(list).toHaveClass('test');
        expect(list).toHaveStyle({ height: '420px' });
    });

    it('bordered 的 List', () => {
        const { container } = renderList({ bordered: true });
        expect(container.firstChild).toHaveClass(`${prefixCls}-bordered`);
    });

    it('size 的 List', () => {
        for (const size of ['small', 'default', 'large'] as const) {
            const { container, unmount } = renderList({ size });
            expect(container.firstChild).toHaveClass(`${prefixCls}-${size}`);
            unmount();
        }
    });

    it('layout 的 List', () => {
        const { container, rerender } = renderList({ layout: 'horizontal' });
        expect(container.firstChild).toHaveClass(`${prefixCls}-flex`);
        rerender(<List dataSource={dataSource} layout="vertical" renderItem={(item) => <List.Item>{item}</List.Item>} />);
        expect(container.firstChild).not.toHaveClass(`${prefixCls}-flex`);
    });

    it('grid 的 List', () => {
        const { container } = renderList({
            grid: {
                gutter: 18,
                span: 6,
            },
        });
        const cols = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-col-6`);
        expect(cols).toHaveLength(4);
        // Row hands the gutter to grid.scss, which pads every Col with half of it
        expect(cols[0].parentElement).toHaveStyle({ '--semi-row-gutter-x-xs': '18px' });
    });

    it('split 的 List', () => {
        const { container } = renderList({ split: false });
        expect(container.querySelector(`.${prefixCls}-split`)).toBeNull();
    });

    it('onClick 的 List', async () => {
        const spyOnClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const { container } = renderList({ onClick: spyOnClick });
        await userEvent.click(getItems(container)[0]);
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('使用 JSX 的 List', async () => {
        const spyOnClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const { container } = render(
            <List>
                <List.Item onClick={spyOnClick}>从明天起，做一个幸福的人</List.Item>
                <List.Item>喂马，劈柴，周游世界</List.Item>
                <List.Item>从明天起，关心粮食和蔬菜</List.Item>
                <List.Item>我有一所房子，面朝大海，春暖花开菜</List.Item>
            </List>
        );
        const items = getItems(container);
        await userEvent.click(items[0]);
        expect(spyOnClick).toHaveBeenCalledTimes(1);
        await userEvent.click(items[1]);
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('loading 的 List', () => {
        const { container, unmount } = renderList({ loading: true });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-spin-hidden`)).toBeNull();
        unmount();
        const { container: noloadingContainer } = renderList({ loading: false });
        expect(noloadingContainer.querySelector(`.${BASE_CLASS_PREFIX}-spin-hidden`)).not.toBeNull();
    });

    it('loadMore 的 List', () => {
        renderList({ loadMore: <Button>加载更多</Button> });
        expect(screen.getByRole('button', { name: '加载更多' })).toBeInTheDocument();
    });

    it('emptyContent 的 List', () => {
        const { container, unmount } = renderList({
            emptyContent: <span className="empty">自定义空内容</span>,
            dataSource: [],
        });
        expect(container.querySelector(`.${prefixCls}-empty .empty`)).toHaveTextContent(/^自定义空内容$/);
        unmount();

        const { container: container2 } = renderList({ dataSource: [] });
        expect(container2.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
    });

    it('children 为空数组时显示空状态', () => {
        const rows: string[] = [];
        const { container } = render(
            <List>
                {rows.map((row) => (
                    <List.Item key={row}>{row}</List.Item>
                ))}
            </List>
        );
        expect(container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        expect(container.querySelector(`.${prefixCls}-items`)).toBeNull();
    });

    it('footer 与 header 的 List', () => {
        const { container } = renderList({
            header: <div className="header">头部</div>,
            footer: <div className="footer">尾部</div>,
        });
        expect(container.querySelector(`.${prefixCls}-header .header`)).toHaveTextContent(/^头部$/);
        expect(container.querySelector(`.${prefixCls}-footer .footer`)).toHaveTextContent(/^尾部$/);
    });

    it('loading 且 dataSource 为空时，List 显示空状态 div', () => {
        const { container } = renderList({
            dataSource: [],
            loading: true,
        });
        expect(container.querySelector(`.${prefixCls}-empty`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-spin-large`)).not.toBeNull();
    });

    it('根节点类名来自默认值与属性', () => {
        const { container, rerender } = render(<List />);
        const list = container.firstChild as HTMLElement;
        expect(list).toHaveClass(prefixCls, `${prefixCls}-default`, `${prefixCls}-split`);
        expect(list).not.toHaveClass(`${prefixCls}-bordered`, `${prefixCls}-flex`, `${prefixCls}-grid`);
        rerender(<List bordered grid={{ span: 12 }} layout="horizontal" size="small" split={false} />);
        expect(list.className).toBe(`${prefixCls} ${prefixCls}-flex ${prefixCls}-small ${prefixCls}-grid ${prefixCls}-bordered`);
    });

    it('List.Item 脱离 List 使用时渲染为普通 li', () => {
        const { container } = render(<List.Item>solo</List.Item>);
        expect(container.querySelector('li')).toHaveTextContent('solo');
        expect(container.querySelector('li')).not.toHaveAttribute('tabindex');
    });

    it('renderItem 可以返回 null、文本、数字与布尔值', () => {
        const values = [null, 'text', 0, 7, false, <List.Item key="x">el</List.Item>];
        const { container } = renderList({ dataSource: values, renderItem: (item) => item });
        expect(container.querySelector(`.${prefixCls}-items`)).toHaveTextContent('text07el');
        expect(getItems(container)).toHaveLength(1);
    });

    it('可点击项以原生按钮作为唯一的 Tab 停留点，普通项没有', async () => {
        const onClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const { container } = render(
            <List>
                <List.Item onClick={onClick}>a</List.Item>
                <List.Item>b</List.Item>
            </List>
        );
        const items = getItems(container);
        expect(items[0]).not.toHaveAttribute('tabindex');
        expect(items[0].tagName).toBe('LI');
        expect(items[1].querySelector('button')).toBeNull();
        const button = screen.getByRole('button', { name: 'a' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(items[0].contains(button)).toBe(true);
        button.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('可点击的项把 tabIndex 与 aria-* 落在按钮上，不可点击的项落在 li 上', () => {
        const { container } = render(
            <List>
                <List.Item aria-label="first" tabIndex={-1} onClick={() => {}}>
                    a
                </List.Item>
                <List.Item aria-label="second" tabIndex={-1}>
                    b
                </List.Item>
            </List>
        );
        const [first, second] = getItems(container);
        expect(first).not.toHaveAttribute('aria-label');
        expect(first).not.toHaveAttribute('tabindex');
        const button = screen.getByRole('button', { name: 'first' });
        expect(button).toHaveAttribute('tabindex', '-1');
        expect(second).toHaveAttribute('aria-label', 'second');
        expect(second).toHaveAttribute('tabindex', '-1');
    });

    it('通过 List 的 onClick 可点击的项同样渲染为按钮', async () => {
        const onClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const { container } = renderList({ onClick });
        expect(container.querySelectorAll('button')).toHaveLength(4);
        screen.getByRole('button', { name: dataSource[2] }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('仅支持右键的项渲染为按钮，其上的右键菜单触发 onRightClick', () => {
        const onRightClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        render(
            <List>
                <List.Item onRightClick={onRightClick}>a</List.Item>
            </List>
        );
        fireEvent.contextMenu(screen.getByRole('button', { name: 'a' }));
        expect(onRightClick).toHaveBeenCalledTimes(1);
    });

    it('header 与 main 位于按钮内，extra 位于按钮外', async () => {
        const onClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const onExtra = vi.fn<() => void>();
        const { container } = render(
            <List>
                <List.Item header="H" main="M" extra={<Button onClick={onExtra}>Act</Button>} onClick={onClick} />
            </List>
        );
        const itemButton = container.querySelector(`.${prefixCls}-item-button`);
        expect(itemButton).toHaveTextContent('HM');
        expect(itemButton.querySelector('div, button')).toBeNull();
        const extraButton = screen.getByRole('button', { name: 'Act' });
        expect(itemButton.contains(extraButton)).toBe(false);
        expect(container.querySelectorAll(`.${prefixCls}-item button`)).toHaveLength(2);
    });

    it('extra 内嵌套的 List 的 extra 按钮不触发外层 onClick', async () => {
        const onOuter = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const onInner = vi.fn<() => void>();
        render(
            <List>
                <List.Item
                    main="outer"
                    extra={
                        <List>
                            <List.Item main="inner" extra={<Button onClick={onInner}>InnerAct</Button>} />
                        </List>
                    }
                    onClick={onOuter}
                />
            </List>
        );
        await userEvent.click(screen.getByRole('button', { name: 'InnerAct' }));
        expect(onInner).toHaveBeenCalledTimes(1);
        expect(onOuter).not.toHaveBeenCalled();
    });

    it('extra 内经 Portal 渲染的内容被点击时不触发 onClick，children 里的 Portal 仍触发', async () => {
        const onClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        render(
            <List>
                <List.Item main="row" extra={createPortal(<button type="button">InPortal</button>, document.body)} onClick={onClick}>
                    {createPortal(<button type="button">ChildPortal</button>, document.body)}
                </List.Item>
            </List>
        );
        await userEvent.click(screen.getByRole('button', { name: 'InPortal' }));
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'ChildPortal' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('有 aria-label 或 aria-labelledby 时根 div 是 group，否则没有 role', () => {
        const { container, rerender } = render(<List aria-label="items" />);
        expect(container.firstChild).toHaveAttribute('role', 'group');
        rerender(<List aria-labelledby="x" />);
        expect(container.firstChild).toHaveAttribute('role', 'group');
        rerender(<List />);
        expect(container.firstChild).not.toHaveAttribute('role');
        rerender(<List aria-label="items" role="note" />);
        expect(container.firstChild).toHaveAttribute('role', 'note');
    });

    it('renderItem 只以 item 与 index 调用', () => {
        const renderItem = vi.fn<NonNullable<ListProps<string>['renderItem']>>((item) => <List.Item>{item}</List.Item>);
        renderList({ dataSource: ['a', 'b'], renderItem });
        expect(renderItem.mock.calls).toEqual([
            ['a', 0],
            ['b', 1],
        ]);
    });

    it('没有 renderItem 时，dataSource 既不渲染项也不显示空状态', () => {
        const { container } = render(<List dataSource={['a']} />);
        expect(container.querySelector(`.${prefixCls}-items`)).toBeEmptyDOMElement();
    });

    it('children 跟随 dataSource 的项，并屏蔽空状态', () => {
        const { container, rerender } = render(
            <List dataSource={['a']} renderItem={(item) => <List.Item>{item}</List.Item>}>
                <List.Item>child</List.Item>
            </List>
        );
        expect([...getItems(container)].map((item) => item.textContent)).toEqual(['a', 'child']);
        rerender(
            <List dataSource={[]}>
                <List.Item>child</List.Item>
            </List>
        );
        expect(getItems(container)).toHaveLength(1);
        expect(container.querySelector(`.${prefixCls}-empty`)).toBeNull();
    });

    it('dataSource 变化时更新项', () => {
        const renderItem = (item) => <List.Item key={item}>{item}</List.Item>;
        const { container, rerender } = render(<List dataSource={['a', 'b']} renderItem={renderItem} />);
        rerender(<List dataSource={['b', 'c', 'd']} renderItem={renderItem} />);
        expect([...getItems(container)].map((item) => item.textContent)).toEqual(['b', 'c', 'd']);
        rerender(<List dataSource={[]} renderItem={renderItem} />);
        expect(container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
    });

    it('空文本跟随语言包，emptyContent 占据其位置', () => {
        const { container, unmount } = render(
            <LocaleProvider locale={en_US}>
                <List dataSource={[]} />
            </LocaleProvider>
        );
        expect(container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^No Result$/);
        expect(container.querySelector(`.${prefixCls}-empty`)).not.toHaveAttribute('x-semi-prop');
        unmount();
        const { container: custom } = render(<List emptyContent="nothing" />);
        expect(custom.querySelector(`.${prefixCls}-empty`)).toHaveAttribute('x-semi-prop', 'emptyContent');
    });

    it('header、footer 与 loadMore 的顺序与插槽', () => {
        const { container } = render(
            <List footer="f" header="h" loadMore={<span className="more">more</span>}>
                <List.Item>i</List.Item>
            </List>
        );
        const children = [...(container.firstChild as HTMLElement).children];
        expect(children[0]).toHaveClass(`${prefixCls}-header`);
        expect(children[0]).toHaveAttribute('x-semi-prop', 'header');
        expect(children[1]).toHaveClass(`${BASE_CLASS_PREFIX}-spin`);
        expect(children[2]).toHaveClass(`${prefixCls}-footer`);
        expect(children[2]).toHaveAttribute('x-semi-prop', 'footer');
        expect(children[3]).toHaveClass('more');
    });

    it('grid 将各项包裹在 flex Row 中，每项放在一个 Col 中', () => {
        const { container } = renderList({
            grid: { gutter: 20, justify: 'center', align: 'middle', span: 8, xs: 24, className: 'col' },
        });
        expect(container.querySelector(`.${prefixCls}-items`)).toBeNull();
        const row = container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`);
        expect(row).toHaveClass(`${BASE_CLASS_PREFIX}-row-flex-center`, `${BASE_CLASS_PREFIX}-row-flex-middle`);
        expect(row).toHaveStyle({ '--semi-row-gutter-x-md': '20px' });
        const cols = row.children;
        expect(cols).toHaveLength(4);
        expect(cols[0]).toHaveClass(`${BASE_CLASS_PREFIX}-col`, `${BASE_CLASS_PREFIX}-col-8`, `${BASE_CLASS_PREFIX}-col-xs-24`, 'col');
        expect(cols[0].firstChild).toHaveClass(`${prefixCls}-item`);
    });

    it('grid 保持列表语义：Row 即列表，布局用的 Col 没有自己的 role', () => {
        const { container } = renderList({ grid: { span: 12 } });
        const row = container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`);
        expect(screen.getByRole('list')).toBe(row);
        for (const col of row.children) {
            expect(col).toHaveAttribute('role', 'none');
        }
        expect(screen.getAllByRole('listitem')).toHaveLength(dataSource.length);
    });

    it('不传 Row 属性时，grid 仍使用 flex Row 布局', () => {
        const { container } = renderList({ grid: {} });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`).children).toHaveLength(4);
    });

    it('只有 header 或 main 时才渲染项的主体，align 设置其类名', () => {
        const { container } = render(
            <List>
                <List.Item>plain</List.Item>
                <List.Item header="h" />
                <List.Item align="center" main="m" extra="e" />
            </List>
        );
        const items = getItems(container);
        expect(items[0].querySelector(`.${prefixCls}-item-body`)).toBeNull();
        expect(items[0].querySelector(`.${prefixCls}-item-extra`)).toBeNull();
        const headerBody = items[1].querySelector(`.${prefixCls}-item-body`);
        expect(headerBody).toHaveClass(`${prefixCls}-item-body-flex-start`);
        expect(headerBody.querySelector(`.${prefixCls}-item-body-main`)).toBeNull();
        const mainBody = items[2].querySelector(`.${prefixCls}-item-body`);
        expect(mainBody).toHaveClass(`${prefixCls}-item-body-center`);
        expect(mainBody.querySelector(`.${prefixCls}-item-body-header`)).toBeNull();
        expect(items[2].lastChild).toHaveClass(`${prefixCls}-item-extra`);
        expect(items[2].lastChild).toHaveTextContent(/^e$/);
    });

    it('项的 className 与 style', () => {
        const { container } = render(
            <List>
                <List.Item className="own" style={{ color: 'red' }} />
            </List>
        );
        const item = getItems(container)[0];
        expect(item).toHaveClass(`${prefixCls}-item`, 'own');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('项的事件处理函数优先于 List 的事件处理函数', () => {
        const listClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const listRightClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const itemClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const itemRightClick = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const { container } = render(
            <List onClick={listClick} onRightClick={listRightClick}>
                <List.Item onClick={itemClick} onRightClick={itemRightClick} />
                <List.Item />
            </List>
        );
        const items = getItems(container);
        fireEvent.click(items[0]);
        fireEvent.contextMenu(items[0]);
        expect(itemClick).toHaveBeenCalledTimes(1);
        expect(itemRightClick).toHaveBeenCalledTimes(1);
        expect(listClick).not.toHaveBeenCalled();
        expect(listRightClick).not.toHaveBeenCalled();
        fireEvent.click(items[1]);
        fireEvent.contextMenu(items[1]);
        expect(listClick).toHaveBeenCalledTimes(1);
        expect(listClick.mock.calls[0][0].target).toBe(items[1]);
        expect(listRightClick).toHaveBeenCalledTimes(1);
    });

    it('项的鼠标进入与离开', () => {
        const onMouseEnter = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const onMouseLeave = vi.fn<MouseEventHandler<HTMLLIElement>>();
        const { container } = render(
            <List>
                <List.Item onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
            </List>
        );
        const item = getItems(container)[0];
        fireEvent.mouseEnter(item);
        fireEvent.mouseLeave(item);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('data-* 属性透传到列表根节点与项的 li', () => {
        const { container } = render(
            <List data-testid="list">
                <List.Item data-testid="item" />
            </List>
        );
        expect(screen.getByTestId('list')).toBe(container.firstChild);
        expect(screen.getByTestId('item')).toBe(getItems(container)[0]);
    });

    it('其他 DOM 属性透传到列表根节点与项的 li', () => {
        const { container } = render(
            <List id="list" aria-label="items">
                <List.Item id="item" title="t" />
            </List>
        );
        expect(container.firstChild).toHaveAttribute('id', 'list');
        expect(container.firstChild).toHaveAttribute('aria-label', 'items');
        expect(getItems(container)[0]).toHaveAttribute('id', 'item');
        expect(getItems(container)[0]).toHaveAttribute('title', 't');
    });

    it('ref 指向列表根 div 与项的 li，StrictMode 与 grid 下同样如此', () => {
        const listRef = createRef<HTMLDivElement>();
        const itemRef = createRef<HTMLLIElement>();
        const { container } = render(
            <StrictMode>
                <List ref={listRef} grid={{ span: 12 }}>
                    <List.Item ref={itemRef} />
                </List>
            </StrictMode>
        );
        expect(listRef.current).toBe(container.firstChild);
        expect(itemRef.current).toBe(getItems(container)[0]);
    });

    it('grid 的类型只含 Row 与 Col 的布局属性', () => {
        type Grid = NonNullable<ListProps<unknown>['grid']>;
        const ok: Grid = { span: 12, gutter: 8, align: 'top', md: { span: 6 }, className: 'c' };
        expect(ok).toBeTruthy();
        // @ts-expect-error grid takes no arbitrary div attributes
        const bad: Grid = { id: 'x' };
        expect(bad).toBeTruthy();
        expectTypeOf<Grid>().not.toHaveProperty('id');
        expectTypeOf<Grid>().not.toHaveProperty('onClick');
    });

    it('读取 semiGlobal overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { List: { size: 'small', bordered: true } };
        try {
            const { container, rerender } = render(<List />);
            expect(container.firstChild).toHaveClass(`${prefixCls}-small`, `${prefixCls}-bordered`);
            rerender(<List size="large" />);
            expect(container.firstChild).toHaveClass(`${prefixCls}-large`, `${prefixCls}-bordered`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('空状态不是 ul 的子元素', () => {
        const { container } = render(<List dataSource={[]} />);
        expect(container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        expect(container.querySelector('ul')).toBeNull();
    });

    it('渲染的项设置 key，不产生 React key 警告', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            render(<List dataSource={['a', 'b']} renderItem={(item) => <List.Item>{item}</List.Item>} />);
            expect(spy.mock.calls.flat().join(' ')).not.toMatch(/unique "key" prop/);
        } finally {
            spy.mockRestore();
        }
    });

    it('数字 0 的 header、footer、loadMore、emptyContent 照常渲染', () => {
        const { container } = render(<List emptyContent={0} footer={0} header={0} loadMore={0} />);
        expect(container.querySelector('.semi-list-header')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.semi-list-footer')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.semi-list-empty')).toHaveTextContent(/^0$/);
        expect(container.firstElementChild?.textContent).toBe('0000');
    });

    it('List.Item 的 header、main、extra 为 0 时照常渲染', () => {
        const { container } = render(
            <List>
                <List.Item header={0} main={0} extra={0} />
            </List>
        );
        expect(container.querySelector('.semi-list-item-body-header')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.semi-list-item-body-main')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.semi-list-item-extra')).toHaveTextContent(/^0$/);
    });
});
