<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = true)}>打开全屏弹窗</Button>
<Modal bind:visible fullScreen onOk={close} title="全屏对话框标题">
    <p>This is a full screen modal</p>
    <p>More content...</p>
</Modal>
