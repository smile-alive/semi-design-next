import { type JSX, createMemo, untrack } from 'solid-js';
import clsx from 'clsx';
import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
import callHandler from '../../_base/call-handler';
import { useTableContext } from '../context';
import { TableExpandIcon } from '../custom-expand-icon';
import type { ColumnProps, OnGroupedRow, OnRowReturnObject } from '../interface';
import { isRenderReturnObject } from '../utils';
import BaseRow from './base-row';

type SectionRecord = Parameters<OnGroupedRow<Record<string, any>>>[0];

export interface SectionRowProps {
    groupKey: string | number;
    /** The row keys of the group */
    group: BaseRowKeyType[];
    record: SectionRecord;
    index: number;
    expanded: boolean;
    style?: JSX.CSSProperties;
}

/** The row heading a group: one cell across the table with the group's expand button */
export default function SectionRow(props: SectionRowProps) {
    const table = useTableContext('Table.SectionRow');

    // called again when the group changes
    const cell = createMemo(() => {
        const render = table.props.renderGroupSection;
        const groupKey = props.groupKey;
        const group = [...props.group];
        return typeof render === 'function' ? untrack(() => render(groupKey, group)) : null;
    });

    const columns = createMemo((): ColumnProps[] => {
        const value = cell();
        let children = value as JSX.Element;
        let column: ColumnProps = {};
        if (isRenderReturnObject(value)) {
            const { children: cellChildren, ...restProps } = value as { children: JSX.Element } & ColumnProps;
            children = cellChildren;
            column = restProps;
        }
        const colSpan = table.flattenedColumns().length;
        return [{ render: () => children, ...column, onCell: (record, index) => ({ ...column.onCell?.(record, index), colSpan }) }];
    });

    const prefixCls = () => table.view().prefixCls;

    const onRow = (record: SectionRecord, index: number): OnRowReturnObject => {
        const own = table.props.onGroupedRow?.(record, index) ?? {};
        return {
            ...own,
            onClick: (e) => {
                if (table.props.clickGroupedRowToExpand) {
                    table.handleRowExpanded(!props.expanded, props.groupKey, e);
                }
                callHandler(own.onClick, e);
            },
        };
    };

    return (
        <BaseRow
            replaceClass={clsx(`${prefixCls()}-row-section`, { on: props.expanded })}
            style={props.style}
            cellWidths={table.getCellWidths(columns())}
            columns={columns()}
            expandableRow
            expanded={props.expanded}
            index={props.index}
            isSection
            record={props.record}
            rowKey={props.groupKey}
            renderExpandIcon={() => <TableExpandIcon record={props.record} groupKey={props.groupKey} />}
            onRow={onRow}
        />
    );
}
