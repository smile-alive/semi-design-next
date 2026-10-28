import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, isChromium, tab, tabTo } from '@test/utils/browser';
import { getData } from '@test/utils/solid';
import Table from '..';
import Button from '../../button';
import ConfigProvider from '../../config-provider';
import Input from '../../input';
import Space from '../../space';
import Switch from '../../switch';
import Typography from '../../typography';
import type { ColumnProps, TableProps } from '../interface';

const prefix = `${BASE_CLASS_PREFIX}-table`;

const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));

const getHeaderCell = (container: Element, title: string) => [...container.querySelectorAll<HTMLElement>(`.${prefix}-thead .${prefix}-row-head`)].find((th) => th.textContent === title) as HTMLElement;

interface AXNode {
    nodeId: string;
    parentId?: string;
    ignored: boolean;
    role: { value: string };
    name: { value: string };
}

// Chrome's accessibility tree of the iframe the tests render in
const getAccessibilityTree = async () => {
    const { frameTree } = await cdp().send('Page.getFrameTree');
    const frame = frameTree?.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
    if (!frame) throw new Error('vitest-iframe frame not found');
    const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
    return nodes as AXNode[];
};

const fixedBothSideColumns: ColumnProps[] = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address', width: 150 },
    { title: 'Description', dataIndex: 'description', fixed: 'right', width: 150 },
];

