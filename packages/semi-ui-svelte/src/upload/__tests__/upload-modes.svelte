<script lang="ts">
    import type { FileItem } from '../interface';
    import Upload from '../upload.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    let {
        mode,
        store,
        action,
    }: {
        mode: Mode;
        store: { list?: FileItem[]; accept: boolean; log: string[]; progress: number[] };
        action: string;
    } = $props();

    const events = {
        onChange: ({ fileList }: { fileList: FileItem[] }) => store.log.push(`change ${fileList.map((item) => item.name).join(',')}`),
        onProgress: (percent: number) => store.progress.push(percent),
    };
</script>

{#if mode === 'bind'}
    <Upload {action} bind:fileList={store.list} {...events} />
{:else if mode === 'function'}
    <Upload
        {action}
        bind:fileList={
            () => store.list,
            (value) => {
                store.log.push(`set ${value?.map((item) => item.name).join(',')}`);
                if (store.accept) store.list = value;
            }
        }
        {...events}
    />
{:else if mode === 'one-way'}
    <Upload {action} fileList={store.list} {...events} />
{:else}
    <Upload {action} {...events} />
{/if}
