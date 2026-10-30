<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = true)}>自定义按钮文字</Button>
<Modal bind:visible cancelText="No, thanks." okText="Sounds great!" onOk={close} title="自定义按钮文字">
    <p>This is a modal with customized button texts.</p>
    <p>More content...</p>
</Modal>
