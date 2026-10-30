<script lang="ts">
    import { IconMore } from '@fibrae/semi-icons-svelte';
    import { Avatar, Table, type ColumnProps, type TableProps } from '@fibrae/semi-ui-svelte';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue';
    }

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
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '4',
            name: 'Semi D2C 设计稿.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '5',
            name: 'Semi D2C 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '6',
            name: 'Semi D2C 设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
    ];

    const handleRow: TableProps['onRow'] = (_record, index) => (index % 2 === 0 ? { style: 'background: var(--semi-color-fill-0)' } : {});
</script>

<Table {columns} dataSource={data} onRow={handleRow} pagination={false}>
    {#snippet cell({ column, text, record })}
        {#if column.dataIndex === 'name'}
            <div>
                <Avatar alt="" shape="square" size="small" src={record.nameIconSrc} style="margin-right: 12px" />
                {text}
            </div>
        {:else if column.dataIndex === 'owner'}
            <div>
                <Avatar color={record.avatarBg} size="small" style="margin-right: 4px">
                    {typeof text === 'string' ? text.slice(0, 1) : ''}
                </Avatar>
                {text}
            </div>
        {:else if column.dataIndex === 'operate'}
            <IconMore />
        {:else}
            {text}
        {/if}
    {/snippet}
</Table>
