<script lang="ts">
    import { IconEdit } from '@fibrae/semi-icons-svelte';
    import ButtonGroup from '../../button/button-group.svelte';
    import Button from '../../button/button.svelte';
    import type { ButtonProps } from '../../button/interface';
    import Checkbox from '../../checkbox/checkbox.svelte';
    import IconButton from '../../icon-button/icon-button.svelte';
    import Switch from '../../switch/switch.svelte';
    import type { TooltipProps, TooltipTriggerProps } from '../interface';
    import Tooltip from '../tooltip.svelte';

    let {
        store,
    }: {
        store: {
            kind: 'button' | 'icon-button' | 'switch' | 'checkbox' | 'group';
            tip: Omit<TooltipProps, 'children' | 'child' | 'content' | 'arrow' | 'visible'>;
            props: ButtonProps & { checked?: boolean };
            /** The trigger takes Tooltip's props through the `child` snippet instead of filling its span */
            child?: boolean;
            /** A button after the tooltip, to count Tab stops */
            after?: boolean;
        };
    } = $props();
</script>

{#snippet switchChild({ props }: { props: TooltipTriggerProps })}
    <Switch aria-label="trigger" {...props} disabled={store.props.disabled} />
{/snippet}

{#snippet checkboxChild({ props }: { props: TooltipTriggerProps })}
    <Checkbox {...props} disabled={store.props.disabled}>trigger</Checkbox>
{/snippet}

{#snippet trigger()}
    {#if store.kind === 'icon-button'}
        <IconButton aria-label="trigger" {...store.props}>
            {#snippet icon()}<IconEdit />{/snippet}
        </IconButton>
    {:else if store.kind === 'switch'}
        <Switch aria-label="trigger" disabled={store.props.disabled} />
    {:else if store.kind === 'checkbox'}
        <Checkbox disabled={store.props.disabled}>trigger</Checkbox>
    {:else}
        <Button {...store.props}>trigger</Button>
    {/if}
{/snippet}

{#snippet content()}<span>content</span>{/snippet}

{#if store.kind === 'group'}
    <ButtonGroup disabled>
        <Tooltip {content} motion={false} {...store.tip}>
            <Button>trigger</Button>
        </Tooltip>
        <Button>other</Button>
    </ButtonGroup>
{:else if store.child}
    <Tooltip {content} motion={false} {...store.tip} child={store.kind === 'switch' ? switchChild : checkboxChild} />
{:else}
    <Tooltip {content} motion={false} {...store.tip} children={trigger} />
{/if}
{#if store.after}
    <button type="button">after</button>
{/if}
