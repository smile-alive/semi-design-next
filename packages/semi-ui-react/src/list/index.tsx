import type React from 'react';
import { Children, cloneElement, isValidElement, useMemo } from 'react';
import clsx from 'clsx';
import { pick } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/list/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/list/list.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import { hasContent } from '../_utils';
import { Row } from '../grid';
import LocaleConsumer from '../locale/locale-consumer';
import Spin from '../spin';
import ListItem from './item';
import { ListContext, type Grid } from './list-context';

export type { ListItemProps } from './item';

export interface ListProps<T> extends ElementProps<'div', 'onClick'> {
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    bordered?: boolean;
    footer?: React.ReactNode;
    header?: React.ReactNode;
    layout?: 'vertical' | 'horizontal';
    size?: Size;
    split?: boolean;
    emptyContent?: React.ReactNode;
    dataSource?: T[];
    renderItem?: (item: T, ind: number) => React.ReactNode;
    grid?: Grid;
    loading?: boolean;
    loadMore?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLLIElement>;
    onRightClick?: React.MouseEventHandler<HTMLLIElement>;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const prefixCls = cssClasses.PREFIX;
// RowProps declares only the Row's own props (F6); role still lands on its div (F2)
const listRole = { role: 'list' };

const defaultProps = {
    bordered: false,
    split: true,
    loading: false,
    layout: 'vertical',
    size: 'default',
} satisfies Partial<ListProps<unknown>>;

function List<T = any>(rawProps: ListProps<T>) {
    const { ref, className, header, loading, onRightClick, onClick, footer, layout, grid, size, split, loadMore, bordered, dataSource, renderItem, emptyContent, children, ...rest } = useDefaultProps('List', rawProps, defaultProps);

    let items: React.ReactNode;

    const context = useMemo(() => ({ grid, onClick, onRightClick }), [grid, onClick, onRightClick]);
    const showEmpty = !dataSource?.length && Children.toArray(children).length === 0;

    if (dataSource?.length) {
        const rendered = renderItem ? dataSource.map((item, index) => renderItem(item, index)) : [];
        // collected by hand: React 19 warns about missing keys on a Children.map result here
        const keyed: React.ReactNode[] = [];
        Children.forEach(rendered, (child, index) => {
            if (isValidElement(child)) {
                keyed.push(cloneElement(child, { key: child.key || `list-item-${index}` }));
            } else if (child != null && typeof child !== 'boolean') {
                keyed.push(child);
            }
        });
        items = keyed;
    } else if (showEmpty) {
        items = hasContent(emptyContent) ? (
            <div className={`${prefixCls}-empty`} x-semi-prop="emptyContent">
                {emptyContent}
            </div>
        ) : (
            <LocaleConsumer componentName="List">{(locale: Locale['List']) => <div className={`${prefixCls}-empty`}>{locale.emptyText}</div>}</LocaleConsumer>
        );
    }

    return (
        <div
            role={namedRole(rest)}
            {...rest}
            ref={ref}
            className={clsx(prefixCls, className, {
                [`${prefixCls}-flex`]: layout === 'horizontal',
                [`${prefixCls}-${size}`]: size,
                [`${prefixCls}-grid`]: grid,
                [`${prefixCls}-split`]: split,
                [`${prefixCls}-bordered`]: bordered,
            })}
        >
            {hasContent(header) && (
                <div className={`${prefixCls}-header`} x-semi-prop="header">
                    {header}
                </div>
            )}
            <ListContext value={context}>
                <Spin size="large" spinning={loading}>
                    {showEmpty ? (
                        items
                    ) : grid ? (
                        <Row type="flex" {...pick(grid, ['align', 'gutter', 'justify', 'type'])} {...listRole}>
                            {items}
                            {children}
                        </Row>
                    ) : (
                        <ul className={`${prefixCls}-items`}>
                            {items}
                            {children}
                        </ul>
                    )}
                </Spin>
            </ListContext>
            {hasContent(footer) && (
                <div className={`${prefixCls}-footer`} x-semi-prop="footer">
                    {footer}
                </div>
            )}
            {loadMore}
        </div>
    );
}

export default Object.assign(List, { Item: ListItem });
