import { Show, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import TableFoundation from '@fibrae/semi-foundation/table/foundation';
import Checkbox, { type CheckboxEvent, type CheckboxProps } from '../checkbox';
import useLocale from '../locale/use-locale';
import { useTableContext } from './context';

export interface TableSelectionCellProps {
    getCheckboxProps?: () => CheckboxProps;
    onChange?: (checked: boolean, e: CheckboxEvent) => void;
    selected?: boolean;
    disabled?: boolean;
    /** Intermediate state, shown as a solid horizontal line */
    indeterminate?: boolean;
    prefixCls?: string;
    class?: string;
    'aria-label'?: string;
}

export default function TableSelectionCell(props: TableSelectionCellProps) {
    const prefixCls = () => props.prefixCls ?? cssClasses.PREFIX;

    return (
        <span class={clsx(`${prefixCls()}-selection-wrap`, { [`${prefixCls()}-selection-disabled`]: Boolean(props.disabled) }, props.class)}>
            <Checkbox aria-label={props['aria-label']} disabled={Boolean(props.disabled)} indeterminate={props.indeterminate} checked={props.selected} onChange={(e) => props.onChange?.(e.target.checked, e)} {...props.getCheckboxProps?.()} />
        </span>
    );
}

/**
 * The selection checkbox of a row, or of the header when `inHeader`, following the table's selection state
 */
export function TableSelection(props: { record?: Record<string, any>; inHeader?: boolean; index?: number }) {
    const table = useTableContext('Table.Selection');
    const locale = useLocale('Table');

    const rowSelection = () => table.state().rowSelection;

    const selectedRowKeysSet = () => rowSelection()?.selectedRowKeysSet ?? new Set();

    const key = () => TableFoundation.getRecordKey({ rowKey: table.props.rowKey }, props.record);

    const allIsSelected = () => TableFoundation.allIsSelected(selectedRowKeysSet(), table.state().filteredDisabledRowKeysSet ?? new Set(), table.state().filteredSortedRowKeys ?? []);

    const hasRowSelected = () => TableFoundation.hasRowSelected(rowSelection()?.selectedRowKeys ?? [], table.state().filteredSortedRowKeysSet ?? new Set());

    const selected = () => (props.inHeader ? allIsSelected() : selectedRowKeysSet().has(key()));

    const indeterminate = () => (props.inHeader ? hasRowSelected() && !allIsSelected() : (rowSelection()?.checkRelation ?? 'unRelated') === 'related' && Boolean(table.state().halfCheckedRowKeysSet?.has(key())));

    const disabled = () => rowSelection()?.disabled;

    const selectAll = (checked: boolean, e: any) => table.foundation.handleSelectAllRow(checked, e);

    const selectRow = (checked: boolean, e: any) => table.foundation.handleSelectRow(key(), checked, e);

    const getCheckboxProps = () => {
        const fn = rowSelection()?.getCheckboxProps;
        return typeof fn === 'function' ? (fn(props.record ?? {}) as CheckboxProps) : {};
    };

    const originNode = () =>
        props.inHeader ? (
            <TableSelectionCell aria-label={locale().locale.selectAllRows} disabled={disabled()} indeterminate={indeterminate()} selected={selected()} onChange={selectAll} />
        ) : (
            <TableSelectionCell aria-label={locale().locale.selectRow} getCheckboxProps={getCheckboxProps} indeterminate={indeterminate()} selected={selected()} onChange={selectRow} />
        );

    // renderCell is called once with live fields, so what it reads in its JSX follows the selection
    const renderCellArgs = {
        get selected() {
            return selected();
        },
        get record() {
            return props.record;
        },
        originNode,
        get inHeader() {
            return Boolean(props.inHeader);
        },
        get disabled() {
            return Boolean(disabled());
        },
        get indeterminate() {
            return indeterminate();
        },
        get index() {
            return props.index;
        },
        get selectRow() {
            return props.inHeader ? undefined : selectRow;
        },
        get selectAll() {
            return props.inHeader ? selectAll : undefined;
        },
    };

    return (
        <Show when={rowSelection()}>
            <Show keyed when={rowSelection()?.renderCell} fallback={originNode()}>
                {(renderCell) => untrack(() => renderCell(renderCellArgs as Parameters<typeof renderCell>[0]))}
            </Show>
        </Show>
    );
}
