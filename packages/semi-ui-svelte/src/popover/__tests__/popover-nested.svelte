<script lang="ts">
    import type { TooltipTriggerProps } from '../../tooltip';
    import type { PopoverProps } from '../interface';
    import Popover from '../popover.svelte';

    let { where, props = {} }: { where: 'content' | 'trigger'; props?: Omit<PopoverProps, 'children' | 'child' | 'content'> } = $props();
</script>

{#snippet innerAction()}
    <button type="button">inner action</button>
{/snippet}

{#snippet innerTrigger({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">inner trigger</button>
{/snippet}

{#snippet sharedTrigger({ props: outerProps }: { props: TooltipTriggerProps })}
    <Popover {...props} aria-label="Inner" content={innerAction}>
        {#snippet child({ props: innerProps })}
            <button {...outerProps} {...innerProps} type="button">shared trigger</button>
        {/snippet}
    </Popover>
{/snippet}

{#snippet nested()}
    <Popover {...props} aria-label="Inner" child={innerTrigger} content={innerAction} />
{/snippet}

{#snippet outerContent()}
    outer content
{/snippet}

{#snippet outerTrigger({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">outer trigger</button>
{/snippet}

<p>outside</p>
{#if where === 'content'}
    <Popover {...props} aria-label="Outer" child={outerTrigger} content={nested} />
{:else}
    <Popover {...props} aria-label="Outer" child={sharedTrigger} content={outerContent} />
{/if}
