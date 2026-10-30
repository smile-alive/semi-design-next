<script lang="ts">
    import { debounce } from 'es-toolkit';
    import { Select, type SelectValue } from '@fibrae/semi-ui-svelte';

    interface Item {
        value: string;
        label: string;
        type: number;
    }

    const mockSearch = (inputValue: string): Item[] => {
        const length = Math.ceil(Math.random() * 100);
        return Array.from({ length }, (_v, i) => {
            return { value: inputValue + i, label: `相近业务 ${inputValue}${i}`, type: i + 1 };
        });
    };

    let loading = $state(false);
    let list = $state<Item[]>([
        { value: 'douyin', label: '抖音', type: 1 },
        { value: 'xingtu', label: '醒图', type: 2 },
        { value: 'jianying', label: '剪映', type: 3 },
        { value: 'toutiao', label: '今日头条', type: 4 },
    ]);
    let value = $state<SelectValue>([]);

    const handleSearch = debounce((inputValue: string) => {
        loading = true;
        if (inputValue) {
            const result = mockSearch(inputValue);
            setTimeout(() => {
                loading = false;
                list = result;
            }, 1000);
        } else {
            loading = false;
        }
    }, 1000);
</script>

<Select aria-label="远程搜索" bind:value emptyContent={null} filter {loading} multiple onChangeWithObject onSearch={handleSearch} optionList={list} remote style="width: 300px" />
