<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/float-button/constants';
    import '@fibrae/semi-foundation/components/float-button/float-button.scss';
    import { useDefaultProps } from '../../base/index.js';
    import Badge from '../badge/badge.svelte';
    import FloatButtonAction from './float-button-action.svelte';
    import FloatButtonBody from './float-button-body.svelte';
    import type { FloatButtonProps } from './interface.js';

    const defaults = useDefaultProps('FloatButton');

    let {
        badge = defaults('badge'),
        classNames = defaults('classNames'),
        colorful = defaults('colorful', false),
        disabled = defaults('disabled', false),
        href = defaults('href'),
        rel = defaults('rel'),
        shape = defaults('shape', 'round'),
        size = defaults('size', 'default'),
        styles = defaults('styles'),
        target = defaults('target'),
        badgeCount,
        icon,
        ...rest
    }: FloatButtonProps = $props();

    const prefix = cssClasses.PREFIX;
</script>

{#snippet body()}
    <FloatButtonBody class={classNames?.body} {colorful} {disabled} {shape} {size} style={styles?.body}>
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
