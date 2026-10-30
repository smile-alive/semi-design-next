<script lang="ts">
    import { Avatar } from '@fibrae/semi-ui-svelte';

    const sizes = ['medium', 'large', 'extra-large'];
</script>

<div>
    {#each sizes as size (size)}
        <Avatar border={{ motion: true }} color="amber" contentMotion {size} style="margin-right: 8px">T</Avatar>
    {/each}
</div>
