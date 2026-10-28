import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { getData } from '@test/utils/vue';
import type { ColumnProps, RowSelectionProps, TableProps } from '..';
import { P, getBodyRows, mountTable } from './table-helpers';

type RowEvent = (record: Record<string, any>, event: MouseEvent) => void;
const rowData = getData(3);
const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address' },
];

describe('Table onRow', () => {
    it('onRow 返回的 class 落在行上，onClick 在点击行时调用', async () => {
        const onRowClick = vi.fn<(event: MouseEvent) => void>();
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>(() => ({ class: 'test-row', onClick: onRowClick }));
        mountTable({ columns: getColumns(), dataSource: getData(46), onRow });
        const rows = getBodyRows();
        expect(rows[0]).toHaveClass('test-row');
        await fireEvent.click(rows[0]);
        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(onRow).toHaveBeenCalledWith(expect.objectContaining({ key: '0' }), 0, expect.anything());
    });

    it('onRow 返回 { class, style, onClick } 时类名合并、样式合并，点击处理与 clickRow 选择都执行', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onSelectionChange = vi.fn<NonNullable<RowSelectionProps['onChange']>>();
        mountTable({
            columns: getColumns(),
            dataSource: rowData,
            pagination: false,
            rowSelection: { clickRow: true, onChange: onSelectionChange },
            onRow: (_record: unknown, index: number) => ({
                class: ['own-row', { even: index % 2 === 0 }],
                style: { color: 'red' },
                onClick,
            }),
        });
        const [first, second] = getBodyRows();
        expect(first).toHaveClass(`${P}-row`, 'own-row', 'even');
        expect(second).toHaveClass(`${P}-row`, 'own-row');
        expect(second).not.toHaveClass('even');
        expect(first).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await userEvent.click(first.querySelector('td:last-child') as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).toHaveBeenCalledWith(['0'], [rowData[0]]);
        expect(getBodyRows()[0]).toHaveClass(`${P}-row-selected`, 'own-row');
    });

    it('onRow 返回的 role 与 data-row-key 不覆盖内部值', () => {
        mountTable({
            columns: getColumns(),
            dataSource: rowData,
            pagination: false,
            onRow: () => ({ 'data-row-key': 'custom', role: 'presentation' }),
        });
        const [first] = getBodyRows();
        expect(first).toHaveAttribute('role', 'row');
        expect(first).toHaveAttribute('data-row-key', '0');
    });
});

describe('Table 行事件', () => {
    it('@row-mouse-enter、@row-mouse-leave、@row-double-click 和 @row-context-menu 接收（record, event）', async () => {
        const handlers = {
            onRowMouseEnter: vi.fn<RowEvent>(),
            onRowMouseLeave: vi.fn<RowEvent>(),
            onRowDoubleClick: vi.fn<RowEvent>(),
            onRowContextMenu: vi.fn<RowEvent>(),
        };
        const warn = vi.spyOn(console, 'warn');
        const { container } = mountTable({ columns: getColumns(), dataSource: rowData, ...handlers });
        const rows = getBodyRows();
        await userEvent.hover(rows[1]);
        expect(handlers.onRowMouseEnter).toHaveBeenCalledTimes(1);
        expect(handlers.onRowMouseEnter.mock.calls[0][0]).toBe(rowData[1]);
        expect(handlers.onRowMouseEnter.mock.calls[0][1].type).toBe('mouseenter');
        await userEvent.unhover(rows[1]);
        expect(handlers.onRowMouseLeave).toHaveBeenCalledTimes(1);
        expect(handlers.onRowMouseLeave.mock.calls[0][0]).toBe(rowData[1]);
        expect(handlers.onRowMouseLeave.mock.calls[0][1].type).toBe('mouseleave');
        await userEvent.dblClick(rows[2]);
        expect(handlers.onRowDoubleClick).toHaveBeenCalledTimes(1);
        expect(handlers.onRowDoubleClick.mock.calls[0][0]).toBe(rowData[2]);
        expect(handlers.onRowDoubleClick.mock.calls[0][1].type).toBe('dblclick');
        await fireEvent.contextMenu(rows[0]);
        expect(handlers.onRowContextMenu).toHaveBeenCalledTimes(1);
        expect(handlers.onRowContextMenu.mock.calls[0][0]).toBe(rowData[0]);
        expect(handlers.onRowContextMenu.mock.calls[0][1].type).toBe('contextmenu');
        const root = container.firstElementChild as HTMLElement;
        Object.keys(handlers).forEach((name) => expect(root.hasAttribute(name.toLowerCase())).toBe(false));
        await fireEvent.contextMenu(root);
        await fireEvent.dblClick(root);
        expect(handlers.onRowContextMenu).toHaveBeenCalledTimes(1);
        expect(handlers.onRowDoubleClick).toHaveBeenCalledTimes(1);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('先触发行事件，再调用 onRow 返回的处理函数，两者都会执行', async () => {
        const calls: string[] = [];
        mountTable({
            columns: getColumns(),
            dataSource: rowData,
            onRow: () => ({
                onMouseenter: () => calls.push('onRow:enter'),
                onMouseleave: () => calls.push('onRow:leave'),
                onDblclick: () => calls.push('onRow:dblclick'),
                onContextmenu: () => calls.push('onRow:contextmenu'),
            }),
            onRowContextMenu: () => calls.push('emit:contextmenu'),
            onRowDoubleClick: () => calls.push('emit:dblclick'),
            onRowMouseEnter: () => calls.push('emit:enter'),
            onRowMouseLeave: () => calls.push('emit:leave'),
        });
        const [row] = getBodyRows();
        await userEvent.hover(row);
        await userEvent.unhover(row);
        await fireEvent.dblClick(row);
        await fireEvent.contextMenu(row);
        expect(calls).toEqual(['emit:enter', 'onRow:enter', 'emit:leave', 'onRow:leave', 'emit:dblclick', 'onRow:dblclick', 'emit:contextmenu', 'onRow:contextmenu']);
    });
});
