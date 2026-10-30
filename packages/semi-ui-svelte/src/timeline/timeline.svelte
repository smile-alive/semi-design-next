<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
    import { getPosCls } from '@fibrae/semi-foundation/timeline/utils';
    import '@fibrae/semi-foundation/timeline/timeline.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { TimelineData, TimelineProps } from './interface.js';

    const defaults = useDefaultProps('Timeline');
    let { mode = defaults('mode', 'left'), dataSource = defaults('dataSource'), content, time, extra, ...rest }: TimelineProps = $props();

    const prefixCls = cssClasses.PREFIX;
    const itemCls = cssClasses.ITEM;

    const hasText = (value?: string | number) => value !== undefined && value !== '';

    const itemAttrs = (item: TimelineData) => omit(item, ['content', 'time', 'extra', 'color', 'type', 'position', 'dot', 'onClick']);

    const handleClick = (event: MouseEvent & { currentTarget: HTMLElement }, onClick: (event: MouseEvent) => void) => {
        // Interactive content in an extra inside this item, nested items' extras included, must not also trigger the item
        const inExtra = event.target instanceof Element ? event.target.closest(`.${itemCls}-content-extra`) : null;
        if (inExtra && event.currentTarget.contains(inExtra)) return;
        onClick(event);
    };

    // only a clickable item is a keyboard target; extra and time stay outside
    const handleKeydown = (event: KeyboardEvent & { currentTarget: HTMLElement }) => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        event.currentTarget.click();
    };
</script>

<ul {...rest} class={[prefixCls, rest.class, { [`${prefixCls}-${mode}`]: mode }]}>
    {#each dataSource ?? [] as item, index (index)}
        {@const onClick = item.onClick}
        {#snippet body()}
            {#if content}{@render content({ item, index })}{:else}{item.content}{/if}
        {/snippet}
        <li {...itemAttrs(item)} class={[itemCls, item.class, getPosCls(mode, item.position, index)]} onclick={onClick ? (event) => handleClick(event, onClick) : undefined}>
            <div aria-hidden="true" class={`${itemCls}-tail`}></div>
            <div aria-hidden="true" class={[`${itemCls}-head`, `${itemCls}-head-${item.type ?? 'default'}`, { [`${itemCls}-head-custom`]: item.dot }]} style={item.color ? `background-color: ${item.color};` : undefined}>
                {@render item.dot?.()}
            </div>
            <div class={`${itemCls}-content`}>
                {#if onClick}
                    <div class={`${itemCls}-content-main`} role="button" tabindex="0" onkeydown={handleKeydown}>
                        {@render body()}
                    </div>
                {:else}
                    {@render body()}
                {/if}{#if extra || hasText(item.extra)}
                    <div class={`${itemCls}-content-extra`}>
                        {#if extra}{@render extra({ item, index })}{:else}{item.extra}{/if}
                    </div>
                {/if}{#if time || hasText(item.time)}
                    <div class={`${itemCls}-content-time`}>
                        {#if time}{@render time({ item, index })}{:else}{item.time}{/if}
                    </div>
                {/if}
            </div>
        </li>
    {/each}
</ul>
