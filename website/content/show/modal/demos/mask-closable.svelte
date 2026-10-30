<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = true)}>点击遮罩层不可关闭</Button>
<Modal bind:visible maskClosable={false} onOk={close} title="对话框标题">
    <p>This is a modal that cannot be closed by clicking on the mask.</p>
    <p>More content...</p>
</Modal>
