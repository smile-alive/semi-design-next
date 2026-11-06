<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { AutoComplete } from '@fibrae/semi-ui-svelte';

    const domains = ['gmail.com', '163.com', 'qq.com'];

    let stringData = $state<string[]>([]);
    let value = $state<string | number>('');

    const handleStringSearch = (input: string) => {
        stringData = input ? domains.map((domain) => `${input}@${domain}`) : [];
    };
</script>

<AutoComplete bind:value data={stringData} onChange={(next) => console.log('onChange', next)} onSearch={handleStringSearch} placeholder="搜索... " showClear style="width: 200px">
    {#snippet prefix()}
        <IconSearch />
    {/snippet}
</AutoComplete>
