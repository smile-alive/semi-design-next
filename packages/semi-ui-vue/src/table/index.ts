import { strings } from '@fibrae/semi-foundation/table/constants';
import TableColumn from './column';
import Table from './table.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const TableWithParts: typeof Table & {
    Column: typeof TableColumn;
    DEFAULT_KEY_COLUMN_SELECTION: typeof strings.DEFAULT_KEY_COLUMN_SELECTION;
    DEFAULT_KEY_COLUMN_EXPAND: typeof strings.DEFAULT_KEY_COLUMN_EXPAND;
} = Object.assign(Table, {
    Column: TableColumn,
    DEFAULT_KEY_COLUMN_SELECTION: strings.DEFAULT_KEY_COLUMN_SELECTION,
    DEFAULT_KEY_COLUMN_EXPAND: strings.DEFAULT_KEY_COLUMN_EXPAND,
});
export default TableWithParts;
export { default as TableColumn } from './column';
export type * from './interface';
