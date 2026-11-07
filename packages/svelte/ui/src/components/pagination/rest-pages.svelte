<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/pagination/constants';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import VirtualList from '../../internal/virtual-list.svelte';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';

    // The pages behind an ellipsis can number in the millions, so the list is virtualized. Rows are focusable buttons:
    // ArrowDown on the popover trigger moves focus into them, and the scroll container must not stop Tab.
    let { start, count, onSelect }: { start: number; count: number; onSelect: (page: number) => void } = $props();

    const config = getConfigContext();
    const locale = useLocale('Pagination');

    const prefix = cssClasses.PREFIX;

    // Equals $height-pagination_item in pagination.scss
    const itemHeight = 32;

    const pageLabel = (page: number) => formatLocale(locale().locale.pageN, { page });
</script>

<VirtualList class={`${prefix}-rest-list`} height={itemHeight * Math.min(count, 5)} itemCount={count} itemSize={itemHeight} style="direction: {config.direction ?? 'ltr'}" width={78}>
    {#snippet children({ index, style })}
        <button aria-label={pageLabel(start + index)} class={`${prefix}-rest-item`} {style} type="button" onclick={() => onSelect(start + index)}>
            {start + index}
        </button>
    {/snippet}
</VirtualList>
