<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Avatar } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Avatar bottomSlot={{ shape: 'square', bgColor: '#FE2C55' }} color="amber">
        T
        {#snippet bottomSlotText()}直播中{/snippet}
    </Avatar>

    <Avatar bottomSlot={{ shape: 'square', bgColor: '#FE2C55' }} color="amber" size="large">
        T
        {#snippet bottomSlotText()}直播中{/snippet}
    </Avatar>

    <Avatar bottomSlot={{ shape: 'square', bgColor: '#FE2C55' }} color="amber" size="extra-large">
        T
        {#snippet bottomSlotText()}直播中{/snippet}
    </Avatar>
    <br />
    <br />
    <br />
    <Avatar bottomSlot={{ shape: 'circle', bgColor: '#FE2C55' }} color="amber">
        T
        {#snippet bottomSlotText()}
            <IconPlus />
        {/snippet}
    </Avatar>

    <Avatar bottomSlot={{ shape: 'circle', bgColor: '#FE2C55' }} color="amber" size="large">
        T
        {#snippet bottomSlotText()}
            <IconPlus />
        {/snippet}
    </Avatar>

    <Avatar bottomSlot={{ shape: 'circle', bgColor: '#FE2C55' }} color="amber" size="extra-large">
        T
        {#snippet bottomSlotText()}
            <IconPlus />
        {/snippet}
    </Avatar>
</div>
