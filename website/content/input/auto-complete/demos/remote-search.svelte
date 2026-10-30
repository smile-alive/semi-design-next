<script lang="ts">
    import { debounce } from 'es-toolkit';
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { IconButton, IconForm, IconInput, IconSelect, IconTable } from '@fibrae/semi-icons-svelte/lab';
    import { AutoComplete, type AutoCompleteDataItem } from '@fibrae/semi-ui-svelte';

    interface ListItem {
        value: 'select' | 'input' | 'form' | 'button' | 'table';
        label: string;
    }

    const icons = {
        select: IconSelect,
        input: IconInput,
        form: IconForm,
        button: IconButton,
        table: IconTable,
    };

    const initList: ListItem[] = [
        { value: 'select', label: '选择器' },
        { value: 'input', label: '输入框' },
        { value: 'form', label: '表单' },
        { value: 'button', label: '按钮' },
        { value: 'table', label: '表格' },
    ];

    let loading = $state(false);
    let list = $state(initList);
    let selected = $state('');

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
        selected = String(value);
    };

    // Unlike Select, this can return only a string, not a node
    const renderSelectedItem = (item: ListItem) => item.value;
</script>

<AutoComplete aria-label="搜索" data={list} {loading} onSearch={search} onSelect={handleSelect} {renderSelectedItem} style="width: 250px">
    {#snippet prefix()}
        <IconSearch />
    {/snippet}
    {#snippet item({ item })}
        {@const Icon = icons[item.value]}
        <div style="display: flex; align-items: center">
            <div style="font-size: 32px">
                <Icon />
            </div>
            <div style="margin-left: 12px">
                <p>{item.value}</p>
                <p>{item.label}</p>
            </div>
        </div>
    {/snippet}
</AutoComplete>
<p>已选择：{selected}</p>
