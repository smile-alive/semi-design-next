<script lang="ts">
    import { IconCamera } from '@fibrae/semi-icons-svelte';
    import { Avatar } from '@fibrae/semi-ui-svelte';
</script>

<Avatar alt="Bob Downton" color="red">
    BD
    {#snippet hoverMask()}
        <div style="background-color: var(--semi-color-overlay-bg); height: 100%; width: 100%; display: flex; align-items: center; justify-content: center">
            <IconCamera />
        </div>
    {/snippet}
</Avatar>
