import type { BaseRowKeyType, BaseHeadWidth } from '@fibrae/semi-foundation/table/foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { createContext } from '../_base/create-context';
import type { ContextValue } from '../config-provider/context';
import type { ColumnProps, GetVirtualizedListRef } from './interface';

export interface TableContextProps {
    anyColumnFixed?: boolean;
    flattenedColumns?: ColumnProps[];
    /** The width of section and expanded rows; undefined until the table is measured */
    headWidths?: BaseHeadWidth[][];
    setHeadWidths?: (headWidth?: BaseHeadWidth[], index?: number) => void;
    getCellWidths?: (flattenColumns: ColumnProps[]) => number[];
    handleRowExpanded?: (expanded: boolean, realKey: BaseRowKeyType, domEvent: React.MouseEvent<HTMLElement>) => void;
    renderExpandIcon?: (record: Record<string, any>, isNested?: boolean, groupKey?: string | number) => React.ReactNode;
    renderSelection?: (record?: Record<string, any>, isHeader?: boolean, index?: number) => React.ReactNode;
    getVirtualizedListRef?: GetVirtualizedListRef;
    setBodyHasScrollbar?: (bodyHasScrollbar: boolean) => void;
    direction?: ContextValue['direction'];
    handleRowSelection?: (rowKey: BaseRowKeyType, selected: boolean, e: React.MouseEvent) => void;
    headerStyle?: React.CSSProperties;
    /** Whether to highlight all related rows when hovering over a rowspan cell */
    rowSpanHover?: boolean;
    /**
     * The header and the body render as separate elements (fixed header, sticky or virtualized): their common
     * container carries the table role and the table elements inside are role="none"
     */
    splitTable?: boolean;
    /** The accessible name and description of the table, applied to whichever element has role="table" */
    tableAria?: Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby'>;
    /** Rows of the header, which come before the body rows in aria-rowindex */
    headerRowCount?: number;
}

export const [TableContext, useTableContext] = createContext<TableContextProps>('Table', {
    defaultValue: {
        headWidths: [],
        setHeadWidths: noop,
        handleRowExpanded: noop,
    },
});
