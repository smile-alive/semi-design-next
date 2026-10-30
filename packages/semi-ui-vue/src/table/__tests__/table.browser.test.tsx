/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive, shallowRef } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, isChromium, tab, tabTo } from '@test/utils/browser';
import { getData, render } from '@test/utils/vue';
import Table, { type ColumnProps, type TableCellSlotProps, type TableHandle, type TableRowAttrs } from '..';
import ConfigProvider from '../../config-provider';

const prefix = `${BASE_CLASS_PREFIX}-table`;

type Slots = Record<string, (...args: any[]) => unknown>;

const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));

const fixedBothSideColumns: ColumnProps[] = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address', width: 150 },
    { title: 'Description', dataIndex: 'description', fixed: 'right', width: 150 },
];

const getBody = () => document.querySelector(`.${prefix}-body`) as HTMLElement;
const getHeadEllipsis = () => Array.from(document.querySelectorAll<HTMLElement>(`.${prefix}-row-head-ellipsis`));
const hasTitle = (el: Element) => el.matches('[title]') || el.querySelector('[title]') !== null;
const showInfo = ({ column }: TableCellSlotProps) => (column.dataIndex ? [] : [<span>Show Info</span>]);

function mountTable(props: Record<string, unknown>, slots: Slots = {}, wrapperStyle?: Record<string, string>) {
    const state = shallowReactive({ props });
    const handle = shallowRef<TableHandle | null>(null);
    const result = render(
        defineComponent(() => () => {
            const table = (
                <Table {...state.props} ref={handle}>
                    {slots}
                </Table>
            );
            return wrapperStyle ? <div style={wrapperStyle}>{table}</div> : table;
        })
    );
    return {
        container: result.container,
        handle: () => handle.value as TableHandle,
        update: async (next: Record<string, unknown>) => {
            state.props = { ...state.props, ...next };
            await nextTick();
        },
    };
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

describe('Table（浏览器）', () => {
    it('修复 #247：所有列都没有宽度时，表头与表体列对齐', () => {
        const columns = ['name', 'age', 'address', 'description'].map((dataIndex) => ({ title: dataIndex, dataIndex }));
        const data = Array.from({ length: 8 }, (_, i) => ({
            key: `${i}`,
            name: `Edward King ${i}`,
            age: (i * 1000) % 149,
            address: `London, Park Lane no. ${i}`,
            description: `My name is Edward King ${i}, and this description is much longer than the other cells`,
        }));
        const { container } = mountTable({ bordered: true, columns, dataSource: data, pagination: false, scroll: { y: 300 } }, {}, { width: '800px' });
        expect(container.querySelector(`.${prefix}-header table`)).toHaveStyle({ tableLayout: 'fixed' });
        const headerCells = Array.from(container.querySelectorAll(`.${prefix}-thead .${prefix}-row-head`));
        const bodyCells = Array.from((container.querySelector(`.${prefix}-tbody .${prefix}-row`) as HTMLElement).children);
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
        const owner = (node: (typeof nodes)[number] | undefined) => {
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
        const { container } = render(
            defineComponent(() => () => (
                <div style={{ position: 'relative', width: '600px' }}>
                    <div style={{ height: '60px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} data-testid="overlay" />
                    <Table
                        columns={[
                            { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                            { title: 'Owner', dataIndex: 'owner', width: 600 },
                            { title: 'Size', dataIndex: 'size', width: 200, fixed: 'right' },
                        ]}
                        dataSource={getFileData(10)}
                        rowSelection={{}}
                        scroll={{ y: 300, x: 950 }}
                    />
                </div>
            ))
        );
        const wrapper = container.querySelector(`.${prefix}-wrapper`);
        expect(wrapper).toHaveAttribute('data-column-fixed', 'true');
        expect(wrapper).toHaveStyle({ zIndex: '1' });
        const fixedHeadCell = container.querySelector(`.${prefix}-thead .${prefix}-cell-fixed-left`) as HTMLElement;
        const rect = fixedHeadCell.getBoundingClientRect();
        expect(rect.top).toBeLessThan(60);
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height, 60) / 2);
        expect(hit).toBe(screen.getByTestId('overlay'));
    });

    it.each(['ltr', 'rtl'] as const)('%s 下虚拟化表格的 tbody 是 block', async (direction) => {
        const { container } = render(defineComponent(() => () => <ConfigProvider direction={direction}>{() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getFileData(50)} pagination={false} scroll={{ y: 300 }} virtualized />}</ConfigProvider>));
        const tbody = await waitFor(() => {
            const el = container.querySelector(`.${prefix}-tbody`);
            expect(el).not.toBeNull();
            return el as HTMLElement;
        });
        expect(getComputedStyle(tbody).display).toBe('block');
    });

    it('修复 #944：空的虚拟表格不保留 scroll.y 高度', async () => {
        const { container, update } = mountTable({
            style: { width: '800px' },
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
        await waitFor(() => expect(container.querySelector(`.${prefix}-placeholder`)).not.toBeNull());
        const emptyRect = (container.querySelector(`.${prefix}-placeholder`) as HTMLElement).getBoundingClientRect();
        expect(emptyRect.height).toBeGreaterThan(0);
        expect(getBody().getBoundingClientRect().height).toBeLessThan(600);
        expect(getBody().getBoundingClientRect().bottom).toBeGreaterThanOrEqual(emptyRect.bottom - 1);

        await update({ dataSource: getFileData(1000) });
        await waitFor(() => expect(getBody().getBoundingClientRect().height).toBe(600));
    });

    it('修复 #2305：scroll.y 在挂载后才给出时，expose 的 scrollToItem 可用', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        onTestFinished(() => warn.mockRestore());
        const { handle, update } = mountTable({
            style: { width: '750px' },
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
        await update({ scroll: { y: 400, x: 900 } });
        await waitFor(() => expect(document.querySelectorAll(`.${prefix}-tbody .${prefix}-row`).length).toBeGreaterThan(0));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('You have to specific "scroll.y"'));
        expect(screen.queryByText('Semi Design 设计稿20.fig')).not.toBeInTheDocument();
        handle().scrollToItem(20);
        expect(await screen.findByText('Semi Design 设计稿20.fig')).toBeInTheDocument();
    });

    it('有固定列时，容器宽度变化不重新渲染表格，分组行仍随容器变宽', async () => {
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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
            { groupSection: ({ groupKey }: { groupKey: string }) => [<span>{groupKey}</span>] },
            { width: '800px' }
        );
        const wrapper = container.firstElementChild as HTMLElement;
        const section = () => container.querySelector(`.${prefix}-section-inner`) as HTMLElement;
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
        mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false, onRow }, {}, { width: '300px' });
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
        const { container } = mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false }, {}, { width: '300px' });
        const tableContainer = container.querySelector(`.${prefix}-container`) as HTMLElement;
        const body = await waitFor(() => {
            const element = getBody();
            expect(element).not.toBeNull();
            return element;
        });
        // [left, right] shadows shown; container queries restyle a frame after the scroll
        const shadows = () => (['left-last', 'right-first'] as const).map((side) => getComputedStyle(body.querySelector(`.${prefix}-cell-fixed-${side}`) as Element, '::after').display !== 'none');

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
        const { container } = mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false, ...extraProps }, {}, { width: '300px' });
        const body = await waitFor(() => {
            const element = getBody();
            expect(element).not.toBeNull();
            return element;
        });
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const max = body.scrollWidth - body.clientWidth;

        const leftLastCells = () => Array.from(container.querySelectorAll<HTMLElement>(`.${prefix}-cell-fixed-left-last`));
        const rightFirstCells = () => Array.from(container.querySelectorAll<HTMLElement>(`.${prefix}-cell-fixed-right-first`));
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
        const { container } = mountTable({ columns: fixedBothSideColumns, dataSource: getFileData(3), direction: 'rtl', pagination: false }, {}, { width: '300px' });
        const body = getBody();
        // Chrome represents an RTL scroller's scrollLeft from 0 (visual right, the start) down to a negative minimum
        await waitFor(() => expect(body.scrollLeft).toBe(0));
        await waitFor(() => expect(getComputedStyle(body).direction).toBe('rtl'));
        const min = -(body.scrollWidth - body.clientWidth);
        await waitFor(() => expect(min).toBeLessThan(0));

        const leftLast = () => container.querySelector(`.${prefix}-cell-fixed-left-last`) as HTMLElement;
        const rightFirst = () => container.querySelector(`.${prefix}-cell-fixed-right-first`) as HTMLElement;
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
        const { container } = mountTable({ bordered: true, columns: fixedBothSideColumns, dataSource: getFileData(3), pagination: false }, {}, { width: '300px' });
        const body = getBody();
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const tableContainer = container.querySelector(`.${prefix}-container`) as HTMLElement;
        const lastCells = Array.from(container.querySelectorAll<HTMLElement>(`.${prefix}-cell-last`));

        expect(lastCells.length).toBeGreaterThan(0);
        expect(lastCells.map((cell) => getComputedStyle(cell).borderInlineEndWidth)).toEqual(lastCells.map(() => '0px'));
        expect(getComputedStyle(tableContainer).borderInlineEndWidth).toBe('1px');
        body.scrollLeft = body.scrollWidth - body.clientWidth;
        await expect.poll(() => body.scrollLeft).toBeGreaterThan(0);
        expect(getComputedStyle(tableContainer).borderInlineEndWidth).toBe('1px');
    });
});

