<script lang="ts">
    import Pagination from '../pagination.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    // `target` is the prop under test; the other one stays unbound
    let { target, mode, store }: { target: 'currentPage' | 'pageSize'; mode: Mode; store: { page?: number; size?: number; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
    const events = {
        onPageChange: (page: number) => log(`page ${page}`),
        onPageSizeChange: (size: number) => log(`size ${size}`),
        onChange: (page: number, size: number) => log(`change ${page}/${size}`),
    };
</script>

{#if target === 'currentPage'}
    {#if mode === 'bind'}
        <Pagination bind:currentPage={store.page} showSizeChanger total={200} {...events} />
    {:else if mode === 'function'}
        <Pagination
            bind:currentPage={
                () => store.page,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.page = value;
                }
            }
            showSizeChanger
            total={200}
            {...events}
        />
    {:else if mode === 'one-way'}
        <Pagination currentPage={store.page} showSizeChanger total={200} {...events} />
    {:else}
        <Pagination showSizeChanger total={200} {...events} />
    {/if}
{:else if mode === 'bind'}
    <Pagination bind:pageSize={store.size} currentPage={5} showSizeChanger total={200} {...events} />
{:else if mode === 'function'}
    <Pagination
        bind:pageSize={
            () => store.size,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.size = value;
            }
        }
        currentPage={5}
        showSizeChanger
        total={200}
        {...events}
    />
{:else if mode === 'one-way'}
    <Pagination currentPage={5} pageSize={store.size} showSizeChanger total={200} {...events} />
{:else}
    <Pagination currentPage={5} showSizeChanger total={200} {...events} />
{/if}
