<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/transfer/constants';
    import { IconClose, IconHandle } from '@fibrae/semi-icons-svelte';
    import { SortableHandle } from '../../internal/sortable/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TransferDataItem, TransferLabelSnippetProps, TransferProps, TransferSelectedItemSnippetProps } from './interface.js';

    let {
        classNames,
        styles,
        item,
        index,
        pathLabel,
        disabled = false,
        draggable,
        sortable,
        label,
        selectedItem,
        onRemove,
    }: {
        classNames?: TransferProps['classNames'];
        styles?: TransferProps['styles'];
        item: TransferDataItem;
        index: number;
        pathLabel?: string;
        disabled?: boolean;
        draggable: boolean;
        /** the sortable list has loaded, so the handle is a real drag handle */
        sortable: boolean;
        label?: Snippet<[TransferLabelSnippetProps]>;
        selectedItem?: Snippet<[TransferSelectedItemSnippetProps]>;
        onRemove: () => void;
    } = $props();

    const locale = useLocale('Transfer');

    const prefixCls = cssClasses.PREFIX;
</script>

{#snippet handle(grip: Snippet)}
    <SortableHandle>{@render grip()}</SortableHandle>
{/snippet}

{#if selectedItem}
    <div role="listitem">
        {@render selectedItem({ item, index, fullPath: item.fullPath, onRemove, handle: draggable ? handle : undefined })}
    </div>
{:else}
    <div class={[`${prefixCls}-item`, `${prefixCls}-right-item`, { [`${prefixCls}-right-item-draggable`]: draggable }, classNames?.item]} role="listitem" style={styles?.item}>
        {#if draggable}
            {#if sortable}
                <SortableHandle>
                    <IconHandle class={[`${prefixCls}-right-item-drag-handler`, classNames?.itemDragHandle]} style={styles?.itemDragHandle} />
                </SortableHandle>
            {:else}
                <!-- the stand-in until the sortable list loads: same box as the real handle, named but unavailable -->
                <span aria-disabled="true" aria-label={locale().locale.dragSort} class={`${prefixCls}-right-item-sortable-handle`} role="button">
                    <IconHandle class={[`${prefixCls}-right-item-drag-handler`, classNames?.itemDragHandle]} style={styles?.itemDragHandle} />
                </span>
            {/if}
        {/if}
        <div class={`${prefixCls}-right-item-text`}>
            {#if pathLabel !== undefined}
                {pathLabel}
            {:else if label}
                {@render label({ item })}
            {:else}
                {item.label}
            {/if}
        </div>
        <button aria-label={locale().locale.remove} class={[`${prefixCls}-item-close-icon`, { [`${prefixCls}-item-close-icon-disabled`]: item.disabled }, classNames?.itemRemove]} disabled={item.disabled || disabled} style={styles?.itemRemove} type="button" onclick={onRemove}>
            <IconClose />
        </button>
    </div>
{/if}
