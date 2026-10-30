<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { AutoComplete, Avatar } from '@fibrae/semi-ui-svelte';

    interface ListItem {
        name: string;
        email: string;
        abbr: string;
        color: 'amber' | 'indigo' | 'blue' | 'cyan';
        value?: string;
        label?: string;
    }

    const list: ListItem[] = [
        { name: '夏可漫', email: 'xiakeman@example.com', abbr: 'XK', color: 'amber' },
        { name: '申悦', email: 'shenyue@example.com', abbr: 'SY', color: 'indigo' },
        { name: '曲晨一', email: 'quchenyi@example.com', abbr: 'CY', color: 'blue' },
        { name: '文嘉茂', email: 'wenjiamao@example.com', abbr: 'JM', color: 'cyan' },
    ];

    let data = $state<ListItem[]>([]);

    const handleStringSearch = (value: string) => {
        data = value ? list.map((item) => ({ ...item, value: item.name, label: item.email })) : [];
    };

    const renderSelectedItem = (option: ListItem) => option.email;
</script>

<AutoComplete aria-label="搜索邮箱" {data} onSearch={handleStringSearch} {renderSelectedItem} showClear style="width: 280px">
    {#snippet prefix()}
        <IconSearch />
    {/snippet}
    {#snippet item({ item })}
        <Avatar color={item.color} size="small">{item.abbr}</Avatar>
        <div style="margin-left: 4px">
            <div style="font-size: 14px; margin-left: 4px">{item.name}</div>
            <div style="margin-left: 4px">{item.email}</div>
        </div>
    {/snippet}
</AutoComplete>
