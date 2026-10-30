import { useEffect, useMemo, useState } from 'react';
import { strings, numbers } from '@fibrae/semi-foundation/table/constants';
import { assignColumnKeys } from '@fibrae/semi-foundation/table/utils';
import { addClass, removeClass } from '@fibrae/semi-foundation/utils/classnames';
import { noop } from '@fibrae/semi-foundation/utils/function';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { ResizableProps, TableProps, ColumnProps, RowSelectionProps } from './interface';
import ResizableHeaderCell from './resizable-header-cell';
import Table from './table';
import { cloneDeep } from './utils';

const childrenColumnName = 'children';

type ColumnKey = string | number;
type ColumnOverrides = Record<ColumnKey, Partial<ColumnProps>>;

/**
 * The overrides as of the last drag update rather than the last render: the moves of a fast drag can arrive before
 * React renders the previous one
 */
class DragOverrides {
    #latest: ColumnOverrides = {};

    get(key: ColumnKey) {
        return this.#latest[key];
    }

    record(key: ColumnKey, change: Partial<ColumnProps>) {
        this.#latest = { ...this.#latest, [key]: { ...this.#latest[key], ...change } };
        return this.#latest;
    }
}

/**
 * A copy of the columns prop with keys, plus width placeholders for the expand and selection columns that Table adds,
 * so that those columns can be resized too
 */
function getResizableColumns({ columns, expandedRowRender, hideExpandedColumn, rowSelection, expandCellFixed }: TableProps) {
    const resizableColumns = assignColumnKeys(cloneDeep(columns ?? []), childrenColumnName);
    // Table merges its own column into the placeholder in place, so the placeholder sits where Table puts the column
    const place = (column: ColumnProps, fixed: unknown) => (fixed === 'right' ? resizableColumns.push(column) : resizableColumns.unshift(column));

    if (typeof expandedRowRender === 'function' && !hideExpandedColumn && !resizableColumns.some((item) => item.key === strings.DEFAULT_KEY_COLUMN_EXPAND)) {
        place({ key: strings.DEFAULT_KEY_COLUMN_EXPAND, width: numbers.DEFAULT_WIDTH_COLUMN_EXPAND }, expandCellFixed);
    }

    if (rowSelection && !(rowSelection as RowSelectionProps<any>)?.hidden && !resizableColumns.some((item) => item.key === strings.DEFAULT_KEY_COLUMN_SELECTION)) {
        place(
            {
                width: (rowSelection as RowSelectionProps<any>).width ?? numbers.DEFAULT_WIDTH_COLUMN_SELECTION,
                key: strings.DEFAULT_KEY_COLUMN_SELECTION,
                // This placeholder overrides the selection column's own handler when the columns are merged
                onHeaderCell: (rowSelection as RowSelectionProps<any>)?.onHeaderCell,
            },
            (rowSelection as RowSelectionProps<any>)?.fixed
        );
    }

    return resizableColumns;
}

