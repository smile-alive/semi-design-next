import { memo } from 'react';
import clsx from 'clsx';
// compat get falls back to the default only for undefined, not null
import { get } from 'es-toolkit/compat';
import ColGroup from './col-group';
import type { TableComponents, Scroll, BodyScrollEvent, ColumnProps, OnHeaderRow, Sticky } from './interface';
import TableHeader from './table-header';

export interface HeadTableProps {
    tableLayout?: 'fixed' | 'auto';
    bodyHasScrollBar?: boolean;
    columns?: ColumnProps[];
    components?: TableComponents;
    handleBodyScroll?: React.EventHandler<BodyScrollEvent>;
    prefixCls?: string;
    scroll?: Scroll;
    showHeader?: boolean;
    onHeaderRow?: OnHeaderRow<any>;
    sticky?: Sticky;
    /** Attached to the header wrapper div */
    ref?: React.Ref<HTMLDivElement>;
}

/**
 * When the header is fixed, it is rendered as a separate Table
 */
function HeadTable({ ref, scroll, prefixCls, handleBodyScroll, columns, components, showHeader, tableLayout, bodyHasScrollBar, sticky, onHeaderRow }: HeadTableProps) {
    const Table = components?.header?.outer ?? 'table';
    const x = scroll?.x;
    const headStyle: Partial<React.CSSProperties> = {};
    const tableStyle: { width?: number | string } = {};

    if (x) {
        tableStyle.width = x;
    }

    if (bodyHasScrollBar) {
        headStyle.overflowY = 'scroll';
    }

    const headTableCls = clsx(`${prefixCls}-header`, {
        [`${prefixCls}-header-sticky`]: sticky,
        [`${prefixCls}-header-hidden`]: !showHeader,
    });

    const stickyTop = get(sticky, 'top', 0);

    if (typeof stickyTop === 'number') {
        headStyle.top = stickyTop;
    }

    return (
        // a hidden header stays for its column widths; inert keeps its controls out of the Tab order and the a11y tree
        <div ref={ref} className={headTableCls} style={headStyle} inert={!showHeader} onScroll={handleBodyScroll}>
            <Table
                className={clsx(prefixCls, {
                    [`${prefixCls}-fixed`]: tableLayout === 'fixed',
                })}
                style={tableStyle}
                role="none"
            >
                <ColGroup columns={columns} prefixCls={prefixCls} />
                <TableHeader bodyHasScrollBar={bodyHasScrollBar} columns={columns} components={components} prefixCls={prefixCls} onHeaderRow={onHeaderRow} />
            </Table>
        </div>
    );
}

export default memo(HeadTable);
