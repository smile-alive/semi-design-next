<script lang="ts">
    import { cssClasses, cssClassesGroup } from '@fibrae/semi-foundation/float-button/constants';
    import '@fibrae/semi-foundation/float-button/float-button.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import Badge from '../badge/badge.svelte';
    import FloatButtonAction from './float-button-action.svelte';
    import type { FloatButtonGroupItem, FloatButtonGroupProps } from './interface.js';

    const defaults = useDefaultProps('FloatButtonGroup');
    let { disabled = defaults('disabled', false), items, onClick, badgeCount, content, icon, ...rest }: FloatButtonGroupProps = $props();

    const prefix = cssClassesGroup.PREFIX;
    const buttonPrefix = cssClasses.PREFIX;

    const actionProps = (item: FloatButtonGroupItem) => {
        const { badge: _badge, colorful, content: _content, disabled: itemOwnDisabled, shape, size, value, onClick: itemClick, ...attrs } = item;
        const itemDisabled = disabled || itemOwnDisabled;
        return {
            ...attrs,
            class: [
                `${prefix}-item`,
                item.class,
                {
                    [`${buttonPrefix}-${shape}`]: shape,
                    [`${buttonPrefix}-${size}`]: size,
                    [`${buttonPrefix}-colorful`]: colorful,
                    [`${prefix}-item-disabled`]: itemDisabled,
                },
            ],
            'data-value': value,
            disabled: itemDisabled,
            onclick: (event: MouseEvent) => {
                itemClick?.(event);
                onClick?.(value, event);
            },
        };
    };
</script>

{#snippet action(item: FloatButtonGroupItem, index: number)}
    <FloatButtonAction {...actionProps(item)}>
        <!-- no whitespace between icon and content: the button's accessible name is the content text -->
        {@render icon?.({ item, index })}{#if content}{@render content({ item, index })}{:else}{item.content}{/if}
    </FloatButtonAction>
{/snippet}

<div {...rest} class={[prefix, rest.class, { [`${prefix}-disabled`]: disabled }]} role="group">
    {#each items as item, index (index)}
        {#snippet itemCount()}
            {@render badgeCount?.({ item, index })}
        {/snippet}
        {#if item.badge}
            <Badge {...item.badge} count={badgeCount ? itemCount : item.badge.count}>
                {@render action(item, index)}
            </Badge>
        {:else}
            {@render action(item, index)}
        {/if}
    {/each}
</div>
