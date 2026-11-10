<script lang="ts">
    import { IconClear, IconComment, IconMore, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import { Avatar, Table, Tag, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-svelte';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        status: 'success' | 'pending' | 'wait';
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue';
    }

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const columns: ColumnProps[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
        },
        {
            title: '大小',
            dataIndex: 'size',
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
        },
        {
            title: '',
            dataIndex: 'operate',
        },
    ];

    const data: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            status: 'success',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            status: 'pending',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'wait',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '4',
            name: 'Semi 设计稿.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            status: 'wait',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '5',
            name: 'Semi 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            status: 'pending',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '6',
            name: 'Semi 设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'success',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
    ];

    const rowSelection: RowSelectionProps = {
        getCheckboxProps: (record) => ({
            disabled: record.name === '设计文档', // 这一行不可勾选
            name: record.name,
        }),
        onSelect: (record, selected) => {
            console.log(`select row: ${selected}`, record);
        },
        onSelectAll: (selected, selectedRows) => {
            console.log(`select all rows: ${selected}`, selectedRows);
        },
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const pagination = { pageSize: 3 };
</script>

<Table {columns} dataSource={data} {pagination} {rowSelection}>
    {#snippet cell(cellProps)}
        {#if cellProps.column.dataIndex === 'name'}
            <div>
                <Avatar alt="" shape="square" size="small" src={cellProps.record.nameIconSrc} style="margin-inline-end: 12px" />
                {cellProps.text}
            </div>
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
        {:else if cellProps.column.dataIndex === 'operate'}
            <IconMore />
        {:else}
            {cellProps.text}
        {/if}
    {/snippet}
</Table>
