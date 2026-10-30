<script lang="ts">
    import { Button, SideSheet } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
</script>

<Button onclick={() => (visible = !visible)}>Open SideSheet</Button>
<SideSheet bind:visible title="滑动侧边栏">
    <p>This is the content of a basic sidesheet.</p>
    <p>Here is more content...</p>
</SideSheet>
