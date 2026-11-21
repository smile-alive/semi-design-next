<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/collapse/constants';
    import CollapseFoundation from '@fibrae/semi-foundation/components/collapse/foundation';
    import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-svelte';
    import Collapsible from '../collapsible/collapsible.svelte';
    import { getCollapseContext } from './context.js';
    import type { CollapsePanelProps } from './interface.js';

    let { itemKey, showArrow = true, disabled = false, classNames, styles, onMotionEnd, header, extra, children, ...rest }: CollapsePanelProps = $props();

    const ctx = getCollapseContext('Collapse.Panel');

    const uid = $props.id();
    let button = $state<HTMLButtonElement>();
    let leftIcon = $state<HTMLSpanElement>();
    let rightIcon = $state<HTMLSpanElement>();
    let everOpened = $state(false);

    const prefixCls = cssClasses.PREFIX;
    const ariaId = `${prefixCls}-${uid}`;
    const headerId = `${ariaId}-header`;
    const hasBody = $derived(children !== undefined);
    const active = $derived(ctx.activeSet.has(itemKey));
    const iconLeft = $derived(ctx.expandIconPosition === 'left');
    const iconEnabled = $derived(hasBody && !disabled);
    const contentMounted = $derived(CollapseFoundation.isContentMounted({ hasBody, active, keepDOM: ctx.keepDOM, lazyRender: ctx.lazyRender, everOpened }));
    const iconClass = $derived([`${prefixCls}-header-icon`, { [`${prefixCls}-header-iconDisabled`]: !iconEnabled }, ctx.classNames?.itemIcon, classNames?.icon]);

    // The parent Collapse's item* style comes first, the panel's own after it
    const joinStyles = (...values: Array<string | undefined>) => values.filter(Boolean).join(';') || undefined;

    const iconStyle = $derived(joinStyles(ctx.styles?.itemIcon, styles?.icon));

    const handleHeaderClick = (event: MouseEvent) => {
        // The only toggle handler: the button's click (also fired by Enter, Space and assistive tech) bubbles here, so a
        // handler on the button as well would toggle twice. Without clickHeaderToExpand the rest of the row, including
        // extra, does not toggle.
        const target = event.target instanceof Node ? event.target : null;
        if (!disabled && (ctx.clickHeaderToExpand || button?.contains(target) || leftIcon?.contains(target) || rightIcon?.contains(target))) {
            ctx.onClick(itemKey, event);
        }
    };

    $effect.pre(() => {
        const next = CollapseFoundation.isEverOpened({ hasBody, active, everOpened });
        if (next !== everOpened) {
            everOpened = next;
        }
    });
</script>

{#snippet arrow()}
    {#if iconEnabled && active}
        {#if ctx.collapseIcon}
            {@render ctx.collapseIcon()}
        {:else}
            <IconChevronUp />
        {/if}
    {:else if ctx.expandIcon}
        {@render ctx.expandIcon()}
    {:else}
        <IconChevronDown />
    {/if}
{/snippet}

<div {...rest} class={[`${prefixCls}-item`, rest.class, { [`${prefixCls}-item-active`]: active }, ctx.classNames?.item]} style={joinStyles(ctx.styles?.item, rest.style ?? undefined)}>
    <div class={[`${prefixCls}-header`, { [`${prefixCls}-header-disabled`]: disabled, [`${prefixCls}-header-iconLeft`]: iconLeft }, ctx.classNames?.itemHeader, classNames?.header]} style={joinStyles(ctx.styles?.itemHeader, styles?.header)} onclick={handleHeaderClick}>
        {#if showArrow && iconLeft}
            <span aria-hidden="true" bind:this={leftIcon} class={iconClass} style={iconStyle}>{@render arrow()}</span>
        {/if}
        <!-- APG Accordion: the button sits in a heading. role="heading" rather than h3, since host pages often style h3
            without a layer and those rules would beat Semi's layered styles. Level 3 as in Radix Accordion, which
            assumes the accordion sits under the page's h1 and a section h2. -->
        <div aria-level="3" class={[`${prefixCls}-header-title`, ctx.classNames?.itemTitle, classNames?.title]} role="heading" style={joinStyles(ctx.styles?.itemTitle, styles?.title)}>
            <button aria-controls={contentMounted ? ariaId : undefined} aria-expanded={active} bind:this={button} class={`${prefixCls}-header-button`} {disabled} id={headerId} type="button">
                {@render header?.()}
            </button>
        </div>
        <!-- extra stays outside the button so it may hold its own controls. The wrapper is always present, a snippet
            cannot be inspected for text: a text header needs the empty extra span, whose end padding spaces the arrow. -->
        <span class={`${prefixCls}-header-right`}>
            <span class={[`${prefixCls}-header-extra`, ctx.classNames?.itemExtra, classNames?.extra]} style={joinStyles(ctx.styles?.itemExtra, styles?.extra)}>{@render extra?.()}</span>
            {#if showArrow && !iconLeft}
                <span aria-hidden="true" bind:this={rightIcon} class={iconClass} style={iconStyle}>{@render arrow()}</span>
            {/if}
        </span>
    </div>
    {#if hasBody}
        <Collapsible isOpen={active} keepDOM={ctx.keepDOM} lazyRender={ctx.lazyRender} motion={ctx.motion} {onMotionEnd}>
            <div aria-labelledby={headerId} class={[`${prefixCls}-content`, ctx.classNames?.itemBody, classNames?.body]} id={ariaId} inert={active ? undefined : true} role="region" style={joinStyles(ctx.styles?.itemBody, styles?.body)}>
                <div class={`${prefixCls}-content-wrapper`}>
                    {@render children?.()}
                </div>
            </div>
        </Collapsible>
    {/if}
</div>
