<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
</script>

<Button onclick={() => (visible = true)}>自定义页脚样式</Button>
<Modal bind:visible title="自定义页脚">
    <p>This is a modal with a customized footer.</p>
    <p>More content...</p>
    {#snippet footer()}
        <Button type="primary" onclick={() => (visible = false)}>Yes, I Understand</Button>
    {/snippet}
</Modal>
