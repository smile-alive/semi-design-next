import { Show, batch, children, createEffect, createMemo, createSignal, splitProps, untrack } from 'solid-js';
import { applyColumnResize, findColumn, getColumnResizeChange, getExpandColumn, getResizableColumns, getSelectionColumn } from '@fibrae/semi-foundation/components/table/utils';
import { warning } from '@fibrae/semi-foundation/utils';
import type { ColumnProps, OnHeaderCellReturnObject, RowSelectionProps, TableComponents, TableProps } from './interface';
import NormalTable from './normal-table';
import ResizableHeaderCell, { type ResizeHandler } from './table-header/resizable-header-cell';

const childrenColumnName = 'children';

type ColumnKey = string | number;
type ColumnOverrides = Record<ColumnKey, Partial<ColumnProps>>;

export default function ResizableTable(props: TableProps) {
    const [local, rest] = splitProps(props, ['components', 'columns', 'resizable', 'children']);

    /*
     * What dragging changed, by column key: the width and the fields the resize callbacks return. Only these outlive a
     * change of the columns prop; a column never dragged follows the prop.
     */
    const [overrides, setOverrides] = createSignal<ColumnOverrides>({});

    // The handler class is added when the columns are built, so a later class prop is not shadowed by a snapshot
    const [resizing, setResizing] = createSignal<ColumnKey[]>([]);

    const components = createMemo((): TableComponents => ({ ...local.components, header: { ...local.components?.header, cell: local.components?.header?.cell ?? ResizableHeaderCell } }));
    const baseColumns = createMemo(() => getResizableColumns<ColumnProps>(local.columns, typeof props.expandedRowRender === 'function' ? getExpandColumn(props.hideExpandedColumn, props.expandCellFixed) : null, getSelectionColumn(props.rowSelection as RowSelectionProps<any> | boolean | undefined)));
    const resizableColumns = createMemo(() => applyColumnResize(baseColumns(), { resizable: local.resizable, classKey: 'class', getOverride: (key) => overrides()[key], isResizing: (key) => resizing().includes(key) }));

    const hasColumnsProp = () => Array.isArray(local.columns) && local.columns.length > 0;

    // read only without a columns prop, which then makes the children the columns
    const resolvedChildren = children(() => (hasColumnsProp() ? undefined : local.children));

    // Only the columns prop is resizable, as documented: JSX columns render as a plain table
    const jsxColumnsOnly = () => !hasColumnsProp() && resolvedChildren() != null;

    const handlePhase =
        (key: ColumnKey, phase: 'start' | 'move' | 'stop'): ResizeHandler =>
        (_e, data) =>
            batch(() => {
                if (phase !== 'move') {
                    setResizing((prev) => [...prev.filter((item) => item !== key), ...(phase === 'start' ? [key] : [])]);
                }
                const recorded = untrack(overrides)[key];
                const column: ColumnProps = { ...findColumn(untrack(baseColumns), { key }), ...recorded };
                const change = getColumnResizeChange({ phase, column, recorded, resizable: untrack(() => local.resizable), classKey: 'class', width: data?.size.width });
                setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...change } }));
            });

    // The caller's onHeaderCell runs when the header renders the column, so its result follows the dragged width
    const assignResizableRender = (cols: ColumnProps[]) =>
        cols.map((col) => {
            const key = col.key as ColumnKey;
            const ownHeaderCell = col.onHeaderCell;
            const nextColumn: ColumnProps = {
                ...col,
                onHeaderCell: (column, columnIndex, rowIndex) =>
                    ({
                        ...ownHeaderCell?.(column, columnIndex, rowIndex),
                        width: column?.width,
                        onResize: handlePhase(key, 'move'),
                        onResizeStart: handlePhase(key, 'start'),
                        onResizeStop: handlePhase(key, 'stop'),
                        // the cell's onResize* are Resizable's handlers, which share the name of the DOM resize event but not its signature
                    }) as unknown as OnHeaderCellReturnObject,
            };
            const colChildren = col[childrenColumnName];
            if (Array.isArray(colChildren) && colChildren.length) {
                nextColumn[childrenColumnName] = assignResizableRender(colChildren);
            }
            return nextColumn;
        });

    const finalColumns = createMemo(() => assignResizableRender(resizableColumns()));

    createEffect(() => warning(jsxColumnsOnly(), '[Semi Table] resizable only works with the columns prop; JSX columns render without resize handles'));

    return (
        <Show
            when={!jsxColumnsOnly()}
            fallback={
                <NormalTable {...rest} components={local.components}>
                    {resolvedChildren()}
                </NormalTable>
            }
        >
            <NormalTable {...rest} columns={finalColumns()} components={components()}>
                {local.children}
            </NormalTable>
        </Show>
    );
}
