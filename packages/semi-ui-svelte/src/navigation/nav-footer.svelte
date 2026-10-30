<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import CollapseButton from './collapse-button.svelte';
    import { getNavContext } from './context.js';
    import type { NavFooterProps } from './interface.js';

    let { collapseButton = false, collapseText, children, ...rest }: NavFooterProps = $props();

    const ctx = getNavContext('Nav.Footer');

    const prefix = cssClasses.PREFIX;

    // the button only takes an empty footer of a vertical nav
    const showButton = $derived(!children && Boolean(collapseButton) && ctx.mode !== strings.MODE_HORIZONTAL);
</script>

<div {...rest} class={[`${prefix}-footer`, rest.class, { [`${prefix}-footer-collapsed`]: ctx.isCollapsed }]}>
    {#if showButton}
        {#if typeof collapseButton === 'function'}
            {@render collapseButton()}
        {:else}
            <CollapseButton {collapseText} collapsed={ctx.isCollapsed} onToggle={ctx.toggleCollapsed} />
        {/if}
    {:else}
        {@render children?.()}
    {/if}
</div>
