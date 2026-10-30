<script lang="ts">
    import { IllustrationNoContent } from '@fibrae/semi-illustrations-svelte';
    import { AutoComplete, Empty } from '@fibrae/semi-ui-svelte';

    let data = $state<number[]>([]);
    let loading = $state(false);

    const fetchData = (input: string) => {
        loading = true;
        setTimeout(() => {
            data = input ? Array.from({ length: 5 }, () => Math.random()) : [];
            loading = false;
        }, 1000);
    };
</script>

<AutoComplete aria-label="搜索" {data} {loading} onSearch={fetchData}>
    {#snippet emptyContent()}
        <Empty style="padding: 12px; width: 300px">
            {#snippet image()}
                <IllustrationNoContent style="width: 150px; height: 150px" />
            {/snippet}
            {#snippet description()}暂无内容{/snippet}
        </Empty>
    {/snippet}
</AutoComplete>
