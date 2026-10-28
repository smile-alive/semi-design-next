import { fireEvent, render } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { getData } from '@test/utils/solid';
import Table from '..';
import { getBodyRows, getColumns } from './table-helpers';

const rowData = getData(3);
const rowColumns = getColumns();

type RowHandler = (record: unknown, event: { type: string }) => void;

describe('Table 行事件属性', () => {
    it('onRowMouseEnter、onRowMouseLeave、onRowDoubleClick 和 onRowContextMenu 接收（record, event）', async () => {
        const handlers = {
            onRowMouseEnter: vi.fn<RowHandler>(),
            onRowMouseLeave: vi.fn<RowHandler>(),
            onRowDoubleClick: vi.fn<RowHandler>(),
            onRowContextMenu: vi.fn<RowHandler>(),
        };
        const { container } = render(() => <Table columns={rowColumns} dataSource={rowData} {...handlers} />);
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

        fireEvent.contextMenu(rows[0]);
        expect(handlers.onRowContextMenu).toHaveBeenCalledTimes(1);
        expect(handlers.onRowContextMenu.mock.calls[0][0]).toBe(rowData[0]);
        expect(handlers.onRowContextMenu.mock.calls[0][1].type).toBe('contextmenu');

        const root = container.firstChild as HTMLElement;
        Object.keys(handlers).forEach((name) => {
            expect(root.hasAttribute(name.toLowerCase())).toBe(false);
        });
        fireEvent.contextMenu(root);
        fireEvent.dblClick(root);
        expect(handlers.onRowContextMenu).toHaveBeenCalledTimes(1);
        expect(handlers.onRowDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('先调用行事件处理函数，再调用 onRow 返回的处理函数，两者都会执行', async () => {
        const calls: string[] = [];
        render(() => (
            <Table
                columns={rowColumns}
                dataSource={rowData}
                onRow={() => ({
                    onMouseEnter: () => calls.push('onRow:enter'),
                    onMouseLeave: () => calls.push('onRow:leave'),
                    onDblClick: () => calls.push('onRow:dblclick'),
                    onContextMenu: () => calls.push('onRow:contextmenu'),
                })}
                onRowContextMenu={() => calls.push('prop:contextmenu')}
                onRowDoubleClick={() => calls.push('prop:dblclick')}
                onRowMouseEnter={() => calls.push('prop:enter')}
                onRowMouseLeave={() => calls.push('prop:leave')}
            />
        ));
        const row = getBodyRows()[0];
        await userEvent.hover(row);
        await userEvent.unhover(row);
        fireEvent.dblClick(row);
        fireEvent.contextMenu(row);
        expect(calls).toEqual(['prop:enter', 'onRow:enter', 'prop:leave', 'onRow:leave', 'prop:dblclick', 'onRow:dblclick', 'prop:contextmenu', 'onRow:contextmenu']);
    });
});