/** Table with resizable header cells; loaded only when `resizable` is set, so plain tables skip the drag code */
export default function ResizableTable(props: TableProps) {
    const { components: propComponents, columns: propColumns, resizable, ...restProps } = props;
    const { expandedRowRender, hideExpandedColumn, rowSelection, expandCellFixed, children } = props;

    /*
     * What dragging changed, by column key: the width and the fields the resize callbacks return. Only these outlive a
     * change of the columns prop; a column never dragged follows the prop.
     */
    const [overrides, setOverrides] = useState<ColumnOverrides>({});
    const [drag] = useState(() => new DragOverrides());

    // The handler class is added at render, so a later className prop is not shadowed by a snapshot
    const [resizing, setResizing] = useState<ColumnKey[]>([]);

    const { onResize = noop, onResizeStart = noop, onResizeStop = noop, handlerClassName = 'resizing' }: ResizableProps<any> = typeof resizable === 'object' ? resizable : {};

    // Only the columns prop is resizable, as documented: JSX columns render as a plain table
    const jsxColumnsOnly = !(Array.isArray(propColumns) && propColumns.length) && children != null;

    // The resize handlers look the columns up by key, at any level of the column tree
    const { columns, columnsByKey } = useMemo(() => {
        const byKey: Record<ColumnKey, ColumnProps> = {};
        const applyOverrides = (cols: ColumnProps[]) =>
            cols.map((column) => {
                const next: ColumnProps = { ...column, ...overrides[column.key] };
                if (resizing.includes(column.key)) {
                    next.className = addClass(next.className, handlerClassName);
                }
                const colChildren = column[childrenColumnName];
                if (Array.isArray(colChildren) && colChildren.length) {
                    next[childrenColumnName] = applyOverrides(colChildren);
                }
                byKey[next.key] = next;
                return next;
            });
        const applied = applyOverrides(getResizableColumns({ columns: propColumns, expandedRowRender, hideExpandedColumn, rowSelection, expandCellFixed }));
        return { columns: applied, columnsByKey: byKey };
    }, [propColumns, expandedRowRender, hideExpandedColumn, rowSelection, expandCellFixed, overrides, resizing, handlerClassName]);

    // A shallow override: compat merge would clone a memo or forwardRef component missing from the base into a new
    // type, remounting every row whenever the components object changes. Table merges in the defaults.
    const components = useMemo(() => ({ ...propComponents, header: { ...propComponents?.header, cell: propComponents?.header?.cell ?? ResizableHeaderCell } }), [propComponents]);

    const finalColumns = useMemo(() => {
        const getColumn = (key: ColumnKey): ColumnProps => ({ ...columnsByKey[key], ...drag.get(key) });
        const record = (key: ColumnKey, change: Partial<ColumnProps>) => setOverrides(drag.record(key, change));

        const setColumnResizing = (key: ColumnKey, on: boolean) => setResizing((prev) => [...prev.filter((item) => item !== key), ...(on ? [key] : [])]);

        const handleResize =
            (key: ColumnKey) =>
            (_e: React.MouseEvent, { size }: { size: { width: number } }) => {
                const change = { width: size.width };
                record(key, { ...change, ...onResize({ ...getColumn(key), ...change }) });
            };

        const handleResizeStart = (key: ColumnKey) => () => {
            setColumnResizing(key, true);
            const curColumn = getColumn(key);
            record(key, {
                ...onResizeStart({ ...curColumn, className: addClass(curColumn.className, handlerClassName) }),
            });
        };

        const handleResizeStop = (key: ColumnKey) => () => {
            setColumnResizing(key, false);
            const curColumn = getColumn(key);
            const className = removeClass(curColumn.className, handlerClassName);
            // A className returned at the start carries the handler class, which must not outlive the drag
            const kept = drag.get(key)?.className != null ? { className } : {};
            record(key, { ...kept, ...onResizeStop({ ...curColumn, className }) });
        };

        // The caller's onHeaderCell runs when the header renders, so its result follows whatever it reads
        const assignResizableRender = (cols: ColumnProps[] = []) =>
            cols.map((col) => {
                const ownHeaderCell = col.onHeaderCell;
                const nextColumn: ColumnProps = {
                    ...col,
                    onHeaderCell: (column: ColumnProps, columnIndex: number, rowIndex: number) => ({
                        ...ownHeaderCell?.(column, columnIndex, rowIndex),
                        width: column.width,
                        onResize: handleResize(col.key),
                        onResizeStart: handleResizeStart(col.key),
                        onResizeStop: handleResizeStop(col.key),
                    }),
                };
                const colChildren = col[childrenColumnName];
                if (Array.isArray(colChildren) && colChildren.length) {
                    nextColumn[childrenColumnName] = assignResizableRender(colChildren);
                }
                return nextColumn;
            });

        return assignResizableRender(columns);
    }, [columns, columnsByKey, drag, onResize, onResizeStart, onResizeStop, handlerClassName]);

    useEffect(() => {
        warning(jsxColumnsOnly, '[Semi Table] resizable only works with the columns prop; JSX columns render without resize handles');
    }, [jsxColumnsOnly]);

    if (jsxColumnsOnly) {
        return <Table {...restProps} components={propComponents} />;
    }

    return <Table {...restProps} columns={finalColumns} components={components} />;
}
