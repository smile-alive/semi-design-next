<script lang="ts">
    import type { UserGuideStepItem } from '../interface';
    import UserGuide from '../user-guide.svelte';

    let {
        mode,
        store,
    }: {
        mode: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        store: { visible: boolean; current?: number; accept: boolean; log: string[]; steps: UserGuideStepItem[] };
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <UserGuide bind:current={store.current} bind:visible={store.visible} onChange={(value) => log(`change ${value}`)} steps={store.steps} />
{:else if mode === 'function'}
    <UserGuide
        bind:current={
            () => store.current,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.current = value;
            }
        }
        bind:visible={store.visible}
        onChange={(value) => log(`change ${value}`)}
        steps={store.steps}
    />
{:else if mode === 'one-way'}
    <UserGuide bind:visible={store.visible} current={store.current} onChange={(value) => log(`change ${value}`)} steps={store.steps} />
{:else}
    <UserGuide bind:visible={store.visible} onChange={(value) => log(`change ${value}`)} steps={store.steps} />
{/if}
