<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/navigation/constants';
    import '@fibrae/semi-foundation/components/navigation/navigation.scss';
    import { getNavContext, joinStyles } from './context.js';
    import type { NavHeaderProps } from './interface.js';

    let { classNames, styles, link, linkOptions, text, logo, children, ...rest }: NavHeaderProps = $props();

    const ctx = getNavContext('Nav.Header');

    const prefix = cssClasses.PREFIX;
</script>

{#snippet inner()}
    {#if logo}
        <i class={[`${prefix}-header-logo`, classNames?.logo]} style={styles?.logo} x-semi-prop="logo">{@render logo()}</i>
    {/if}
    {#if text != null && !ctx.isCollapsed}
        <span class={[`${prefix}-header-text`, classNames?.text]} style={styles?.text}>{text}</span>
    {/if}
    {@render children?.()}
{/snippet}

<div {...rest} class={[`${prefix}-header`, rest.class, { [`${prefix}-header-collapsed`]: ctx.isCollapsed }]}>
    {#if typeof link === 'string'}
        <!-- collapsed, the text is hidden and a Semi icon logo is aria-hidden, so the text still names the link -->
        <a aria-label={ctx.isCollapsed && text != null ? String(text) : undefined} href={link} {...linkOptions} class={[`${prefix}-header-link`, classNames?.link, linkOptions?.class]} style={joinStyles(styles?.link, linkOptions?.style)}>
            {@render inner()}
        </a>
    {:else}
        {@render inner()}
    {/if}
</div>
