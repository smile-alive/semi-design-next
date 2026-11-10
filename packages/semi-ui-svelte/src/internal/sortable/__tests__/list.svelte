<script lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-svelte/config-provider/config-provider.svelte';
    import { zh_CN, type Locale } from '@fibrae/semi-ui-svelte/locale';
    import { Sortable, SortableHandle, type SortEndPayload } from '..';

    let { items = ['a', 'b', 'c'], locale, onSortEnd }: { items?: (string | number)[]; locale?: Locale; onSortEnd?: (payload: SortEndPayload) => void } = $props();
</script>

{#snippet list()}
    <Sortable aria-label="list" class="list" dragHandleLabel={zh_CN.Transfer.dragSort} dragOverlayClass="overlay" {items} {onSortEnd} role="list" style="overflow: auto" tabindex={0}>
        {#snippet item({ id, index })}
            <div data-index={index} style="height: 30px">
                <SortableHandle><span style="display: inline-block; height: 20px">drag</span></SortableHandle>
                <span>{id}</span>
            </div>
        {/snippet}
    </Sortable>
{/snippet}

{#if locale}
    <ConfigProvider {locale}>{@render list()}</ConfigProvider>
{:else}
    {@render list()}
{/if}
