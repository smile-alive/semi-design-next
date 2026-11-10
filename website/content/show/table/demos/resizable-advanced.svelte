<script lang="ts">
    import * as dateFns from 'date-fns';
    import { addClass, removeClass } from '@fibrae/semi-foundation/utils';
    import { Avatar, Table, type ColumnProps, type TableResizableProps } from '@fibrae/semi-ui-svelte';

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';
    const pagination = { pageSize: 5 };

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
            width: 400,
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
            width: 200,
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            width: 200,
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const data: Row[] = [];
    for (let i = 0; i < 46; i++) {
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

    const resizable: TableResizableProps = {
        onResizeStart: (curColumn) => ({ class: addClass(curColumn.class, 'my-resizing') }),
        onResizeStop: (curColumn) => ({ class: removeClass(curColumn.class, 'my-resizing') }),
    };
</script>

<div id="components-table-demo-resizable-column">
    <Table bordered {columns} dataSource={data} {pagination} {resizable}>
        {#snippet cell(cellProps)}
            {#if cellProps.column.dataIndex === 'name'}
                <div>
                    <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-inline-end: 12px" />
                    {cellProps.text}
                </div>
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
            {:else}
                {cellProps.text}
            {/if}
        {/snippet}
    </Table>
</div>