const getBody = () => document.querySelector(`.${prefix}-body`) as HTMLElement;
const getBodyRows = () => document.querySelectorAll(`.${prefix}-tbody .${prefix}-row`);
const getHeadTitles = () => document.querySelectorAll(`.${prefix}-row-head-title`);
const getHeadEllipsis = () => document.querySelectorAll(`.${prefix}-row-head-ellipsis`);
const getDropdown = () => document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown`);
const getFilterTriggers = () => document.querySelectorAll<HTMLElement>(`.${prefix}-column-filter`);
const designFilters = ['Semi Design 设计稿', 'Semi D2C 设计稿'].map((value) => ({ text: value, value }));

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
        const { container } = render(() => (
            <div style={{ width: '800px' }}>
                <Table bordered columns={columns} dataSource={data} pagination={false} scroll={{ y: 300 }} />
            </div>
        ));
        expect(container.querySelector(`.${prefix}-header table`)).toHaveStyle({ tableLayout: 'fixed' });
        const headerCells = [...container.querySelectorAll(`.${prefix}-thead .${prefix}-row-head`)];
        const bodyCells = [...(container.querySelector(`.${prefix}-tbody .${prefix}-row`) as HTMLElement).children];
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
    ] as const)('%s Chrome 中表头与表体行作为一个 table 暴露', async (_name, extra) => {
        render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 200 },
                    {
                        title: 'Detail',
                        children: [
                            { title: 'Age', dataIndex: 'age', width: 100 },
                            { title: 'Address', dataIndex: 'address', width: 300 },
                        ],
                    },
                ]}
                dataSource={getData(3)}
                pagination={false}
                {...extra}
            />
        ));
        await waitFor(() => expect(screen.getAllByRole('cell')).toHaveLength(9));
        const nodes = await getAccessibilityTree();
        const byId = new Map(nodes.map((node) => [node.nodeId, node]));
        const exposed = nodes.filter((node) => !node.ignored);
        const ofRole = (role: string) => exposed.filter((node) => node.role.value === role);
        const owner = (node: AXNode) => {
            let parent = byId.get(node.parentId ?? '');
            while (parent && (parent.ignored || parent.role.value === 'generic')) {
                parent = byId.get(parent.parentId ?? '');
            }
            return parent as AXNode;
        };

        expect(ofRole('LayoutTable')).toHaveLength(0);
        const [table, ...otherTables] = ofRole('table');
        expect(otherTables).toHaveLength(0);
        expect(ofRole('columnheader').map((node) => node.name.value)).toEqual(['Name', 'Detail', 'Age', 'Address']);
        const rows = ofRole('row');
        expect(rows).toHaveLength(5);
        for (const row of rows) {
            expect(owner(row).role.value).toBe('rowgroup');
            expect(owner(owner(row))).toBe(table);
        }
        for (const cell of [...ofRole('columnheader'), ...ofRole('cell')]) {
            expect(rows).toContain(owner(cell));
        }
    });

    // sticky fixed cells must not paint above a positioned page element (z-index 2) overlapping the table
    it('修复 z-index 问题：固定列保持在重叠的定位元素之下', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
            { title: 'Owner', dataIndex: 'owner', width: 600 },
            { title: 'Size', dataIndex: 'size', width: 200, fixed: 'right' },
        ];
        const { container } = render(() => (
            <div style={{ position: 'relative', width: '600px' }}>
                <div style={{ height: '60px', position: 'absolute', top: 0, left: 0, right: 0, 'z-index': 2 }} data-testid="overlay" />
                <Table columns={columns} dataSource={getFileData(10)} rowSelection={{}} scroll={{ y: 300, x: 950 }} />
            </div>
        ));
        const wrapper = container.querySelector(`.${prefix}-wrapper`);
        expect(wrapper).toHaveAttribute('data-column-fixed', 'true');
        expect(wrapper).toHaveStyle({ zIndex: '1' });
        const rect = (container.querySelector(`.${prefix}-thead .${prefix}-cell-fixed-left`) as HTMLElement).getBoundingClientRect();
        expect(rect.top).toBeLessThan(60);
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height, 60) / 2);
        expect(hit).toBe(screen.getByTestId('overlay'));
    });

    it('修复 #1599：排序列标题与列对齐方式一致', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', align: 'center' },
            { title: 'Size', dataIndex: 'size', align: 'center', sorter: (a, b) => a.size - b.size, ellipsis: true },
            { title: 'Owner', dataIndex: 'owner', align: 'right', sorter: (a, b) => a.size - b.size },
        ];
        const { container } = render(() => <Table style={{ width: '800px' }} columns={columns} dataSource={getFileData(3)} pagination={false} />);
        const sizeOperate = getHeaderCell(container, 'Size').querySelector(`.${prefix}-operate-wrapper`);
        const ownerCell = getHeaderCell(container, 'Owner');
        const ownerOperate = ownerCell.querySelector(`.${prefix}-operate-wrapper`) as HTMLElement;
        expect(sizeOperate).toHaveStyle({ justifyContent: 'center' });
        expect(ownerOperate).toHaveStyle({ justifyContent: 'flex-end' });
        const ownerCellRect = ownerCell.getBoundingClientRect();
        const ownerTitleRect = (ownerOperate.firstElementChild as HTMLElement).getBoundingClientRect();
        expect(ownerTitleRect.left).toBeGreaterThan(ownerCellRect.left + ownerCellRect.width / 2);
    });

    it('固定列表格横向滚动不重新调用列的 render 与 onRow', async () => {
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>(() => ({}));
        const renderName = vi.fn<(text: unknown) => string>((text) => String(text));
        render(() => (
            <div style={{ width: '300px' }}>
                <Table columns={[{ ...fixedBothSideColumns[0], render: renderName }, ...fixedBothSideColumns.slice(1)]} dataSource={getFileData(3)} pagination={false} onRow={onRow} />
            </div>
        ));
        const body = getBody();
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        onRow.mockClear();
        renderName.mockClear();
        const max = body.scrollWidth - body.clientWidth;
        for (const scrollLeft of [max / 2, max, 0]) {
            body.scrollLeft = scrollLeft;
            fireEvent.scroll(body);
        }
        expect(onRow).not.toHaveBeenCalled();
        expect(renderName).not.toHaveBeenCalled();
    });

    it('不支持 scroll-state 时按横向滚动位置写 data-scrollable-*', async () => {
        const supports = CSS.supports.bind(CSS);
        vi.spyOn(CSS, 'supports').mockImplementation(((property: string, value?: string) => (property === 'container-type' && value === 'scroll-state' ? false : value === undefined ? supports(property) : supports(property, value))) as typeof CSS.supports);
        const { container } = render(() => (
            <div style={{ width: '300px' }}>
                <Table columns={fixedBothSideColumns} dataSource={getFileData(3)} pagination={false} />
            </div>
        ));
        const tableContainer = container.querySelector(`.${prefix}-container`) as HTMLElement;
        const body = getBody();
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
    ] as const)('%s：固定列阴影随滚动位置显示/隐藏', async (_label, extraProps) => {
        const { container } = render(() => (
            <div style={{ width: '300px' }}>
                <Table columns={fixedBothSideColumns} dataSource={getFileData(3)} pagination={false} {...extraProps} />
            </div>
        ));
        const body = getBody();
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const max = body.scrollWidth - body.clientWidth;

        // a fixed header scrolls in a separate container, so thead cells must stay in sync too
        const leftLastCells = () => [...container.querySelectorAll<HTMLElement>(`.${prefix}-cell-fixed-left-last`)];
        const rightFirstCells = () => [...container.querySelectorAll<HTMLElement>(`.${prefix}-cell-fixed-right-first`)];
        const shadowsOf = (cells: HTMLElement[]) => cells.map((cell) => getComputedStyle(cell, '::after').display);
        const allHaveShadow = (cells: HTMLElement[]) => shadowsOf(cells).every((shadow) => shadow !== 'none');
        const noneHaveShadow = (cells: HTMLElement[]) => shadowsOf(cells).every((shadow) => shadow === 'none');

        await expect.poll(() => noneHaveShadow(leftLastCells())).toBe(true);
        await expect.poll(() => allHaveShadow(rightFirstCells())).toBe(true);

        body.scrollLeft = max / 2;
        fireEvent.scroll(body);
        await expect.poll(() => allHaveShadow(leftLastCells())).toBe(true);
        await expect.poll(() => allHaveShadow(rightFirstCells())).toBe(true);

        body.scrollLeft = max;
        fireEvent.scroll(body);
        await expect.poll(() => allHaveShadow(leftLastCells())).toBe(true);
        await expect.poll(() => noneHaveShadow(rightFirstCells())).toBe(true);
    });

    it('RTL：固定列阴影随滚动位置正确对应视觉左右两侧', async () => {
        const { container } = render(() => (
            <div style={{ width: '300px' }}>
                <Table columns={fixedBothSideColumns} dataSource={getFileData(3)} direction="rtl" pagination={false} />
            </div>
        ));
        const body = getBody();
        // Chrome's RTL scrollLeft runs from 0 (visual right) down to a negative minimum (visual left)
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
        fireEvent.scroll(body);
        await expect.poll(() => hasShadow(rightFirst())).toBe(true);
        await expect.poll(() => hasShadow(leftLast())).toBe(true);

        body.scrollLeft = min;
        fireEvent.scroll(body);
        await expect.poll(() => hasShadow(rightFirst())).toBe(true);
        await expect.poll(() => hasShadow(leftLast())).toBe(false);
    });

    it('有边框的横向可滚动表格：末端边框由容器绘制，末列不再重复绘制', async () => {
        const { container } = render(() => (
            <div style={{ width: '300px' }}>
                <Table bordered columns={fixedBothSideColumns} dataSource={getFileData(3)} pagination={false} />
            </div>
        ));
        const body = getBody();
        await waitFor(() => expect(body.scrollWidth).toBeGreaterThan(body.clientWidth));
        const tableContainer = container.querySelector(`.${prefix}-container`) as HTMLElement;
        const lastCells = [...container.querySelectorAll<HTMLElement>(`.${prefix}-cell-last`)];

        expect(lastCells.length).toBeGreaterThan(0);
        expect(lastCells.map((cell) => getComputedStyle(cell).borderInlineEndWidth)).toEqual(lastCells.map(() => '0px'));
        expect(getComputedStyle(tableContainer).borderInlineEndWidth).toBe('1px');
        body.scrollLeft = body.scrollWidth - body.clientWidth;
        fireEvent.scroll(body);
        await expect.poll(() => body.scrollLeft).toBeGreaterThan(0);
        expect(getComputedStyle(tableContainer).borderInlineEndWidth).toBe('1px');
    });
});

describe('table', () => {
    it('行选择', async () => {
        const columns: ColumnProps[] = [
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
        ];
        const data = ['John Brown', 'Jim Green', 'Joe Black', 'Disabled User'].map((name, i) => ({ key: `${i + 1}`, name, age1: 23, age2: 11, address: 'London No. 1 Lake Park' }));
        render(() => <Table columns={columns} dataSource={data} rowSelection={{ getCheckboxProps: (record) => ({ disabled: record.name === 'Disabled User' }) }} />);
        await userEvent.click(document.querySelector(`.${prefix}-row-head .${BASE_CLASS_PREFIX}-checkbox-inner-display`) as HTMLElement);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).toHaveLength(4));
    });

    it('defaultFilteredValue', async () => {
        function Demo() {
            const [dataSource, setData] = createSignal(getFileData(46));
            const [filteredValue, setFilteredValue] = createSignal<unknown[]>(['Semi D2C 设计稿']);
            return (
                <div>
                    <Button onClick={() => setData(getFileData(dataSource().length === 46 ? 25 : 46))}>toggle change dataSource (46/25)</Button>
                    <Table
                        columns={[
                            {
                                title: '标题',
                                dataIndex: 'name',
                                width: 400,
                                filters: designFilters,
                                onFilter: (value, record) => record.name.includes(value),
                                sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1),
                                defaultFilteredValue: filteredValue(),
                            },
                            { title: '大小', dataIndex: 'size' },
                        ]}
                        dataSource={dataSource()}
                        scroll={{ y: 300 }}
                        onChange={({ filters }) => {
                            if (filters?.length) {
                                setFilteredValue(filters.find((filter) => filter.dataIndex === 'name')?.filteredValue ?? []);
                            }
                        }}
                    />
                </div>
            );
        }
        render(() => <Demo />);
        const toggle = screen.getByRole('button', { name: 'toggle change dataSource (46/25)' });
        expect(await screen.findByText('显示第 1 条-第 10 条，共 23 条')).toBeInTheDocument();
        await userEvent.click(toggle);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 12 条')).toBeInTheDocument();
        await userEvent.click(getFilterTriggers()[0]);
        await userEvent.click(
            await waitFor(() => {
                const item = document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-menu .${BASE_CLASS_PREFIX}-dropdown-item:nth-child(2)`);
                expect(item).not.toBeNull();
                return item as HTMLElement;
            })
        );
        await userEvent.click(toggle);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 46 条')).toBeInTheDocument();
    });

    it('滚动', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
            { title: 'Age', dataIndex: 'age', width: 150 },
            { title: 'Address', width: 200, dataIndex: 'address' },
            { title: 'Description', dataIndex: 'description' },
            { fixed: 'right', width: 250, render: () => 'Show Info' },
        ];
        render(() => <Table columns={columns} dataSource={getData(12)} scroll={{ y: 300, x: '120%' }} />);
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

    it('调整大小', async () => {
        function Demo() {
            const [scroll, setScroll] = createSignal<TableProps['scroll']>({});
            return (
                <>
                    <Switch aria-label="fixed header" onChange={(checked) => setScroll(checked ? { y: 300 } : {})} />
                    <Table
                        columns={[
                            { title: 'Name', dataIndex: 'name', width: 150 },
                            { title: 'Address', dataIndex: 'address' },
                        ]}
                        dataSource={getData(8)}
                        scroll={scroll()}
                    />
                </>
            );
        }
        render(() => <Demo />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-switch`) as HTMLElement);
        await expect.poll(getBody).toHaveStyle({ maxHeight: '300px' });
    });

    it('空筛选项', async () => {
        function Demo() {
            const [filteredValue, setFilteredValue] = createSignal<string[]>([]);
            return (
                <div>
                    <Input style={{ width: '200px' }} placeholder="筛选标题" value={filteredValue()[0]} onChange={(value) => setFilteredValue([value])} />
                    <Table
                        columns={[
                            { title: '标题', dataIndex: 'name', width: 400, onFilter: (value, record) => record.name.includes(value), filteredValue: filteredValue() },
                            { title: '大小', dataIndex: 'size' },
                        ]}
                        dataSource={getFileData(46)}
                        scroll={{ y: 300 }}
                    />
                </div>
            );
        }
        render(() => <Demo />);
        await userEvent.type(screen.getByPlaceholderText('筛选标题'), 'Semi D2C');
        await waitFor(() => expect(getBodyRows()[0]).toMatchTextContent('Semi D2C'));
        expect(getBodyRows()[1]).toMatchTextContent('Semi D2C');
        expect(getBodyRows()[2]).toMatchTextContent('Semi D2C');
        expect(screen.getByText('显示第 1 条-第 10 条，共 23 条')).toBeInTheDocument();
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
        const sorter = (a: Record<string, any>, b: Record<string, any>) => (a.name.length - b.name.length > 0 ? 1 : -1);
        const onFilter = (value: string, record: Record<string, any>) => record.name.includes(value);

        it('普通表格省略标题', () => {
            const columns: ColumnProps[] = [
                { title: '标题标题标题标题标题标题标题标题', dataIndex: 'name', ellipsis: true, filters: designFilters, onFilter, sorter },
                { title: '所有者', dataIndex: 'owner', ellipsis: true, filters: designFilters, onFilter, sorter },
                { title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小', dataIndex: 'size', sorter, ellipsis: true },
                { title: '更新日期', dataIndex: 'updateTime', ellipsis: true },
            ];
            render(() => (
                <>
                    <Table style={{ width: '800px' }} columns={columns} dataSource={data} pagination={false} />
                    <Table columns={columns} dataSource={data} pagination={false} />
                </>
            ));
            [0, 1, 2].forEach((i) => expect(getHeadTitles()[i]).toHaveAttribute('title'));
            expect(getHeadEllipsis()[3]).toHaveAttribute('title');
        });

        it('固定列表格省略标题', () => {
            const columns: ColumnProps[] = [
                { title: longTitle, dataIndex: 'name', fixed: true, width: 300, filters: designFilters, onFilter, sorter, ellipsis: true },
                { title: '所有者', dataIndex: 'owner', ellipsis: true, filters: designFilters, onFilter, sorter, width: 300 },
                { title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小', dataIndex: 'size', sorter, ellipsis: true },
                { title: '更新日期', dataIndex: 'updateTime', ellipsis: true, width: 300, fixed: 'right' },
            ];
            render(() => <Table style={{ width: '1000px' }} columns={columns} dataSource={data} pagination={false} scroll={{ x: 1200 }} />);
            [0, 1, 2].forEach((i) => expect(getHeadTitles()[i]).toHaveAttribute('title'));
            expect(getHeadEllipsis()[3]).toHaveAttribute('title');
        });

        it('固定列表格省略标题，showTitle 为 false', () => {
            const renderText = (text: string) => <Typography.Text ellipsis={{ showTooltip: true }}>{text}</Typography.Text>;
            const columns: ColumnProps[] = [
                { title: longTitle, dataIndex: 'name', fixed: true, width: 300, filters: designFilters, onFilter, sorter, render: renderText, ellipsis: { showTitle: false } },
                { title: '所有者', dataIndex: 'owner', width: 300, filters: designFilters, onFilter, sorter, render: renderText, ellipsis: { showTitle: false } },
                { title: '大小大小大小大小大小大小大小大小大小大小大小大小大小大小', dataIndex: 'size', sorter, render: renderText, ellipsis: { showTitle: false } },
                { title: '更新日期', dataIndex: 'updateTime', width: 300, fixed: 'right', ellipsis: { showTitle: false } },
            ];
            render(() => <Table style={{ width: '1000px' }} columns={columns} dataSource={data} pagination={false} scroll={{ x: 1200 }} />);
            [0, 1, 2].forEach((i) => expect(getHeadTitles()[i]).not.toHaveAttribute('title'));
            expect(getHeadEllipsis()[3]).not.toHaveAttribute('title');
            const cells = document.querySelectorAll(`.${prefix}-row-cell`);
            [0, 1, 2, 3].forEach((i) => expect(cells[i]).not.toHaveAttribute('title'));
        });
    });

    it('sorter 的 sortOrder 参数', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name' },
            {
                title: '大小',
                dataIndex: 'size',
                sorter: (r1, r2, order) => {
                    const a = r1.size;
                    const b = r2.size;
                    if (typeof a === 'number' && typeof b === 'number') {
                        return a - b;
                    } else if (typeof a === 'undefined') {
                        return order === 'ascend' ? 1 : -1;
                    } else if (typeof b === 'undefined') {
                        return order === 'ascend' ? -1 : 1;
                    }
                    return 0;
                },
                render: (text) => (text ? `${text} KB` : '未知'),
            },
        ];
        const data = [3, undefined, 1, 5, undefined, 2].map((size, i) => ({ key: `${i + 1}`, name: `文档${i + 1}`, size }));
        render(() => <Table columns={columns} dataSource={data} />);
        const sorter = document.querySelector(`.${prefix}-column-sorter`) as HTMLElement;
        for (const first of ['1 KB', '5 KB']) {
            await userEvent.click(sorter);
            await waitFor(() => expect(getBodyRows()[0]).toMatchTextContent(first));
            expect(getBodyRows()[4]).toMatchTextContent('未知');
            expect(getBodyRows()[5]).toMatchTextContent('未知');
        }
    });

    it('showHeader 为 false 且表头拆分时，Tab 不进入隐藏表头', async () => {
        render(() => (
            <>
                <button type="button">before</button>
                <Table columns={[{ title: '标题', dataIndex: 'name', width: 200, sorter: (a, b) => a.name.localeCompare(b.name), filters: [{ text: 'a', value: 'a' }], onFilter: () => true }]} dataSource={getFileData(3)} pagination={false} scroll={{ y: 300 }} showHeader={false} />
                <button type="button">after</button>
            </>
        ));
        screen.getByRole('button', { name: 'before' }).focus();
        // the scrollable body is the table's only Tab stop
        await tab();
        expect(document.querySelector(`.${prefix}-body`)).toHaveFocus();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('showHeader 为 false 且表头不拆分时，多个固定列按列宽错开', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 200, fixed: true },
            { title: '大小', dataIndex: 'size', width: 150, fixed: true },
            { title: '所有者', dataIndex: 'owner' },
        ];
        const { container } = render(() => <Table style={{ width: '600px' }} columns={columns} dataSource={getFileData(3)} pagination={false} scroll={{ x: 900 }} showHeader={false} />);
        const secondCell = () => (container.querySelector(`.${prefix}-tbody .${prefix}-row`) as HTMLElement).children[1] as HTMLElement;
        await waitFor(() => expect(getComputedStyle(secondCell()).left).toBe('200px'));
        const thead = container.querySelector(`.${prefix}-thead`) as HTMLElement;
        expect(thead.getBoundingClientRect().height).toBe(0);
        expect((thead.querySelector('th') as HTMLElement).getBoundingClientRect().width).toBeGreaterThan(0);
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
        const nameColumns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name', key: 'name' }];
        render(() => (
            <div>
                <Table data-cy="expand" columns={nameColumns} dataSource={expandData} expandCellFixed hideExpandedColumn={false} keepDOM scroll={{ x: '160%' }} expandedRowRender={(record) => <p>{record?.description}</p>} />
                <Table data-cy="tree" columns={nameColumns} dataSource={treeData} keepDOM />
            </div>
        ));
        const hiddenRows = (name: string) => document.querySelectorAll(`[data-cy=${name}] .${prefix}-row-hidden`);
        const expandIcon = (name: string) => document.querySelector(`[data-cy=${name}] .${prefix}-expand-icon`) as HTMLElement;

        expect(hiddenRows('expand')).toHaveLength(3);
        expect(hiddenRows('tree')).toHaveLength(5);
        await userEvent.click(expandIcon('tree'));
        await waitFor(() => expect(hiddenRows('tree')).toHaveLength(3));
    });

    it('renderFilterDropdown', async () => {
        let input: HTMLDivElement | undefined;
        const columns: ColumnProps[] = [
            {
                title: '标题',
                dataIndex: 'name',
                onFilter: (value, record) => record.name.includes(value),
                renderFilterDropdown: (props) => (
                    <Space style={{ padding: '8px' }} align="start" vertical>
                        <Input ref={(el) => (input = el)} value={props?.tempFilteredValue[0]} onChange={(value) => props?.setTempFilteredValue(value ? [value] : [])} />
                        <Space>
                            <Button onClick={() => props?.confirm({ closeDropdown: true })}>筛选+关闭</Button>
                            <Button onClick={() => props?.clear({ closeDropdown: true })}>清除+关闭</Button>
                            <Button onClick={() => props?.close()}>直接关闭</Button>
                        </Space>
                    </Space>
                ),
                onFilterDropdownVisibleChange: () => input?.focus(),
            },
            {
                title: '所有者',
                dataIndex: 'owner',
                onFilter: (value, record) => record.owner.includes(value),
                defaultFilteredValue: ['姜鹏志'],
                renderFilterDropdown: (props) => (
                    <Space style={{ padding: '8px' }} align="start" vertical>
                        <Input value={props?.tempFilteredValue[0]} onChange={(value) => props?.setTempFilteredValue(value ? [value] : [])} />
                        <Space>
                            <Button onClick={() => props?.confirm({ closeDropdown: false })}>筛选后不关闭</Button>
                            <Button onClick={() => props?.clear({ closeDropdown: false })}>清除后不关闭</Button>
                            <Button onClick={() => props?.close()}>直接关闭</Button>
                        </Space>
                    </Space>
                ),
            },
        ];
        render(() => <Table columns={columns} dataSource={getFileData(46)} />);
        const getInput = () => document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
        const clickButton = (name: string) => userEvent.click(screen.getByRole('button', { name }));
        const waitForClosed = () => waitFor(() => expect(getDropdown()).toBeNull());
        const openFilter = async (index: number) => {
            await userEvent.click(getFilterTriggers()[index]);
            await waitFor(() => expect(getInput()).not.toBeNull());
        };
        const paginationInfo = () => document.querySelector(`.${prefix}-pagination-info`);

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
        // userEvent.type focuses via an id selector, invalid for random ids starting with a digit; click first
        await userEvent.click(getInput());
        await userEvent.keyboard('郝宣');
        await clickButton('筛选后不关闭');
        await waitFor(() => expect(paginationInfo()).toHaveTextContent('显示第 1 条-第 10 条，共 23 条'));
        expect(getDropdown()).not.toBeNull();
        await clickButton('直接关闭');
        await waitForClosed();
    });

    it('rowSelection 的 onCell 与 onHeaderCell', () => {
        render(() => (
            <Table
                columns={[{ title: '标题', dataIndex: 'name' }]}
                dataSource={getFileData(6)}
                rowSelection={{
                    onCell: () => ({ style: { background: 'red' }, class: 'test-td' }),
                    onHeaderCell: () => ({ style: { background: 'blue' }, class: 'test-th' }),
                }}
            />
        ));
        expect(document.querySelector('.test-th')?.getAttribute('style')).toContain('background: blue');
        expect(document.querySelector('.test-td')?.getAttribute('style')).toContain('background: red');
    });

    it('确认模式的筛选页脚按钮靠末端排列，与选项之间有分隔线', async () => {
        render(() => <Table columns={[{ title: 'name', dataIndex: 'name', filterConfirmMode: 'confirm', filters: [{ text: 'a', value: 'a' }], onFilter: (value, record) => record.name === value }]} dataSource={getFileData(3)} pagination={false} />);
        await userEvent.click(document.querySelector(`.${prefix}-column-filter`) as HTMLElement);
        const footer = await waitFor(() => {
            const found = document.querySelector<HTMLElement>(`.${prefix}-column-filter-footer`);
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        const style = getComputedStyle(footer);
        expect(style.display).toBe('flex');
        expect(style.justifyContent).toBe('flex-end');
        expect(style.padding).toBe('8px 12px');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopStyle).toBe('solid');
    });

    it('用键盘改每页条数后，焦点留在每页条数选择器上', async () => {
        render(() => <Table columns={[{ title: 'name', dataIndex: 'name' }]} dataSource={getFileData(46)} pagination={{ showSizeChanger: true }} />);
        const selector = screen.getByRole('combobox', { name: '每页条数' });
        await tabTo(selector);
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('listbox');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.querySelectorAll(`.${prefix}-tbody .${prefix}-row`)).toHaveLength(20));
        expect(screen.getByRole('combobox', { name: '每页条数' })).toHaveFocus();
    });

    // Chrome makes an overflowing scroll container keyboard focusable; that focus must not show the default ring
    it('滚动的表体获得键盘焦点时显示主题焦点环', async () => {
        const { container } = render(() => <Table columns={[{ title: 'name', dataIndex: 'name' }]} dataSource={getFileData(30)} pagination={false} scroll={{ y: 200 }} />);
        const body = container.querySelector(`.${prefix}-body`) as HTMLElement;
        await tabTo(body);
        expectThemeFocusRing(body);
    });

    // dnd-kit style sortable rows are role=button tabindex=0
    it('为拖拽排序设置为可聚焦的行显示主题焦点环', async () => {
        const { container } = render(() => <Table columns={[{ title: 'name', dataIndex: 'name' }]} dataSource={getFileData(3)} pagination={false} onRow={() => ({ role: 'button', tabIndex: 0 })} />);
        const row = container.querySelector(`.${prefix}-tbody .${prefix}-row`) as HTMLElement;
        await tabTo(row);
        expectThemeFocusRing(row);
    });

    it('列排序器显示主题焦点环', async () => {
        const { container } = render(() => <Table columns={[{ title: 'size', dataIndex: 'size', sorter: (a, b) => a.size - b.size }]} dataSource={getFileData(3)} pagination={false} />);
        const sorter = container.querySelector(`.${prefix}-column-sorter-wrapper`) as HTMLElement;
        await tabTo(sorter);
        expectThemeFocusRing(sorter);
    });

    it('排序按钮的外观与周围的表头文字一致', () => {
        const { container } = render(() => <Table columns={[{ title: 'size', dataIndex: 'size', sorter: (a, b) => a.size - b.size }]} dataSource={getFileData(3)} pagination={false} />);
        const button = getComputedStyle(container.querySelector(`.${prefix}-column-sorter-wrapper`) as HTMLElement);
        const cell = getComputedStyle(container.querySelector('th') as HTMLElement);
        for (const prop of ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight'] as const) {
            expect(button[prop]).toBe(cell[prop]);
        }
        expect(button.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(button.borderTopWidth).toBe('0px');
        expect(button.paddingLeft).toBe('0px');
    });

    it('展开按钮显示主题焦点环', async () => {
        const { container } = render(() => <Table columns={[{ title: 'size', dataIndex: 'size' }]} dataSource={getFileData(3)} pagination={false} expandedRowRender={() => 'more'} />);
        const expand = container.querySelector(`.${prefix}-expand-icon`) as HTMLElement;
        await tabTo(expand);
        expectThemeFocusRing(expand);
    });

    it('容器窄于整行时分页信息文字保持单行原宽，不按字换行', () => {
        const columns: ColumnProps[] = [{ title: '标题', dataIndex: 'name' }];
        const pagination = { pageSize: 10, showSizeChanger: true };
        const { container } = render(() => (
            <>
                <div style={{ width: '900px' }}>
                    <Table columns={columns} dataSource={getFileData(46)} pagination={pagination} />
                </div>
                <div style={{ width: '300px' }}>
                    <Table columns={columns} dataSource={getFileData(46)} pagination={pagination} />
                </div>
            </>
        ));
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefix}-pagination-info`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});

// Real mouse input from Playwright in every browser: setPointerCapture rejects a synthetic pointerId. The drop target is
// the root, so the drag may end anywhere in the viewport; a point left of the viewport is clamped to its edge
async function drag(handle: Element, dx: number) {
    const root = document.documentElement.getBoundingClientRect();
    const box = handle.getBoundingClientRect();
    const x = Math.max(0, box.left + box.width / 2 + dx);
    await userEvent.dragAndDrop(handle, document.documentElement, { targetPosition: { x: x - root.left, y: box.top + box.height / 2 - root.top } });
}

const findHandle = (container: Element, index = 0) =>
    waitFor(() => {
        const found = container.querySelectorAll(`.${prefix}-resize-handle`)[index];
        expect(found).toBeDefined();
        return found;
    });

describe('Table 虚拟化（浏览器）', () => {
    const rowTexts = () => [...document.querySelectorAll('div[role="row"]')].map((row) => row.textContent);

    it.each(['ltr', 'rtl'] as const)('%s 下虚拟化表格的 tbody 是 block', async (direction) => {
        const { container } = render(() => (
            <ConfigProvider direction={direction}>
                <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getFileData(50)} pagination={false} scroll={{ y: 300 }} virtualized />
            </ConfigProvider>
        ));
        const tbody = await waitFor(() => {
            const found = container.querySelector(`.${prefix}-tbody`);
            expect(found).not.toBeNull();
            return found as Element;
        });
        expect(getComputedStyle(tbody).display).toBe('block');
    });

    it('修复 #944：空的虚拟表格不保留 scroll.y 高度', async () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
            { title: 'Owner', dataIndex: 'owner' },
            { title: 'Size', dataIndex: 'size', width: 250, fixed: 'right' },
        ];
        const [dataSource, setDataSource] = createSignal<Record<string, any>[]>([]);
        render(() => <Table style={{ width: '800px' }} columns={columns} dataSource={dataSource()} pagination={false} scroll={{ y: 600, x: 1600 }} virtualized />);
        const emptyRect = await waitFor(() => {
            const placeholder = document.querySelector(`.${prefix}-placeholder`);
            expect(placeholder).not.toBeNull();
            return (placeholder as Element).getBoundingClientRect();
        });
        expect(emptyRect.height).toBeGreaterThan(0);
        expect(getBody().getBoundingClientRect().height).toBeLessThan(600);
        expect(getBody().getBoundingClientRect().bottom).toBeGreaterThanOrEqual(emptyRect.bottom - 1);

        setDataSource(getFileData(1000));
        await waitFor(() => expect(getBody().getBoundingClientRect().height).toBe(600));
    });

    // scroll.y arrives after mount; the list handle must still work
    it('修复 #2305：getVirtualizedListRef 交出的句柄可以滚动到指定行', async () => {
        let list: Parameters<NonNullable<TableProps['getVirtualizedListRef']>>[0] | undefined;
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 200, fixed: true },
            { title: 'Owner', dataIndex: 'owner' },
            { title: 'Size', dataIndex: 'size', width: 150, fixed: 'right' },
        ];
        const [scroll, setScroll] = createSignal<TableProps['scroll']>({});
        render(() => (
            <>
                <button type="button" onClick={() => list?.scrollToItem(20)}>
                    Scroll to 20
                </button>
                <Table style={{ width: '750px' }} columns={columns} dataSource={getFileData(1000)} getVirtualizedListRef={(handle) => (list = handle)} pagination={false} scroll={scroll()} virtualized />
            </>
        ));
        setScroll({ y: 400, x: 900 });
        await waitFor(() => expect(list).toBeDefined());
        expect(screen.queryByText('Semi Design 设计稿20.fig')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Scroll to 20' }));
        expect(await screen.findByText('Semi Design 设计稿20.fig')).toBeInTheDocument();
    });

    it('无限滚动', async () => {
        const itemSize = 56;
        const scroll = { y: 600, x: 1600 };
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
            { title: 'Age', dataIndex: 'age', width: 150 },
            { title: 'Address', dataIndex: 'address' },
            { fixed: 'right', width: 250, render: () => 'Show Info' },
        ];
        const [data, setData] = createSignal(getData(20));
        render(() => (
            <Table
                style={{ width: '800px' }}
                columns={columns}
                dataSource={data()}
                pagination={false}
                rowSelection={{ fixed: true }}
                scroll={scroll}
                virtualized={{
                    itemSize,
                    onScroll: ({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
                        if (scrollDirection === 'forward' && (scrollOffset ?? 0) >= (data().length - Math.ceil(scroll.y / itemSize) * 1.5) * itemSize && !scrollUpdateWasRequested) {
                            setData(getData(data().length + 20));
                        }
                    },
                }}
            />
        ));
        await waitFor(() => expect(rowTexts().length).toBeGreaterThan(0));
        expect(rowTexts().length).toBeLessThan(30);

        const firstHeight = getBody().scrollHeight;
        getBody().scrollTop = firstHeight;
        await waitFor(() => expect(rowTexts().some((text) => text?.includes('Edward King 14'))).toBe(true));
        await waitFor(() => expect(getBody().scrollHeight).toBeGreaterThan(firstHeight));
        getBody().scrollTop = getBody().scrollHeight;
        await waitFor(() => expect(rowTexts().some((text) => text?.includes('Edward King 34'))).toBe(true));
        getBody().scrollTop = 0;
        await waitFor(() => expect(rowTexts().some((text) => text?.includes('Edward King 0'))).toBe(true));
    });

    it('虚拟表格横向滚动后再纵向滚动，横向位置保持且表头对齐', async () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, fixed: true },
            { title: 'Age', dataIndex: 'age', width: 150 },
            { title: 'Address', dataIndex: 'address' },
            { fixed: 'right', width: 250, render: () => 'Show Info' },
        ];
        render(() => <Table style={{ width: '800px' }} columns={columns} dataSource={getData(100)} pagination={false} scroll={{ y: 300, x: 1600 }} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
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

    it('虚拟表格 showHeader 为 false', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 200, fixed: true },
            { title: '大小', dataIndex: 'size', width: 150 },
            { title: '所有者', dataIndex: 'owner' },
            { title: '更新日期', dataIndex: 'key', fixed: 'right', width: 150 },
        ];
        render(() => <Table style={{ width: '750px', margin: '0 auto' }} columns={columns} dataSource={getFileData(1000)} pagination={false} scroll={{ y: 400, x: 900 }} showHeader={false} virtualized />);
        const headers = document.querySelectorAll(`.${prefix}-header`);
        expect(headers).toHaveLength(1);
        expect(getComputedStyle(headers[0]).height).toBe('0px');
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
    });

    it('虚拟化分组表：分组值与 rowKey 相同时分组行与记录行都渲染', async () => {
        const data = [
            { key: 'a', name: '记录 a', group: 'a' },
            { key: 'b', name: '记录 b', group: 'a' },
            { key: 'c', name: '记录 c', group: 'c' },
        ];
        render(() => <Table columns={[{ title: '名称', dataIndex: 'name' }]} dataSource={data} defaultExpandAllGroupRows groupBy="group" pagination={false} scroll={{ y: 300 }} virtualized renderGroupSection={(groupKey) => `group ${groupKey}`} />);
        await waitFor(() => expect(rowTexts()).toEqual(['group a', '记录 a', '记录 b', 'group c', '记录 c']));
    });
});

