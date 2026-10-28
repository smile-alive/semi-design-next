import { createSignal, children as resolveChildren, type JSX } from 'solid-js';
import * as dateFns from 'date-fns';
import { Table, Switch, ButtonGroup, Button, Avatar, type ColumnProps, type RowSelectionProps, type TableProps, type TablePaginationPosition as PaginationPosition } from '@fibrae/semi-ui-solid';

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
    description?: string;
}

interface PageState {
    currentPage: number;
    pageSize: number;
    total: number;
}

interface FetchResult {
    dataSource: Row[];
    pagination: PageState;
    sorter: ColumnProps<Row>;
    filters: ColumnProps<Row>[];
}

const DAY = 24 * 60 * 60 * 1000;
const figmaIconUrl = '/assets/placeholder/app.svg';
const dataTotalSize = 46;

const wrapStyle = {
    'margin-bottom': '15px',
    display: 'flex',
    'justify-content': 'space-around',
    'flex-wrap': 'wrap',
} as const;

const initialColumns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 400,
        render: (text) => {
            return (
                <span>
                    <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ 'margin-right': '12px' }} />
                    {text}
                </span>
            );
        },
        filters: [
            {
                text: 'Semi Design 设计稿',
                value: 'Semi Design 设计稿',
            },
            {
                text: 'Semi D2C 设计稿',
                value: 'Semi D2C 设计稿',
            },
        ],
        onFilter: (value, record) => record.name.includes(value),
    },
    {
        title: '大小',
        dataIndex: 'size',
        sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        render: (text) => `${text} KB`,
    },
    {
        title: '所有者',
        dataIndex: 'owner',
        render: (text, record) => {
            return (
                <div>
                    <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                        {typeof text === 'string' && text.slice(0, 1)}
                    </Avatar>
                    {text}
                </div>
            );
        },
    },
    {
        title: '更新日期',
        dataIndex: 'updateTime',
        sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        render: (value) => {
            return dateFns.format(new Date(value), 'yyyy-MM-dd');
        },
    },
];

const allData: Row[] = Array.from({ length: dataTotalSize }, (_v, i): Row => {
    const isSemiDesign = i % 2 === 0;
    const randomNumber = (i * 1000) % 199;
    return {
        key: '' + i,
        name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
        owner: isSemiDesign ? '姜鹏志' : '郝宣',
        size: randomNumber,
        updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
        avatarBg: isSemiDesign ? 'grey' : 'red',
        description: `这是第 ${i} 份设计稿的详细说明。`,
    };
});

const defaultPagination: PageState = {
    currentPage: 1,
    pageSize: 8,
    total: allData.length,
};

const renderExpandedRow = (record: Row) => {
    return {
        children: <p>{record.description}</p>,
        fixed: 'left' as const,
    };
};

const renderFooter = () => <p style={{ margin: '0px' }}>This is footer.</p>;

const mergeColumns = (column: ColumnProps<Row>, columns: ColumnProps<Row>[], keys: (keyof ColumnProps<Row>)[] = ['dataIndex']) => {
    const nextColumns = [...columns];
    nextColumns.forEach((curColumn, index) => {
        let isTarget = !!(keys && keys.length);
        for (const key of keys) {
            if (column[key] !== curColumn[key]) {
                isTarget = false;
                break;
            }
        }
        if (isTarget) {
            nextColumns[index] = { ...curColumn, ...column };
        }
    });
    return nextColumns;
};

const filterData = (filters: ColumnProps<Row>[], dataSource: Row[]) => {
    let result = [...dataSource];
    filters.forEach((filter) => {
        const filteredValue = filter.filteredValue;
        const dataIndex = filter.dataIndex as keyof Row | undefined;
        if (Array.isArray(filteredValue) && filteredValue.length && dataIndex) {
            result = result.filter((data) => filteredValue.filter((value) => String(data[dataIndex]).indexOf(value) > -1).length);
        }
    });
    return result;
};

const sortData = (sortObj: ColumnProps<Row>, dataSource: Row[]) => {
    const { sortOrder } = sortObj;
    const dataIndex = (sortObj.dataIndex ?? '') as keyof Row;
    let sorter = sortObj.sorter;
    let result = dataSource;
    if (sorter && sortOrder && typeof sorter !== 'function') {
        sorter = (a, b) => ((a?.[dataIndex] ?? '') > (b?.[dataIndex] ?? '') ? 1 : -1);
    }
    if (typeof sorter === 'function') {
        result = [...result].sort(sorter);
        if (sortOrder === 'descend') {
            result = result.reverse();
        }
    }
    return result;
};

