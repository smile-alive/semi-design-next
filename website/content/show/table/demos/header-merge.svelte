<script lang="ts">
    import * as dateFns from 'date-fns';
    import { IconMore } from '@fibrae/semi-icons-svelte';
    import { Avatar, Table, type ColumnProps } from '@fibrae/semi-ui-svelte';

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

    const columns: ColumnProps[] = [
        {
            title: '基本信息',
            fixed: 'left',
            children: [
                {
                    title: '标题',
                    dataIndex: 'name',
                    width: 300,
                    fixed: true,
                    filters: [
                        {
                            text: 'Semi Design 设计稿',
                            value: 'Semi Design 设计稿',
                        },
                        {
                            text: 'Semi 设计稿',
                            value: 'Semi 设计稿',
                        },
                    ],
                    onFilter: (value, record) => record.name.includes(value),
                },
                {
                    title: '大小',
                    dataIndex: 'size',
                    width: 100,
                    fixed: true,
                    sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
                },
            ],
        },
        {
            title: '其他信息',
            children: [
                {
                    title: '所有者',
                    dataIndex: 'owner',
                },
                {
                    title: '更新日期',
                    dataIndex: 'updateTime',
                    sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
                },
            ],
        },
        {
            title: '更多',
            fixed: 'right',
            width: 100,
            align: 'center',
            dataIndex: 'operate',
        },
    ];

    const getData = (total: number) => {
        const data: Row[] = [];
        for (let i = 0; i < total; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const data = getData(46);
    const rowSelection = { fixed: true };
    const scroll = { x: 1000, y: 400 };
    const onChange = (changeInfo: unknown) => console.log(changeInfo);
</script>

<Table {columns} dataSource={data} {onChange} {rowSelection} {scroll}>
    {#snippet cell(cellProps)}
        {#if cellProps.column.dataIndex === 'name'}
            <span>
                <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-inline-end: 12px" />
                {cellProps.text}
            </span>
        {:else if cellProps.column.dataIndex === 'size'}
            {cellProps.text} KB
        {:else if cellProps.column.dataIndex === 'owner'}
            <div>
                <Avatar color={cellProps.record.avatarBg} size="small" style="margin-inline-end: 4px">
                    {typeof cellProps.text === 'string' && cellProps.text.slice(0, 1)}
                </Avatar>
                {cellProps.text}
            </div>
        {:else if cellProps.column.dataIndex === 'updateTime'}
            {dateFns.format(new Date(cellProps.text), 'yyyy-MM-dd')}
        {:else if cellProps.column.dataIndex === 'operate'}
            <IconMore />
        {:else}
            {cellProps.text}
        {/if}
    {/snippet}
    {#snippet expandedRow(expandedProps)}
        <article>{expandedProps.record.name}</article>
    {/snippet}
</Table>
