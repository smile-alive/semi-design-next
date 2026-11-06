<script lang="ts">
    import { AvatarGroup } from '@fibrae/semi-ui-svelte';

    const items = [{ alt: 'Lisa LeBlanc', color: 'red' as const }, { alt: 'Caroline Xiao' }, { alt: 'Rafal Matin', color: 'amber' as const }, { alt: 'Zank Lance', style: 'color: #f56a00; background-color: #fde3cf' }, { alt: 'Youself Zhang', style: 'background-color: #87d068' }];

    const initials = (alt = '') =>
        alt
            .split(' ')
            .map((word) => word[0])
            .join('');
</script>

<div>
    <div>
        <AvatarGroup {items} overlapFrom="start">
            {#snippet item(context)}
                {initials(context.item.alt)}
            {/snippet}
        </AvatarGroup>
    </div>
    <div>
        <AvatarGroup {items} overlapFrom="end">
            {#snippet item(context)}
                {initials(context.item.alt)}
            {/snippet}
        </AvatarGroup>
    </div>
</div>