const fetchData = (pagination: PageState, currentPage = 1, sorter: ColumnProps<Row> = {}, filters: ColumnProps<Row>[] = []) => {
    const nextPagination = { ...pagination, currentPage };
    return new Promise<FetchResult>((resolve) => {
        setTimeout(() => {
            let data = sortData(sorter, allData);
            data = filterData(filters, data);
            const dataSource = data.slice((currentPage - 1) * nextPagination.pageSize, currentPage * nextPagination.pageSize);
            nextPagination.total = data.length;
            resolve({
                dataSource,
                pagination: nextPagination,
                sorter,
                filters,
            });
        }, 1500);
    });
};

const getSorterColumn = (columns: ColumnProps<Row>[]) => columns.filter((column) => !!column.sorter)[0];

const getFilterColumns = (columns: ColumnProps<Row>[]) => columns.filter((column) => Array.isArray(column.filteredValue) && column.filteredValue.length);

interface TableSwitchProps {
    text: string;
    children?: JSX.Element;
    checked?: boolean | number | string;
    onChange?: (checked: boolean) => void;
}

function TableSwitch(props: TableSwitchProps) {
    // Resolve the children once: reading props.children again would build new nodes
    const content = resolveChildren(() => props.children);

    return (
        <span style={{ display: 'inline-flex', 'align-items': 'center', margin: '5px' }}>
            <span>{props.text}</span>
            {content() ?? <Switch size="small" aria-label={props.text} checked={props.checked != null ? !!props.checked : undefined} onChange={props.onChange} />}
        </span>
    );
}

