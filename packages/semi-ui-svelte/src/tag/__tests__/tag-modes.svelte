<script lang="ts">
    import Tag from '../tag.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { visible?: boolean; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Tag bind:visible={store.visible} closable onClose={() => log('close')}>semi</Tag>
{:else if mode === 'function'}
    <Tag
        bind:visible={
            () => store.visible,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.visible = value;
            }
        }
        closable
        onClose={() => log('close')}
    >
        semi
    </Tag>
{:else if mode === 'one-way'}
    <Tag closable onClose={() => log('close')} visible={store.visible}>semi</Tag>
{:else}
    <Tag closable onClose={() => log('close')}>semi</Tag>
{/if}