describe('table', () => {
    it('滚动', () => {
        mountTable(
            {
                columns: [
                    { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
                    { title: 'Age', dataIndex: 'age', width: 150 },
                    { title: 'Address', width: 200, dataIndex: 'address' },
                    { title: 'Description', dataIndex: 'description' },
                    { key: 'operate', fixed: 'right', width: 250 },
                ],
                dataSource: getData(12),
                scroll: { y: 300, x: '120%' },
            },
            { cell: showInfo }
        );
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
        const { update } = mountTable(
            {
                style: { width: '800px' },
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
            },
            { cell: showInfo }
        );
        let length = 20;
        await update({
            onScroll: ({ scrollDirection, scrollOffset, scrollUpdateWasRequested }: Record<string, any>) => {
                if (scrollDirection === 'forward' && scrollOffset >= (length - Math.ceil(scroll.y / itemSize) * 1.5) * itemSize && !scrollUpdateWasRequested) {
                    length += 20;
                    void update({ dataSource: getData(length) });
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
        mountTable(
            {
                style: { width: '800px' },
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
            },
            { cell: showInfo }
        );
        await waitFor(() => expect(document.querySelector(`.${prefix}-header`)).not.toBeNull());
        const header = document.querySelector(`.${prefix}-header`) as HTMLElement;
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
        const designFilters = ['Semi Design 设计稿', 'Semi D2C 设计稿'].map((value) => ({ text: value, value }));
        const sorter = (a: Record<string, any>, b: Record<string, any>) => (a.name.length - b.name.length > 0 ? 1 : -1);
        const onFilter = (value: string, record: Record<string, any>) => record.name.includes(value);

        it('普通表格省略标题', () => {
            const columns: ColumnProps[] = [
                {
                    title: '标题标题标题标题标题标题标题标题',
                    dataIndex: 'name',
                    ellipsis: true,
                    filters: designFilters,
                    onFilter,
                    sorter,
                },
                { title: '所有者', dataIndex: 'owner', ellipsis: true, filters: designFilters, onFilter, sorter },
                {
                    title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小',
                    dataIndex: 'size',
                    sorter,
                    ellipsis: true,
                },
                { title: '更新日期', dataIndex: 'updateTime', ellipsis: true },
            ];
            render(
                defineComponent(() => () => (
                    <div>
                        <Table style={{ width: '800px' }} columns={columns} dataSource={data} pagination={false} />
                        <Table columns={columns} dataSource={data} pagination={false} />
                    </div>
                ))
            );
            expect(getHeadEllipsis()).toHaveLength(8);
            for (const head of getHeadEllipsis()) {
                expect(hasTitle(head)).toBe(true);
            }
        });

        it('固定列表格省略标题', () => {
            mountTable({
                style: { width: '1000px' },
                columns: [
                    {
                        title: longTitle,
                        dataIndex: 'name',
                        fixed: true,
                        width: 300,
                        filters: designFilters,
                        onFilter,
                        sorter,
                        ellipsis: true,
                    },
                    {
                        title: '所有者',
                        dataIndex: 'owner',
                        ellipsis: true,
                        filters: designFilters,
                        onFilter,
                        sorter,
                        width: 300,
                    },
                    {
                        title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小',
                        dataIndex: 'size',
                        sorter,
                        ellipsis: true,
                    },
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
            mountTable(
                {
                    style: { width: '1000px' },
                    columns: [
                        {
                            title: longTitle,
                            dataIndex: 'name',
                            fixed: true,
                            width: 300,
                            filters: designFilters,
                            onFilter,
                            sorter,
                            ellipsis: { showTitle: false },
                        },
                        {
                            title: '所有者',
                            dataIndex: 'owner',
                            width: 300,
                            filters: designFilters,
                            onFilter,
                            sorter,
                            ellipsis: { showTitle: false },
                        },
                        {
                            title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小',
                            dataIndex: 'size',
                            sorter,
                            ellipsis: { showTitle: false },
                        },
                        {
                            title: '更新日期',
                            dataIndex: 'updateTime',
                            width: 300,
                            fixed: 'right',
                            ellipsis: { showTitle: false },
                        },
                    ],
                    dataSource: data,
                    pagination: false,
                    scroll: { x: 1200 },
                },
                { cell: ({ text }: TableCellSlotProps) => [<span>{text}</span>] }
            );
            expect(getHeadEllipsis()).toHaveLength(4);
            for (const head of getHeadEllipsis()) {
                expect(hasTitle(head)).toBe(false);
            }
            for (const cell of document.querySelectorAll(`.${prefix}-row-cell`)) {
                expect(hasTitle(cell)).toBe(false);
            }
        });
    });

    it('虚拟表格 showHeader 为 false', () => {
        mountTable({
            style: { width: '750px', margin: '0 auto' },
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
        const headers = document.querySelectorAll(`.${prefix}-header`);
        expect(headers).toHaveLength(1);
        expect(getComputedStyle(headers[0]).height).toBe('0px');
    });

    it('showHeader 为 false 且表头拆分时，Tab 不进入隐藏表头', async () => {
        render(
            defineComponent(() => () => (
                <>
                    <button type="button">before</button>
                    <Table
                        columns={[{ title: '标题', dataIndex: 'name', width: 200, sorter: (a: Record<string, any>, b: Record<string, any>) => a.name.localeCompare(b.name), filters: [{ text: 'a', value: 'a' }], onFilter: () => true }]}
                        dataSource={getFileData(3)}
                        pagination={false}
                        scroll={{ y: 300 }}
                        showHeader={false}
                    />
                    <button type="button">after</button>
                </>
            ))
        );
        screen.getByRole('button', { name: 'before' }).focus();
        // the scrollable body is the table's only Tab stop
        await tab();
        expect(document.querySelector(`.${prefix}-body`)).toHaveFocus();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('showHeader 为 false 且表头不拆分时，多个固定列按列宽错开', async () => {
        const { container } = mountTable({
            style: { width: '600px' },
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
        const secondCell = () => container.querySelector(`.${prefix}-tbody .${prefix}-row`)?.children[1] as HTMLElement;
        await waitFor(() => expect(getComputedStyle(secondCell()).left).toBe('200px'));
        const thead = container.querySelector(`.${prefix}-thead`) as HTMLElement;
        expect(thead.getBoundingClientRect().height).toBe(0);
        expect(thead.querySelector('th')?.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    it('滚动的表体获得键盘焦点时显示主题焦点环', async () => {
        const { container } = mountTable({
            columns: [{ title: 'name', dataIndex: 'name' }],
            dataSource: getFileData(30),
            pagination: false,
            scroll: { y: 200 },
        });
        const body = container.querySelector(`.${prefix}-body`) as HTMLElement;
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
