import type { Accessor } from 'solid-js';
import type TableFoundation from '@fibrae/semi-foundation/table/foundation';
import type { BaseHeadWidth, BaseRowKeyType, TableBaseProps, TableBaseState } from '@fibrae/semi-foundation/table/foundation';
import type { FlattenData, GroupFlattenData } from '@fibrae/semi-foundation/table/utils';
import { createContext } from '../_base/create-context';
import type { ColumnProps, Direction, RowSelectionProps, TableProps } from './interface';
import type { MergedTableComponents } from './utils';

type AnyRecord = Record<string, any>;

/** The props the foundation reads: the Table props with the data props kept as stable references */
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

/** Table-wide settings the parts render from; they change rarely */
export interface TableView {
    prefixCls: string;
    direction: Direction | undefined;
    anyColumnFixed: boolean;
    /**
     * The header and the body render as separate elements (fixed header, sticky or virtualized): their common
     * container carries the table role and the table elements inside are role="none"
     */
    splitTable: boolean;
    /** Rows of the header, which come before the body rows */
    headerRowCount: number;
    components: MergedTableComponents;
    tableLayout: 'fixed' | 'auto';
}

export interface TableContextValue {
    view: Accessor<TableView>;
    /** The Table props, defaults applied */
    props: TableProps;
    state: Accessor<Readonly<TableState>>;
    foundation: TableFoundation<AnyRecord, TableFoundationProps>;
    /** The leaf columns, the selection and expand columns included */
    flattenedColumns: Accessor<ColumnProps[]>;
    /** The measured widths of the given leaf columns, in order; empty before the header is measured */
    getCellWidths: (columns: ColumnProps[]) => number[];
    setHeadWidths: (widths: BaseHeadWidth[], index: number) => void;
    setBodyHasScrollbar: (hasScrollbar: boolean) => void;
    handleBodyScroll: (event: Event) => void;
    handleRowExpanded: (expanded: boolean, rowKey: BaseRowKeyType, event?: Event) => void;
    handleRowSelection: (rowKey: BaseRowKeyType, selected: boolean, event: Event) => void;
    /** Whether the row gets an expand button */
    rowExpandable: (record: AnyRecord) => boolean;
    /** Whether `expandIcon` is not `false`, read without creating the icon */
    hasExpandIcon: Accessor<boolean>;
    /** The accessible name and description of the table, applied to whichever element has role="table" */
    tableAria: Accessor<{ 'aria-label'?: string; 'aria-labelledby'?: string; 'aria-describedby'?: string }>;
    /** The rows of a virtualized body, flattened; empty when not virtualized */
    virtualizedData: Accessor<Array<FlattenData | GroupFlattenData>>;
}

/** The context the parts of a table read; they render only inside Table */
export const [TableContext, useTableContext] = createContext<TableContextValue>('Table');
