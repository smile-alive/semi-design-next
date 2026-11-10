import { type Accessor, type JSX, Show, createMemo, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
// compat get resolves deep dataIndex paths such as 'a.b'
import { get } from 'es-toolkit/compat';
import { getRTLAlign, getRTLFlexAlign, isExpandedColumn, isSelectionColumn, shouldShowEllipsisTitle } from '@fibrae/semi-foundation/components/table/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import { mergeStyles } from '../../utils/index';
import ColumnSelection from './column-selection';
import { useTableContext } from './context';
import { TableExpandIcon } from './custom-expand-icon';
import type { ColumnProps, RenderOptions, TableComponent } from './interface';
import { isRenderReturnObject } from './utils';

export interface TableCellProps {
    record?: Record<string, any>;
    index?: number;
    /** The sticky offset of a left fixed column, false when not fixed left */
    fixedLeft?: number | false;
    lastFixedLeft?: boolean;
    fixedRight?: number | false;
    firstFixedRight?: boolean;
    columnsToEnd?: number;
    indent?: number;
    column?: ColumnProps;
    showExpandIcon?: boolean;
    /** The expand button of the row, for the first data cell of an expandable row */
    renderExpandIcon?: () => JSX.Element;
    component?: TableComponent;
    width?: string | number;
    height?: string | number;
    hovered?: boolean;
    isSection?: boolean;
}

const EMPTY_COLUMN: ColumnProps = {};

const spanOf = (attrs: Record<string, any>, name: 'col' | 'row'): number | undefined => attrs[`${name}Span`] ?? attrs[`${name}span`];

export default function TableCell(props: TableCellProps) {
    const table = useTableContext('Table.Cell');

    const column = () => props.column ?? EMPTY_COLUMN;

    const custom = createMemo(() => {
        const onCell = column().onCell;
        const record = props.record ?? {};
        const index = props.index as number;
        return (typeof onCell === 'function' ? untrack(() => onCell(record, index)) : undefined) ?? {};
    });

    const attrs = createMemo(() => {
        const { class: _class, style: _style, onClick: _onClick, ...customAttrs } = custom() as Record<string, any>;
        return customAttrs;
    });

    const prefixCls = () => table.view().prefixCls;

    const isRTL = () => table.view().direction === 'rtl';

    const fullRender = () => Boolean(column().useFullRender);

    const indent = () => (props.indent && table.props.indentSize ? props.indent : 0);

    const indentNode = () => <span class={`${prefixCls()}-row-indent indent-level-${indent()}`} style={{ 'padding-inline-start': `${(table.props.indentSize ?? 0) * indent()}px` }} />;

    const selectionNode = () => <ColumnSelection record={props.record} />;

    // the options are live: a render function reading them in its JSX follows the row without being called again. The
    // parts are render functions, so one the column leaves out is never created
    const renderOptions: RenderOptions = {
        get expandIcon() {
            return props.renderExpandIcon;
        },
        get isHovering() {
            return Boolean(props.hovered);
        },
        get selection() {
            return fullRender() ? selectionNode : undefined;
        },
        get indentText() {
            return fullRender() && indent() ? indentNode : undefined;
        },
    };

    const colSpan = () => spanOf(attrs(), 'col');

    const rowSpan = () => spanOf(attrs(), 'row');

    const fixedLeftFlag = () => typeof props.fixedLeft === 'number';

    const fixedRightFlag = () => typeof props.fixedRight === 'number';

    const style = () => {
        const position: JSX.CSSProperties = {};
        if (fixedLeftFlag()) {
            position[isRTL() ? 'right' : 'left'] = toCssLength(props.fixedLeft as number);
        } else if (fixedRightFlag()) {
            position[isRTL() ? 'left' : 'right'] = toCssLength(props.fixedRight as number);
        }
        if (props.width != null) {
            position.width = toCssLength(props.width);
        }
        if (props.height != null) {
            position.height = toCssLength(props.height);
        }
        const align = column().align;
        const alignStyle = align ? { 'text-align': getRTLAlign(align, table.view().direction), 'justify-content': getRTLFlexAlign(align, table.view().direction) } : undefined;
        return mergeStyles(position, (custom() as Record<string, any>).style, alignStyle);
    };

    const cls = () => {
        const [isFixedLeft, isFixedLeftLast, isFixedRight, isFixedRightFirst] = isRTL() ? [fixedRightFlag(), props.firstFixedRight, fixedLeftFlag(), props.lastFixedLeft] : [fixedLeftFlag(), props.lastFixedLeft, fixedRightFlag(), props.firstFixedRight];
        return clsx(column().class, `${prefixCls()}-row-cell`, (custom() as Record<string, any>).class, {
            [`${prefixCls()}-cell-fixed-left`]: isFixedLeft,
            [`${prefixCls()}-cell-fixed-left-last`]: isFixedLeftLast,
            [`${prefixCls()}-cell-fixed-right`]: isFixedRight,
            [`${prefixCls()}-cell-fixed-right-first`]: isFixedRightFirst,
            [`${prefixCls()}-cell-last`]: props.columnsToEnd != null && (colSpan() ?? 1) >= props.columnsToEnd,
            [`${prefixCls()}-row-cell-ellipsis`]: Boolean(column().ellipsis),
        });
    };

    const renderContent = () => {
        const col = column();
        const record = props.record ?? {};
        const index = props.index as number;
        const text = col.dataIndex ? get(record, col.dataIndex) : record;
        if (typeof col.render === 'function') {
            const render = col.render;
            return untrack(() => render(text, record, index, renderOptions));
        }
        if (isSelectionColumn(col)) {
            return untrack(() => <ColumnSelection index={index} record={record} />);
        }
        if (isExpandedColumn(col)) {
            return table.hasExpandIcon() && table.rowExpandable(record) ? untrack(() => <TableExpandIcon record={record} />) : null;
        }
        // a record (no dataIndex) or another plain object is not content
        return (isRenderReturnObject(text) ? null : text) as JSX.Element;
    };

    const inner = (content: Accessor<JSX.Element>) => (
        <>
            <Show when={indent()}>{indentNode()}</Show>
            <Show when={props.showExpandIcon}>{props.renderExpandIcon?.()}</Show>
            {content()}
        </>
    );

    const title = (content: JSX.Element) => (shouldShowEllipsisTitle(column().ellipsis ?? false) && typeof content === 'string' ? content : undefined);

    return (
        <Show when={colSpan() !== 0 && rowSpan() !== 0}>
            {(_shown) => {
                // the title check and the insertion share one creation
                const content = createMemo(renderContent);
                return (
                    <Dynamic
                        component={props.component ?? 'td'}
                        // a role="none" table no longer gives colspan and rowspan their table meaning
                        aria-colspan={table.view().splitTable && (colSpan() ?? 0) > 1 ? colSpan() : undefined}
                        aria-rowspan={table.view().splitTable && (rowSpan() ?? 0) > 1 ? rowSpan() : undefined}
                        // a table, not a grid: the cells have no arrow-key navigation
                        role="cell"
                        title={title(content())}
                        onClick={(custom() as Record<string, any>).onClick}
                        {...attrs()}
                        class={cls()}
                        style={style()}
                    >
                        <Show when={!fullRender()} fallback={content()}>
                            <Show when={props.isSection} fallback={inner(content)}>
                                <div class={`${prefixCls()}-section-inner`} style={{ width: table.view().anyColumnFixed ? 'var(--semi-table-section-width)' : undefined }}>
                                    {inner(content)}
                                </div>
                            </Show>
                        </Show>
                    </Dynamic>
                );
            }}
        </Show>
    );
}
