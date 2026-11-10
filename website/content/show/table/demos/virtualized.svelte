<script lang="ts">
    import * as dateFns from 'date-fns';
    import { Avatar, Button, Table, type ColumnProps, type TableHandle } from '@fibrae/semi-ui-svelte';

    const DAY = 24 * 60 * 60 * 1000;

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
            title: '标题',
            dataIndex: 'name',
            width: 200,
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
            width: 150,
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            fixed: 'right',
            width: 150,
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 1000; i++) {
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

    const data = getData();
    const scroll = { y: 400, x: 900 };
    const style = 'width: 750px; margin: 0 auto';
    let table = $state<TableHandle>();
</script>

<Button onclick={() => table?.scrollToItem(100)}>Scroll to 100</Button>
<Table bind:this={table} {columns} dataSource={data} pagination={false} {scroll} {style} virtualized>
    {#snippet cell(cellProps)}
        {#if cellProps.column.dataIndex === 'size'}
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
        {:else}
            {cellProps.text}
        {/if}
    {/snippet}
</Table>
