<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
    import { getTagListKeys } from '@fibrae/semi-foundation/tag/tag-key';
    import useDefaultProps from '../_base/use-default-props.js';
    import { Popover } from '../popover/index.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import type { TagCloseEvent, TagGroupItem, TagGroupProps } from './interface.js';
    import Tag from './tag.svelte';

    const defaults = useDefaultProps('TagGroup');

    let {
        tagList,
        maxTagCount = defaults('maxTagCount'),
        restCount = defaults('restCount'),
        size = defaults('size', 'default'),
        avatarShape = defaults('avatarShape', 'square'),
        showPopover = defaults('showPopover'),
        popoverProps = defaults('popoverProps'),
        onTagClose,
        onPlusNMouseEnter,
        tag,
        ...rest
    }: TagGroupProps = $props();

    const prefix = cssClasses.PREFIX;
    const count = $derived(maxTagCount === undefined ? 0 : restCount || tagList.length - maxTagCount);
    const shown = $derived(count > 0 ? tagList.slice(0, maxTagCount) : tagList);
    const hidden = $derived(count > 0 ? tagList.slice(maxTagCount) : []);
    const shownKeys = $derived(getTagListKeys(shown));
    const hiddenKeys = $derived(getTagListKeys(hidden));
</script>

{#snippet entry(item: TagGroupItem, index: number)}
    {#if tag}
        {@render tag({ tag: item, index })}
    {:else}
        {@const { children: label, ...tagProps } = item}
        <Tag
            {...tagProps}
            avatarShape={item.avatarShape || avatarShape}
            onClose={(event: TagCloseEvent, key) => {
                item.onClose?.(event, key);
                onTagClose?.(event, key);
            }}
            size={item.size || size}
            tagKey={item.tagKey ?? label ?? index}
        >
            {label}
        </Tag>
    {/if}
{/snippet}

<!-- trigger props (when inside a Popover) carry the attachment that hands the element to Tooltip -->
{#snippet plusN(trigger?: TooltipTriggerProps)}
    <Tag {...trigger} color="grey" {size} style="background-color: transparent" onmouseenter={onPlusNMouseEnter}>+{count}</Tag>
{/snippet}

{#snippet plusNTrigger({ props }: { props: TooltipTriggerProps })}
    {@render plusN(props)}
{/snippet}

{#snippet restTags()}
    {#each hidden as item, index (hiddenKeys[index])}
        {@render entry(item, (maxTagCount ?? 0) + index)}
    {/each}
{/snippet}

<div
    {...rest}
    class={[
        `${prefix}-group`,
        rest.class,
        {
            [`${prefix}-group-max`]: maxTagCount,
            [`${prefix}-group-small`]: size === 'small',
            [`${prefix}-group-large`]: size === 'large',
        },
    ]}
>
    {#each shown as item, index (shownKeys[index])}
        {@render entry(item, index)}
    {/each}
    {#if count > 0}
        {#if showPopover}
            <Popover autoAdjustOverflow class="{prefix}-rest-group-popover" position="top" showArrow trigger="hover" {...popoverProps} child={plusNTrigger} content={restTags} />
        {:else}
            {@render plusN()}
        {/if}
    {/if}
</div>
