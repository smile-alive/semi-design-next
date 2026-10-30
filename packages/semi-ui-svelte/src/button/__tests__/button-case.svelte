<script lang="ts">
    import { IconEdit } from '@fibrae/semi-icons-svelte';
    import IconButton from '../../icon-button/icon-button.svelte';
    import Button from '../button.svelte';
    import type { ButtonIconArgs, ButtonProps } from '../interface';
    import FillProbe from './fill-probe.svelte';

    interface Case {
        kind?: 'button' | 'icon-button';
        props?: ButtonProps;
        text?: string;
        icon?: 'edit' | 'probe';
    }

    let { store }: { store: Case } = $props();

    // A snippet is passed only when the case asks for it: an absent snippet is what makes a button text-less or icon-less
    const slots = $derived({
        ...(store.text ? { children: label } : {}),
        ...(store.icon ? { icon: iconView } : {}),
    });
</script>

{#snippet label()}{store.text}{/snippet}

{#snippet iconView({ fill }: ButtonIconArgs)}
    {#if store.icon === 'probe'}
        <FillProbe {fill} />
    {:else}
        <IconEdit {fill} />
    {/if}
{/snippet}

{#if store.kind === 'icon-button'}
    <IconButton {...store.props} {...slots} />
{:else}
    <Button {...store.props} {...slots} />
{/if}
