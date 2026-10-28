import { children, createMemo, For, Show, splitProps, untrack, type JSX } from 'solid-js';
import clsx from 'clsx';
import { pick } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/list/constants';
import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/list/list.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import { Row } from '../grid';
import useLocale from '../locale/use-locale';
import Spin from '../spin';
import { type Grid, ListContext, type ListItemEventHandler } from './context';
import ListItem from './item';

const prefixCls = cssClasses.PREFIX;

export interface ListProps<T> extends ElementProps<'div', 'onClick'> {
    bordered?: boolean;
    footer?: JSX.Element;
    header?: JSX.Element;
    layout?: 'vertical' | 'horizontal';
    size?: Size;
    split?: boolean;
    emptyContent?: JSX.Element;
    dataSource?: T[];
    renderItem?: (item: T, ind: number) => JSX.Element;
    grid?: Grid;
    loading?: boolean;
    loadMore?: JSX.Element;
    onClick?: ListItemEventHandler;
    onRightClick?: ListItemEventHandler;
}

// The Row is a div that stands in for the ul, so it carries the list role itself
const listRole = { role: 'list' } as const;

// namedRole yields a plain string, which the typed role attribute does not accept
type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];

const defaultProps = {
    bordered: false,
    split: true,
    loading: false,
    layout: 'vertical',
    size: 'default',
} satisfies Partial<ListProps<unknown>>;

function List<T = any>(rawProps: ListProps<T>) {
    const props = useDefaultProps('List', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['bordered', 'children', 'class', 'dataSource', 'emptyContent', 'footer', 'grid', 'header', 'layout', 'loadMore', 'loading', 'onClick', 'onRightClick', 'renderItem', 'size', 'split']);

    const locale = useLocale('List');

    const header = children(() => local.header);
    const footer = children(() => local.footer);
    const loadMore = children(() => local.loadMore);

    // content equality: props spread from a signal object notify every key, which must not hand the items a new value
    const context = createMemo(() => ({ grid: local.grid, onClick: local.onClick, onRightClick: local.onRightClick }), undefined, { equals: shallowEqualObjects });
    const renderItem = createMemo(() => local.renderItem);

    // Rendered inside the provider, because the items a consumer passes as children read the context when they are created
    function Content() {
        const body = children(() => local.children);
        const showEmpty = () => !local.dataSource?.length && !hasContent(body());
        const emptyContent = children(() => (showEmpty() ? local.emptyContent : undefined));

        function Rows() {
            return (
                <>
                    <For each={local.dataSource}>
                        {(item, index) => {
                            // the render function and the index may change while the item stays; the items it builds are not tracked
                            const row = createMemo(() => {
                                const render = renderItem();
                                const position = index();
                                return render ? untrack(() => render(item, position)) : undefined;
                            });
                            return <>{row()}</>;
                        }}
                    </For>
                    {body()}
                </>
            );
        }

        return (
            <Show
                when={!showEmpty()}
                fallback={
                    <Show when={hasContent(emptyContent())} fallback={<div class={`${prefixCls}-empty`}>{locale().locale.emptyText}</div>}>
                        <div class={`${prefixCls}-empty`} x-semi-prop="emptyContent">
                            {emptyContent()}
                        </div>
                    </Show>
                }
            >
                <Show
                    when={local.grid}
                    fallback={
                        <ul class={`${prefixCls}-items`}>
                            <Rows />
                        </ul>
                    }
                >
                    {(grid) => (
                        <Row type="flex" {...pick(grid(), ['align', 'gutter', 'justify', 'type'])} {...listRole}>
                            <Rows />
                        </Row>
                    )}
                </Show>
            </Show>
        );
    }

    return (
        <div
            {...rest}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-flex`]: local.layout === 'horizontal',
                [`${prefixCls}-${local.size}`]: local.size,
                [`${prefixCls}-grid`]: local.grid,
                [`${prefixCls}-split`]: local.split,
                [`${prefixCls}-bordered`]: local.bordered,
            })}
        >
            <Show when={hasContent(header())}>
                <div class={`${prefixCls}-header`} x-semi-prop="header">
                    {header()}
                </div>
            </Show>
            <ListContext.Provider value={context}>
                <Spin size="large" spinning={local.loading}>
                    <Content />
                </Spin>
            </ListContext.Provider>
            <Show when={hasContent(footer())}>
                <div class={`${prefixCls}-footer`} x-semi-prop="footer">
                    {footer()}
                </div>
            </Show>
            {loadMore()}
        </div>
    );
}

export default Object.assign(List, { Item: ListItem });
