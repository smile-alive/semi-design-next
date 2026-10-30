<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/navigation/constants';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import { getNavContext } from './context.js';
    import type { NavHeaderProps } from './interface.js';

    let { link, linkOptions, text, logo, children, ...rest }: NavHeaderProps = $props();

    const ctx = getNavContext('Nav.Header');

    const prefix = cssClasses.PREFIX;
</script>

{#snippet inner()}
    {#if logo}
        <i class={`${prefix}-header-logo`} x-semi-prop="logo">{@render logo()}</i>
    {/if}
    {#if text != null && !ctx.isCollapsed}
        <span class={`${prefix}-header-text`}>{text}</span>
    {/if}
    {@render children?.()}
{/snippet}

<div {...rest} class={[`${prefix}-header`, rest.class, { [`${prefix}-header-collapsed`]: ctx.isCollapsed }]}>
    {#if typeof link === 'string'}
        <!-- collapsed, the text is hidden and a Semi icon logo is aria-hidden, so the text still names the link -->
        <a aria-label={ctx.isCollapsed && text != null ? String(text) : undefined} href={link} {...linkOptions} class={[`${prefix}-header-link`, linkOptions?.class]}>
            {@render inner()}
        </a>
    {:else}
        {@render inner()}
    {/if}
</div>
