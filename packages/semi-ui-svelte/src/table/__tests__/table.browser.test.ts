import { createRawSnippet, flushSync } from 'svelte';
import { screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, isChromium, tab, tabTo } from '@test/utils/browser';
import { getData } from '@test/utils/table/data';
import type { ColumnProps, RowSelectionProps, TableCellSnippetProps, TableChangeInfo, TableExpandedRowSnippetProps, TableFilterDropdownSnippetProps, TableGroupSectionSnippetProps, TableResizeFn, TableRowAttrs } from '../interface';
import { P, mountTable, query, queryAll } from './helpers';

type Row = Record<string, any>;

const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));
const designFilters = ['Semi Design 设计稿', 'Semi D2C 设计稿'].map((value) => ({ text: value, value }));

const fixedBothSideColumns: ColumnProps[] = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address', width: 150 },
    { title: 'Description', dataIndex: 'description', fixed: 'right', width: 150 },
];

const getBody = () => query(`.${P}-body`);
const getBodyRows = () => queryAll(`.${P}-tbody .${P}-row`);
const getDropdown = () => document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown`);
const getFilterTriggers = () => queryAll(`.${P}-column-filter`);
const getHeadEllipsis = () => queryAll(`.${P}-row-head-ellipsis`);
const hasTitle = (el: Element) => el.matches('[title]') || el.querySelector('[title]') !== null;
// the filter button keeps a zero-width space for its icon to align to
const getHeaderCell = (container: Element, title: string) => queryAll(`.${P}-thead .${P}-row-head`, container).find((th) => th.textContent?.replaceAll('​', '').trim() === title) as HTMLElement;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const findElement = <E extends Element>(find: () => E | null | undefined) =>
    waitFor(() => {
        const found = find();
        expect(found).toBeTruthy();
        return found as E;
    });

// Real mouse input from Playwright in every browser: setPointerCapture rejects a synthetic pointerId. The drop target is
// the root, so the drag may end anywhere in the viewport; a point left of the viewport is clamped to its edge
async function drag(handle: Element, dx: number) {
    const root = document.documentElement.getBoundingClientRect();
    const box = handle.getBoundingClientRect();
    const x = Math.max(0, box.left + box.width / 2 + dx);
    await userEvent.dragAndDrop(handle, document.documentElement, { targetPosition: { x: x - root.left, y: box.top + box.height / 2 - root.top } });
}

async function getAccessibilityTree() {
    const { frameTree } = await cdp().send('Page.getFrameTree');
    const frame = frameTree.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
    if (!frame) {
        throw new Error('The test iframe is missing from the frame tree');
    }
    const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
    return nodes;
}

describe('Svelte Table（浏览器）', () => {
    it('修复 #247：所有列都没有宽度时，表头与表体列对齐', () => {
        const columns = ['name', 'age', 'address', 'description'].map((dataIndex) => ({ title: dataIndex, dataIndex }));
        const { container } = mountTable({ bordered: true, columns, dataSource: getData(8), pagination: false, scroll: { y: 300 } }, [], 'width: 800px');
        expect(getComputedStyle(query(`.${P}-header table`, container)).tableLayout).toBe('fixed');
        const headerCells = queryAll(`.${P}-thead .${P}-row-head`, container);
        const bodyCells = Array.from(query(`.${P}-tbody .${P}-row`, container).children);
        expect(headerCells).toHaveLength(columns.length);
        headerCells.forEach((th, i) => {
            const thRect = th.getBoundingClientRect();
            const tdRect = bodyCells[i].getBoundingClientRect();
            expect(Math.abs(thRect.left - tdRect.left)).toBeLessThan(1);
            expect(Math.abs(thRect.width - tdRect.width)).toBeLessThan(1);
        });
    });

    // Reads Chrome's accessibility tree over CDP
    it.skipIf(!isChromium).each([
        ['scroll.y', { scroll: { y: 300 } }],
        ['sticky', { sticky: true }],
        ['virtualized', { scroll: { y: 300 }, virtualized: true }],
    ])('%s Chrome 中表头与表体行作为一个 table 暴露', async (_name, extra) => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 200 },
                {
                    title: 'Detail',
                    children: [
                        { title: 'Age', dataIndex: 'age', width: 100 },
                        { title: 'Address', dataIndex: 'address', width: 300 },
                    ],
                },
            ],
            dataSource: getData(3),
            pagination: false,
            ...extra,
        });
        await waitFor(() => expect(screen.getAllByRole('cell')).toHaveLength(9));
        const nodes = await getAccessibilityTree();
        const byId = new Map(nodes.map((node) => [node.nodeId, node]));
        const exposed = nodes.filter((node) => !node.ignored);
        const ofRole = (role: string) => exposed.filter((node) => node.role?.value === role);
        const owner = (node?: (typeof nodes)[number]) => {
            let parent = node?.parentId ? byId.get(node.parentId) : undefined;
            while (parent && (parent.ignored || parent.role?.value === 'generic')) {
                parent = parent.parentId ? byId.get(parent.parentId) : undefined;
            }
            return parent;
        };

        expect(ofRole('LayoutTable')).toHaveLength(0);
        const [table, ...otherTables] = ofRole('table');
        expect(otherTables).toHaveLength(0);
        expect(ofRole('columnheader').map((node) => node.name?.value)).toEqual(['Name', 'Detail', 'Age', 'Address']);
        const rows = ofRole('row');
        expect(rows).toHaveLength(5);
        for (const row of rows) {
            expect(owner(row)?.role?.value).toBe('rowgroup');
            expect(owner(owner(row))).toBe(table);
        }
        for (const cell of [...ofRole('columnheader'), ...ofRole('cell')]) {
            expect(rows).toContain(owner(cell));
        }
    });

    it('修复 z-index 问题：固定列保持在重叠的定位元素之下', () => {
        const { container } = mountTable(
            {
                columns: [
                    { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                    { title: 'Owner', dataIndex: 'owner', width: 600 },
                    { title: 'Size', dataIndex: 'size', width: 200, fixed: 'right' },
                ],
                dataSource: getFileData(10),
                rowSelection: {},
                scroll: { y: 300, x: 950 },
            },
            [],
            'position: relative; width: 600px'
        );
        const overlay = document.createElement('div');
        overlay.style.cssText = 'height: 60px; position: absolute; top: 0; left: 0; right: 0; z-index: 2';
        (container.firstElementChild as HTMLElement).prepend(overlay);
        const wrapper = query(`.${P}-wrapper`, container);
        expect(wrapper.dataset.columnFixed).toBe('true');
        expect(getComputedStyle(wrapper).zIndex).toBe('1');
        const rect = query(`.${P}-thead .${P}-cell-fixed-left`, container).getBoundingClientRect();
        expect(rect.top).toBeLessThan(60);
        expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height, 60) / 2)).toBe(overlay);
    });

    it.each(['ltr', 'rtl'] as const)('%s 下虚拟化表格的 tbody 是 block', async (direction) => {
        const { container } = mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getFileData(50), direction, pagination: false, scroll: { y: 300 }, virtualized: true });
        const tbody = await findElement(() => container.querySelector<HTMLElement>(`.${P}-tbody`));
        expect(getComputedStyle(tbody).display).toBe('block');
    });

    it('修复 #944：空的虚拟表格不保留 scroll.y 高度', async () => {
        const { container, store } = mountTable({
            style: 'width: 800px',
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                { title: 'Owner', dataIndex: 'owner' },
                { title: 'Size', dataIndex: 'size', width: 250, fixed: 'right' },
            ],
            dataSource: [],
            pagination: false,
            scroll: { y: 600, x: 1600 },
            virtualized: true,
        });
        const placeholder = await findElement(() => container.querySelector<HTMLElement>(`.${P}-placeholder`));
        const emptyRect = placeholder.getBoundingClientRect();
        expect(emptyRect.height).toBeGreaterThan(0);
        expect(getBody().getBoundingClientRect().height).toBeLessThan(600);
        expect(getBody().getBoundingClientRect().bottom).toBeGreaterThanOrEqual(emptyRect.bottom - 1);

        store.props.dataSource = getFileData(1000);
        flushSync();
        await waitFor(() => expect(getBody().getBoundingClientRect().height).toBe(600));
    });

    it('修复 #2305：scroll.y 在挂载后才给出时，scrollToItem 可用', async () => {
        const { handle, store } = mountTable({
            style: 'width: 750px',
            columns: [
                { title: 'Name', dataIndex: 'name', width: 200, fixed: true },
                { title: 'Owner', dataIndex: 'owner' },
                { title: 'Size', dataIndex: 'size', width: 150, fixed: 'right' },
            ],
            dataSource: getFileData(1000),
            pagination: false,
            scroll: {},
            virtualized: true,
        });
        store.props.scroll = { y: 400, x: 900 };
        flushSync();
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        expect(screen.queryByText('Semi Design 设计稿20.fig')).not.toBeInTheDocument();
        handle().scrollToItem(20);
        expect(await screen.findByText('Semi Design 设计稿20.fig')).toBeInTheDocument();
    });

    it('有固定列时，容器宽度变化不重新渲染表格，分组行仍随容器变宽', async () => {
        const onHeaderRow = vi.fn<() => TableRowAttrs>(() => ({}));
        const onGroupedRow = vi.fn<() => TableRowAttrs>(() => ({}));
        const renders = () => onHeaderRow.mock.calls.length + onGroupedRow.mock.calls.length;
        const { container } = mountTable(
            {
                columns: [
                    { title: '名称', dataIndex: 'name', fixed: 'left', width: 300 },
                    { title: '大小', dataIndex: 'size', width: 300 },
                    { title: '所有者', dataIndex: 'owner', width: 300 },
                ],
                dataSource: getFileData(6),
                groupBy: 'owner',
                pagination: false,
                scroll: { x: 900, y: 300 },
                onHeaderRow,
                onGroupedRow,
            },
            ['groupSection'],
            'width: 800px'
        );
        const wrapper = container.firstElementChild as HTMLElement;
        const section = () => query(`.${P}-section-inner`, container);
        await waitFor(() => expect(section().getBoundingClientRect().width).toBeGreaterThan(0));
        await nextFrame();
        const before = renders();
        const sectionWidth = section().getBoundingClientRect().width;

        for (const width of [760, 720, 680, 640, 600]) {
            wrapper.style.width = `${width}px`;
            await nextFrame();
        }
        expect(renders()).toBe(before);
        expect(section().getBoundingClientRect().width).toBeCloseTo(sectionWidth - 200, 0);
    });

    it('固定列表格横向滚动不触发 Table 重渲染', async () => {
        const onRow = vi.fn<() => TableRowAttrs>(() => ({}));
        mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false, onRow }, [], 'width: 300px');
        const body = getBody();
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const before = onRow.mock.calls.length;
        const max = body.scrollWidth - body.clientWidth;

        for (const scrollLeft of [max / 2, max, 0]) {
            body.scrollLeft = scrollLeft;
            await expect.poll(() => body.scrollLeft).toBe(scrollLeft);
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        expect(onRow).toHaveBeenCalledTimes(before);
    });

    it('不支持 scroll-state 时按横向滚动位置写 data-scrollable-*', async () => {
        const supports = CSS.supports.bind(CSS);
        vi.spyOn(CSS, 'supports').mockImplementation(((property: string, value?: string) => (property === 'container-type' && value === 'scroll-state' ? false : value === undefined ? supports(property) : supports(property, value))) as typeof CSS.supports);
        const { container } = mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false }, [], 'width: 300px');
        const tableContainer = query(`.${P}-container`, container);
        const body = await findElement(getBody);
        // [left, right] shadows shown; container queries restyle a frame after the scroll
        const shadows = () => (['left-last', 'right-first'] as const).map((side) => getComputedStyle(query(`.${P}-cell-fixed-${side}`, body), '::after').display !== 'none');

        await waitFor(() => expect(tableContainer).toHaveAttribute('data-scrollable-right'));
        expect(tableContainer).not.toHaveAttribute('data-scrollable-left');
        await expect.poll(shadows).toEqual([false, true]);

        body.scrollLeft = 100;
        await waitFor(() => expect(tableContainer).toHaveAttribute('data-scrollable-left'));
        expect(tableContainer).toHaveAttribute('data-scrollable-right');
        await expect.poll(shadows).toEqual([true, true]);

        body.scrollLeft = body.scrollWidth;
        await waitFor(() => expect(tableContainer).not.toHaveAttribute('data-scrollable-right'));
        expect(tableContainer).toHaveAttribute('data-scrollable-left');
        await expect.poll(shadows).toEqual([true, false]);
    });

    it.each([
        ['普通表格', {}],
        ['固定表头', { scroll: { y: 300 } }],
        ['虚拟化表体', { scroll: { y: 300 }, virtualized: true }],
    ] as const)('%s：固定列阴影随滚动位置显示/隐藏', async (_label, extraProps) => {
        const { container } = mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false, ...extraProps }, [], 'width: 300px');
        const body = await findElement(getBody);
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const max = body.scrollWidth - body.clientWidth;

        const leftLastCells = () => queryAll(`.${P}-cell-fixed-left-last`, container);
        const rightFirstCells = () => queryAll(`.${P}-cell-fixed-right-first`, container);
        const shadowsOf = (cells: HTMLElement[]) => cells.map((cell) => getComputedStyle(cell, '::after').display);
        const allHaveShadow = (cells: HTMLElement[]) => shadowsOf(cells).every((shadow) => shadow !== 'none');
        const noneHaveShadow = (cells: HTMLElement[]) => shadowsOf(cells).every((shadow) => shadow === 'none');

        await expect.poll(() => noneHaveShadow(leftLastCells())).toBe(true);
        await expect.poll(() => allHaveShadow(rightFirstCells())).toBe(true);

        body.scrollLeft = max / 2;
        await expect.poll(() => allHaveShadow(leftLastCells())).toBe(true);
        await expect.poll(() => allHaveShadow(rightFirstCells())).toBe(true);

        body.scrollLeft = max;
        await expect.poll(() => allHaveShadow(leftLastCells())).toBe(true);
        await expect.poll(() => noneHaveShadow(rightFirstCells())).toBe(true);
    });

    it('RTL：固定列阴影随滚动位置正确对应视觉左右两侧', async () => {
        const { container } = mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), direction: 'rtl', pagination: false }, [], 'width: 300px');
        const body = getBody();
        // Chrome represents an RTL scroller's scrollLeft from 0 (visual right, the start) down to a negative minimum
        await waitFor(() => expect(body.scrollLeft).toBe(0));
        await waitFor(() => expect(getComputedStyle(body).direction).toBe('rtl'));
        const min = -(body.scrollWidth - body.clientWidth);
        await waitFor(() => expect(min).toBeLessThan(0));

        const leftLast = () => query(`.${P}-cell-fixed-left-last`, container);
        const rightFirst = () => query(`.${P}-cell-fixed-right-first`, container);
        const hasShadow = (el: HTMLElement) => getComputedStyle(el, '::after').display !== 'none';

        await expect.poll(() => hasShadow(rightFirst())).toBe(false);
        await expect.poll(() => hasShadow(leftLast())).toBe(true);

        body.scrollLeft = min / 2;
        await expect.poll(() => hasShadow(rightFirst())).toBe(true);
        await expect.poll(() => hasShadow(leftLast())).toBe(true);

        body.scrollLeft = min;
        await expect.poll(() => hasShadow(rightFirst())).toBe(true);
        await expect.poll(() => hasShadow(leftLast())).toBe(false);
    });

    it('有边框的横向可滚动表格：末端边框由容器绘制，末列不再重复绘制', async () => {
        const { container } = mountTable({ bordered: true, columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false }, [], 'width: 300px');
        const body = getBody();
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const tableContainer = query(`.${P}-container`, container);
        const lastCells = queryAll(`.${P}-cell-last`, container);

        expect(lastCells.length).toBeGreaterThan(0);
        expect(lastCells.map((cell) => getComputedStyle(cell).borderInlineEndWidth)).toEqual(lastCells.map(() => '0px'));
        expect(getComputedStyle(tableContainer).borderInlineEndWidth).toBe('1px');
        body.scrollLeft = body.scrollWidth - body.clientWidth;
        await expect.poll(() => body.scrollLeft).toBeGreaterThan(0);
        expect(getComputedStyle(tableContainer).borderInlineEndWidth).toBe('1px');
    });

    it('滚动', () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                { title: 'Age', dataIndex: 'age', width: 150 },
                { title: 'Address', width: 200, dataIndex: 'address' },
                { title: 'Description', dataIndex: 'description' },
                { key: 'operate', fixed: 'right', width: 250 },
            ],
            dataSource: getData(12),
            scroll: { y: 300, x: '120%' },
        });
        const body = getBody();
        body.scrollTop = body.scrollHeight;
        expect(body.scrollTop).toBeGreaterThan(0);
        body.scrollTop = 0;
        expect(body.scrollTop).toBe(0);
        body.scrollLeft = body.scrollWidth;
        expect(body.scrollLeft).toBeGreaterThan(0);
        body.scrollLeft = 0;
        expect(body.scrollLeft).toBe(0);
    });

    it('无限滚动', async () => {
        const itemSize = 56;
        const scroll = { y: 600, x: 1600 };
        let length = 20;
        const { store } = mountTable({
            style: 'width: 800px',
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                { title: 'Age', dataIndex: 'age', width: 150 },
                { title: 'Address', dataIndex: 'address' },
                { key: 'operate', fixed: 'right', width: 250 },
            ],
            dataSource: getData(20),
            pagination: false,
            rowSelection: { fixed: true },
            scroll,
            virtualized: { itemSize },
            // the scroll arguments carry only the offset: a load near the end grows the data
            onScroll: ({ scrollOffset }) => {
                if (scrollOffset >= (length - Math.ceil(scroll.y / itemSize) * 1.5) * itemSize) {
                    length += 20;
                    store.props.dataSource = getData(length);
                }
            },
        });
        const rowTexts = () => Array.from(document.querySelectorAll('div[role="row"]'), (row) => row.textContent ?? '');
        await waitFor(() => expect(rowTexts().length).toBeGreaterThan(0));
        expect(rowTexts().length).toBeLessThan(30);

        const firstHeight = getBody().scrollHeight;
        getBody().scrollTop = firstHeight;
        await waitFor(() => expect(rowTexts().some((text) => text.includes('Edward King 14'))).toBe(true));
        await waitFor(() => expect(getBody().scrollHeight).toBeGreaterThan(firstHeight));
        getBody().scrollTop = getBody().scrollHeight;
        await waitFor(() => expect(rowTexts().some((text) => text.includes('Edward King 34'))).toBe(true));
        getBody().scrollTop = 0;
        await waitFor(() => expect(rowTexts().some((text) => text.includes('Edward King 0'))).toBe(true));
    });

    it('虚拟表格横向滚动后再纵向滚动，横向位置保持且表头对齐', async () => {
        mountTable({
            style: 'width: 800px',
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                { title: 'Age', dataIndex: 'age', width: 150 },
                { title: 'Address', dataIndex: 'address' },
                { key: 'operate', fixed: 'right', width: 250 },
            ],
            dataSource: getData(100),
            pagination: false,
            scroll: { y: 300, x: 1600 },
            virtualized: true,
        });
        const header = await findElement(() => document.querySelector<HTMLElement>(`.${P}-header`));
        const body = getBody();
        body.scrollLeft = 300;
        await waitFor(() => expect(header.scrollLeft).toBe(300));

        body.scrollTop = 56 * 50;
        await waitFor(() => expect(screen.getByText('Edward King 50')).toBeInTheDocument());
        expect(screen.queryByText('Edward King 0')).not.toBeInTheDocument();
        expect(body.scrollLeft).toBe(300);
        expect(header.scrollLeft).toBe(300);
    });

    describe('省略标题', () => {
        const longTitle = '标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题';
        const data = [
            {
                key: '1',
                name: 'Semi is designed based on FA architecture, and the main logic is extracted as Foundation package, which is easy to migrate to other frameworks',
                size: '2M',
                owner: 'LiveCode 允许你使用在线代码编辑器即时演示你的 UI 组件 LiveCode 允许你使用在线代码编辑器即时演示你的 UI 组件',
                updateTime: '2020-02-02 05:13',
            },
        ];
        const sorter = (a?: Row, b?: Row) => ((a?.name.length ?? 0) - (b?.name.length ?? 0) > 0 ? 1 : -1);
        const onFilter = (value: string, record: Row) => record.name.includes(value);

        it('普通表格省略标题', () => {
            const columns: ColumnProps[] = [
                { title: '标题标题标题标题标题标题标题标题', dataIndex: 'name', ellipsis: true, filters: designFilters, onFilter, sorter },
                { title: '所有者', dataIndex: 'owner', ellipsis: true, filters: designFilters, onFilter, sorter },
                { title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小', dataIndex: 'size', sorter, ellipsis: true },
                { title: '更新日期', dataIndex: 'updateTime', ellipsis: true },
            ];
            mountTable({ style: 'width: 800px', columns, dataSource: data, pagination: false });
            mountTable({ columns, dataSource: data, pagination: false });
            expect(getHeadEllipsis()).toHaveLength(8);
            for (const head of getHeadEllipsis()) {
                expect(hasTitle(head)).toBe(true);
            }
        });

        it('固定列表格省略标题', () => {
            mountTable({
                style: 'width: 1000px',
                columns: [
                    { title: longTitle, dataIndex: 'name', fixed: true, width: 300, filters: designFilters, onFilter, sorter, ellipsis: true },
                    { title: '所有者', dataIndex: 'owner', ellipsis: true, filters: designFilters, onFilter, sorter, width: 300 },
                    { title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小', dataIndex: 'size', sorter, ellipsis: true },
                    { title: '更新日期', dataIndex: 'updateTime', ellipsis: true, width: 300, fixed: 'right' },
                ],
                dataSource: data,
                pagination: false,
                scroll: { x: 1200 },
            });
            expect(getHeadEllipsis()).toHaveLength(4);
            for (const head of getHeadEllipsis()) {
                expect(hasTitle(head)).toBe(true);
            }
        });

        it('固定列表格省略标题，showTitle 为 false', () => {
            mountTable({
                style: 'width: 1000px',
                columns: [
                    { title: longTitle, dataIndex: 'name', fixed: true, width: 300, filters: designFilters, onFilter, sorter, ellipsis: { showTitle: false } },
                    { title: '所有者', dataIndex: 'owner', width: 300, filters: designFilters, onFilter, sorter, ellipsis: { showTitle: false } },
                    { title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小', dataIndex: 'size', sorter, ellipsis: { showTitle: false } },
                    { title: '更新日期', dataIndex: 'updateTime', width: 300, fixed: 'right', ellipsis: { showTitle: false } },
                ],
                dataSource: data,
                pagination: false,
                scroll: { x: 1200 },
                cell: createRawSnippet<[TableCellSnippetProps]>((args) => ({ render: () => `<span>${String(args().text)}</span>` })),
            });
            expect(getHeadEllipsis()).toHaveLength(4);
            for (const head of getHeadEllipsis()) {
                expect(hasTitle(head)).toBe(false);
            }
            for (const cell of queryAll(`.${P}-row-cell`)) {
                expect(hasTitle(cell)).toBe(false);
            }
        });
    });

    it('虚拟表格 showHeader 为 false', () => {
        mountTable({
            style: 'width: 750px; margin: 0 auto',
            columns: [
                { title: '标题', dataIndex: 'name', width: 200, fixed: true },
                { title: '大小', dataIndex: 'size', width: 150 },
                { title: '所有者', dataIndex: 'owner' },
                { title: '更新日期', dataIndex: 'key', fixed: 'right', width: 150 },
            ],
            dataSource: getFileData(1000),
            pagination: false,
            scroll: { y: 400, x: 900 },
            showHeader: false,
            virtualized: true,
        });
        const headers = queryAll(`.${P}-header`);
        expect(headers).toHaveLength(1);
        expect(getComputedStyle(headers[0]).height).toBe('0px');
    });

    it('showHeader 为 false 且表头拆分时，Tab 不进入隐藏表头', async () => {
        const { container } = mountTable({
            columns: [{ title: '标题', dataIndex: 'name', width: 200, sorter: (a?: Row, b?: Row) => String(a?.name).localeCompare(String(b?.name)), filters: [{ text: 'a', value: 'a' }], onFilter: () => true }],
            dataSource: getFileData(3),
            pagination: false,
            scroll: { y: 300 },
            showHeader: false,
        });
        const before = document.createElement('button');
        const after = document.createElement('button');
        container.prepend(before);
        container.append(after);
        before.focus();
        // the scrollable body is the table's only Tab stop
        await tab();
        expect(getBody()).toHaveFocus();
        await tab();
        expect(after).toHaveFocus();
    });

    it('showHeader 为 false 且表头不拆分时，多个固定列按列宽错开', async () => {
        const { container } = mountTable({
            style: 'width: 600px',
            columns: [
                { title: '标题', dataIndex: 'name', width: 200, fixed: true },
                { title: '大小', dataIndex: 'size', width: 150, fixed: true },
                { title: '所有者', dataIndex: 'owner' },
            ],
            dataSource: getFileData(3),
            pagination: false,
            scroll: { x: 900 },
            showHeader: false,
        });
        const secondCell = () => query(`.${P}-tbody .${P}-row`, container).children[1] as HTMLElement;
        await waitFor(() => expect(getComputedStyle(secondCell()).left).toBe('200px'));
        const thead = query(`.${P}-thead`, container);
        expect(thead.getBoundingClientRect().height).toBe(0);
        expect(thead.querySelector('th')?.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    it('滚动的表体获得键盘焦点时显示主题焦点环', async () => {
        const { container } = mountTable({ columns: [{ title: 'name', dataIndex: 'name' }], dataSource: getFileData(30), pagination: false, scroll: { y: 200 } });
        const body = query(`.${P}-body`, container);
        await tabTo(body);
        expectThemeFocusRing(body);
        // rows are no Tab stops; a stop follows, since past the document's end Firefox keeps the focus where it is
        const after = document.createElement('button');
        document.body.append(after);
        onTestFinished(() => after.remove());
        await tab();
        expect(after).toHaveFocus();
    });
});

describe('Svelte Table 列功能（浏览器）', () => {
    it('修复 #1599：排序列标题与列对齐方式一致', () => {
        const { container } = mountTable({
            style: 'width: 800px',
            columns: [
                { title: 'Name', dataIndex: 'name', align: 'center' },
                { title: 'Size', dataIndex: 'size', align: 'center', sorter: (a?: Row, b?: Row) => (a?.size ?? 0) - (b?.size ?? 0), ellipsis: true },
                { title: 'Owner', dataIndex: 'owner', align: 'right', sorter: (a?: Row, b?: Row) => (a?.size ?? 0) - (b?.size ?? 0) },
            ],
            dataSource: getFileData(3),
            pagination: false,
        });
        const sizeOperate = query(`.${P}-operate-wrapper`, getHeaderCell(container, 'Size'));
        const ownerCell = getHeaderCell(container, 'Owner');
        const ownerOperate = query(`.${P}-operate-wrapper`, ownerCell);
        expect(getComputedStyle(sizeOperate).justifyContent).toBe('center');
        expect(getComputedStyle(ownerOperate).justifyContent).toBe('flex-end');
        const ownerCellRect = ownerCell.getBoundingClientRect();
        const ownerTitleRect = (ownerOperate.firstElementChild as HTMLElement).getBoundingClientRect();
        expect(ownerTitleRect.left).toBeGreaterThan(ownerCellRect.left + ownerCellRect.width / 2);
    });

    it('修复 #1869：选中行后保留已调整的列宽', async () => {
        const { container, store } = mountTable(
            {
                columns: [
                    { title: 'Key', dataIndex: 'key', key: 'key' },
                    { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
                    { title: '大小', dataIndex: 'size', key: 'size', width: 400 },
                    { title: '所有者', dataIndex: 'owner', key: 'owner' },
                ],
                dataSource: getFileData(3),
                pagination: false,
                resizable: true,
                rowSelection: {
                    selectedRowKeys: [],
                    onChange: (keys) => {
                        store.props.rowSelection = { ...(store.props.rowSelection as RowSelectionProps), selectedRowKeys: keys };
                    },
                },
            },
            [],
            'width: 1200px'
        );
        const handle = await findElement(() => getHeaderCell(container, '名称')?.querySelector(`.${P}-resize-handle`));
        await drag(handle, 100);
        await waitFor(() => expect(getHeaderCell(container, '名称').getBoundingClientRect().width).toBeCloseTo(300, 0));
        await userEvent.click(query(`.${P}-tbody .${BASE_CLASS_PREFIX}-checkbox`, container));
        await waitFor(() => expect(queryAll(`.${P}-tbody .${BASE_CLASS_PREFIX}-checkbox-checked`, container)).toHaveLength(1));
        expect(getHeaderCell(container, '名称').getBoundingClientRect().width).toBeCloseTo(300, 0);
    });

    it('行选择', async () => {
        const data = ['John Brown', 'Jim Green', 'Joe Black', 'Disabled User'].map((name, i) => ({ key: `${i + 1}`, name, age1: 23, age2: 11, address: 'London No. 1 Lake Park' }));
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: '30%' },
                {
                    title: 'combine',
                    width: '20%',
                    dataIndex: 'test',
                    children: [
                        {
                            title: 'Age',
                            width: '20%',
                            children: [
                                { title: 'Age1', width: '20%', dataIndex: 'age1' },
                                { title: 'Age2', width: '20%', dataIndex: 'age2' },
                            ],
                        },
                        { title: 'Key', width: '20%', dataIndex: 'key' },
                    ],
                },
                { title: 'Address', width: '50%', dataIndex: 'address' },
            ],
            dataSource: data,
            rowSelection: { getCheckboxProps: (record) => ({ disabled: record.name === 'Disabled User' }) },
        });
        await userEvent.click(query(`.${P}-row-head .${BASE_CLASS_PREFIX}-checkbox-inner-display`));
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).toHaveLength(4));
    });

    it('defaultFilteredValue', async () => {
        let filteredValue: any[] = ['Semi D2C 设计稿'];
        const columns = (): ColumnProps[] => [
            { title: '标题', dataIndex: 'name', width: 400, filters: designFilters, onFilter: (value, record) => record.name.includes(value), sorter: (a?: Row, b?: Row) => ((a?.name.length ?? 0) - (b?.name.length ?? 0) > 0 ? 1 : -1), defaultFilteredValue: filteredValue },
            { title: '大小', dataIndex: 'size' },
        ];
        const { store } = mountTable({
            columns: columns(),
            dataSource: [],
            scroll: { y: 300 },
            onChange: ({ filters }: TableChangeInfo) => {
                if (filters?.length) {
                    filteredValue = filters.find((filter) => filter.dataIndex === 'name')?.filteredValue as any[];
                }
            },
        });
        // like a parent that renders the columns afresh with the latest filter whenever it changes the data
        const setData = (total: number) => {
            store.props.dataSource = getFileData(total);
            store.props.columns = columns();
            flushSync();
        };
        setData(46);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 23 条')).toBeInTheDocument();
        setData(25);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 12 条')).toBeInTheDocument();
        await userEvent.click(getFilterTriggers()[0]);
        await userEvent.click(await findElement(() => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-dropdown-menu .${BASE_CLASS_PREFIX}-dropdown-item:nth-child(2)`)));
        setData(46);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 46 条')).toBeInTheDocument();
    });

    it('可调整大小的表头', async () => {
        const data = ['2018-02-11', '2018-03-11', '2018-04-11'].map((date, key) => ({ key, date, amount: 120, type: 'income', note: 'transfer' }));
        // Room for the dragged widths: WebKit shrinks fixed columns that overflow an auto-layout table instead of widening it
        const { container } = mountTable({
            columns: [
                { title: 'Date', dataIndex: 'date', width: 200 },
                { title: 'Amount', dataIndex: 'amount', width: 100 },
                { title: 'Type', dataIndex: 'type', width: 100 },
                { title: 'Note', dataIndex: 'note', width: 100 },
                { title: 'Action', key: 'action' },
            ],
            dataSource: data,
            resizable: true,
            style: 'width: 1200px',
        });
        const getCellWidth = (index: number) => getComputedStyle(queryAll(`.${P}-row-cell`)[index]).width;
        const handles = () => queryAll(`.${P}-resize-handle`, container);
        await drag(await findElement(() => handles()[0]), 164);
        await waitFor(() => expect(getCellWidth(0)).toBe('364px'));
        await drag(handles()[1], 300);
        await waitFor(() => expect(getCellWidth(1)).toBe('400px'));
    });

    it('拖动列宽手柄时回调收到新宽度，表头跟随，点击手柄不触发排序', async () => {
        const onResize = vi.fn<TableResizeFn>();
        const onResizeStart = vi.fn<TableResizeFn>();
        const onResizeStop = vi.fn<TableResizeFn>();
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const { container } = mountTable({
            columns: [
                { title: 'Date', dataIndex: 'date', width: 200, sorter: (a?: Row, b?: Row) => String(a?.date).localeCompare(String(b?.date)) },
                { title: 'Note', dataIndex: 'note' },
            ],
            dataSource: [{ key: 0, date: '2018-02-11' }],
            resizable: { onResize, onResizeStart, onResizeStop },
            onChange,
        });
        const handle = await findElement(() => container.querySelector(`.${P}-resize-handle`));
        await drag(handle, 80);
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 280 }));
        await waitFor(() => expect(getHeaderCell(container, 'Date').getBoundingClientRect().width).toBeCloseTo(280, 0));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(query(`.${P}-resize-handle`, container));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('拖动列宽手柄越过起始侧时，宽度不小于 20', async () => {
        const onResize = vi.fn<TableResizeFn>();
        const { container } = mountTable({
            columns: [
                { title: 'Date', dataIndex: 'date', width: 200 },
                { title: 'Note', dataIndex: 'note' },
            ],
            dataSource: [{ key: 0, date: '2018-02-11' }],
            resizable: { onResize },
        });
        const getHandle = () => findElement(() => container.querySelector(`.${P}-resize-handle`));
        await drag(await getHandle(), -300);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 20 }));
        await drag(await getHandle(), 50);
        // the narrowed handle sits at a fractional x
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: expect.closeTo(70, 0) }));
    });

    it('调整大小', async () => {
        const { store } = mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150 },
                { title: 'Address', dataIndex: 'address' },
            ],
            dataSource: getData(8),
            scroll: {},
        });
        store.props.scroll = { y: 300 };
        flushSync();
        await expect.poll(() => getBody().style.maxHeight).toBe('300px');
    });

    it('空筛选项', async () => {
        const columns = (filteredValue: string[]): ColumnProps[] => [
            { title: '标题', dataIndex: 'name', width: 400, onFilter: (value, record) => record.name.includes(value), filteredValue },
            { title: '大小', dataIndex: 'size' },
        ];
        const { store } = mountTable({ columns: columns([]), dataSource: getFileData(46), scroll: { y: 300 } });
        store.props.columns = columns(['Semi D2C']);
        flushSync();
        await waitFor(() => expect(getBodyRows()[0].textContent).toContain('Semi D2C'));
        expect(getBodyRows()[1].textContent).toContain('Semi D2C');
    });

    it('可调整大小的 onHeaderCell', async () => {
        const onHeaderCell = (_column: ColumnProps, columnIndex: number) => ({ class: `test-${columnIndex}` });
        const { store } = mountTable({
            bordered: true,
            columns: [
                { title: 'Name', dataIndex: 'name', width: 150, onHeaderCell },
                { title: 'Age', dataIndex: 'age', width: 150, sorter: (a?: Row, b?: Row) => (a?.age ?? 0) - (b?.age ?? 0), onHeaderCell },
                { title: 'Address', width: 200, dataIndex: 'address' },
            ],
            dataSource: getData(46),
            resizable: true,
            rowSelection: {
                selectedRowKeys: [],
                onChange: (keys) => {
                    store.props.rowSelection = { ...(store.props.rowSelection as RowSelectionProps), selectedRowKeys: keys };
                },
            },
        });
        await findElement(() => document.querySelector(`.${P}-resize-handle`));
        expect(queryAll('.test-1')).toHaveLength(1);
        expect(queryAll('.test-2')).toHaveLength(1);
    });

    it('sorter 的 sortOrder 参数', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name' },
            {
                title: '大小',
                dataIndex: 'size',
                sorter: (r1, r2, order) => {
                    const a = r1?.size;
                    const b = r2?.size;
                    if (typeof a === 'number' && typeof b === 'number') {
                        return a - b;
                    } else if (typeof a === 'undefined') {
                        return order === 'ascend' ? 1 : -1;
                    } else if (typeof b === 'undefined') {
                        return order === 'ascend' ? -1 : 1;
                    }
                    return 0;
                },
            },
        ];
        const data = [3, undefined, 1, 5, undefined, 2].map((size, i) => ({ key: `${i + 1}`, name: `文档${i + 1}`, size }));
        mountTable({
            columns,
            dataSource: data,
            cell: createRawSnippet<[TableCellSnippetProps]>((args) => ({
                render: () => {
                    const { column, text } = args();
                    return `<span>${column.dataIndex === 'size' ? (text ? `${text} KB` : '未知') : String(text)}</span>`;
                },
            })),
        });
        const sorter = query(`.${P}-column-sorter`);
        for (const first of ['1 KB', '5 KB']) {
            await userEvent.click(sorter);
            await waitFor(() => expect(getBodyRows()[0].textContent).toContain(first));
            expect(getBodyRows()[4].textContent).toContain('未知');
            expect(getBodyRows()[5].textContent).toContain('未知');
        }
    });

    it('keepDOM', async () => {
        const expandData = [
            { key: 1, name: 'John Brown', description: 'My name is John Brown' },
            { key: 2, name: 'Jim Green' },
            { key: 3, name: 'Joe Black', description: 'My name is Joe Black' },
        ];
        const treeData = [
            {
                key: 1,
                name: '视频信息',
                children: [
                    { key: 11, name: '视频状态' },
                    { key: 12, name: '视频 ID', children: [{ name: '视频地址' }] },
                ],
            },
            {
                key: 2,
                name: '文本信息',
                children: [
                    { key: 21, name: '视频标题' },
                    { key: 22, name: '视频描述' },
                ],
            },
        ];
        const sectionData = Array.from({ length: 46 }, (_, i) => ({
            name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
            size: ((i * 1000) % 19) + 100,
        }));
        const nameColumns = [{ title: 'Name', dataIndex: 'name', key: 'name' }];
        const expandTable = mountTable({
            columns: nameColumns,
            dataSource: expandData,
            expandCellFixed: true,
            hideExpandedColumn: false,
            keepDOM: true,
            scroll: { x: '160%' },
            expandedRow: createRawSnippet<[TableExpandedRowSnippetProps]>((args) => ({ render: () => `<p>${String(args().record.description)}</p>` })),
        }).container;
        const treeTable = mountTable({ columns: nameColumns, dataSource: treeData, keepDOM: true }).container;
        const sectionTable = mountTable({
            clickGroupedRowToExpand: true,
            columns: [...nameColumns, { title: '大小', dataIndex: 'size' }],
            dataSource: sectionData,
            groupBy: 'size',
            keepDOM: true,
            rowKey: (record: Row) => `${record.owner}-${record.name}`,
            scroll: { y: 480 },
            groupSection: createRawSnippet<[TableGroupSectionSnippetProps]>((args) => ({ render: () => `<strong>根据文件大小分组 ${args().groupKey} KB</strong>` })),
        }).container;
        const hiddenRows = (container: HTMLElement) => queryAll(`.${P}-row-hidden`, container);
        const expandIcon = (container: HTMLElement) => query(`.${P}-expand-icon`, container);
        await waitFor(() => expect(hiddenRows(expandTable)).toHaveLength(3));
        expect(hiddenRows(treeTable)).toHaveLength(5);
        await userEvent.click(expandIcon(treeTable));
        await waitFor(() => expect(hiddenRows(treeTable)).toHaveLength(3));
        expect(hiddenRows(sectionTable)).toHaveLength(10);
        await userEvent.click(expandIcon(sectionTable));
        await waitFor(() => expect(hiddenRows(sectionTable)).toHaveLength(7));
    });

    it('filterDropdown snippet：确认、清除、关闭与焦点', async () => {
        // a panel of an input and three buttons; the name column's confirm and clear close it, the owner column's keep it open
        const filterDropdown = createRawSnippet<[TableFilterDropdownSnippetProps]>((args) => {
            const close = args().column.dataIndex === 'name';
            const labels = close ? ['筛选+关闭', '清除+关闭'] : ['筛选后不关闭', '清除后不关闭'];
            return {
                render: () => `<div><input class="${BASE_CLASS_PREFIX}-input" /><button type="button">${labels[0]}</button><button type="button">${labels[1]}</button><button type="button">直接关闭</button></div>`,
                setup: (node) => {
                    const input = node.querySelector('input') as HTMLInputElement;
                    const [confirm, clear, dismiss] = node.querySelectorAll('button');
                    input.value = args().tempFilteredValue?.[0] ?? '';
                    input.addEventListener('input', () => args().onTempFilteredValueChange(input.value ? [input.value] : []));
                    confirm.addEventListener('click', () => args().onConfirm({ closeDropdown: close }));
                    clear.addEventListener('click', () => {
                        input.value = '';
                        args().onClear({ closeDropdown: close });
                    });
                    dismiss.addEventListener('click', () => args().onClose());
                },
            };
        });
        const getInput = () => document.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-input`);
        mountTable({
            columns: [
                { title: '标题', dataIndex: 'name', filterDropdown: true, onFilter: (value, record) => record.name.includes(value), onFilterDropdownVisibleChange: (visible) => visible && getInput()?.focus() },
                { title: '所有者', dataIndex: 'owner', filterDropdown: true, onFilter: (value, record) => record.owner.includes(value), defaultFilteredValue: ['姜鹏志'] },
            ],
            dataSource: getFileData(46),
            filterDropdown,
        });
        const clickButton = (name: string) => userEvent.click(screen.getByRole('button', { name }));
        const waitForClosed = () => waitFor(() => expect(getDropdown()).toBeNull());
        const openFilter = async (index: number) => {
            await userEvent.click(getFilterTriggers()[index]);
            await waitFor(() => expect(getInput()).not.toBeNull());
        };
        const paginationInfo = () => document.querySelector(`.${P}-pagination-info`);

        await openFilter(0);
        await waitFor(() => expect(getInput()).toHaveFocus());
        await userEvent.keyboard('12');
        await clickButton('筛选+关闭');
        await waitFor(() => expect(getBodyRows()).toHaveLength(1));
        await waitForClosed();

        await openFilter(0);
        await waitFor(() => expect(getInput()).toHaveFocus());
        await clickButton('清除+关闭');
        await waitFor(() => expect(getBodyRows()).toHaveLength(10));
        await waitForClosed();

        await openFilter(0);
        await waitFor(() => expect(getInput()).toHaveFocus());
        await clickButton('直接关闭');
        await waitForClosed();

        await openFilter(1);
        expect(getInput()).toHaveValue('姜鹏志');
        await clickButton('清除后不关闭');
        await waitFor(() => expect(paginationInfo()).toHaveTextContent('显示第 1 条-第 10 条，共 46 条'));
        expect(getDropdown()).not.toBeNull();
        await userEvent.click(getInput() as HTMLElement);
        await userEvent.keyboard('郝宣');
        await clickButton('筛选后不关闭');
        await waitFor(() => expect(paginationInfo()).toHaveTextContent('显示第 1 条-第 10 条，共 23 条'));
        expect(getDropdown()).not.toBeNull();
        await clickButton('直接关闭');
        await waitForClosed();
    });

    it('rowSelection 的 onCell 与 onHeaderCell', () => {
        mountTable({
            columns: [{ title: '标题', dataIndex: 'name' }],
            dataSource: getFileData(6),
            rowSelection: {
                onCell: () => ({ style: 'background: red', class: 'test-td' }),
                onHeaderCell: () => ({ style: 'background: blue', class: 'test-th' }),
            },
        });
        expect(document.querySelector('.test-th')?.getAttribute('style')).toContain('background: blue');
        expect(document.querySelector('.test-td')?.getAttribute('style')).toContain('background: red');
    });

    it('确认模式的筛选页脚按钮靠末端排列，与选项之间有分隔线', async () => {
        mountTable({
            columns: [{ title: 'name', dataIndex: 'name', filterConfirmMode: 'confirm', filters: [{ text: 'a', value: 'a' }], onFilter: (value, record) => record.name === value }],
            dataSource: getFileData(3),
            pagination: false,
        });
        await userEvent.click(query(`.${P}-column-filter`));
        const footer = await findElement(() => document.querySelector<HTMLElement>(`.${P}-column-filter-footer`));
        const style = getComputedStyle(footer);
        expect(style.display).toBe('flex');
        expect(style.justifyContent).toBe('flex-end');
        expect(style.padding).toBe('8px 12px');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopStyle).toBe('solid');
    });

    it('用键盘改每页条数后，焦点留在每页条数选择器上', async () => {
        mountTable({ columns: [{ title: 'name', dataIndex: 'name' }], dataSource: getFileData(46), pagination: { showSizeChanger: true } });
        const selector = screen.getByRole('combobox', { name: '每页条数' });
        await tabTo(selector);
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('listbox');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getBodyRows()).toHaveLength(20));
        expect(screen.getByRole('combobox', { name: '每页条数' })).toHaveFocus();
    });

    // dnd-kit and similar libraries turn each sortable row into role=button tabindex=0
    it('为拖拽排序设置为可聚焦的行显示主题焦点环', async () => {
        const { container } = mountTable({ columns: [{ title: 'name', dataIndex: 'name' }], dataSource: getFileData(3), pagination: false, onRow: () => ({ role: 'button', tabindex: 0 }) });
        const row = query(`.${P}-tbody .${P}-row`, container);
        await tabTo(row);
        expectThemeFocusRing(row);
    });

    it('列排序器显示主题焦点环', async () => {
        const { container } = mountTable({ columns: [{ title: 'size', dataIndex: 'size', sorter: (a?: Row, b?: Row) => (a?.size ?? 0) - (b?.size ?? 0) }], dataSource: getFileData(3), pagination: false });
        const sorter = query(`.${P}-column-sorter-wrapper`, container);
        await tabTo(sorter);
        expectThemeFocusRing(sorter);
    });

    it('排序按钮的外观与周围的表头文字一致', () => {
        const { container } = mountTable({ columns: [{ title: 'size', dataIndex: 'size', sorter: (a?: Row, b?: Row) => (a?.size ?? 0) - (b?.size ?? 0) }], dataSource: getFileData(3), pagination: false });
        const button = getComputedStyle(query(`.${P}-column-sorter-wrapper`, container));
        const cell = getComputedStyle(query('th', container));
        for (const prop of ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight'] as const) {
            expect(button[prop]).toBe(cell[prop]);
        }
        expect(button.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(button.borderTopWidth).toBe('0px');
        expect(button.paddingLeft).toBe('0px');
    });

    it('展开按钮显示主题焦点环', async () => {
        const { container } = mountTable({ columns: [{ title: 'size', dataIndex: 'size' }], dataSource: getFileData(3), pagination: false }, ['expandedRow']);
        const expand = query(`.${P}-expand-icon`, container);
        await tabTo(expand);
        expectThemeFocusRing(expand);
    });

    it('容器窄于整行时分页信息文字保持单行原宽，不按字换行', () => {
        const props = { columns: [{ title: '标题', dataIndex: 'name' }], dataSource: getFileData(46), pagination: { pageSize: 10, showSizeChanger: true } };
        mountTable(props, [], 'width: 900px');
        mountTable(props, [], 'width: 300px');
        const [roomy, narrow] = queryAll(`.${P}-pagination-info`).map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});
