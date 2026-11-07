<script lang="ts">
    import SideSheet from '../side-sheet.svelte';

    let {
        mode,
        store,
    }: {
        mode: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        store: { value?: boolean; accept: boolean; log: string[] };
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <SideSheet bind:visible={store.value} closeOnEsc motion={false} onCancel={() => log('cancel')} title="Sheet" />
{:else if mode === 'function'}
    <SideSheet
        bind:visible={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        closeOnEsc
        motion={false}
        onCancel={() => log('cancel')}
        title="Sheet"
    />
{:else if mode === 'one-way'}
    <SideSheet closeOnEsc motion={false} onCancel={() => log('cancel')} title="Sheet" visible={store.value} />
{:else}
    <SideSheet closeOnEsc motion={false} onCancel={() => log('cancel')} title="Sheet" />
{/if}
