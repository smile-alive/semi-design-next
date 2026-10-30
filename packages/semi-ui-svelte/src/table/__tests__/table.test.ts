import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { numbers } from '@fibrae/semi-foundation/table/constants';
import type { TableProps } from '../interface';
import { P, click, firstCellTexts, getBodyRows, getColumns, getData, getHeads, mountTable, query, queryAll, rowKeys } from './helpers';

describe('Svelte Table 基本渲染', () => {
    it('按 columns 与 dataSource 渲染表头与行', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false });
        expect(getHeads().map((head) => head.textContent?.trim())).toEqual(['Name', 'Age', 'Address']);
        expect(rowKeys()).toEqual(['1', '2', '3', '4']);
        expect(firstCellTexts()).toEqual(['John Brown', 'Jim Green', 'Joe Black', 'Lisa']);
    });

    it('是行和单元格组成的 table，不是 grid', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, 'aria-label': '用户' });
        const table = query('[role="table"]');
        expect(table.tagName).toBe('TABLE');
        expect(table.getAttribute('aria-label')).toBe('用户');
        expect(query(`.${P}-wrapper`).getAttribute('aria-label')).toBeNull();
        expect(queryAll('[role="grid"]')).toHaveLength(0);
        expect(queryAll('[role="columnheader"]')).toHaveLength(3);
        expect(queryAll('[role="row"]')).toHaveLength(5);
        expect(queryAll('[role="cell"]')).toHaveLength(12);
    });

    it('dataSource 变化后重新渲染，原地 push 也显示新行', () => {
        const { store } = mountTable({ columns: getColumns(), dataSource: getData(), pagination: false });
        store.props.dataSource = getData().slice(0, 2);
        flushSync();
        expect(rowKeys()).toEqual(['1', '2']);
        store.props.dataSource?.push({ key: '9', name: 'New', age: 1, address: 'x' });
        flushSync();
        expect(rowKeys()).toEqual(['1', '2', '9']);
    });

    it('id、class、style 和 data-* 落在根元素上', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, id: 't', class: 'mine', style: 'color: red', 'data-test': 'x' } as never);
        const root = query(`.${P}-wrapper`);
        expect(root.id).toBe('t');
        expect(root.classList.contains('mine')).toBe(true);
        expect(root.getAttribute('style')).toContain('color: red');
        expect(root.dataset.test).toBe('x');
    });

    it('单元格对齐与列 class', () => {
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name', align: 'right', class: 'col-name' }], dataSource: getData(), pagination: false });
        const cell = query(`.${P}-tbody .${P}-row-cell`);
        expect(cell.classList.contains('col-name')).toBe(true);
        expect(cell.getAttribute('style')).toContain('text-align: right');
        expect(getHeads()[0].classList.contains(`${P}-align-right`)).toBe(true);
    });

    it('cell 与 headerCell snippet 按 column 分支，其余列显示原值', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false }, ['cell', 'headerCell']);
        expect(query('.custom-cell').textContent).toBe('John Brown!');
        expect(query('.custom-head').textContent).toBe('Age (years)');
        expect(getHeads()[0].textContent?.trim()).toBe('Name');
        expect(getBodyRows()[0].children[1].textContent?.trim()).toBe('32');
    });

    it('title 与 footer 收到当前页数据，aria-labelledby 指向标题', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false }, ['title', 'footer']);
        expect(query('.custom-title').textContent).toBe('Title 4');
        expect(query('.custom-footer').textContent).toBe('Footer 4');
        const titleId = query(`.${P}-title`).id;
        expect(query('[role="table"]').getAttribute('aria-labelledby')).toBe(titleId);
    });

    it('字符串 title 与 footer', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, title: '标题', footer: '页脚' });
        expect(query(`.${P}-title`).textContent?.trim()).toBe('标题');
        expect(query(`.${P}-footer`).textContent?.trim()).toBe('页脚');
    });

    it('onRow 与 onCell 返回的属性落在行和单元格上，onRow 的 onclick 在内部逻辑之后调用', async () => {
        const calls: string[] = [];
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', onCell: (record) => ({ class: 'cell-x', 'data-name': record.name }) }],
            dataSource: getData(),
            pagination: false,
            onRow: (record) => ({ class: 'row-x', onclick: () => calls.push(`row ${record.key}`) }),
            onRowDoubleClick: (record) => calls.push(`dbl ${record.key}`),
        });
        const row = getBodyRows()[0];
        expect(row.classList.contains('row-x')).toBe(true);
        expect(row.querySelector('.cell-x')?.getAttribute('data-name')).toBe('John Brown');
        await click(row);
        row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(calls).toEqual(['row 1', 'dbl 1']);
    });

    it('onCell 返回 colspan 0 时跳过单元格', () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', onCell: (_record, index) => (index === 0 ? { colspan: 2 } : {}) },
                { title: 'Age', dataIndex: 'age', onCell: (_record, index) => (index === 0 ? { colspan: 0 } : {}) },
            ],
            dataSource: getData(),
            pagination: false,
        });
        const [first, second] = getBodyRows();
        expect(first.children).toHaveLength(1);
        expect(first.children[0].getAttribute('colspan')).toBe('2');
        expect(second.children).toHaveLength(2);
    });

    it('表头分组：父列跨子列，子列在第二行', () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name' },
                {
                    title: 'Info',
                    children: [
                        { title: 'Age', dataIndex: 'age' },
                        { title: 'Address', dataIndex: 'address' },
                    ],
                },
            ],
            dataSource: getData(),
            pagination: false,
        });
        const headRows = queryAll(`.${P}-thead tr`);
        expect(headRows).toHaveLength(2);
        expect(headRows[0].children[0].getAttribute('rowspan')).toBe('2');
        expect(headRows[0].children[1].getAttribute('colspan')).toBe('2');
        expect(Array.from(headRows[1].children, (cell) => cell.textContent?.trim())).toEqual(['Age', 'Address']);
        expect(getBodyRows()[0].children).toHaveLength(3);
    });

    it('空数据显示语言包文案，empty snippet 替换文案', () => {
        mountTable({ columns: getColumns(), dataSource: [] });
        expect(query(`.${P}-empty`).textContent?.trim()).toBe('暂无数据');
    });

    it('empty snippet 替换空文案', () => {
        mountTable({ columns: getColumns(), dataSource: [] }, ['empty']);
        expect(query(`.${P}-empty .custom-empty`).textContent).toBe('Nothing here');
    });

    it('loading 时显示加载中的 Spin', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), loading: true });
        expect(query(`.${P}-wrapper output[aria-label="加载中"]`)).not.toBeNull();
        expect(query(`.${P}-wrapper .semi-spin`).getAttribute('aria-busy')).toBe('true');
    });

    it('size、bordered 落在内层容器的类名上', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), size: 'small', bordered: true });
        expect(query(`.${P}-small.${P}-bordered`)).not.toBeNull();
    });

    it('showHeader 为 false 时不渲染表头', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), showHeader: false });
        expect(getHeads()).toHaveLength(0);
    });

    it('getCurrentPageData 返回当前页数据的副本', () => {
        const { handle } = mountTable({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2 } });
        const pageData = handle().getCurrentPageData();
        expect(pageData.dataSource?.map((record) => record.key)).toEqual(['1', '2']);
        expect(pageData.dataSource?.[0]).not.toBe(getData()[0]);
    });
});

