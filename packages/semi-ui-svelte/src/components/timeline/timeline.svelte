<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/timeline/constants';
    import { getPosCls } from '@fibrae/semi-foundation/components/timeline/utils';
    import '@fibrae/semi-foundation/components/timeline/timeline.scss';
    import { useDefaultProps } from '../../base/index.js';
    import type { TimelineData, TimelineProps } from './interface.js';

    const defaults = useDefaultProps('Timeline');
    let { mode = defaults('mode', 'left'), dataSource = defaults('dataSource'), classNames = defaults('classNames'), styles = defaults('styles'), content, time, extra, ...rest }: TimelineProps = $props();

    const prefixCls = cssClasses.PREFIX;
    const itemCls = cssClasses.ITEM;

    const joinStyle = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join('; ') || undefined;

    const hasText = (value?: string | number) => value !== undefined && value !== '';

    const itemAttrs = (item: TimelineData) => omit(item, ['content', 'time', 'extra', 'color', 'type', 'position', 'dot', 'onClick', 'classNames', 'styles']);

    const handleClick = (event: MouseEvent & { currentTarget: HTMLElement }, onClick: (event: MouseEvent) => void) => {
        // Interactive content in an extra inside this item, nested items' extras included, must not also trigger the item
        const inExtra = event.target instanceof Element ? event.target.closest(`.${itemCls}-content-extra`) : null;
        if (inExtra && event.currentTarget.contains(inExtra)) return;
        onClick(event);
    };

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
        <li {...itemAttrs(item)} class={[itemCls, classNames?.item, item.class, getPosCls(mode, item.position, index)]} style={joinStyle(styles?.item, item.style)} onclick={onClick ? (event) => handleClick(event, onClick) : undefined}>
            <div aria-hidden="true" class={[`${itemCls}-tail`, classNames?.itemRail, item.classNames?.rail]} style={joinStyle(styles?.itemRail, item.styles?.rail)}></div>
            <div aria-hidden="true" class={[`${itemCls}-head`, `${itemCls}-head-${item.type ?? 'default'}`, { [`${itemCls}-head-custom`]: item.dot }, classNames?.itemIcon, item.classNames?.icon]} style={joinStyle(item.color && `background-color: ${item.color}`, styles?.itemIcon, item.styles?.icon)}>
                {@render item.dot?.()}
            </div>
            <div class={[`${itemCls}-content`, classNames?.itemContent, item.classNames?.content]} style={joinStyle(styles?.itemContent, item.styles?.content)}>
                {#if onClick}
                    <div class={`${itemCls}-content-main`} role="button" tabindex="0" onkeydown={handleKeydown}>
                        {@render body()}
                    </div>
                {:else}
                    {@render body()}
                {/if}{#if extra || hasText(item.extra)}
                    <div class={[`${itemCls}-content-extra`, classNames?.itemExtra, item.classNames?.extra]} style={joinStyle(styles?.itemExtra, item.styles?.extra)}>
                        {#if extra}{@render extra({ item, index })}{:else}{item.extra}{/if}
                    </div>
                {/if}{#if time || hasText(item.time)}
                    <div class={[`${itemCls}-content-time`, classNames?.itemTime, item.classNames?.time]} style={joinStyle(styles?.itemTime, item.styles?.time)}>
                        {#if time}{@render time({ item, index })}{:else}{item.time}{/if}
                    </div>
                {/if}
            </div>
        </li>
    {/each}
</ul>
