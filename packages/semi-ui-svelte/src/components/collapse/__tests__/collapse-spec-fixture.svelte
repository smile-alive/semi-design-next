<script lang="ts">
    import type { CollapseSpecProps } from '@test/specs/collapse';
    import Collapse from '../collapse.svelte';
    import CollapsePanel from '../panel.svelte';

    let { store }: { store: CollapseSpecProps } = $props();

    // Svelte has no `defaultActiveKey`: the spec's default is the binding's initial value and its controlled value goes
    // through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<string | string[] | undefined>(store.defaultActiveKey);
</script>

<Collapse
    accordion={store.accordion}
    bind:activeKey={
        () => (store.activeKey === undefined ? chosen : store.activeKey),
        (key) => {
            chosen = key ?? undefined;
        }
    }
    clickHeaderToExpand={store.clickHeaderToExpand}
    expandIconPosition={store.expandIconPosition}
    keepDOM={store.keepDOM}
    lazyRender={store.lazyRender}
    motion={store.motion}
    onChange={store.onChange}
>
    {#each store.panels as { itemKey, header, content, extra, disabled, showArrow } (itemKey)}
        {#snippet headerText()}{header}{/snippet}
        {#snippet extraText()}{extra}{/snippet}
        {#snippet body()}{content}{/snippet}
        <CollapsePanel children={content === undefined ? undefined : body} {disabled} extra={extra === undefined ? undefined : extraText} header={headerText} {itemKey} {showArrow} />
    {/each}
</Collapse>
