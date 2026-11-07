import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { getData } from '@test/utils/solid';
import Table from '..';
import type { GetVirtualizedListRef, TableProps } from '../interface';
import { P, getBodyRows, query, queryAll } from './table-helpers';

type Row = Record<string, any>;

const nameColumns = [{ title: 'Name', dataIndex: 'name', width: 200 }];
const topOf = (key: string) => document.querySelector<HTMLElement>(`[data-row-key="${key}"]`)?.style.top;
const warnings = (warn: { mock: { calls: unknown[][] } }, text: string) => warn.mock.calls.filter((call) => String(call[0]).includes(text));

describe('Table 虚拟化', () => {
    it('只渲染一段行窗口，并把 list 句柄交给 getVirtualizedListRef', async () => {
        const getVirtualizedListRef = vi.fn<GetVirtualizedListRef>();
        render(() => <Table columns={nameColumns} dataSource={getData(1000)} getVirtualizedListRef={getVirtualizedListRef} pagination={false} scroll={{ y: 300 }} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        expect(getBodyRows().length).toBeLessThan(1000);
        expect(getVirtualizedListRef).toHaveBeenCalledTimes(1);
        expect(typeof getVirtualizedListRef.mock.lastCall?.[0].scrollToItem).toBe('function');
    });

    it('列表挂载后才设置 scroll.y 时，观察虚拟化 body', async () => {
        const disconnect = vi.fn<() => void>();
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: (entries: unknown[]) => void;
                constructor(callback: (entries: unknown[]) => void) {
                    this.callback = callback;
                }
                observe() {
                    this.callback([]);
                }
                unobserve() {}
                disconnect() {
                    disconnect();
                }
            }
        );
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const [scroll, setScroll] = createSignal<TableProps['scroll']>();
            const { unmount } = render(() => <Table columns={nameColumns} dataSource={getData(100)} pagination={false} scroll={scroll()} sticky virtualized />);
            await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
            setScroll({ y: 300 });
            // the test setup gives the list offsetWidth 100 and clientWidth 0, i.e. a scrollbar
            await waitFor(() => expect(query(`.${P}-header`)).toHaveStyle({ 'overflow-y': 'scroll' }));
            unmount();
            expect(disconnect).toHaveBeenCalled();
        } finally {
            warn.mockRestore();
            vi.unstubAllGlobals();
        }
    });

    it('虚拟化表格计入表头行和所有 body 行', async () => {
        render(() => <Table columns={nameColumns} dataSource={getData(1000)} pagination={false} scroll={{ y: 300 }} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const table = screen.getByRole('table');
        expect(table).toHaveAttribute('aria-rowcount', '1001');
        expect(within(table).getAllByRole('rowgroup')).toHaveLength(2);
        expect(getBodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
        expect(document.querySelectorAll('[aria-rowcount]')).toHaveLength(1);
    });

    it('style.width 不被 scroll.x 覆盖', () => {
        render(() => <Table style={{ width: '100%' }} columns={[{ title: 'Name', dataIndex: 'name', width: 100 }]} dataSource={getData(3)} pagination={false} scroll={{ x: 800, y: 200 }} virtualized />);
        expect(query(`.${P}-wrapper`).style.width).toBe('100%');
    });

    it('没有 style.width 时根元素取 scroll.x', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 100 }]} dataSource={getData(3)} pagination={false} scroll={{ x: 800, y: 200 }} virtualized />);
        expect(query(`.${P}-wrapper`).style.width).toBe('800px');
    });

    it('虚拟化时展开行带 aria-rowindex，等于前一数据行加 1', async () => {
        render(() => <Table columns={nameColumns} dataSource={getData(3)} defaultExpandAllRows pagination={false} scroll={{ y: 300 }} virtualized expandedRowRender={() => 'detail'} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(1));
        const expanded = query('[data-row-key$="-expanded-row"]');
        expect(expanded).toHaveAttribute('aria-rowindex', '3');
        expect(expanded.previousElementSibling).toHaveAttribute('aria-rowindex', '2');
    });

    it('虚拟化表体横向滚动不触发 virtualized.onScroll', async () => {
        const onScroll = vi.fn<(args: object) => void>();
        render(() => <Table columns={nameColumns} dataSource={getData(100)} pagination={false} scroll={{ x: 800, y: 300 }} virtualized={{ onScroll }} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const body = query(`.${P}-body`);
        body.scrollTop = 50;
        fireEvent.scroll(body);
        expect(onScroll).toHaveBeenLastCalledWith(expect.objectContaining({ scrollOffset: 50 }));
        const calls = onScroll.mock.calls.length;
        body.scrollLeft = 30;
        fireEvent.scroll(body);
        expect(onScroll).toHaveBeenCalledTimes(calls);
    });

    it('showHeader 为 false 时行数不计表头行', async () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200, sorter: (a, b) => a.name.localeCompare(b.name) }]} dataSource={getData(3)} pagination={false} scroll={{ y: 300 }} showHeader={false} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBe(3));
        expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '3');
        expect(getBodyRows()[0]).toHaveAttribute('aria-rowindex', '1');
    });

    it('空表格显示空状态，列表不保留 scroll.y 高度', async () => {
        render(() => <Table columns={nameColumns} dataSource={[]} pagination={false} scroll={{ y: 300 }} virtualized />);
        await waitFor(() => expect(query(`.${P}-body`)).toBeInTheDocument());
        expect(query(`.${P}-body`).style.height).toBe('');
        expect(screen.getByText(zh_CN.Table.emptyText)).toBeInTheDocument();
    });
});

