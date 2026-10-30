<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { AutoComplete } from '@fibrae/semi-ui-svelte';

    let stringData = $state<string[]>([]);
    let value = $state<string | number>('');

    const handleStringSearch = (input: string) => {
        stringData = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
    };
</script>

<AutoComplete bind:value data={stringData} onSearch={handleStringSearch} placeholder="搜索... " showClear style="width: 200px">
    {#snippet prefix()}
        <IconSearch />
    {/snippet}
</AutoComplete>
<p>当前输入：{value}</p>
