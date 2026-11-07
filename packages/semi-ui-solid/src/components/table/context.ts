import type { Accessor } from 'solid-js';
import type TableFoundation from '@fibrae/semi-foundation/components/table/foundation';
import type { BaseHeadWidth, BaseRowKeyType, TableBaseProps, TableBaseState } from '@fibrae/semi-foundation/components/table/foundation';
import type { FlattenData, GroupFlattenData } from '@fibrae/semi-foundation/components/table/utils';
import { createContext } from '../../base/create-context';
import type { ColumnProps, Direction, RowSelectionProps, TableProps } from './interface';
import type { MergedTableComponents } from './utils';

type AnyRecord = Record<string, any>;

export type TableFoundationProps = TableBaseProps<AnyRecord> & Omit<TableProps, keyof TableBaseProps<AnyRecord>>;

/**
 * The foundation's state, its columns typed as the Solid column objects it keeps as given; the Solid callbacks take
 * Solid JSX attributes, which the foundation's column type does not admit
 */
export type TableState = Omit<TableBaseState<AnyRecord>, 'flattenColumns' | 'queries' | 'rowSelection'> & {
    flattenColumns?: ColumnProps[];
    queries?: ColumnProps[];
    rowSelection?: (RowSelectionProps<AnyRecord> & { selectedRowKeysSet?: Set<BaseRowKeyType> }) | null;
};

export interface TableView {
    prefixCls: string;
    direction?: Direction;
    anyColumnFixed: boolean;
    /**
     * The header and the body render as separate elements (fixed header, sticky or virtualized): their common
     * container carries the table role and the table elements inside are role="none"
     */
    splitTable: boolean;
    headerRowCount: number;
    components: MergedTableComponents;
    tableLayout: 'fixed' | 'auto';
}

export interface TableContextValue {
    view: Accessor<TableView>;
    props: TableProps;
    state: Accessor<Readonly<TableState>>;
    foundation: TableFoundation<AnyRecord, TableFoundationProps>;
    flattenedColumns: Accessor<ColumnProps[]>;
    /** The measured widths of the given leaf columns, in order; empty before the header is measured */
    getCellWidths: (columns: ColumnProps[]) => number[];
    setHeadWidths: (widths: BaseHeadWidth[], index: number) => void;
    setBodyHasScrollbar: (hasScrollbar: boolean) => void;
    handleBodyScroll: (event: Event) => void;
    handleRowExpanded: (expanded: boolean, rowKey: BaseRowKeyType, event?: Event) => void;
    handleRowSelection: (rowKey: BaseRowKeyType, selected: boolean, event: Event) => void;
    rowExpandable: (record: AnyRecord) => boolean;
    /** Whether `expandIcon` is not `false`, read without creating the icon */
    hasExpandIcon: Accessor<boolean>;
    /** The accessible name and description of the table, applied to whichever element has role="table" */
    tableAria: Accessor<{ 'aria-label'?: string; 'aria-labelledby'?: string; 'aria-describedby'?: string }>;
    virtualizedData: Accessor<Array<FlattenData | GroupFlattenData>>;
}

export const [TableContext, useTableContext] = createContext<TableContextValue>('Table');