describe('Table 虚拟化分组', () => {
    it('分组行与展开分组的记录行按扁平顺序渲染，aria-rowindex 连续', async () => {
        const dataSource = [
            { key: '1', city: 'B', name: 'b1' },
            { key: '2', city: 'B', name: 'b2' },
            { key: '3', city: 'A', name: 'a1' },
        ];
        render(() => <Table clickGroupedRowToExpand columns={nameColumns} dataSource={dataSource} defaultExpandAllGroupRows groupBy="city" pagination={false} scroll={{ y: 300 }} virtualized renderGroupSection={(groupKey) => `group ${groupKey}`} />);
        await waitFor(() => expect(queryAll(`.${P}-row-section`)).toHaveLength(2));
        const rows = queryAll(`.${P}-tbody [role="row"]`);
        expect(rows.map((row) => row.textContent)).toEqual(['group B', 'b1', 'b2', 'group A', 'a1']);
        expect(rows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3', '4', '5', '6']);
        await userEvent.click(screen.getByText('group B'));
        await waitFor(() => expect(screen.queryByText('b1')).not.toBeInTheDocument());
        expect(screen.getByText('a1')).toBeInTheDocument();
        expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '4');
    });
});

describe('Table 虚拟化行高', () => {
    it('展开行后重新计算各行的偏移', async () => {
        render(() => <Table columns={nameColumns} dataSource={getData(10)} pagination={false} scroll={{ y: 400 }} virtualized={{ itemSize: (_index, row) => (row?.expandedRow ? 100 : 40) }} expandedRowRender={() => 'detail'} />);
        await waitFor(() => expect(topOf('2')).toBe('80px'));
        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Table.expandRow })[1]);
        await waitFor(() => expect(topOf('1-expanded-row')).toBe('80px'));
        expect(topOf('2')).toBe('180px');
    });

    it('行数不变而各下标的行类型变化时重新计算各行的偏移', () => {
        const a = { key: 'a', name: 'a' };
        const b = { key: 'b', name: 'b' };
        const c = { key: 'c', name: 'c' };
        const [dataSource, setDataSource] = createSignal<Row[]>([a, b, c]);
        render(() => <Table columns={nameColumns} dataSource={dataSource()} expandedRowKeys={['a']} pagination={false} scroll={{ y: 400 }} virtualized={{ itemSize: (_index, row) => (row?.expandedRow ? 100 : 40) }} expandedRowRender={() => 'detail'} />);
        expect(topOf('c')).toBe('180px');

        setDataSource([b, c, a]);
        expect(topOf('c')).toBe('40px');
        expect(topOf('a-expanded-row')).toBe('120px');
    });

    it('rowExpandable 为假的行没有展开行，展开行以 expanded 为 true 渲染', async () => {
        const expandedRowRender = vi.fn<NonNullable<TableProps['expandedRowRender']>>(() => 'detail');
        render(() => <Table columns={nameColumns} dataSource={getData(3)} defaultExpandAllRows pagination={false} rowExpandable={(record) => record?.key !== '1'} scroll={{ y: 300 }} virtualized expandedRowRender={expandedRowRender} />);
        await waitFor(() => expect(query('[data-row-key="0-expanded-row"]')).toBeInTheDocument());
        expect(query('[data-row-key="1-expanded-row"]')).toBeNull();
        expect(expandedRowRender.mock.calls.every(([record, , expanded]) => record?.key !== '1' && expanded === true)).toBe(true);
    });
});

describe('Table 虚拟化的开发期告警', () => {
    it('itemSize 过小时只警告一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const [dataSource, setDataSource] = createSignal(getData(50));
        render(() => <Table columns={nameColumns} dataSource={dataSource()} pagination={false} scroll={{ y: 300 }} virtualized={{ itemSize: 20 }} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        setDataSource(getData(40));
        expect(warnings(warn, 'itemSize')).toHaveLength(1);
        warn.mockRestore();
    });

    it('没有 scroll.y 时警告一次', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const [dataSource, setDataSource] = createSignal(getData(5));
        render(() => <Table columns={nameColumns} dataSource={dataSource()} pagination={false} virtualized />);
        setDataSource(getData(5));
        expect(warnings(warn, 'scroll.y')).toHaveLength(1);
        warn.mockRestore();
    });
});
