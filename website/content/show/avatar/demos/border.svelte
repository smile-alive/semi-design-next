<script lang="ts">
    import { Avatar } from '@fibrae/semi-ui-svelte';
</script>

<div>
    {#each [1, 2, 3] as index (index)}
        <Avatar border color="amber" style="margin-right: 8px">T</Avatar>
    {/each}
</div>