export default function TableDemo() {
    const [loading, setLoading] = createSignal(true);
    const [columns, setColumns] = createSignal<ColumnProps<Row>[]>(initialColumns);
    const [scroll, setScroll] = createSignal<TableProps<Row>['scroll']>({});
    const [rowSelection, setRowSelection] = createSignal<RowSelectionProps<Row>>();
    const [expandable, setExpandable] = createSignal(false);
    const [expandCellFixed, setExpandCellFixed] = createSignal(false);
    const [showTitle, setShowTitle] = createSignal(false);
    const [showFooter, setShowFooter] = createSignal(false);
    const [expandedRowKeys, setExpandedRowKeys] = createSignal<string[]>([]);
    const [showHeader, setShowHeader] = createSignal(true);
    const [bordered, setBordered] = createSignal(false);
    const [resizable, setResizable] = createSignal(false);
    const [pagination, setPagination] = createSignal<PageState | false>(defaultPagination);
    const [dataSource, setDataSource] = createSignal<Row[]>([]);

    const load = (currentPagination: PageState, currentPage?: number, sorter?: ColumnProps<Row>, filters?: ColumnProps<Row>[]) => {
        fetchData(currentPagination, currentPage, sorter, filters)
            .then((result) => {
                let nextColumns = mergeColumns(result.sorter, columns());
                for (const filterObj of result.filters) {
                    nextColumns = mergeColumns(filterObj, nextColumns);
                }
                setColumns(nextColumns);
                setLoading(false);
                setPagination(result.pagination);
                setDataSource(result.dataSource);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    const setPage = (page?: number | null, sorter?: ColumnProps<Row> | null, filters?: ColumnProps<Row>[]) => {
        if (loading()) {
            return;
        }
        const current = pagination();
        const currentPage = typeof page === 'number' ? page : (current && current.currentPage) || 1;
        setLoading(true);
        load(current || defaultPagination, currentPage, sorter || getSorterColumn(columns()), filters || getFilterColumns(columns()));
    };

    // Initial load: the first page with the default sorter
    load(defaultPagination, 1, getSorterColumn(initialColumns), []);

    const toggleFixHeader = (checked: boolean) => {
        setScroll({ ...scroll(), y: checked ? 300 : undefined });
    };

    const toggleFixColumns = (checked: boolean) => {
        const cols = columns();
        const lastIndex = cols.length - 1;
        if (checked) {
            setColumns(
                cols.map((column, index) => {
                    if (index === 0) {
                        return { ...column, fixed: true };
                    }
                    return index === lastIndex ? { ...column, fixed: 'right' } : column;
                })
            );
        } else {
            setColumns(cols.map((column) => ({ ...column, fixed: false })));
        }
        const selection = rowSelection();
        if (selection) {
            setRowSelection({ ...selection, fixed: checked });
        }
        setScroll({ ...scroll(), x: checked ? '150%' : undefined });
        setExpandCellFixed(checked);
    };

    const toggleRowSelection = (checked: boolean) => {
        setRowSelection(
            checked
                ? {
                      width: 48,
                      fixed: true,
                      onChange: (selectedRowKeys, selectedRows) => console.log('Selection changed, selectedRowKeys: ', selectedRowKeys, 'selectedRows: ', selectedRows),
                  }
                : undefined
        );
    };

    const toggleShowSorter = (checked: boolean) => {
        setColumns(
            columns().map((column) => ({
                ...column,
                sorter: checked ? initialColumns.find((item) => item.dataIndex === column.dataIndex)?.sorter : undefined,
            }))
        );
    };

    const toggleShowFilter = (checked: boolean) => {
        if (checked) {
            setColumns(
                columns().map((column) =>
                    column.dataIndex === 'name'
                        ? {
                              ...column,
                              filters: [
                                  {
                                      text: '姓名中包含 1',
                                      value: '1',
                                  },
                                  {
                                      text: '姓名中包含 2',
                                      value: '2',
                                  },
                                  {
                                      text: '姓名中包含 3',
                                      value: '3',
                                  },
                              ],
                              filteredValue: [],
                          }
                        : column
                )
            );
        } else {
            setColumns(columns().map((column) => ({ ...column, filters: undefined, filteredValue: undefined })));
            setPage(null, null, []);
        }
    };

    const onExpandedRowsChange: TableProps<Row>['onExpandedRowsChange'] = (rows) => {
        console.log('Expanded rows changed to: ', rows);
        // The demo has no grouped rows, so every entry is a data row
        setExpandedRowKeys(rows.map((row) => (row as Row).key));
    };

    const toggleExpandedRowKeys = (checked: boolean) => {
        if (checked) {
            setExpandedRowKeys(
                dataSource()
                    .filter((data) => data.key)
                    .map((data) => data.key)
            );
            setExpandable(true);
        } else {
            setExpandedRowKeys([]);
        }
    };

    const toggleResizable = (checked: boolean) => {
        setResizable(!!checked);
        setBordered(!!checked);
    };

    const toggleDataSource = (checked: boolean) => {
        if (checked) {
            setDataSource([]);
        } else {
            setPage();
        }
    };

    const switchPagination = (position: PaginationPosition | false) => {
        setPagination(position ? { ...defaultPagination, ...pagination(), position } : false);
    };

    return (
        <div>
            <div style={wrapStyle}>
                <TableSwitch text="固定表头：" checked={scroll()?.y} onChange={toggleFixHeader} />
                <TableSwitch text="隐藏表头：" onChange={(checked) => setShowHeader(!checked)} />
                <TableSwitch text="显示标题：" onChange={(checked) => setShowTitle(checked)} />
                <TableSwitch text="显示底部：" onChange={(checked) => setShowFooter(checked)} />
                <TableSwitch text="固定列：" onChange={toggleFixColumns} />
                <TableSwitch text="显示选择列：" onChange={toggleRowSelection} />
                <TableSwitch text="显示加载状态：" onChange={(checked) => setLoading(checked)} checked={loading()} />
                <TableSwitch text="无数据：" onChange={toggleDataSource} checked={!dataSource() || !dataSource().length} />
                <TableSwitch text="开启排序功能：" onChange={toggleShowSorter} checked={columns().some((column) => column.sorter)} />
                <TableSwitch text="开启过滤功能：" onChange={toggleShowFilter} checked={columns().some((column) => column.filters)} />
                <TableSwitch text="开启行展开功能：" onChange={(checked) => setExpandable(checked)} checked={expandable()} />
                <TableSwitch text="展开当前所有行：" onChange={toggleExpandedRowKeys} />
                <TableSwitch text="显示边框：" onChange={(checked) => setBordered(checked)} checked={bordered()} />
                <TableSwitch text="开启列伸缩功能：" onChange={toggleResizable} />
                <TableSwitch text="分页控件：">
                    <ButtonGroup>
                        <Button onClick={() => switchPagination('bottom')}>Bottom</Button>
                        <Button onClick={() => switchPagination('top')}>Top</Button>
                        <Button onClick={() => switchPagination('both')}>Both</Button>
                        <Button onClick={() => switchPagination(false)}>None</Button>
                    </ButtonGroup>
                </TableSwitch>
            </div>
            <Table
                onExpandedRowsChange={onExpandedRowsChange}
                title={showTitle() ? 'This is title.' : undefined}
                footer={showFooter() ? renderFooter : undefined}
                showHeader={showHeader()}
                bordered={bordered()}
                onChange={(data) => {
                    console.log('Table changed: ', data);
                    setPage(data.pagination?.currentPage, data.sorter, data.filters);
                }}
                expandCellFixed={expandCellFixed()}
                expandedRowRender={expandable() ? renderExpandedRow : undefined}
                expandedRowKeys={expandedRowKeys()}
                rowSelection={rowSelection()}
                scroll={scroll()}
                columns={columns()}
                dataSource={dataSource()}
                pagination={pagination() && { ...pagination(), onPageChange: setPage }}
                loading={loading()}
                resizable={resizable()}
            />
        </div>
    );
}
