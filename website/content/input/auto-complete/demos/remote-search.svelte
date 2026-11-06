<script lang="ts">
    import { debounce } from 'es-toolkit';
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { IconButton, IconForm, IconInput, IconSelect, IconTable } from '@fibrae/semi-icons-svelte/lab';
    import { AutoComplete, type AutoCompleteDataItem } from '@fibrae/semi-ui-svelte';

    const initList = [
        { value: 'select', label: '选择器', icon: IconSelect },
        { value: 'input', label: '输入框', icon: IconInput },
        { value: 'form', label: '表单', icon: IconForm },
        { value: 'button', label: '按钮', icon: IconButton },
        { value: 'table', label: '表格', icon: IconTable },
    ];

    type ListItem = (typeof initList)[number];

    let loading = $state(false);
    let list = $state.raw<ListItem[]>(initList);

    const handleSearch = (inputValue: string) => {
        loading = true;
        const newList = inputValue ? initList.filter((item) => item.value.includes(inputValue)) : initList;
        setTimeout(() => {
            list = newList;
            loading = false;
        }, 1000);
    };

    const search = debounce(handleSearch, 200);

    const handleSelect = (value: string | number | AutoCompleteDataItem) => {
        console.log(value);
    };

    // Unlike Select, this can return only a string, not a node
    const renderSelectedItem = (item: ListItem) => item.value;
</script>

<AutoComplete aria-label="搜索" data={list} {loading} onSearch={search} onSelect={handleSelect} {renderSelectedItem} style="width: 250px">
    {#snippet prefix()}
        <IconSearch />
    {/snippet}
    {#snippet item(entry)}
        {@const Icon = entry.item.icon}
        <div style="display: flex; align-items: center">
            <div style="font-size: 32px">
                <Icon />
            </div>
            <div style="margin-inline-start: 12px">
                <p>{entry.item.value}</p>
                <p>{entry.item.label}</p>
            </div>
        </div>
    {/snippet}
</AutoComplete>
