<script lang="ts">
    import { tick } from 'svelte';
    import { format } from 'date-fns';
    import { Avatar, Button, Input, Space, Table, type ColumnProps } from '@fibrae/semi-ui-svelte';

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
    let nameInput = $state<Input>();

    const columns: ColumnProps[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            onFilter: (value, record) => record.name.includes(value),
            filterDropdown: true,
            onFilterDropdownVisibleChange: () => {
                // the panel is rendered after the visibility changes
                void tick().then(() => nameInput?.focus());
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            onFilter: (value, record) => record.owner.includes(value),
            defaultFilteredValue: ['姜鹏志'],
            filterDropdown: true,
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];
</script>

<Table {columns} {dataSource}>
    {#snippet filterDropdown({ column, tempFilteredValue, onTempFilteredValueChange, onConfirm, onClear, onClose })}
        {#if column.dataIndex === 'name'}
            <Space align="start" style="padding: 8px" vertical>
                <Input bind:this={nameInput} onChange={(value) => onTempFilteredValueChange(value ? [value] : [])} value={tempFilteredValue?.[0]} />
                <Space>
                    <Button onclick={() => onConfirm({ closeDropdown: true })}>筛选 + 关闭</Button>
                    <Button onclick={() => onClear({ closeDropdown: true })}>清除 + 关闭</Button>
                    <Button onclick={() => onClose()}>直接关闭</Button>
                </Space>
            </Space>
        {:else}
            <Space align="start" style="padding: 8px" vertical>
                <Input onChange={(value) => onTempFilteredValueChange(value ? [value] : [])} value={tempFilteredValue?.[0]} />
                <Space>
                    <Button onclick={() => onConfirm({ closeDropdown: false })}>筛选后不关闭</Button>
                    <Button onclick={() => onClear({ closeDropdown: false })}>清除后不关闭</Button>
                    <Button onclick={() => onClose()}>直接关闭</Button>
                </Space>
            </Space>
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
