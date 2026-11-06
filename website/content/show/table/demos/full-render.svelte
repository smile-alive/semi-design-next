<script lang="ts">
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-svelte';

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
            title: 'Name',
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
            useFullRender: true,
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

    const getData = (total: number) => {
        const data: Row[] = [];
        for (let i = 0; i < total; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData(46);
    const pagination = { pageSize: 12 };
    const rowSelection: RowSelectionProps = {
        hidden: true,
        fixed: 'left',
    };
    const onChange = (changeInfo: unknown) => console.log(changeInfo);
</script>

<Table {columns} {dataSource} {onChange} {pagination} {rowSelection}>
    {#snippet headerCell(headerProps)}
        {#if headerProps.column.dataIndex === 'name'}
            <span style="display: inline-flex; align-items: center; padding-inline-start: 20px">
                {@render headerProps.selection?.()}
                <span style="margin-inline-start: 8px">{headerProps.title}</span>
                {@render headerProps.sorter?.()}
                {@render headerProps.filter?.()}
            </span>
        {:else}
            {headerProps.title}
        {/if}
    {/snippet}
    {#snippet cell(cellProps)}
        {#if cellProps.column.dataIndex === 'name'}
            <span style="display: inline-flex; align-items: center; justify-content: center">
                {@render cellProps.indentText?.()}
                {@render cellProps.expandIcon?.()}
                {@render cellProps.selection?.()}
                <span style="margin-inline-start: 8px">
                    <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-inline-end: 12px" />
                    {cellProps.text}
                </span>
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
        {:else}
            {cellProps.text}
        {/if}
    {/snippet}
    {#snippet expandedRow(expandedProps)}
        <article>{expandedProps.record.name}</article>
    {/snippet}
</Table>
