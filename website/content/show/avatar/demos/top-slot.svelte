<script lang="ts">
    import { Avatar } from '@fibrae/semi-ui-svelte';

    const sizes = ['medium', 'large', 'extra-large'];
</script>

<div>
    {#each sizes as size (size)}
        <Avatar color="amber" {size} topSlot={{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }}>
            T
            {#snippet topSlotText()}直播{/snippet}
        </Avatar>
    {/each}
</div>
