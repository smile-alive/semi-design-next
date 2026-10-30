<script lang="ts">
    import { Avatar } from '@fibrae/semi-ui-svelte';

    const sizes = ['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'];
</script>

<div>
    {#each sizes as size (size)}
        <Avatar alt="用户" {size} style="margin: 4px">U</Avatar>
    {/each}
</div>