describe('Svelte Table 固定列与固定表头', () => {
    it('固定列得到 sticky 类，表格按固定布局', () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                { title: 'Age', dataIndex: 'age', width: 150 },
                { title: 'Address', dataIndex: 'address', width: 200, fixed: 'right' },
            ],
            dataSource: getData(),
            pagination: false,
            scroll: { x: 1200 },
        });
        expect(query(`.${P}-wrapper`).dataset.columnFixed).toBe('true');
        expect(query(`.${P}-tbody table, table.${P}`).classList.contains(`${P}-fixed`)).toBe(true);
        const cells = getBodyRows()[0].children;
        expect(cells[0].classList.contains(`${P}-cell-fixed-left`)).toBe(true);
        expect(cells[0].classList.contains(`${P}-cell-fixed-left-last`)).toBe(true);
        expect(cells[2].classList.contains(`${P}-cell-fixed-right`)).toBe(true);
        expect(cells[2].getAttribute('style')).toContain('right: 0px');
    });

    it('scroll.y 把表头拆成单独的表，容器是 table，表体可滚动并可聚焦', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, scroll: { y: 200 }, 'aria-label': '用户' });
        const container = query(`.${P}-container`);
        expect(container.getAttribute('role')).toBe('table');
        expect(container.getAttribute('aria-label')).toBe('用户');
        expect(query(`.${P}-header table`).getAttribute('role')).toBe('none');
        expect(query(`.${P}-body table`).getAttribute('role')).toBe('none');
        expect(query(`.${P}-thead`).getAttribute('role')).toBe('rowgroup');
        const body = query(`.${P}-body`);
        expect(body.style.maxHeight).toBe('200px');
        expect(body.tabIndex).toBe(0);
        expect(query(`.${P}-fixed-header`)).not.toBeNull();
    });

    it('sticky 表头使用顶部偏移', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), sticky: { top: 20 } });
        const header = query(`.${P}-header`);
        expect(header.classList.contains(`${P}-header-sticky`)).toBe(true);
        expect(header.style.top).toBe('20px');
    });
});

