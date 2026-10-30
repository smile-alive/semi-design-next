<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Avatar } from '@fibrae/semi-ui-svelte';

    const sizes = ['medium', 'large', 'extra-large'];
</script>

<div>
    {#each sizes as size (size)}
        <Avatar bottomSlot={{ shape: 'square', bgColor: '#FE2C55' }} color="amber" {size}>
            T
            {#snippet bottomSlotText()}直播中{/snippet}
        </Avatar>
    {/each}
    <br /><br /><br />
    {#each sizes as size (size)}
        <Avatar bottomSlot={{ shape: 'circle', bgColor: '#FE2C55' }} color="amber" {size}>
            T
            {#snippet bottomSlotText()}
                <IconPlus />
            {/snippet}
        </Avatar>
    {/each}
</div>
