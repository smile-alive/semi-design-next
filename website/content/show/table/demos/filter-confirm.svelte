<script lang="ts">
    import { format } from 'date-fns';
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
            title: '标题',
            dataIndex: 'name',
            width: 300,
            filters: [
                {
                    text: 'Semi Design 设计稿',
                    value: 'Semi Design',
                },
                {
                    text: 'Semi Pro 设计稿',
                    value: 'Semi Pro',
                },
            ],
            onFilter: (value, record) => record.name.includes(value),
            filterMultiple: true,
            filterConfirmMode: 'confirm',
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            filters: [
                {
                    text: '姜鹏志',
                    value: '姜鹏志',
                },
                {
                    text: '郝宣',
                    value: '郝宣',
                },
            ],
            onFilter: (value, record) => record.owner.includes(value),
            filterMultiple: true,
            filterConfirmMode: 'confirm',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 20; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi Pro 首页${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date('2024-01-25').valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData();
</script>

<Table {columns} {dataSource}>
    {#snippet cell({ column, text, record })}
        {#if column.dataIndex === 'name'}
            <div>
                <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-right: 12px" />
                {text}
            </div>
        {:else if column.dataIndex === 'size'}
            {text} KB
        {:else if column.dataIndex === 'owner'}
            <div>
                <Avatar color={record.avatarBg} size="small" style="margin-right: 4px">
                    {text.slice(0, 1)}
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
