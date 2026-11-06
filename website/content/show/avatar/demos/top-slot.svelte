<script lang="ts">
    import { Avatar } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Avatar color="amber" topSlot={{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }}>
        T
        {#snippet topSlotText()}直播{/snippet}
    </Avatar>

    <Avatar color="amber" size="large" topSlot={{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }}>
        T
        {#snippet topSlotText()}直播{/snippet}
    </Avatar>

    <Avatar color="amber" size="extra-large" topSlot={{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }}>
        T
        {#snippet topSlotText()}直播{/snippet}
    </Avatar>
</div>
