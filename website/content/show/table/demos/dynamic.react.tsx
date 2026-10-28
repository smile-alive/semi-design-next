import { useState, useEffect, useCallback, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import * as dateFns from 'date-fns';
import { Table, Switch, ButtonGroup, Button, Avatar, type TableChangeInfo, type ColumnProps, type RowSelectionProps, type TableScroll, type TablePaginationProps, type TableProps, type TablePaginationPosition as PaginationPosition } from '@fibrae/semi-ui-react';

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: string;
    description?: string;
}

interface PageState extends TablePaginationProps {
    currentPage: number;
    pageSize: number;
    total: number;
}

interface FetchResult {
    dataSource: Row[];
    pagination: PageState;
    sorter: ColumnProps;
    filters: ColumnProps[];
}

const DAY = 24 * 60 * 60 * 1000;
const figmaIconUrl = '/assets/placeholder/app.svg';
const dataTotalSize = 46;
const wrapStyle: CSSProperties = {
    marginBottom: 15,
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
};

const initialColumns: ColumnProps[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 400,
        render: (text) => {
            return (
                <span>
                    <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
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
                    <Avatar size="small" color={record.avatarBg} style={{ marginRight: 4 }}>
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

const allData = Array.from({ length: dataTotalSize }, (_v, i): Row => {
    const isSemiDesign = i % 2 === 0;
    const randomNumber = (i * 1000) % 199;
    return {
        key: '' + i,
        name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
        owner: isSemiDesign ? '姜鹏志' : '郝宣',
        size: randomNumber,
        updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
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

const renderFooter = () => <p style={{ margin: 0 }}>This is footer.</p>;

const mergeColumns = (column: ColumnProps, columns: ColumnProps[], keys: (keyof ColumnProps)[] = ['dataIndex']) => {
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

const filterData = (filters: ColumnProps[], dataSource: Row[]) => {
    let result = [...dataSource];
    filters.forEach((filter) => {
        const filteredValue = filter.filteredValue;
        const dataIndex = filter.dataIndex;
        if (Array.isArray(filteredValue) && filteredValue.length && dataIndex) {
            result = result.filter((data) => filteredValue.filter((value) => String(data[dataIndex as keyof Row]).indexOf(value) > -1).length);
        }
    });

    return result;
};

const sortData = (sortObj: ColumnProps, dataSource: Row[]) => {
    const { sortOrder, dataIndex = '' } = sortObj;
    let sorter = sortObj.sorter;
    let result = dataSource;

    if (sorter && sortOrder && typeof sorter !== 'function') {
        sorter = (a, b) => (a[dataIndex] > b[dataIndex] ? 1 : -1);
    }

    if (typeof sorter === 'function') {
        result = [...result].sort(sorter);

        if (sortOrder === 'descend') {
            result = result.reverse();
        }
    }

    return result;
};

const fetchData = (pagination: PageState, currentPage = 1, sorter: ColumnProps = {}, filters: ColumnProps[] = []) => {
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

const getSorterColumn = (columns: ColumnProps[]) => columns.filter((column) => !!column.sorter)[0];

const getFilterColumns = (columns: ColumnProps[]) => columns.filter((column) => Array.isArray(column.filteredValue) && column.filteredValue.length);

interface TableSwitchProps {
    text: string;
    children?: ReactNode;
    checked?: boolean | number | string;
    onChange?: (checked: boolean) => void;
    style?: CSSProperties;
}

function TableSwitch({ text, children, checked, onChange, style = { display: 'inline-flex', alignItems: 'center', margin: 5 } }: TableSwitchProps) {
    const switchProps: ComponentProps<typeof Switch> = { onChange };

    if (checked != null) {
        switchProps.checked = !!checked;
    }
    return (
        <span style={style}>
            <span>{text}</span>
            {children != null ? children : <Switch size="small" aria-label={text} {...switchProps} />}
        </span>
    );
}

export default function TableDemo() {
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(initialColumns);
    const [scroll, setScroll] = useState<TableScroll>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionProps<Row>>();
    const [expandable, setExpandable] = useState(false);
    const [expandCellFixed, setExpandCellFixed] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [showFooter, setShowFooter] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
    const [showHeader, setShowHeader] = useState(true);
    const [bordered, setBordered] = useState(false);
    const [resizable, setResizable] = useState(false);
    const [pagination, setPagination] = useState<PageState | false>(defaultPagination);
    const [dataSource, setDataSource] = useState<Row[]>([]);

    const load = useCallback((currentPagination: PageState, currentPage?: number, sorter?: ColumnProps, filters?: ColumnProps[]) => {
        fetchData(currentPagination, currentPage, sorter, filters)
            .then((result) => {
                setColumns((prevColumns) => {
                    let nextColumns = mergeColumns(result.sorter, prevColumns);
                    for (const filterObj of result.filters) {
                        nextColumns = mergeColumns(filterObj, nextColumns);
                    }
                    return nextColumns;
                });
                setLoading(false);
                setPagination(result.pagination);
                setDataSource(result.dataSource);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const setPage = (page?: number | null, sorter?: ColumnProps | null, filters?: ColumnProps[]) => {
        if (loading) {
            return;
        }
        const currentPage = typeof page === 'number' ? page : (pagination && pagination.currentPage) || 1;

        setLoading(true);
        load(pagination || defaultPagination, currentPage, sorter || getSorterColumn(columns), filters || getFilterColumns(columns));
    };

    useEffect(() => {
        load(defaultPagination, 1, getSorterColumn(initialColumns), []);
    }, [load]);

    const toggleFixHeader = (checked: boolean) => {
        setScroll({ ...scroll, y: checked ? 300 : undefined });
    };

    const toggleFixColumns = (checked: boolean) => {
        const lastIndex = columns.length - 1;
        if (checked) {
            setColumns(
                columns.map((column, index) => {
                    if (index === 0) {
                        return { ...column, fixed: true };
                    }
                    return index === lastIndex ? { ...column, fixed: 'right' } : column;
                })
            );
        } else {
            setColumns(columns.map((column) => ({ ...column, fixed: false })));
        }
        if (rowSelection) {
            setRowSelection({ ...rowSelection, fixed: checked });
        }
        setScroll({ ...scroll, x: checked ? '150%' : undefined });
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
            columns.map((column) => ({
                ...column,
                sorter: checked ? initialColumns.find((item) => item.dataIndex === column.dataIndex)?.sorter : undefined,
            }))
        );
    };

    const toggleShowFilter = (checked: boolean) => {
        if (checked) {
            setColumns(
                columns.map((column) =>
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
            setColumns(columns.map((column) => ({ ...column, filters: undefined, filteredValue: undefined })));
            setPage(null, null, []);
        }
    };

    const onChange = (data: TableChangeInfo<Row>) => {
        console.log('Table changed: ', data);
        const { pagination: tablePagination, sorter, filters } = data;
        setPage(tablePagination?.currentPage, sorter, filters);
    };

    const onExpandedRowsChange: TableProps<Row>['onExpandedRowsChange'] = (rows) => {
        console.log('Expanded rows changed to: ', rows);

        // The demo has no grouped rows, so every entry is a data row
        setExpandedRowKeys((Array.isArray(rows) && rows.map((row) => (row as Row).key)) || []);
    };

    const toggleExpandedRowKeys = (checked: boolean) => {
        if (checked) {
            setExpandedRowKeys(dataSource.filter((data) => data.key).map((data) => data.key));
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
        setPagination(position ? { ...defaultPagination, ...pagination, position } : false);
    };

    return (
        <div>
            <div style={wrapStyle}>
                <TableSwitch text="固定表头：" checked={scroll && scroll.y} onChange={toggleFixHeader} />
                <TableSwitch text="隐藏表头：" onChange={(checked) => setShowHeader(!checked)} />
                <TableSwitch text="显示标题：" onChange={setShowTitle} />
                <TableSwitch text="显示底部：" onChange={setShowFooter} />
                <TableSwitch text="固定列：" onChange={toggleFixColumns} />
                <TableSwitch text="显示选择列：" onChange={toggleRowSelection} />
                <TableSwitch text="显示加载状态：" onChange={setLoading} checked={loading} />
                <TableSwitch text="无数据：" onChange={toggleDataSource} checked={!dataSource || !dataSource.length} />
                <TableSwitch text="开启排序功能：" onChange={toggleShowSorter} checked={columns.some((column) => column.sorter)} />
                <TableSwitch text="开启过滤功能：" onChange={toggleShowFilter} checked={columns.some((column) => column.filters)} />
                <TableSwitch text="开启行展开功能：" onChange={setExpandable} checked={expandable} />
                <TableSwitch text="展开当前所有行：" onChange={toggleExpandedRowKeys} />
                <TableSwitch text="显示边框：" onChange={setBordered} checked={bordered} />
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
                title={showTitle ? 'This is title.' : null}
                footer={showFooter ? renderFooter : null}
                showHeader={showHeader}
                bordered={bordered}
                onChange={onChange}
                expandCellFixed={expandCellFixed}
                expandedRowRender={expandable ? renderExpandedRow : undefined}
                expandedRowKeys={expandedRowKeys}
                rowSelection={rowSelection}
                scroll={scroll}
                columns={columns}
                dataSource={dataSource}
                pagination={pagination && { ...pagination, onPageChange: setPage }}
                loading={loading}
                resizable={resizable}
            />
        </div>
    );
}
