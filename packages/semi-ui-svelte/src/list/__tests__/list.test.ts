import { createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { List, ListItem, type Grid, type ListItemProps } from '../index';
import ListDemo from './list-demo.svelte';
import ListItemState from './list-item-state.svelte';
import ListLocale from './list-locale.svelte';
import ListNested from './list-nested.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-list`;

const dataSource = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];

// createRawSnippet needs a single root element
const raw = (text: string) => createRawSnippet(() => ({ render: () => `<i>${text}</i>` }));
const row = (text: string, props: ListItemProps = {}) => ({ text, props });

const renderList = (props: Record<string, unknown> = {}) => render(ListDemo, { props: { dataSource, ...props } });
const getItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`);
const texts = (container: Element) => [...getItems(container)].map((item) => item.textContent?.trim());
const listOf = (container: Element) => container.firstElementChild as HTMLElement;

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = undefined;
});

describe('List', () => {
    it('children 放置 ListItem', () => {
        const view = renderList({ mode: 'children', dataSource: undefined, rows: dataSource });
        const items = getItems(view.container);
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent(/^从明天起，做一个幸福的人$/);
    });

    it('基础 item snippet 的 List', () => {
        const view = renderList();
        const items = getItems(view.container);
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent(/^从明天起，做一个幸福的人$/);
    });

    it('item snippet 含 header、main 与 extra 的 List', () => {
        const { container } = renderList({ mode: 'rich' });
        expect(container.querySelector(`.${prefixCls}-item-body-header .head`)).toHaveTextContent(/^SE$/);
        expect(container.querySelector(`.${prefixCls}-item-body-main .title`)).toHaveTextContent(/^示例标题$/);
        expect(container.querySelector(`.${prefixCls}-item-extra button`)).toHaveTextContent('编辑');
    });

    it('自定义 class / style 的 List', () => {
        const view = renderList({ class: 'test', style: 'height: 420px' });
        const list = listOf(view.container);
        expect(list).toHaveClass('test');
        expect(list).toHaveStyle({ height: '420px' });
    });

    it('bordered 的 List', () => {
        const view = renderList({ bordered: true });
        expect(listOf(view.container)).toHaveClass(`${prefixCls}-bordered`);
    });

    it('size 的 List', () => {
        for (const size of ['small', 'default', 'large'] as const) {
            const view = renderList({ size });
            expect(listOf(view.container)).toHaveClass(`${prefixCls}-${size}`);
            view.unmount();
        }
    });

    it('layout 的 List', () => {
        const store = createStore({ layout: 'horizontal' as 'horizontal' | 'vertical' });
        const view = renderList({ store });
        expect(listOf(view.container)).toHaveClass(`${prefixCls}-flex`);
        store.layout = 'vertical';
        flushSync();
        expect(listOf(view.container)).not.toHaveClass(`${prefixCls}-flex`);
    });

    it('grid 的 List', () => {
        const view = renderList({ grid: { gutter: 18, span: 6 } });
        const cols = view.container.querySelectorAll(`.${BASE_CLASS_PREFIX}-col-6`);
        expect(cols).toHaveLength(4);
        expect(cols[0].parentElement).toHaveStyle({ '--semi-row-gutter-x-xs': '18px' });
    });

    it('split 的 List', () => {
        const view = renderList({ split: false });
        expect(view.container.querySelector(`.${prefixCls}-split`)).toBeNull();
    });

    it('List 的 onClick', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({ onClick });
        await userEvent.click(getItems(view.container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('ListItem 的 onClick 只响应自己的项', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({ mode: 'children', dataSource: undefined, rows: [row('从明天起，做一个幸福的人', { onClick }), '喂马，劈柴，周游世界'] });
        const items = getItems(view.container);
        await userEvent.click(items[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.click(items[1]);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('loading 的 List', () => {
        const view = renderList({ loading: true });
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-spin-hidden`)).toBeNull();
        view.unmount();
        const view2 = renderList({ loading: false });
        expect(view2.container.querySelector(`.${BASE_CLASS_PREFIX}-spin-hidden`)).not.toBeNull();
    });

    it('loadMore 的 List', () => {
        renderList({ chrome: ['loadMore'] });
        expect(screen.getByRole('button', { name: '加载更多' })).toBeInTheDocument();
    });

    it('emptyContent 的 List', () => {
        const view = renderList({ dataSource: [], chrome: ['emptyContent'] });
        expect(view.container.querySelector(`.${prefixCls}-empty .empty`)).toHaveTextContent(/^自定义空内容$/);
        view.unmount();

        const view2 = renderList({ dataSource: [] });
        expect(view2.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
    });

    it('没有 children 时显示空状态，有 children 时不显示', () => {
        const view = renderList({ mode: 'none', dataSource: undefined });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        expect(view.container.querySelector(`.${prefixCls}-items`)).toBeNull();
        view.unmount();

        const view2 = renderList({ mode: 'children', dataSource: undefined, rows: ['a'] });
        expect(view2.container.querySelector(`.${prefixCls}-empty`)).toBeNull();
        expect(texts(view2.container)).toEqual(['a']);
    });

    it('footer 与 header 的 List', () => {
        const view = renderList({ chrome: ['header', 'footer'] });
        expect(view.container.querySelector(`.${prefixCls}-header .header`)).toHaveTextContent(/^头部$/);
        expect(view.container.querySelector(`.${prefixCls}-footer .footer`)).toHaveTextContent(/^尾部$/);
    });

    it('loading 且 dataSource 为空时，List 显示空状态 div', () => {
        const view = renderList({ dataSource: [], loading: true });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).not.toBeNull();
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-spin-large`)).not.toBeNull();
    });

    it('根节点类名来自默认值与属性', () => {
        const plain = renderList({ dataSource: undefined, mode: 'none' });
        const list = listOf(plain.container);
        expect(list).toHaveClass(prefixCls, `${prefixCls}-default`, `${prefixCls}-split`);
        expect(list).not.toHaveClass(`${prefixCls}-bordered`, `${prefixCls}-flex`, `${prefixCls}-grid`);
        plain.unmount();
        const view = renderList({ bordered: true, grid: { span: 12 }, layout: 'horizontal', size: 'small', split: false });
        expect(listOf(view.container).className).toBe(`${prefixCls} ${prefixCls}-flex ${prefixCls}-small ${prefixCls}-grid ${prefixCls}-bordered`);
    });

    it('ListItem 脱离 List 使用时渲染为普通 li', () => {
        const { container } = render(ListItem, { props: { children: raw('solo') } });
        expect(container.querySelector('li')).toHaveTextContent('solo');
        expect(container.querySelector('li')).not.toHaveAttribute('tabindex');
    });

    it('可点击的项把 tabindex 与 aria-* 落在按钮上，不可点击的项落在 li 上', () => {
        const view = renderList({
            mode: 'children',
            dataSource: undefined,
            rows: [row('a', { 'aria-label': 'first', tabindex: -1, onClick: () => {} }), row('b', { 'aria-label': 'second', tabindex: -1 })],
        });
        const [first, second] = getItems(view.container);
        expect(first).not.toHaveAttribute('aria-label');
        expect(first).not.toHaveAttribute('tabindex');
        expect(screen.getByRole('button', { name: 'first' })).toHaveAttribute('tabindex', '-1');
        expect(second).toHaveAttribute('aria-label', 'second');
        expect(second).toHaveAttribute('tabindex', '-1');
    });

    it('可点击项以原生按钮作为唯一的 Tab 停留点，普通项没有', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({ mode: 'children', dataSource: undefined, rows: [row('a', { onClick }), 'b'] });
        const items = getItems(view.container);
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

    it('通过 List 的 onClick 可点击的项同样渲染为按钮', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({ onClick });
        expect(view.container.querySelectorAll('button')).toHaveLength(4);
        screen.getByRole('button', { name: dataSource[2] }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('仅支持右键的项渲染为按钮，其上的右键菜单触发 onRightClick', async () => {
        const onRightClick = vi.fn<(event: MouseEvent) => void>();
        renderList({ mode: 'children', dataSource: undefined, rows: [row('a', { onRightClick })] });
        await fireEvent.contextMenu(screen.getByRole('button', { name: 'a' }));
        expect(onRightClick).toHaveBeenCalledTimes(1);
        expect(onRightClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('header 与 main 位于按钮内，extra 位于按钮外', () => {
        const view = renderList({ mode: 'rich', dataSource: ['x'], itemProps: { onClick: () => {} } });
        const itemButton = view.container.querySelector(`.${prefixCls}-item-button`);
        expect(itemButton).toHaveTextContent('SE示例标题x');
        expect(itemButton?.querySelector('div, button')).toBeNull();
        const extraButton = screen.getByRole('button', { name: '编辑' });
        expect(itemButton?.contains(extraButton)).toBe(false);
        expect(view.container.querySelectorAll(`.${prefixCls}-item button`)).toHaveLength(2);
    });

    it('extra 内嵌套的 List 的 extra 按钮不触发外层 onClick', async () => {
        const onInner = vi.fn<() => void>();
        const onOuter = vi.fn<(event: MouseEvent) => void>();
        render(ListNested, { props: { onInner, onOuter } });
        await userEvent.click(screen.getByRole('button', { name: 'InnerAct' }));
        expect(onInner).toHaveBeenCalledTimes(1);
        expect(onOuter).not.toHaveBeenCalled();
    });

    it('没有 item snippet 时，dataSource 既不渲染项也不显示空状态', () => {
        const view = renderList({ mode: 'none', dataSource: ['a'] });
        expect(view.container.querySelector(`.${prefixCls}-items`)?.children).toHaveLength(0);
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toBeNull();
    });

    it('children 的项跟随 dataSource 的项，并屏蔽空状态', () => {
        const store = createStore({ dataSource: ['a'] });
        const view = renderList({ mode: 'both', rows: ['child'], store });
        expect(texts(view.container)).toEqual(['a', 'child']);
        store.dataSource = [];
        flushSync();
        expect(texts(view.container)).toEqual(['child']);
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toBeNull();
    });

    it('dataSource 变化时更新项', () => {
        const store = createStore({ dataSource: ['a', 'b'] });
        const view = renderList({ store });
        store.dataSource = ['b', 'c', 'd'];
        flushSync();
        expect(texts(view.container)).toEqual(['b', 'c', 'd']);
        store.dataSource = [];
        flushSync();
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
    });

    it('空文本跟随语言包，emptyContent 占据其位置', () => {
        const english = render(ListLocale);
        const empty = english.container.querySelector(`.${prefixCls}-empty`);
        expect(empty).toHaveTextContent(/^No Result$/);
        expect(empty).not.toHaveAttribute('x-semi-prop');
        english.unmount();
        const custom = renderList({ dataSource: [], chrome: ['emptyContent'] });
        expect(custom.container.querySelector(`.${prefixCls}-empty`)).toHaveAttribute('x-semi-prop', 'emptyContent');
    });

    it('header、footer 与 loadMore 的顺序', () => {
        const view = renderList({ chrome: ['header', 'footer', 'loadMore'] });
        const children = [...listOf(view.container).children];
        expect(children[0]).toHaveClass(`${prefixCls}-header`);
        expect(children[0]).toHaveAttribute('x-semi-prop', 'header');
        expect(children[1]).toHaveClass(`${BASE_CLASS_PREFIX}-spin`);
        expect(children[2]).toHaveClass(`${prefixCls}-footer`);
        expect(children[2]).toHaveAttribute('x-semi-prop', 'footer');
        expect(children[3].tagName).toBe('BUTTON');
    });

    it('grid 将各项包裹在 flex Row 中，每项放在一个 Col 中', () => {
        const view = renderList({ grid: { gutter: 20, justify: 'center', align: 'middle', span: 8, xs: 24, class: 'col' } });
        expect(view.container.querySelector(`.${prefixCls}-items`)).toBeNull();
        const gridRow = view.container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`) as HTMLElement;
        expect(gridRow).toHaveClass(`${BASE_CLASS_PREFIX}-row-flex-center`, `${BASE_CLASS_PREFIX}-row-flex-middle`);
        expect(gridRow).toHaveStyle({ '--semi-row-gutter-x-md': '20px' });
        const cols = gridRow.children;
        expect(cols).toHaveLength(4);
        expect(cols[0]).toHaveClass(`${BASE_CLASS_PREFIX}-col`, `${BASE_CLASS_PREFIX}-col-8`, `${BASE_CLASS_PREFIX}-col-xs-24`, 'col');
        expect(cols[0].firstElementChild).toHaveClass(`${prefixCls}-item`);
    });

    it('grid 保持列表语义：Row 即列表，布局用的 Col 没有自己的 role', () => {
        const view = renderList({ grid: { span: 12 } });
        const gridRow = view.container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`) as HTMLElement;
        expect(screen.getByRole('list')).toBe(gridRow);
        for (const col of gridRow.children) {
            expect(col).toHaveAttribute('role', 'none');
        }
        expect(screen.getAllByRole('listitem')).toHaveLength(dataSource.length);
    });

    it('不传 Row 属性时，grid 仍使用 flex Row 布局', () => {
        const view = renderList({ grid: {} });
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`)?.children).toHaveLength(4);
    });

    it('只有 header 或 main 时才渲染项的主体，align 设置其类名', () => {
        const view = renderList({
            mode: 'children',
            dataSource: undefined,
            rows: [row('plain'), row('', { header: raw('h') }), row('', { main: raw('m'), extra: raw('e'), align: 'center' })],
        });
        const items = getItems(view.container);
        expect(items[0].querySelector(`.${prefixCls}-item-body`)).toBeNull();
        expect(items[0].querySelector(`.${prefixCls}-item-extra`)).toBeNull();
        const headerBody = items[1].querySelector(`.${prefixCls}-item-body`);
        expect(headerBody).toHaveClass(`${prefixCls}-item-body-flex-start`);
        expect(headerBody?.querySelector(`.${prefixCls}-item-body-main`)).toBeNull();
        const mainBody = items[2].querySelector(`.${prefixCls}-item-body`);
        expect(mainBody).toHaveClass(`${prefixCls}-item-body-center`);
        expect(mainBody?.querySelector(`.${prefixCls}-item-body-header`)).toBeNull();
        expect(items[2].lastElementChild).toHaveClass(`${prefixCls}-item-extra`);
        expect(items[2].lastElementChild).toHaveTextContent(/^e$/);
    });

    it('项的 class 与 style 落在 li 上，grid 下也是', () => {
        const own = { class: 'own', style: 'color: red' };
        const view = renderList({ mode: 'children', dataSource: undefined, rows: [row('a', own)] });
        const li = getItems(view.container)[0];
        expect(li).toHaveClass(`${prefixCls}-item`, 'own');
        expect(li).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        view.unmount();

        const gridView = renderList({ grid: { span: 12, class: 'col', style: 'color: blue' }, mode: 'children', dataSource: undefined, rows: [row('a', own)] });
        const gridLi = getItems(gridView.container)[0];
        expect(gridLi).toHaveClass('own');
        expect(gridLi).not.toHaveClass('col');
        expect(gridLi.parentElement).toHaveClass('col');
        expect(gridLi.parentElement).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('项的事件处理函数优先于 List 的事件处理函数', async () => {
        const listClick = vi.fn<(event: MouseEvent) => void>();
        const listRightClick = vi.fn<(event: MouseEvent) => void>();
        const itemClick = vi.fn<(event: MouseEvent) => void>();
        const itemRightClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({
            onClick: listClick,
            onRightClick: listRightClick,
            mode: 'children',
            dataSource: undefined,
            rows: [row('a', { onClick: itemClick, onRightClick: itemRightClick }), 'b'],
        });
        const items = getItems(view.container);
        await fireEvent.click(items[0]);
        await fireEvent.contextMenu(items[0]);
        expect(itemClick).toHaveBeenCalledTimes(1);
        expect(itemRightClick).toHaveBeenCalledTimes(1);
        expect(listClick).not.toHaveBeenCalled();
        expect(listRightClick).not.toHaveBeenCalled();
        await fireEvent.click(items[1]);
        await fireEvent.contextMenu(items[1]);
        expect(listClick).toHaveBeenCalledTimes(1);
        expect(listClick.mock.calls[0][0].target).toBe(items[1]);
        expect(listRightClick).toHaveBeenCalledTimes(1);
    });

    it('项的鼠标进入与离开落在 li 上', async () => {
        const onmouseenter = vi.fn<(event: MouseEvent) => void>();
        const onmouseleave = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({ mode: 'children', dataSource: undefined, rows: [row('a', { onmouseenter, onmouseleave })] });
        const item = getItems(view.container)[0];
        await fireEvent.mouseEnter(item);
        await fireEvent.mouseLeave(item);
        expect(onmouseenter).toHaveBeenCalledTimes(1);
        expect(onmouseleave).toHaveBeenCalledTimes(1);
    });

    it('data-* 与其他 DOM 属性透传到列表根节点与项的 li', () => {
        const view = renderList({ 'data-testid': 'list', id: 'list', mode: 'children', dataSource: undefined, rows: [row('a', { 'data-testid': 'item', id: 'item', title: 't' })] });
        expect(screen.getByTestId('list')).toBe(listOf(view.container));
        expect(screen.getByTestId('item')).toBe(getItems(view.container)[0]);
        expect(listOf(view.container)).toHaveAttribute('id', 'list');
        expect(getItems(view.container)[0]).toHaveAttribute('id', 'item');
        expect(getItems(view.container)[0]).toHaveAttribute('title', 't');
    });

    it('header 出现或消失时，children 里的元素与状态保留', async () => {
        const view = render(ListItemState);
        const input = screen.getByLabelText('state');
        await userEvent.type(input, 'abc');
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(view.container.querySelector(`.${prefixCls}-item-body-header`)).toHaveTextContent('head');
        expect(screen.getByLabelText('state')).toBe(input);
        expect(input).toHaveValue('abc');
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByLabelText('state')).toBe(input);
        expect(input).toHaveValue('abc');
    });

    it('grid 的类型只含 Row 与 Col 的布局属性', () => {
        const ok: Grid = { span: 12, gutter: 8, align: 'top', md: { span: 6 }, class: 'c' };
        expect(ok).toBeTruthy();
        // @ts-expect-error grid takes no arbitrary div attributes
        const bad: Grid = { id: 'x' };
        expect(bad).toBeTruthy();
        expectTypeOf<Grid>().not.toHaveProperty('id');
        expectTypeOf<Grid>().not.toHaveProperty('onClick');
    });

    it('读取 semiGlobal overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { List: { size: 'small', bordered: true } };
        const view = renderList();
        expect(listOf(view.container)).toHaveClass(`${prefixCls}-small`, `${prefixCls}-bordered`);
        view.unmount();
        const explicit = renderList({ size: 'large' });
        expect(listOf(explicit.container)).toHaveClass(`${prefixCls}-large`, `${prefixCls}-bordered`);
    });

    it('全局默认的 onClick 让项可点击', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        semiGlobal.config.overrideDefaultProps = { List: { onClick } };
        renderList({ mode: 'children', dataSource: undefined, rows: ['a'] });
        await userEvent.click(screen.getByRole('button', { name: 'a' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('空状态不是 ul 的子元素', () => {
        const view = renderList({ dataSource: [] });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        expect(view.container.querySelector('ul')).toBeNull();
    });

    it('点击与右键只落在项上，不落在根元素', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onRightClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderList({ onClick, onRightClick });
        await fireEvent.click(listOf(view.container));
        await fireEvent.contextMenu(listOf(view.container));
        expect(onClick).not.toHaveBeenCalled();
        expect(onRightClick).not.toHaveBeenCalled();
        await fireEvent.click(getItems(view.container)[0]);
        await fireEvent.contextMenu(getItems(view.container)[0]);
        expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onRightClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('children 与具名 snippet 在有无 grid 时都只渲染一次，落在各自区域', () => {
        for (const grid of [undefined, { span: 12 }]) {
            const view = renderList({
                grid,
                mode: 'children',
                dataSource: undefined,
                rows: [row('body', { header: raw('head'), extra: raw('more') })],
            });
            const [item] = getItems(view.container);
            expect(item.textContent).toBe('headbodymore');
            expect(item.querySelector(`.${prefixCls}-item-body-header`)).toHaveTextContent('head');
            expect(item.querySelector(`.${prefixCls}-item-extra`)).toHaveTextContent('more');
            view.unmount();
        }
    });

    it('提供 aria-label 或 aria-labelledby 时根元素是 group，使用方传入的 role 优先', () => {
        const none = renderList();
        expect(listOf(none.container)).not.toHaveAttribute('role');
        none.unmount();

        const labelled = renderList({ 'aria-label': 'tasks' });
        expect(screen.getByRole('group', { name: 'tasks' })).toBe(listOf(labelled.container));
        labelled.unmount();

        const own = renderList({ 'aria-label': 'tasks', role: 'region' });
        expect(listOf(own.container)).toHaveAttribute('role', 'region');
    });

    it('List 作为不带泛型参数的组件也能渲染', () => {
        const { container } = render(List, { props: { dataSource: ['a'] } });
        expect(listOf(container)).toHaveClass(prefixCls);
    });
});
