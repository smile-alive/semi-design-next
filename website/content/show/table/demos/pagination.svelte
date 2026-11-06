<script lang="ts">
    import * as dateFns from 'date-fns';
    import { IconClear, IconComment, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import { Avatar, Table, Tag, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-svelte';

    const figmaIconUrl = '/assets/placeholder/app.svg';

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        status: 'success' | 'wait';
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

    const columns: ColumnProps[] = [
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
            title: '交付状态',
            dataIndex: 'status',
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

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const DAY = 24 * 60 * 60 * 1000;
    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 46; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                status: isSemiDesign ? 'success' : 'wait',
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData();

    const rowSelection: RowSelectionProps = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
        getCheckboxProps: (record) => ({
            disabled: record.name === 'Semi Design 设计稿0.fig', // 这一行不可勾选
            name: record.name,
        }),
    };

    const scroll = { y: 300 };
</script>

<Table {columns} {dataSource} {rowSelection} {scroll}>
    {#snippet cell(cellProps)}
        {#if cellProps.column.dataIndex === 'name'}
            <div>
                <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-inline-end: 12px" />
                {cellProps.text}
            </div>
        {:else if cellProps.column.dataIndex === 'size'}
            {cellProps.text} KB
        {:else if cellProps.column.dataIndex === 'status'}
            {@const config = tagConfig[cellProps.text as Row['status']]}
            <Tag color={config.color} shape="circle" style="user-select: text">
                {#snippet prefixIcon()}
                    <config.icon />
                {/snippet}
                {config.text}
            </Tag>
        {:else if cellProps.column.dataIndex === 'owner'}
            <div>
                <Avatar color={cellProps.record.avatarBg} size="small" style="margin-inline-end: 4px">
                    {typeof cellProps.text === 'string' && cellProps.text.slice(0, 1)}
                </Avatar>
                {cellProps.text}
            </div>
        {:else if cellProps.column.dataIndex === 'updateTime'}
            {dateFns.format(new Date(cellProps.text), 'yyyy-MM-dd')}
        {:else}
            {cellProps.text}
        {/if}
    {/snippet}
</Table>
