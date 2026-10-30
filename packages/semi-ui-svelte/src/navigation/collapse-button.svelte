<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/navigation/constants';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import { IconSidebar } from '@fibrae/semi-icons-svelte';
    import { Button } from '../button/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import type { NavCollapseButtonProps } from './interface.js';

    let { collapsed, collapseText, onToggle }: NavCollapseButtonProps = $props();

    const locale = useLocale('Navigation');
</script>

{#snippet trigger({ props }: { props: TooltipTriggerProps })}
    <!-- Only the icon shows while collapsed; a custom collapseText is a snippet whose text cannot be read back, so the locale text names the button -->
    <Button {...props} aria-label={collapsed ? locale().locale.expandText : undefined} children={collapsed ? undefined : label} icon={sidebarIcon} theme="borderless" type="tertiary" onclick={onToggle} />
{/snippet}

{#snippet sidebarIcon()}
    <IconSidebar />
{/snippet}

{#snippet label()}
    {#if collapseText}
        {@render collapseText({ collapsed })}
    {:else}
        {locale().locale.collapseText}
    {/if}
{/snippet}

{#snippet tip()}
    {#if collapseText}
        {@render collapseText({ collapsed })}
    {:else}
        {locale().locale.expandText}
    {/if}
{/snippet}

<div class={`${cssClasses.PREFIX}-collapse-btn`}>
    <!-- One element tree for both states: swapping the wrapper would remount the button and drop the focus it holds -->
    <Tooltip child={trigger} condition={collapsed} content={tip} position="right" />
</div>
