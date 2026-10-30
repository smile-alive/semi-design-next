<script lang="ts">
    import { IconEdit } from '@fibrae/semi-icons-svelte';
    import IconButton from '../../icon-button/icon-button.svelte';
    import ButtonGroup from '../button-group.svelte';
    import Button from '../button.svelte';
    import type { ButtonGroupProps, ButtonProps } from '../interface';

    interface Item {
        kind?: 'button' | 'icon-button';
        label: string;
        props?: ButtonProps;
    }

    let { store }: { store: { group?: ButtonGroupProps; items: Item[]; nested?: ButtonGroupProps } } = $props();
</script>

<ButtonGroup {...store.group}>
    {#each store.items as item (item.label)}
        {#if item.kind === 'icon-button'}
            <IconButton aria-label={item.label} {...item.props}>
                {#snippet icon({ fill })}<IconEdit {fill} />{/snippet}
            </IconButton>
        {:else}
            <Button {...item.props}>{item.label}</Button>
        {/if}
    {/each}
    {#if store.nested}
        <ButtonGroup {...store.nested}>
            <Button>nested</Button>
            <Button type="secondary">own</Button>
        </ButtonGroup>
    {/if}
</ButtonGroup>
