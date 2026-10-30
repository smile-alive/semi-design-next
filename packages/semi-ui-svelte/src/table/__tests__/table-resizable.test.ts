import { flushSync } from 'svelte';
import { fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal from '../../_utils/semi-global';
import type { ColumnProps, TableResizeFn } from '../interface';
import { P, getData, mountTable, query, queryAll } from './helpers';

const getHandles = () => queryAll(`.${P}-thead .${P}-resize-handle`);
const getColWidths = () => queryAll(`.${P}-col`).map((col) => col.style.width);

async function drag(handle: Element, moves: number[]) {
    await fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
    for (const clientX of moves) {
        await fireEvent.pointerMove(handle, { clientX, pointerId: 1 });
    }
    await fireEvent.lostPointerCapture(handle, { clientX: moves.at(-1), pointerId: 1 });
    flushSync();
}

describe('Svelte Table 列宽调整', () => {
    it('带宽度的列有拖动手柄，col 带列宽', () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 150 }, { title: 'Age', dataIndex: 'age', width: 150, sorter: true }, { title: 'Address', dataIndex: 'address', width: 300 }, { key: 'operate' }],
            dataSource: getData(),
            resizable: true,
        });
        expect(getHandles()).toHaveLength(3);
        expect(getColWidths()).toEqual(['150px', '150px', '300px', '']);
    });

    it('删除一列后保留各列宽度', () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 100 },
            { title: '所有者', dataIndex: 'owner', width: 200 },
            { title: '', dataIndex: 'operate' },
        ];
        const { store } = mountTable({ columns, dataSource: getData(), pagination: false, resizable: true });
        expect(getColWidths()).toEqual(['300px', '100px', '200px', '']);
        store.props.columns = columns.filter((_, index) => index !== 1);
        flushSync();
        expect(getColWidths()).toEqual(['300px', '200px', '']);
    });

    it('resize: false 的列没有手柄，表头不带 resize 属性', () => {
        mountTable({
            columns: [
                { dataIndex: 'a', title: 'A', width: 100, resize: false },
                { dataIndex: 'b', title: 'B', width: 100 },
            ],
            dataSource: [],
            resizable: true,
        });
        expect(getHandles()).toHaveLength(1);
        expect(queryAll('th[resize], th[resizable]')).toHaveLength(0);
        expect(query(`.${P}-wrapper`).hasAttribute('resizable')).toBe(false);
    });

    it('rowSelection.hidden 隐藏可调整列宽表格的选择列', () => {
        const getSelectionCells = () => queryAll(`.${P}-column-selection`);
        const { store } = mountTable({
            columns: [
                { title: '标题', dataIndex: 'name', width: 300 },
                { title: '大小', dataIndex: 'size', width: 200 },
            ],
            dataSource: getData(),
            resizable: true,
            rowSelection: { hidden: false },
        });
        expect(getHandles()).toHaveLength(3);
        expect(getSelectionCells().length).toBeGreaterThan(0);
        store.props.rowSelection = { hidden: true };
        flushSync();
        expect(getSelectionCells()).toHaveLength(0);
        expect(queryAll(`.${P}-thead .${P}-row-head`)).toHaveLength(2);
        store.props.rowSelection = { hidden: false };
        flushSync();
        expect(getSelectionCells().length).toBeGreaterThan(0);
    });

    it('选择列与展开列有默认宽度和拖动手柄，rowSelection.onHeaderCell 仍作用于选择列表头', async () => {
        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
                dataSource: getData().slice(0, 1),
                hideExpandedColumn: false,
                pagination: false,
                resizable: true,
                rowSelection: { onHeaderCell: () => ({ class: 'selection-head' }) },
            },
            ['expandedRow']
        );
        expect(getColWidths()).toEqual(['60px', '60px', '200px']);
        const th = query(`th.${P}-column-selection`);
        expect(th.classList.contains('selection-head')).toBe(true);
        expect(th.querySelector(`.${P}-resize-handle`)).not.toBeNull();
        expect(query(`th.${P}-column-expand .${P}-resize-handle`)).not.toBeNull();
        await drag(th.querySelector(`.${P}-resize-handle`) as Element, [40]);
        expect(getColWidths()[0]).toBe('100px');
        expect(query(`th.${P}-column-selection`).classList.contains('selection-head')).toBe(true);
        expect(query(`td.${P}-column-selection`)).not.toBeNull();
    });

    it('选择列与展开列 fixed 为 right 时排在最后', () => {
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name', width: 200 }], dataSource: getData().slice(0, 1), expandCellFixed: 'right', hideExpandedColumn: false, pagination: false, resizable: true, rowSelection: { fixed: 'right' } }, ['expandedRow']);
        const headers = queryAll('[role="columnheader"]');
        expect(headers[0].textContent?.trim()).toBe('Name');
        expect(headers.at(-1)?.querySelector('input[type="checkbox"]')).not.toBeNull();
    });

    it('一次批处理内连续拖动列宽，onResizeStop 收到最终宽度且不带拖动类名', () => {
        const onResizeStop = vi.fn<TableResizeFn>();
        mountTable({
            columns: [
                { title: 'Date', dataIndex: 'date', width: 200 },
                { title: 'Note', dataIndex: 'note' },
            ],
            dataSource: [{ key: 0, date: '2018-02-11' }],
            resizable: { onResizeStop },
        });
        const [handle] = getHandles();
        // synchronous events: the moves of a fast drag can arrive before Svelte renders the previous one
        handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, pointerId: 1 }));
        handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 30, pointerId: 1 }));
        handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 60, pointerId: 1 }));
        handle.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, clientX: 60, pointerId: 1 }));
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResizeStop.mock.calls[0][0]).toMatchObject({ width: 260 });
        expect(onResizeStop.mock.calls[0][0].class ?? '').not.toContain('resizing');
    });

    it('拖动越过起始侧时宽度不小于最小宽度', async () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 100 },
                { title: 'Age', dataIndex: 'age' },
            ],
            dataSource: getData().slice(0, 1),
            pagination: false,
            resizable: true,
        });
        await drag(getHandles()[0], [-500]);
        expect(getColWidths()[0]).toBe('20px');
    });

    it('改变未拖动过的列的 width 后宽度跟随，拖动过的列保留拖动宽度', async () => {
        const columns = (width: number): ColumnProps[] => [
            { title: 'Name', dataIndex: 'name', width },
            { title: 'Age', dataIndex: 'age', width },
            { title: 'Address', dataIndex: 'address' },
        ];
        const { store } = mountTable({ columns: columns(100), dataSource: getData(), pagination: false, resizable: true });
        await drag(getHandles()[0], [50]);
        expect(getColWidths()).toEqual(['150px', '100px', '']);
        store.props.columns = columns(120);
        flushSync();
        expect(getColWidths()).toEqual(['150px', '120px', '']);
    });

    it('拖动中表头带拖动类名，拖动后改变列的 class，新的 columns 优先且拖动宽度保留', async () => {
        const columns = (cls: string): ColumnProps[] => [
            { title: 'Name', dataIndex: 'name', width: 100, class: cls },
            { title: 'Age', dataIndex: 'age' },
        ];
        const { store } = mountTable({ columns: columns('foo'), dataSource: getData(), pagination: false, resizable: { handlerClassName: 'dragging' } });
        const head = () => query(`.${P}-thead th`);
        await fireEvent.pointerDown(getHandles()[0], { button: 0, clientX: 0, pointerId: 1 });
        flushSync();
        expect(head().classList.contains('dragging')).toBe(true);
        await fireEvent.pointerMove(getHandles()[0], { clientX: 50, pointerId: 1 });
        await fireEvent.lostPointerCapture(getHandles()[0], { clientX: 50, pointerId: 1 });
        flushSync();
        expect(head().classList.contains('foo')).toBe(true);
        expect(head().classList.contains('dragging')).toBe(false);
        store.props.columns = columns('bar');
        flushSync();
        expect(head().classList.contains('bar')).toBe(true);
        expect(head().classList.contains('foo')).toBe(false);
        expect(getColWidths()).toEqual(['150px', '']);
    });

    it('resizable 读取全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Table: { resizable: true } };
        try {
            mountTable({
                columns: [
                    { title: 'Name', dataIndex: 'name', width: 100 },
                    { title: 'Age', dataIndex: 'age' },
                ],
                dataSource: getData(),
                pagination: false,
            });
            expect(getHandles()).toHaveLength(1);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('onHeaderCell 照常作用，resize 回调的首参是列配置，返回值合并进列', async () => {
        const onResize = vi.fn<TableResizeFn>((column) => ({ class: `w-${column.width}` }));
        const onHeaderCell = vi.fn<NonNullable<ColumnProps['onHeaderCell']>>(() => ({ class: 'own-head' }));
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 100, onHeaderCell }],
            dataSource: getData(),
            pagination: false,
            resizable: { onResize },
        });
        expect(query(`.${P}-thead th`).classList.contains('own-head')).toBe(true);
        await drag(getHandles()[0], [10]);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ dataIndex: 'name', width: 110 }));
        expect(query(`.${P}-thead th`).classList.contains('w-110')).toBe(true);
        expect(query(`.${P}-thead th`).classList.contains('own-head')).toBe(true);
        expect(onHeaderCell).toHaveBeenCalled();
    });
});
