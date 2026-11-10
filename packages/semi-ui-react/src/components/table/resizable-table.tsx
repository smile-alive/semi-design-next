import { useEffect, useMemo, useState } from 'react';
import { applyColumnResize, findColumn, getColumnResizeChange, getExpandColumn, getResizableColumns, getSelectionColumn } from '@fibrae/semi-foundation/components/table/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { TableProps, ColumnProps, RowSelectionProps } from './interface';
import NormalTable from './normal-table';
import ResizableHeaderCell from './table-header/resizable-header-cell';

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

    // Only the columns prop is resizable, as documented: JSX columns render as a plain table
    const jsxColumnsOnly = !(Array.isArray(propColumns) && propColumns.length) && children != null;

    const baseColumns = useMemo(
        () => getResizableColumns<ColumnProps>(propColumns, typeof expandedRowRender === 'function' ? getExpandColumn(hideExpandedColumn, expandCellFixed) : null, getSelectionColumn(rowSelection as RowSelectionProps<any> | boolean)),
        [propColumns, expandedRowRender, hideExpandedColumn, rowSelection, expandCellFixed]
    );

    const columns = useMemo(() => applyColumnResize(baseColumns, { resizable, classKey: 'className', getOverride: (key) => overrides[key], isResizing: (key) => resizing.includes(key) }), [baseColumns, resizable, overrides, resizing]);

    // A shallow override: compat merge would clone a memo or forwardRef component missing from the base into a new
    // type, remounting every row whenever the components object changes. Table merges in the defaults.
    const components = useMemo(() => ({ ...propComponents, header: { ...propComponents?.header, cell: propComponents?.header?.cell ?? ResizableHeaderCell } }), [propComponents]);

    const finalColumns = useMemo(() => {
        const handlePhase = (key: ColumnKey, phase: 'start' | 'move' | 'stop', width?: number) => {
            if (phase !== 'move') {
                setResizing((prev) => [...prev.filter((item) => item !== key), ...(phase === 'start' ? [key] : [])]);
            }
            const recorded = drag.get(key);
            const column: ColumnProps = { ...findColumn(baseColumns, { key }), ...recorded };
            setOverrides(drag.record(key, getColumnResizeChange({ phase, column, recorded, resizable, classKey: 'className', width })));
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
                        onResize: (_e: React.MouseEvent, { size }: { size: { width: number } }) => handlePhase(col.key, 'move', size.width),
                        onResizeStart: () => handlePhase(col.key, 'start'),
                        onResizeStop: () => handlePhase(col.key, 'stop'),
                    }),
                };
                const colChildren = col[childrenColumnName];
                if (Array.isArray(colChildren) && colChildren.length) {
                    nextColumn[childrenColumnName] = assignResizableRender(colChildren);
                }
                return nextColumn;
            });

        return assignResizableRender(columns);
    }, [columns, baseColumns, drag, resizable]);

    useEffect(() => {
        warning(jsxColumnsOnly, '[Semi Table] resizable only works with the columns prop; JSX columns render without resize handles');
    }, [jsxColumnsOnly]);

    if (jsxColumnsOnly) {
        return <NormalTable {...restProps} components={propComponents} />;
    }

    return <NormalTable {...restProps} columns={finalColumns} components={components} />;
}
