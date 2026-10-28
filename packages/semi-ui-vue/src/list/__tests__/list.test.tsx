/** @jsxImportSource vue */
import { type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { render } from '@test/utils/vue';
import List, { ListItem, type Grid, type ListItemSlotProps, type ListProps, type ListSlots } from '..';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Avatar from '../../avatar';
import Button, { ButtonGroup } from '../../button';
import LocaleProvider from '../../locale/locale-provider.vue';
import ConditionalItem from './fixtures/conditional-item.vue';
import Conditional from './fixtures/conditional.vue';
import DefaultChildren from './fixtures/default-children.vue';
import InstanceRefs from './fixtures/instance-refs.vue';
import ItemState from './fixtures/item-state.vue';
import Nested from './fixtures/nested.vue';
import TypedItem from './fixtures/typed-item.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-list`;

const dataSource = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];

const textItem = ({ item }: ListItemSlotProps<string>) => [<ListItem>{{ default: () => item }}</ListItem>];

function renderList(props: Partial<ListProps<string>> = {}, slots: ListSlots<string> = {}) {
    return render(List, { props: { dataSource, ...props }, slots: { item: textItem, ...slots } });
}

const getItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`);
const texts = (container: Element) => [...getItems(container)].map((item) => item.textContent);
const listOf = (container: Element) => container.firstElementChild as HTMLElement;

describe('List', () => {
    it('默认插槽放置 ListItem', () => {
        const view = render(List, {
            slots: { default: () => dataSource.map((text) => <ListItem>{{ default: () => text }}</ListItem>) },
        });
        const items = getItems(view.container);
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent(/^从明天起，做一个幸福的人$/);
    });

    it('基础 item 插槽的 List', () => {
        const view = renderList();
        const items = getItems(view.container);
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent(/^从明天起，做一个幸福的人$/);
    });

    it('item 插槽含 header、main 与 extra 的 List', () => {
        const view = renderList(
            {},
            {
                item: ({ item }) => [
                    <ListItem>
                        {{
                            header: () => <Avatar color="blue">{{ default: () => 'SE' }}</Avatar>,
                            main: () => (
                                <div>
                                    <span>示例标题</span>
                                    {item}
                                </div>
                            ),
                            extra: () => (
                                <ButtonGroup theme="borderless">
                                    {{
                                        default: () => [<Button>{() => '编辑'}</Button>],
                                    }}
                                </ButtonGroup>
                            ),
                        }}
                    </ListItem>,
                ],
            }
        );
        const { container } = view;
        expect(container.querySelector(`.${prefixCls}-item-body-header .${BASE_CLASS_PREFIX}-avatar-label`)).toHaveTextContent(/^SE$/);
        expect(container.querySelector(`.${prefixCls}-item-body-main span`)).toHaveTextContent(/^示例标题$/);
        expect(container.querySelector(`.${prefixCls}-item-extra .${BASE_CLASS_PREFIX}-button-group`)).not.toBeNull();
    });

    it('自定义 class / style 的 List', () => {
        const view = render(List, { attrs: { class: 'test', style: { height: '420px' } } });
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

    it('layout 的 List', async () => {
        const view = renderList({ layout: 'horizontal' });
        expect(listOf(view.container)).toHaveClass(`${prefixCls}-flex`);
        await view.rerender({ layout: 'vertical' });
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
        const view = render(List, {
            slots: {
                default: () => (
                    <>
                        <ListItem onClick={onClick}>{{ default: () => '从明天起，做一个幸福的人' }}</ListItem>
                        <ListItem>{{ default: () => '喂马，劈柴，周游世界' }}</ListItem>
                    </>
                ),
            },
        });
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
        renderList({}, { loadMore: () => [<Button>{() => '加载更多'}</Button>] });
        expect(screen.getByRole('button', { name: '加载更多' })).toBeInTheDocument();
    });

    it('emptyContent 的 List', () => {
        const view = renderList({ dataSource: [] }, { emptyContent: () => [<span class="empty">自定义空内容</span>] });
        expect(view.container.querySelector(`.${prefixCls}-empty .empty`)).toHaveTextContent(/^自定义空内容$/);
        view.unmount();

        const view2 = renderList({ dataSource: [] });
        expect(view2.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
    });

    it('默认插槽没有内容时显示空状态', () => {
        const view = render(DefaultChildren, { props: { rows: [], show: false } });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        expect(view.container.querySelector(`.${prefixCls}-items`)).toBeNull();
        view.unmount();

        const view2 = render(DefaultChildren, { props: { rows: ['a'] } });
        expect(view2.container.querySelector(`.${prefixCls}-empty`)).toBeNull();
        expect(texts(view2.container)).toEqual(['a']);
    });

    it('footer 与 header 的 List', () => {
        const view = renderList(
            {},
            {
                header: () => [<div class="header">头部</div>],
                footer: () => [<div class="footer">尾部</div>],
            }
        );
        expect(view.container.querySelector(`.${prefixCls}-header .header`)).toHaveTextContent(/^头部$/);
        expect(view.container.querySelector(`.${prefixCls}-footer .footer`)).toHaveTextContent(/^尾部$/);
    });

    it('loading 且 dataSource 为空时，List 显示空状态 div', () => {
        const view = renderList({ dataSource: [], loading: true });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).not.toBeNull();
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-spin-large`)).not.toBeNull();
    });

    it('根节点类名来自默认值与属性', async () => {
        const view = render(List);
        const list = listOf(view.container);
        expect(list).toHaveClass(prefixCls, `${prefixCls}-default`, `${prefixCls}-split`);
        expect(list).not.toHaveClass(`${prefixCls}-bordered`, `${prefixCls}-flex`, `${prefixCls}-grid`);
        await view.rerender({ bordered: true, grid: { span: 12 }, layout: 'horizontal', size: 'small', split: false });
        expect(list.className).toBe(`${prefixCls} ${prefixCls}-flex ${prefixCls}-small ${prefixCls}-grid ${prefixCls}-bordered`);
    });

    it('ListItem 脱离 List 使用时渲染为普通 li', () => {
        const view = render(ListItem, { slots: { default: () => 'solo' } });
        expect(view.container.querySelector('li')).toHaveTextContent('solo');
        expect(view.container.querySelector('li')).not.toHaveAttribute('tabindex');
    });

    it('item 插槽可以返回空、文本、数字与布尔值', () => {
        const values: unknown[] = [null, 'text', 0, 7, false, 'el'];
        const view = render(List, {
            props: { dataSource: values },
            slots: {
                item: ({ item }: { item: unknown }) => (typeof item === 'string' && item === 'el' ? <ListItem key="x">{{ default: () => item }}</ListItem> : (item as VNode)),
            },
        });
        expect(view.container.querySelector(`.${prefixCls}-items`)).toHaveTextContent('text07el');
        expect(getItems(view.container)).toHaveLength(1);
    });

    it('可点击的项把 tabindex 与 aria-* 落在按钮上，不可点击的项落在 li 上', () => {
        const view = render(List, {
            slots: {
                default: () => (
                    <>
                        <ListItem aria-label="first" tabindex={-1} onClick={() => {}}>
                            {{ default: () => 'a' }}
                        </ListItem>
                        <ListItem aria-label="second" tabindex={-1}>
                            {{ default: () => 'b' }}
                        </ListItem>
                    </>
                ),
            },
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
        const view = render(List, {
            slots: {
                default: () => (
                    <>
                        <ListItem onClick={onClick}>{{ default: () => 'a' }}</ListItem>
                        <ListItem>{{ default: () => 'b' }}</ListItem>
                    </>
                ),
            },
        });
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
        render(List, {
            slots: { default: () => <ListItem onRightClick={onRightClick}>{{ default: () => 'a' }}</ListItem> },
        });
        await fireEvent.contextMenu(screen.getByRole('button', { name: 'a' }));
        expect(onRightClick).toHaveBeenCalledTimes(1);
        expect(onRightClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('header 与 main 位于按钮内，extra 位于按钮外', () => {
        const onExtra = vi.fn<() => void>();
        const view = render(List, {
            slots: {
                default: () => (
                    <ListItem onClick={() => {}}>
                        {{
                            header: () => 'H',
                            main: () => 'M',
                            extra: () => <Button onClick={onExtra}>{() => 'Act'}</Button>,
                        }}
                    </ListItem>
                ),
            },
        });
        const itemButton = view.container.querySelector(`.${prefixCls}-item-button`);
        expect(itemButton).toHaveTextContent('HM');
        expect(itemButton?.querySelector('div, button')).toBeNull();
        const extraButton = screen.getByRole('button', { name: 'Act' });
        expect(itemButton?.contains(extraButton)).toBe(false);
        expect(view.container.querySelectorAll(`.${prefixCls}-item button`)).toHaveLength(2);
    });

    it('extra 内嵌套的 List 的 extra 按钮不触发外层 onClick', async () => {
        const view = render(Nested);
        await userEvent.click(screen.getByRole('button', { name: 'InnerAct' }));
        expect(view.emitted().inner).toHaveLength(1);
        expect(view.emitted().outer).toBeUndefined();
    });

    it('item 插槽只以 item 与 index 调用', () => {
        const item = vi.fn<(props: ListItemSlotProps<string>) => VNode[]>(textItem);
        renderList({ dataSource: ['a', 'b'] }, { item });
        expect(item.mock.calls.map(([arg]) => arg)).toEqual([
            { item: 'a', index: 0 },
            { item: 'b', index: 1 },
        ]);
        expect(Object.keys(item.mock.calls[0][0]).sort()).toEqual(['index', 'item']);
    });

    it('没有 item 插槽时，dataSource 既不渲染项也不显示空状态', () => {
        const view = render(List, { props: { dataSource: ['a'] } });
        expect(view.container.querySelector(`.${prefixCls}-items`)?.children).toHaveLength(0);
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toBeNull();
    });

    it('默认插槽的项跟随 dataSource 的项，并屏蔽空状态', async () => {
        const view = render(List, {
            props: { dataSource: ['a'] },
            slots: {
                item: textItem,
                default: () => <ListItem>{{ default: () => 'child' }}</ListItem>,
            },
        });
        expect(texts(view.container)).toEqual(['a', 'child']);
        await view.rerender({ dataSource: [] });
        expect(texts(view.container)).toEqual(['child']);
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toBeNull();
    });

    it('dataSource 变化时更新项', async () => {
        const keyed = ({ item }: ListItemSlotProps<string>) => <ListItem key={item}>{{ default: () => item }}</ListItem>;
        const view = render(List, { props: { dataSource: ['a', 'b'] }, slots: { item: keyed } });
        await view.rerender({ dataSource: ['b', 'c', 'd'] });
        expect(texts(view.container)).toEqual(['b', 'c', 'd']);
        await view.rerender({ dataSource: [] });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
    });

    it('空文本跟随语言包，emptyContent 占据其位置', () => {
        const view = render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <List dataSource={[]} /> },
        });
        const empty = view.container.querySelector(`.${prefixCls}-empty`);
        expect(empty).toHaveTextContent(/^No Result$/);
        expect(empty).not.toHaveAttribute('x-semi-prop');
        view.unmount();
        const custom = render(List, { slots: { emptyContent: () => 'nothing' } });
        expect(custom.container.querySelector(`.${prefixCls}-empty`)).toHaveAttribute('x-semi-prop', 'emptyContent');
    });

    it('header、footer 与 loadMore 的顺序与插槽', () => {
        const view = render(List, {
            slots: {
                default: () => <ListItem>{{ default: () => 'i' }}</ListItem>,
                footer: () => 'f',
                header: () => 'h',
                loadMore: () => <span class="more">more</span>,
            },
        });
        const children = [...listOf(view.container).children];
        expect(children[0]).toHaveClass(`${prefixCls}-header`);
        expect(children[0]).toHaveAttribute('x-semi-prop', 'header');
        expect(children[1]).toHaveClass(`${BASE_CLASS_PREFIX}-spin`);
        expect(children[2]).toHaveClass(`${prefixCls}-footer`);
        expect(children[2]).toHaveAttribute('x-semi-prop', 'footer');
        expect(children[3]).toHaveClass('more');
    });

    it('grid 将各项包裹在 flex Row 中，每项放在一个 Col 中', () => {
        const view = renderList({
            grid: { gutter: 20, justify: 'center', align: 'middle', span: 8, xs: 24, class: 'col' },
        });
        expect(view.container.querySelector(`.${prefixCls}-items`)).toBeNull();
        const row = view.container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`) as HTMLElement;
        expect(row).toHaveClass(`${BASE_CLASS_PREFIX}-row-flex-center`, `${BASE_CLASS_PREFIX}-row-flex-middle`);
        expect(row).toHaveStyle({ '--semi-row-gutter-x-md': '20px' });
        const cols = row.children;
        expect(cols).toHaveLength(4);
        expect(cols[0]).toHaveClass(`${BASE_CLASS_PREFIX}-col`, `${BASE_CLASS_PREFIX}-col-8`, `${BASE_CLASS_PREFIX}-col-xs-24`, 'col');
        expect(cols[0].firstElementChild).toHaveClass(`${prefixCls}-item`);
    });

    it('grid 保持列表语义：Row 即列表，布局用的 Col 没有自己的 role', () => {
        const view = renderList({ grid: { span: 12 } });
        const row = view.container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`) as HTMLElement;
        expect(screen.getByRole('list')).toBe(row);
        for (const col of row.children) {
            expect(col).toHaveAttribute('role', 'none');
        }
        expect(screen.getAllByRole('listitem')).toHaveLength(dataSource.length);
    });

    it('不传 Row 属性时，grid 仍使用 flex Row 布局', () => {
        const view = renderList({ grid: {} });
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-row-flex`)?.children).toHaveLength(4);
    });

    it('只有 header 或 main 时才渲染项的主体，align 设置其类名', () => {
        const view = render(List, {
            slots: {
                default: () => (
                    <>
                        <ListItem>{{ default: () => 'plain' }}</ListItem>
                        <ListItem>{{ header: () => 'h' }}</ListItem>
                        <ListItem align="center">{{ main: () => 'm', extra: () => 'e' }}</ListItem>
                    </>
                ),
            },
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
        const item = () => <ListItem class="own" style={{ color: 'red' }} />;
        const view = render(List, { slots: { default: item } });
        const li = getItems(view.container)[0];
        expect(li).toHaveClass(`${prefixCls}-item`, 'own');
        expect(li).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        view.unmount();

        const gridView = render(List, {
            props: { grid: { span: 12, class: 'col', style: { color: 'blue' } } },
            slots: { default: item },
        });
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
        const view = render(List, {
            props: { onClick: listClick, onRightClick: listRightClick },
            slots: {
                default: () => (
                    <>
                        <ListItem onClick={itemClick} onRightClick={itemRightClick} />
                        <ListItem />
                    </>
                ),
            },
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

    it('项的鼠标进入与离开经 attrs 落在 li 上', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const onMouseleave = vi.fn<(event: MouseEvent) => void>();
        const view = render(List, {
            slots: { default: () => <ListItem onMouseenter={onMouseenter} onMouseleave={onMouseleave} /> },
        });
        const item = getItems(view.container)[0];
        await fireEvent.mouseEnter(item);
        await fireEvent.mouseLeave(item);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
        expect(onMouseleave).toHaveBeenCalledTimes(1);
    });

    it('data-* 与其他 DOM 属性透传到列表根节点与项的 li', () => {
        const view = render(List, {
            attrs: { 'data-testid': 'list', id: 'list' },
            slots: { default: () => <ListItem data-testid="item" id="item" title="t" /> },
        });
        expect(screen.getByTestId('list')).toBe(listOf(view.container));
        expect(screen.getByTestId('item')).toBe(getItems(view.container)[0]);
        expect(listOf(view.container)).toHaveAttribute('id', 'list');
        expect(getItems(view.container)[0]).toHaveAttribute('id', 'item');
        expect(getItems(view.container)[0]).toHaveAttribute('title', 't');
    });

    it('组件实例的 $el：List 是根 div，有 grid 时 ListItem 是外层 Col', () => {
        const view = render(InstanceRefs);
        expect(view.emitted<[Element, Element]>().els[0][0]).toBe(listOf(view.container));
        view.unmount();

        const gridView = render(InstanceRefs, { props: { grid: true } });
        const [gridList, gridItem] = gridView.emitted<[Element, Element]>().els[0];
        expect(gridList).toBe(listOf(gridView.container));
        expect(gridItem).toBe(getItems(gridView.container)[0].parentElement);
    });

    it('无 grid 时 ListItem 的 $el 是 li', () => {
        const view = render(InstanceRefs);
        expect(view.emitted<[Element, Element]>().els[0][1]).toBe(getItems(view.container)[0]);
        expect(getItems(view.container)[0].tagName).toBe('LI');
    });

    it('header 出现或消失时，默认插槽里的元素与状态保留', async () => {
        const view = render(ItemState);
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

    it('不可点击的 li 不绑定 click 监听', () => {
        const add = vi.spyOn(HTMLElement.prototype, 'addEventListener');
        const view = render(List, { slots: { default: () => <ListItem>{{ default: () => 'a' }}</ListItem> } });
        const li = getItems(view.container)[0];
        expect(add.mock.contexts.some((context, index) => context === li && add.mock.calls[index][0] === 'click')).toBe(false);
        add.mockRestore();
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

    it('读取 semiGlobal overrideDefaultProps，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { List: { size: 'small', bordered: true } };
        const view = render(List, { global: { provide: { [semiGlobalKey]: semi } } });
        expect(listOf(view.container)).toHaveClass(`${prefixCls}-small`, `${prefixCls}-bordered`);
        await view.rerender({ size: 'large' });
        expect(listOf(view.container)).toHaveClass(`${prefixCls}-large`, `${prefixCls}-bordered`);
    });

    it('全局默认的 onClick 让项可点击', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { List: { onClick } };
        const view = render(List, {
            global: { provide: { [semiGlobalKey]: semi } },
            slots: { default: () => <ListItem>{{ default: () => 'a' }}</ListItem> },
        });
        await userEvent.click(view.getByRole('button', { name: 'a' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('空状态不是 ul 的子元素', () => {
        const view = render(List, { props: { dataSource: [] } });
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        expect(view.container.querySelector('ul')).toBeNull();
    });

    it('渲染的项带 key：重排 dataSource 后 DOM 随 key 移动，无 key 的项按位置复用', async () => {
        const keyed = ({ item }: ListItemSlotProps<string>) => <ListItem key={item}>{{ default: () => item }}</ListItem>;
        const view = render(List, { props: { dataSource: ['a', 'b'] }, slots: { item: keyed } });
        const [a, b] = getItems(view.container);
        await view.rerender({ dataSource: ['b', 'a'] });
        const reordered = getItems(view.container);
        expect(reordered[0]).toBe(b);
        expect(reordered[1]).toBe(a);
        view.unmount();

        const plain = render(List, { props: { dataSource: ['a', 'b'] }, slots: { item: textItem } });
        const [first] = getItems(plain.container);
        await plain.rerender({ dataSource: ['b', 'a'] });
        expect(getItems(plain.container)[0]).toBe(first);
        expect(texts(plain.container)).toEqual(['b', 'a']);
    });

    it('item 插槽的 item 类型随 dataSource 推断', () => {
        const view = render(TypedItem);
        expect(texts(view.container)).toEqual(['0:ADA', '1:ALAN']);
        expectTypeOf<NonNullable<ListSlots<{ name: string }>['item']>>().parameter(0).toEqualTypeOf<{
            item: { name: string };
            index: number;
        }>();
    });

    it('@click 与 @rightClick 的载荷是原生 MouseEvent，不落到根元素', async () => {
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

    it('header、footer、emptyContent 的内容为 v-if 假时不渲染容器', async () => {
        const view = render(Conditional, { props: { show: false } });
        expect(view.container.querySelector(`.${prefixCls}-header`)).toBeNull();
        expect(view.container.querySelector(`.${prefixCls}-footer`)).toBeNull();
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent(/^暂无数据$/);
        await view.rerender({ show: true });
        expect(view.container.querySelector(`.${prefixCls}-header`)).toHaveTextContent('header');
        expect(view.container.querySelector(`.${prefixCls}-footer`)).toHaveTextContent('footer');
        expect(view.container.querySelector(`.${prefixCls}-empty`)).toHaveTextContent('custom empty');
    });

    it('item 插槽根节点用 v-if/v-else 且不写 key 时，反转 dataSource 不产生重复 key，旧项不残留', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const source = [
            { id: 'A', ok: true },
            { id: 'B', ok: false },
            { id: 'C', ok: true },
        ];
        const view = render(ConditionalItem, { props: { dataSource: source } });
        expect(texts(view.container)).toEqual(['A', 'B!', 'C']);
        await view.rerender({ dataSource: [...source].reverse() });
        expect(texts(view.container)).toEqual(['C', 'B!', 'A']);
        expect(warn.mock.calls.filter(([message]) => String(message).includes('Duplicate'))).toEqual([]);
        warn.mockRestore();
    });

    it('#default 不作为具名插槽转发：有无 grid 时默认内容都只渲染一次，具名插槽落在各自区域', () => {
        for (const grid of [undefined, { span: 12 }]) {
            const view = render(List, {
                props: { grid },
                slots: { default: () => <ListItem>{{ default: () => 'body', header: () => 'head', extra: () => 'more' }}</ListItem> },
            });
            const [item] = getItems(view.container);
            expect(item.textContent).toBe('headbodymore');
            expect(item.querySelector(`.${prefixCls}-item-body-header`)).toHaveTextContent('head');
            expect(item.querySelector(`.${prefixCls}-item-extra`)).toHaveTextContent('more');
            view.unmount();
        }
    });

    it('提供 aria-label 或 aria-labelledby 时根元素是 group，使用方传入的 role 优先', () => {
        const none = render(List);
        expect(listOf(none.container)).not.toHaveAttribute('role');
        none.unmount();

        const labelled = render(List, { attrs: { 'aria-label': 'tasks' } });
        expect(screen.getByRole('group', { name: 'tasks' })).toBe(listOf(labelled.container));
        labelled.unmount();

        const own = render(List, { attrs: { 'aria-label': 'tasks', role: 'region' } });
        expect(listOf(own.container)).toHaveAttribute('role', 'region');
    });
});
