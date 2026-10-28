import { type ReactNode, memo, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import type { ColumnProps, RenderGroupSection, OnGroupedRow, TableComponents, Virtualized, RowKey, OnRowReturnObject } from '../interface';
import { useTableContext } from '../table-context';
import BaseRow from './base-row';

type SectionRecord = Parameters<OnGroupedRow<Record<string, any>>>[0];

export interface SectionRowProps {
    record?: SectionRecord;
    index?: number;
    columns?: ColumnProps[];
    group?: (string | number)[];
    groupKey: string | number;
    data?: Record<string, any>[];
    renderGroupSection?: RenderGroupSection;
    onGroupedRow?: OnGroupedRow<Record<string, any>>;
    clickGroupedRowToExpand?: boolean;
    components?: TableComponents;
    expanded?: boolean;
    prefixCls?: string;
    onExpand?: (willExpanded: boolean, groupKey: number | string, e: React.MouseEvent) => void;
    virtualized?: Virtualized;
    style?: React.CSSProperties;
    renderExpandIcon?: (record: Record<string, any>, isNested: boolean, groupKey: string | number) => ReactNode | null;
    className?: string;
    rowKey?: RowKey<any>;
}

/**
 * Props that Body forwards to SectionRow; everything else in Body's render props is dropped.
 */
export const sectionRowPropKeys = ['record', 'index', 'columns', 'group', 'groupKey', 'data', 'renderGroupSection', 'onGroupedRow', 'clickGroupedRowToExpand', 'components', 'expanded', 'prefixCls', 'onExpand', 'virtualized', 'style', 'renderExpandIcon', 'className', 'rowKey'];

const DEFAULT_COMPONENTS: TableComponents = {
    body: {
        row: 'tr',
        cell: 'td',
    },
};

function SectionRow({ record, columns: propColumns = [], prefixCls = cssClasses.PREFIX, className, expanded, renderGroupSection, components = DEFAULT_COMPONENTS, index, group, groupKey, virtualized, style, onGroupedRow, clickGroupedRowToExpand, onExpand, renderExpandIcon }: SectionRowProps) {
    const { getCellWidths } = useTableContext('Table.SectionRow');

    let column = {};
    let children: ReactNode = null;

    const cellProps: { colSpan?: number } = {};
    const cell = typeof renderGroupSection === 'function' ? renderGroupSection(groupKey, [...group]) : null;

    const onRow = (sectionRecord: SectionRecord, rowIndex: number): OnRowReturnObject => {
        const rowProps: { onClick?: (e: React.MouseEvent) => void } = {};

        if (typeof onGroupedRow === 'function') {
            Object.assign(rowProps, onGroupedRow(sectionRecord, rowIndex));
        }

        return {
            ...rowProps,
            onClick: (e: React.MouseEvent) => {
                if (typeof onExpand === 'function' && clickGroupedRowToExpand) {
                    onExpand(!expanded, groupKey, e);
                }

                if (typeof rowProps.onClick === 'function') {
                    rowProps.onClick(e);
                }
            },
        };
    };

    const renderSectionExpandIcon = (sectionRecord: any) => (typeof renderExpandIcon === 'function' ? renderExpandIcon(sectionRecord, false, groupKey) : null);

    if (!isValidElement(cell) && Object.prototype.toString.call(cell) === '[object Object]') {
        const { children: cellChildren, ...restProps } = cell as { children?: ReactNode };
        children = cellChildren;
        column = { ...restProps };
    } else {
        children = cell as ReactNode;
    }

    cellProps.colSpan = propColumns.length;

    const columns = [{ render: () => ({ props: cellProps, children }), ...column }];

    const rowCls = clsx(className, `${prefixCls}-row-section`, {
        on: expanded,
    });

    return (
        <BaseRow
            replaceClassName={rowCls}
            style={style}
            cellWidths={getCellWidths(columns)}
            columns={columns}
            components={components}
            expandableRow
            expanded={expanded}
            expandIcon
            index={index}
            isSection
            record={record}
            rowKey={groupKey}
            virtualized={virtualized}
            renderExpandIcon={renderSectionExpandIcon}
            onRow={onRow}
        />
    );
}

export default memo(SectionRow);
