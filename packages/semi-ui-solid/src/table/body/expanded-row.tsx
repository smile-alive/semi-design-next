import { type JSX, Show, createMemo, untrack } from 'solid-js';
import clsx from 'clsx';
import { arrayAdd } from '@fibrae/semi-foundation/table/utils';
import { useTableContext } from '../context';
import type { ColumnProps, ExpandedRowRender } from '../interface';
import { isRenderReturnObject } from '../utils';
import BaseRow from './base-row';

export interface TableExpandedRowProps {
    cellWidths: number[];
    class?: string;
    /** The leaf columns of the table, which the expanded content spans */
    columns: ColumnProps[];
    expanded?: boolean;
    expandedRowRender?: ExpandedRowRender<any>;
    index?: number;
    record?: Record<string, any>;
    style?: JSX.CSSProperties;
    displayNone?: boolean;
    rowKey?: string | number;
}

export default function TableExpandedRow(props: TableExpandedRowProps) {
    const table = useTableContext('Table.ExpandedRow');

    // called again when the record, its index or its expanded state change
    const cell = createMemo(() => {
        const render = props.expandedRowRender;
        const record = props.record ?? {};
        const index = props.index as number;
        const expanded = Boolean(props.expanded);
        return render ? untrack(() => render(record, index, expanded)) : null;
    });

    const prefixCls = () => table.view().prefixCls;

    const columns = createMemo((): ColumnProps[] => {
        const value = cell();
        let children = value as JSX.Element;
        let column: ColumnProps = {};
        if (isRenderReturnObject(value)) {
            const { children: cellChildren, fixed: _fixed, ...restProps } = value as { children: JSX.Element; fixed?: unknown } & ColumnProps;
            children = cellChildren;
            column = restProps;
        }
        const cellProps: JSX.TdHTMLAttributes<HTMLElement> = {};
        if (table.view().components.body.cell !== 'td') {
            cellProps.style = { height: table.props.virtualized ? '100%' : undefined, display: 'block', width: `${arrayAdd(props.cellWidths, 0, props.columns.length)}px` };
        } else {
            cellProps.colSpan = props.columns.length;
        }
        return [
            {
                render: () => (
                    <div class={`${prefixCls()}-expand-inner`} style={{ width: table.view().anyColumnFixed ? 'var(--semi-table-section-width)' : undefined }}>
                        {children}
                    </div>
                ),
                ...column,
                onCell: (record, index) => ({ ...column.onCell?.(record, index), ...cellProps }),
            },
        ];
    });

    return (
        <Show when={cell() !== null}>
            <BaseRow class={clsx(props.class, `${prefixCls()}-row-expand`)} style={props.style} cellWidths={table.getCellWidths(columns())} columns={columns()} displayNone={props.displayNone} expandedRow index={props.index} rowKey={`${props.rowKey}-expanded-row`} />
        </Show>
    );
}