describe('Svelte Table 虚拟化行高', () => {
    const rows = (count: number) => Array.from({ length: count }, (_, i) => ({ key: String(i), name: `n${i}` }));
    const virtualProps = (extra: TableProps): TableProps => ({
        columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
        pagination: false,
        scroll: { y: 400 },
        virtualized: { itemSize: (_index, { expandedRow }) => (expandedRow ? 100 : 40) },
        ...extra,
    });
    const topOf = (key: string) => document.querySelector<HTMLElement>(`[data-row-key="${key}"]`)?.style.top;

    it('virtualized.itemSize 变化后按新行高重新排布', () => {
        const { store } = mountTable({ columns: [{ title: 'Name', dataIndex: 'name', width: 200 }], dataSource: rows(100), pagination: false, scroll: { y: 300 }, virtualized: { itemSize: 50 } });
        const rowGroup = () => query(`.${P}-body .${P}-tbody`);
        expect(rowGroup().style.height).toBe('5000px');
        store.props.virtualized = { itemSize: 80 };
        flushSync();
        expect(rowGroup().style.height).toBe('8000px');
        expect(getBodyRows()[1].style.top).toBe('80px');
        expect(getBodyRows()[1].style.height).toBe('80px');
    });

    it('展开行后重新计算各行的偏移', () => {
        const { store } = mountTable(virtualProps({ dataSource: rows(10), expandedRowKeys: [] }), ['expandedRow']);
        expect(topOf('2')).toBe('80px');
        store.props.expandedRowKeys = ['1'];
        flushSync();
        expect(topOf('1-expanded-row')).toBe('80px');
        expect(topOf('2')).toBe('180px');
    });

    it('行数不变而各下标的行类型变化时重新计算各行的偏移', () => {
        const [a, b, c] = ['a', 'b', 'c'].map((key) => ({ key, name: key }));
        const { store } = mountTable(virtualProps({ dataSource: [a, b, c], expandedRowKeys: ['a'] }), ['expandedRow']);
        expect(topOf('c')).toBe('180px');
        store.props.dataSource = [b, c, a];
        flushSync();
        expect(topOf('c')).toBe('40px');
        expect(topOf('a-expanded-row')).toBe('120px');
    });

    it('itemSize 函数返回 null 时按默认行高排布，且不告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // null breaks the declared number return type: it stands for a user function that returns nothing
        const itemSize = (() => null) as unknown as () => number;
        mountTable(virtualProps({ dataSource: rows(10), virtualized: { itemSize } }));
        expect(topOf('2')).toBe(`${numbers.DEFAULT_VIRTUALIZED_ROW_HEIGHT * 2}px`);
        expect(warn.mock.calls.flat().filter((message) => String(message).includes('`itemSize`'))).toHaveLength(0);
    });
});
