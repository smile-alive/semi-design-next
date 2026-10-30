<script lang="ts">
    import { onMount } from 'svelte';
    import { format } from 'date-fns';
    import { Avatar, Button, ButtonGroup, Switch, Table, type ColumnProps, type RowSelectionProps, type TableChangeInfo, type TablePaginationPosition, type TablePaginationProps, type TableScroll } from '@fibrae/semi-ui-svelte';

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

    interface SwitchItem {
        text: string;
        /** Absent: the switch keeps its own state */
        checked?: () => boolean;
        onChange: (checked: boolean) => void;
    }

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';
    const dataTotalSize = 46;
    const wrapStyle = 'margin-bottom: 15px; display: flex; justify-content: space-around; flex-wrap: wrap';
    const switchStyle = 'display: inline-flex; align-items: center; margin: 5px';

    const initialColumns: ColumnProps[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
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
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
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
            result = result.toSorted(sorter);
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

    let loading = $state(true);
    let columns = $state.raw(initialColumns);
    let scroll = $state.raw<TableScroll>({});
    let rowSelection = $state.raw<RowSelectionProps | undefined>();
    let expandable = $state(false);
    let expandCellFixed = $state(false);
    let showTitle = $state(false);
    let showFooter = $state(false);
    let expandedRowKeys = $state<(string | number)[]>([]);
    let showHeader = $state(true);
    let bordered = $state(false);
    let resizable = $state(false);
    let pagination = $state.raw<PageState | false>(defaultPagination);
    let dataSource = $state.raw<Row[]>([]);

    const load = (currentPagination: PageState, currentPage?: number, sorter?: ColumnProps, filters?: ColumnProps[]) => {
        fetchData(currentPagination, currentPage, sorter, filters)
            .then((result) => {
                let nextColumns = mergeColumns(result.sorter, columns);
                for (const filterObj of result.filters) {
                    nextColumns = mergeColumns(filterObj, nextColumns);
                }
                columns = nextColumns;
                loading = false;
                pagination = result.pagination;
                dataSource = result.dataSource;
            })
            .catch((err) => {
                console.error(err);
                loading = false;
            });
    };

    const setPage = (page?: number | null, sorter?: ColumnProps | null, filters?: ColumnProps[]) => {
        if (loading) {
            return;
        }
        const currentPage = typeof page === 'number' ? page : (pagination && pagination.currentPage) || 1;
        loading = true;
        load(pagination || defaultPagination, currentPage, sorter || getSorterColumn(columns), filters || getFilterColumns(columns));
    };

    onMount(() => {
        load(defaultPagination, 1, getSorterColumn(initialColumns), []);
    });

    const tablePagination = $derived(pagination && { ...pagination, onPageChange: setPage });

    const toggleFixHeader = (checked: boolean) => {
        scroll = { ...scroll, y: checked ? 300 : undefined };
    };

    const toggleFixColumns = (checked: boolean) => {
        const lastIndex = columns.length - 1;
        if (checked) {
            columns = columns.map((column, index) => {
                if (index === 0) {
                    return { ...column, fixed: true };
                }
                return index === lastIndex ? { ...column, fixed: 'right' } : column;
            });
        } else {
            columns = columns.map((column) => ({ ...column, fixed: false }));
        }
        if (rowSelection) {
            rowSelection = { ...rowSelection, fixed: checked };
        }
        scroll = { ...scroll, x: checked ? '150%' : undefined };
        expandCellFixed = checked;
    };

    const toggleRowSelection = (checked: boolean) => {
        rowSelection = checked
            ? {
                  width: 48,
                  fixed: true,
                  onChange: (selectedRowKeys, selectedRows) => console.log('Selection changed, selectedRowKeys: ', selectedRowKeys, 'selectedRows: ', selectedRows),
              }
            : undefined;
    };

    const toggleShowSorter = (checked: boolean) => {
        columns = columns.map((column) => ({
            ...column,
            sorter: checked ? initialColumns.find((item) => item.dataIndex === column.dataIndex)?.sorter : undefined,
        }));
    };

    const toggleShowFilter = (checked: boolean) => {
        if (checked) {
            columns = columns.map((column) =>
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
            );
        } else {
            columns = columns.map((column) => ({ ...column, filters: undefined, filteredValue: undefined }));
            setPage(null, null, []);
        }
    };

    const onChange = (data: TableChangeInfo) => {
        console.log('Table changed: ', data);
        const { pagination: pageInfo, sorter, filters } = data;
        setPage(pageInfo?.currentPage, sorter, filters);
    };

    const toggleExpandedRowKeys = (checked: boolean) => {
        if (checked) {
            expandedRowKeys = dataSource.filter((data) => data.key).map((data) => data.key);
            expandable = true;
        } else {
            expandedRowKeys = [];
        }
    };

    const toggleResizable = (checked: boolean) => {
        resizable = checked;
        bordered = checked;
    };

    const toggleDataSource = (checked: boolean) => {
        if (checked) {
            dataSource = [];
        } else {
            setPage();
        }
    };

    const switchPagination = (position: TablePaginationPosition | false) => {
        pagination = position ? { ...defaultPagination, ...pagination, position } : false;
    };

    const switches: SwitchItem[] = [
        { text: '固定表头：', checked: () => !!scroll.y, onChange: toggleFixHeader },
        {
            text: '隐藏表头：',
            onChange: (checked) => {
                showHeader = !checked;
            },
        },
        {
            text: '显示标题：',
            onChange: (checked) => {
                showTitle = checked;
            },
        },
        {
            text: '显示底部：',
            onChange: (checked) => {
                showFooter = checked;
            },
        },
        { text: '固定列：', onChange: toggleFixColumns },
        { text: '显示选择列：', onChange: toggleRowSelection },
        {
            text: '显示加载状态：',
            checked: () => loading,
            onChange: (checked) => {
                loading = checked;
            },
        },
        { text: '无数据：', checked: () => !dataSource.length, onChange: toggleDataSource },
        {
            text: '开启排序功能：',
            checked: () => columns.some((column) => column.sorter),
            onChange: toggleShowSorter,
        },
        {
            text: '开启过滤功能：',
            checked: () => columns.some((column) => column.filters),
            onChange: toggleShowFilter,
        },
        {
            text: '开启行展开功能：',
            checked: () => expandable,
            onChange: (checked) => {
                expandable = checked;
            },
        },
        { text: '展开当前所有行：', onChange: toggleExpandedRowKeys },
        {
            text: '显示边框：',
            checked: () => bordered,
            onChange: (checked) => {
                bordered = checked;
            },
        },
        { text: '开启列伸缩功能：', onChange: toggleResizable },
    ];
</script>

{#snippet expandedRow({ record }: { record: Record<string, any> })}
    <p>{record.description}</p>
{/snippet}

{#snippet footer()}
    <p style="margin: 0">This is footer.</p>
{/snippet}

<div>
    <div style={wrapStyle}>
        {#each switches as item (item.text)}
            <span style={switchStyle}>
                <span>{item.text}</span>
                <Switch aria-label={item.text} checked={item.checked?.()} onChange={item.onChange} size="small" />
            </span>
        {/each}
        <span style={switchStyle}>
            <span>分页控件：</span>
            <ButtonGroup>
                <Button onclick={() => switchPagination('bottom')}>Bottom</Button>
                <Button onclick={() => switchPagination('top')}>Top</Button>
                <Button onclick={() => switchPagination('both')}>Both</Button>
                <Button onclick={() => switchPagination(false)}>None</Button>
            </ButtonGroup>
        </span>
    </div>
    <Table
        bind:expandedRowKeys
        {bordered}
        {columns}
        {dataSource}
        {expandCellFixed}
        expandedRow={expandable ? expandedRow : undefined}
        footer={showFooter ? footer : undefined}
        {loading}
        {onChange}
        pagination={tablePagination}
        {resizable}
        {rowSelection}
        {scroll}
        {showHeader}
        title={showTitle ? 'This is title.' : undefined}
    >
        {#snippet cell({ column, record, text })}
            {#if column.dataIndex === 'name'}
                <span>
                    <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-right: 12px" />
                    {text}
                </span>
            {:else if column.dataIndex === 'size'}
                {text} KB
            {:else if column.dataIndex === 'owner'}
                <div>
                    <Avatar color={record.avatarBg} size="small" style="margin-right: 4px">
                        {typeof text === 'string' && text.slice(0, 1)}
                    </Avatar>
                    {text}
                </div>
            {:else if column.dataIndex === 'updateTime'}
                {format(new Date(text), 'yyyy-MM-dd')}
            {:else}
                {text}
            {/if}
        {/snippet}
    </Table>
</div>
