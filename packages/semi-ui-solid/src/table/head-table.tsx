import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
// compat get falls back to the default only for undefined, not null
import { get } from 'es-toolkit/compat';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import ColGroup from './col-group';
import { useTableContext } from './context';
import type { ColumnProps } from './interface';
import TableHeader from './table-header';

export interface HeadTableProps {
    columns: ColumnProps[];
    /** Receives the header wrapper div */
    ref?: (element: HTMLDivElement) => void;
}

/**
 * When the header is fixed, it is rendered as a separate table
 */
export default function HeadTable(props: HeadTableProps) {
    const table = useTableContext('Table.HeadTable');

    const prefixCls = () => table.view().prefixCls;

    const headStyle = () => {
        const style: JSX.CSSProperties = {};
        if (table.state().bodyHasScrollBar) {
            style['overflow-y'] = 'scroll';
        }
        const stickyTop = get(table.props.sticky, 'top', 0);
        if (typeof stickyTop === 'number') {
            style.top = toCssLength(stickyTop);
        }
        return style;
    };

    return (
        // a hidden header stays for its column widths; inert keeps its controls out of the Tab order and the a11y tree
        <div
            ref={(element) => props.ref?.(element)}
            class={clsx(`${prefixCls()}-header`, {
                [`${prefixCls()}-header-sticky`]: Boolean(table.props.sticky),
                [`${prefixCls()}-header-hidden`]: !table.props.showHeader,
            })}
            style={headStyle()}
            inert={!table.props.showHeader || undefined}
            onScroll={(e) => table.handleBodyScroll(e)}
        >
            <Dynamic component={table.view().components.header.outer} class={clsx(prefixCls(), { [`${prefixCls()}-fixed`]: table.view().tableLayout === 'fixed' })} style={{ width: toCssLength(table.props.scroll?.x) }} role="none">
                <ColGroup columns={props.columns} prefixCls={prefixCls()} />
                <TableHeader columns={props.columns} />
            </Dynamic>
        </div>
    );
}
