<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/float-button/constants';
    import '@fibrae/semi-foundation/float-button/float-button.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import Badge from '../badge/badge.svelte';
    import FloatButtonAction from './float-button-action.svelte';
    import FloatButtonBody from './float-button-body.svelte';
    import type { FloatButtonProps } from './interface.js';

    const defaults = useDefaultProps('FloatButton');

    let {
        badge = defaults('badge'),
        colorful = defaults('colorful', false),
        disabled = defaults('disabled', false),
        href = defaults('href'),
        rel = defaults('rel'),
        shape = defaults('shape', 'round'),
        size = defaults('size', 'default'),
        target = defaults('target'),
        badgeCount,
        icon,
        ...rest
    }: FloatButtonProps = $props();

    const prefix = cssClasses.PREFIX;
</script>

{#snippet body()}
    <FloatButtonBody {colorful} {disabled} {shape} {size}>
        {@render icon?.()}
    </FloatButtonBody>
{/snippet}

<FloatButtonAction {...rest} class={[prefix, `${prefix}-${size}`, `${prefix}-${shape}`, rest.class]} {disabled} {href} {rel} {target}>
    {#if badge}
        <Badge {...badge} count={badgeCount ?? badge.count}>
            {@render body()}
        </Badge>
    {:else}
        {@render body()}
    {/if}
</FloatButtonAction>