describe('Table 可调整列宽（浏览器）', () => {
    it('可调整大小的表头', async () => {
        const columns: ColumnProps[] = [
            { title: 'Date', dataIndex: 'date', width: 200 },
            { title: 'Amount', dataIndex: 'amount', width: 100 },
            { title: 'Type', dataIndex: 'type', width: 100 },
            { title: 'Note', dataIndex: 'note', width: 100 },
            { title: 'Action', key: 'action', render: () => <button type="button">Delete</button> },
        ];
        const data = ['2018-02-11', '2018-03-11', '2018-04-11'].map((date, key) => ({ key, date, amount: 120, type: 'income', note: 'transfer' }));
        // Room for the dragged widths: WebKit shrinks fixed columns that overflow an auto-layout table instead of widening it
        const { container } = render(() => (
            <div style={{ width: '1200px' }}>
                <Table columns={columns} dataSource={data} resizable />
            </div>
        ));
        const getCellWidth = (index: number) => getComputedStyle(document.querySelectorAll(`.${prefix}-row-cell`)[index]).width;
        await drag(await findHandle(container, 0), 164);
        await waitFor(() => expect(getCellWidth(0)).toBe('364px'));
        await drag(await findHandle(container, 1), 300);
        await waitFor(() => expect(getCellWidth(1)).toBe('400px'));
    });

    it('拖动列宽手柄时回调收到新宽度，点击手柄不触发排序', async () => {
        const onResize = vi.fn<(column: ColumnProps) => void>();
        const onResizeStart = vi.fn<(column: ColumnProps) => void>();
        const onResizeStop = vi.fn<(column: ColumnProps) => void>();
        const onChange = vi.fn<() => void>();
        const columns: ColumnProps[] = [
            { title: 'Date', dataIndex: 'date', width: 200, sorter: (a, b) => a.date.localeCompare(b.date) },
            { title: 'Note', dataIndex: 'note' },
        ];
        const { container } = render(() => <Table columns={columns} dataSource={[{ key: 0, date: '2018-02-11' }]} resizable={{ onResize, onResizeStart, onResizeStop }} onChange={onChange} />);
        const handle = await findHandle(container);
        await drag(handle, 80);
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 280 }));
        await waitFor(() => expect(getHeaderCell(container, 'Date').getBoundingClientRect().width).toBeCloseTo(280, 0));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(handle);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('拖动列宽手柄越过起始侧时，宽度不小于 20', async () => {
        const onResize = vi.fn<(column: ColumnProps) => void>();
        const columns: ColumnProps[] = [
            { title: 'Date', dataIndex: 'date', width: 200 },
            { title: 'Note', dataIndex: 'note' },
        ];
        const { container } = render(() => <Table columns={columns} dataSource={[{ key: 0, date: '2018-02-11' }]} resizable={{ onResize }} />);
        await drag(await findHandle(container), -300);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 20 }));
        await drag(await findHandle(container), 50);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 70 }));
    });

    it('修复 #1869：选中行后保留已调整的列宽', async () => {
        const columns: ColumnProps[] = [
            { title: 'Key', dataIndex: 'key', key: 'key' },
            { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
            { title: '大小', dataIndex: 'size', key: 'size', width: 400 },
            { title: '所有者', dataIndex: 'owner', key: 'owner' },
        ];
        const [selectedRowKeys, setSelectedRowKeys] = createSignal<(string | number)[]>([]);
        const { container } = render(() => (
            <div style={{ width: '1200px' }}>
                <Table columns={columns} dataSource={getFileData(3)} pagination={false} resizable rowSelection={{ selectedRowKeys: selectedRowKeys(), onChange: (keys) => setSelectedRowKeys(keys ?? []) }} />
            </div>
        ));
        const handle = getHeaderCell(container, '名称').querySelector(`.${prefix}-resize-handle`) as Element;
        await drag(handle, 100);
        await waitFor(() => expect(getHeaderCell(container, '名称').getBoundingClientRect().width).toBeCloseTo(300, 0));

        await userEvent.click(container.querySelector(`.${prefix}-tbody .${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-tbody .${BASE_CLASS_PREFIX}-checkbox-checked`)).toHaveLength(1));
        expect(getHeaderCell(container, '名称').getBoundingClientRect().width).toBeCloseTo(300, 0);
    });

    it('可调整大小的 onHeaderCell', () => {
        const onHeaderCell: ColumnProps['onHeaderCell'] = (_column, columnIndex) => ({ class: `test-${columnIndex}` });
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, onHeaderCell },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: (a, b) => a.age - b.age, onHeaderCell },
            { title: 'Address', width: 200, dataIndex: 'address' },
        ];
        const [selectedRowKeys, setSelectedRowKeys] = createSignal<(string | number)[]>([]);
        render(() => <Table bordered columns={columns} dataSource={getData(46)} resizable rowSelection={{ onChange: (keys) => setSelectedRowKeys(keys ?? []), selectedRowKeys: selectedRowKeys() }} />);
        expect(document.querySelectorAll('.test-1')).toHaveLength(1);
        expect(document.querySelectorAll('.test-2')).toHaveLength(1);
    });
});

describe('Table 分组（浏览器）', () => {
    it('有固定列时，分组行随容器变宽', async () => {
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const { container } = render(() => (
            <div style={{ width: '800px' }}>
                <Table
                    columns={[
                        { title: '名称', dataIndex: 'name', fixed: 'left', width: 300 },
                        { title: '大小', dataIndex: 'size', width: 300 },
                        { title: '所有者', dataIndex: 'owner', width: 300 },
                    ]}
                    dataSource={getFileData(6)}
                    groupBy="owner"
                    pagination={false}
                    scroll={{ x: 900, y: 300 }}
                    renderGroupSection={(owner) => owner}
                />
            </div>
        ));
        const wrapper = container.firstElementChild as HTMLElement;
        const section = () => container.querySelector(`.${prefix}-section-inner`) as HTMLElement;
        await waitFor(() => expect(section().getBoundingClientRect().width).toBeGreaterThan(0));
        await nextFrame();
        const sectionWidth = section().getBoundingClientRect().width;
        for (const width of [760, 720, 680, 640, 600]) {
            wrapper.style.width = `${width}px`;
            await nextFrame();
        }
        expect(section().getBoundingClientRect().width).toBeCloseTo(sectionWidth - 200, 0);
    });
});
