<script lang="ts">
    import { format } from 'date-fns';
    import { IconClear, IconComment, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import { Avatar, Input, Space, Table, Tag, type ColumnProps } from '@fibrae/semi-ui-svelte';

    const DAY = 24 * 60 * 60 * 1000;
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

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 46; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 首页${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                status: isSemiDesign ? 'success' : 'wait',
                updateTime: new Date('2024-01-25').valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData();
    let filteredValue = $state<string[]>([]);

    // composition makes the Input report the value once an IME composition ends
    const handleChange = (value: string) => {
        filteredValue = value ? [value] : [];
    };

    const columns = $derived<ColumnProps[]>([
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            onFilter: (value, record) => record.name.includes(value),
            filteredValue,
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
    ]);
</script>

<Table {columns} {dataSource}>
    {#snippet headerCell({ column, title })}
        {#if column.dataIndex === 'name'}
            <Space>
                <span>{title}</span>
                <Input composition onChange={handleChange} placeholder="请输入筛选值" showClear style="width: 200px" />
            </Space>
        {:else}
            {title}
        {/if}
    {/snippet}
    {#snippet cell({ column, record, text })}
        {#if column.dataIndex === 'name'}
            <div>
                <Avatar alt="" shape="square" size="small" src={figmaIconUrl} style="margin-right: 12px" />
                {text}
            </div>
        {:else if column.dataIndex === 'size'}
            {text} KB
        {:else if column.dataIndex === 'status'}
            {@const config = tagConfig[text as Row['status']]}
            <Tag color={config.color} shape="circle" style="user-select: text">
                {#snippet prefixIcon()}
                    <config.icon />
                {/snippet}
                {config.text}
            </Tag>
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
