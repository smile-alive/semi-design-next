<script lang="ts">
    import AvatarGroup from '../avatar-group.svelte';
    import Avatar from '../avatar.svelte';
    import type { AvatarGroupProps } from '../interface';

    interface Store extends AvatarGroupProps {
        custom?: boolean;
        explicitMoreSize?: string;
        values?: string[];
    }

    let { store }: { store: Store } = $props();
    const groupProps = $derived.by(() => {
        const { custom: _custom, explicitMoreSize: _size, values: _values, items: _items, ...props } = store;
        return props;
    });
    const values = $derived(store.values ?? ['LL', 'CX', 'RM', 'ZL', 'YZ']);
    const items = $derived(store.items ?? values.map((value) => ({ alt: value, class: 'own', shape: 'circle' as const, size: 'large' })));
</script>

{#snippet customMore({ restNumber, restAvatars }: { restNumber: number; restAvatars: { alt?: string }[] })}
    <div>
        <Avatar data-rest={restAvatars.map((avatar) => avatar.alt).join()} size={store.explicitMoreSize}>+{restNumber}</Avatar>
    </div>
{/snippet}

{#snippet text({ item, index }: { item: { alt?: string }; index: number })}{item.alt}{index}{/snippet}

<AvatarGroup {...groupProps} item={text} {items} more={store.custom ? customMore : undefined} />
