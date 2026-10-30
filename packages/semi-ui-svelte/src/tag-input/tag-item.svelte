<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/tag-input/constants';
    import { IconHandle } from '@fibrae/semi-icons-svelte';
    import { SortableHandle } from '../_sortable/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Tag } from '../tag/index.js';
    import { TypographyParagraph, type TypographyShowTooltip as ShowTooltip } from '../typography/index.js';
    import type { TagInputSize, TagInputTagSnippetProps } from './interface.js';

    let {
        value,
        index,
        size,
        disabled,
        showContentTooltip,
        draggableActive,
        withHandle,
        tag,
        onClose,
    }: {
        value: string;
        index: number;
        size: TagInputSize;
        disabled: boolean;
        showContentTooltip: boolean | ShowTooltip;
        /** the drag handles are on: the tag makes room for one */
        draggableActive: boolean;
        withHandle: boolean;
        tag?: Snippet<[TagInputTagSnippetProps]>;
        onClose: (event?: Event) => void;
    } = $props();

    const tagLocale = useLocale('Tag');

    const prefix = cssClasses.PREFIX;
    const ellipsis = $derived({ showTooltip: showContentTooltip, rows: 1 });

    // The tag's content is an element, so Tag cannot read its name back from the text; a function replacer keeps `$&` and `$$` in the value literal
    const tagLabel = $derived(disabled ? undefined : tagLocale().locale.closableTag.replace('${tag}', () => value));
</script>

{#snippet content()}
    {#if tag}
        {@render tag({ value, index, onClose })}
    {:else}
        <Tag aria-label={tagLabel} class={[`${prefix}-wrapper-tag`, `${prefix}-wrapper-tag-size-${size}`, { [`${prefix}-wrapper-tag-icon`]: draggableActive && !withHandle }]} closable={!disabled} color="white" onClose={(event) => onClose(event)} size={size === 'small' ? 'small' : 'large'} type="light">
            <TypographyParagraph class={[`${prefix}-wrapper-typo`, { [`${prefix}-wrapper-typo-disabled`]: disabled }]} {ellipsis}>{value}</TypographyParagraph>
        </Tag>
    {/if}
{/snippet}

<!-- a closable Tag is a button and must not hold another one, so the handle is its sibling -->
{#if withHandle}
    <div class={[`${prefix}-drag-item`, `${prefix}-wrapper-tag-icon`]}>
        <SortableHandle><IconHandle class={`${prefix}-drag-handler`} /></SortableHandle>
        {@render content()}
    </div>
{:else}
    {@render content()}
{/if}
