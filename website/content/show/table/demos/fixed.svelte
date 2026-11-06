<script lang="ts">
    import * as dateFns from 'date-fns';
    import { IconMore } from '@fibrae/semi-icons-svelte';
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
            title: '标题',
            dataIndex: 'name',
            fixed: true,
            width: 250,
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
            width: 200,
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            width: 200,
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            width: 200,
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
        {
            title: '',
            dataIndex: 'operate',
            fixed: 'right',
            align: 'center',
            width: 100,
        },
    ];

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
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData();
    const scroll = { y: 300, x: 1200 };

    const rowSelection: RowSelectionProps = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
        getCheckboxProps: (record) => ({
            disabled: record.name === 'Semi Design 设计稿0.fig', // 这一行不可勾选
            name: record.name,
        }),
        fixed: true,
    };
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
</Table>
