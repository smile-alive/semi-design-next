<script lang="ts">
    import { format } from 'date-fns';
    import { Avatar, Table, type ColumnProps, type TableChangeInfo, type TableProps } from '@fibrae/semi-ui-svelte';

    const figmaIconUrl = '/assets/placeholder/app.svg';

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

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
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const pageSize = 10;
    let dataSource = $state.raw(getData());
    let pageNum = $state(1);
    const pageData = $derived(dataSource.slice((pageNum - 1) * pageSize, pageNum * pageSize));

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
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    // HTML5 drag and drop through the onRow attributes: Table takes only a tag name for its rows, so a sortable library
    // cannot wrap each row in a component of its own. Known limit: pointer only; use a sortable library with keyboard
    // support when rows must be sortable from the keyboard.
    let draggingKey = $state<string | null>(null);

    const moveTo = (targetKey: string) => {
        const from = dataSource.findIndex((row) => row.key === draggingKey);
        const to = dataSource.findIndex((row) => row.key === targetKey);
        if (from < 0 || to < 0 || from === to) {
            return;
        }
        const next = [...dataSource];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        dataSource = next;
    };

    const onRow: TableProps['onRow'] = (record) => ({
        draggable: true,
        style: `cursor: grab; opacity: ${draggingKey === record.key ? 0.5 : 1}`,
        ondragstart: () => (draggingKey = record.key),
        ondragenter: (event) => {
            event.preventDefault();
            moveTo(record.key);
        },
        ondragover: (event) => event.preventDefault(),
        ondragend: () => (draggingKey = null),
    });

    const handleChange = ({ pagination }: TableChangeInfo) => {
        if (pagination?.currentPage) {
            pageNum = pagination.currentPage;
        }
    };
</script>

<Table {columns} dataSource={pageData} onChange={handleChange} {onRow} pagination={{ currentPage: pageNum, pageSize, total: dataSource.length }} rowKey="key">
    {#snippet cell({ column, record, text })}
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
