import { Show, batch, children, createEffect, createMemo, createSignal, splitProps, untrack } from 'solid-js';
import { numbers, strings } from '@fibrae/semi-foundation/table/constants';
import { assignColumnKeys } from '@fibrae/semi-foundation/table/utils';
import { addClass, removeClass } from '@fibrae/semi-foundation/utils/classnames';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { ColumnProps, OnHeaderCellReturnObject, RowSelectionProps, TableComponents, TableProps } from './interface';
import ResizableHeaderCell, { type ResizeHandler } from './resizable-header-cell';
import NormalTable from './table';
import { cloneDeep } from './utils';

const childrenColumnName = 'children';

type ColumnKey = string | number;
type ColumnOverrides = Record<ColumnKey, Partial<ColumnProps>>;

/**
 * A copy of the columns prop with keys, plus width placeholders for the expand and selection columns that Table adds,
 * so that those columns can be resized too
 */
function getResizableColumns({ columns, expandedRowRender, hideExpandedColumn, rowSelection, expandCellFixed }: Pick<TableProps, 'columns' | 'expandedRowRender' | 'hideExpandedColumn' | 'rowSelection' | 'expandCellFixed'>) {
    const resizableColumns = assignColumnKeys(cloneDeep(columns ?? []), childrenColumnName) as ColumnProps[];
    // Table merges its own column into the placeholder in place, so the placeholder sits where Table puts the column
    const place = (column: ColumnProps, fixed: unknown) => (fixed === 'right' ? resizableColumns.push(column) : resizableColumns.unshift(column));
    const selection = typeof rowSelection === 'object' ? (rowSelection as RowSelectionProps<any>) : undefined;

    if (typeof expandedRowRender === 'function' && !hideExpandedColumn && !resizableColumns.some((item) => item.key === strings.DEFAULT_KEY_COLUMN_EXPAND)) {
        place({ key: strings.DEFAULT_KEY_COLUMN_EXPAND, width: numbers.DEFAULT_WIDTH_COLUMN_EXPAND }, expandCellFixed);
    }

    if (rowSelection && !selection?.hidden && !resizableColumns.some((item) => item.key === strings.DEFAULT_KEY_COLUMN_SELECTION)) {
        place(
            {
                width: selection?.width ?? numbers.DEFAULT_WIDTH_COLUMN_SELECTION,
                key: strings.DEFAULT_KEY_COLUMN_SELECTION,
                // This placeholder overrides the selection column's own handler when the columns are merged
                onHeaderCell: selection?.onHeaderCell,
            },
            selection?.fixed
        );
    }

    return resizableColumns;
}

/** The columns with what dragging changed, collected by key into `byKey` */
function applyOverrides(cols: ColumnProps[], drag: { overrides: ColumnOverrides; resizing: ColumnKey[]; handlerClass: string; byKey: Record<ColumnKey, ColumnProps> }) {
    return cols.map((column) => {
        const key = column.key as ColumnKey;
        const next: ColumnProps = { ...column, ...drag.overrides[key] };
        if (drag.resizing.includes(key)) {
            next.class = addClass(next.class, drag.handlerClass);
        }
        const colChildren = column[childrenColumnName];
        if (Array.isArray(colChildren) && colChildren.length) {
            next[childrenColumnName] = applyOverrides(colChildren, drag);
        }
        drag.byKey[key] = next;
        return next;
    });
}

/** Table with resizable header cells */
export default function ResizableTable(props: TableProps) {
    const [local, rest] = splitProps(props, ['components', 'columns', 'resizable', 'children']);

    /*
     * What dragging changed, by column key: the width and the fields the resize callbacks return. Only these outlive a
     * change of the columns prop; a column never dragged follows the prop.
     */
    const [overrides, setOverrides] = createSignal<ColumnOverrides>({});

    // The handler class is added when the columns are built, so a later class prop is not shadowed by a snapshot
    const [resizing, setResizing] = createSignal<ColumnKey[]>([]);

    // A shallow override: Table merges in the defaults
    const components = createMemo((): TableComponents => ({ ...local.components, header: { ...local.components?.header, cell: local.components?.header?.cell ?? ResizableHeaderCell } }));

    const options = () => (typeof local.resizable === 'object' ? local.resizable : {});

    const handlerClassName = () => options().handlerClassName ?? 'resizing';

    // The resize handlers look the columns up by key, at any level of the column tree
    const resizableColumns = createMemo(() => {
        const byKey: Record<ColumnKey, ColumnProps> = {};
        const base = getResizableColumns({ columns: local.columns, expandedRowRender: props.expandedRowRender, hideExpandedColumn: props.hideExpandedColumn, rowSelection: props.rowSelection, expandCellFixed: props.expandCellFixed });
        const columns = applyOverrides(base, { overrides: overrides(), resizing: resizing(), handlerClass: handlerClassName(), byKey });
        return { columns, byKey };
    });

    const hasColumnsProp = () => Array.isArray(local.columns) && local.columns.length > 0;

    // read only without a columns prop, which then makes the children the columns
    const resolvedChildren = children(() => (hasColumnsProp() ? undefined : local.children));

    // Only the columns prop is resizable, as documented: JSX columns render as a plain table
    const jsxColumnsOnly = () => !hasColumnsProp() && resolvedChildren() != null;

    const getColumn = (key: ColumnKey) => untrack(resizableColumns).byKey[key];

    const record = (key: ColumnKey, change: Partial<ColumnProps> | void) => setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...change } }));

    const setColumnResizing = (key: ColumnKey, on: boolean) => setResizing((prev) => [...prev.filter((item) => item !== key), ...(on ? [key] : [])]);

    const handleResize =
        (key: ColumnKey): ResizeHandler =>
        (_e, data) => {
            const change = { width: data?.size.width };
            record(key, { ...change, ...options().onResize?.({ ...getColumn(key), ...change }) });
        };

    const handleResizeStart =
        (key: ColumnKey): ResizeHandler =>
        () =>
            batch(() => {
                setColumnResizing(key, true);
                const column = getColumn(key);
                record(key, options().onResizeStart?.({ ...column, class: addClass(column.class, handlerClassName()) }));
            });

    const handleResizeStop =
        (key: ColumnKey): ResizeHandler =>
        () =>
            batch(() => {
                setColumnResizing(key, false);
                const column = getColumn(key);
                const className = removeClass(column.class, handlerClassName());
                // A class returned at the start carries the handler class, which must not outlive the drag
                const kept = untrack(overrides)[key]?.class != null ? { class: className } : {};
                record(key, { ...kept, ...options().onResizeStop?.({ ...column, class: className }) });
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
                        onResize: handleResize(key),
                        onResizeStart: handleResizeStart(key),
                        onResizeStop: handleResizeStop(key),
                        // the cell's onResize* are Resizable's handlers, which share the name of the DOM resize event but not its signature
                    }) as unknown as OnHeaderCellReturnObject,
            };
            const colChildren = col[childrenColumnName];
            if (Array.isArray(colChildren) && colChildren.length) {
                nextColumn[childrenColumnName] = assignResizableRender(colChildren);
            }
            return nextColumn;
        });

    const finalColumns = createMemo(() => assignResizableRender(resizableColumns().columns));

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
