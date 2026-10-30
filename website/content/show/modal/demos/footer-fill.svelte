<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const handleOk = () => {
        visible = false;
        console.log('Ok button clicked');
    };
    const handleCancel = () => {
        console.log('Cancel button clicked');
    };
    const handleAfterClose = () => {
        console.log('After Close callback executed');
    };
</script>

<Button onclick={() => (visible = true)}>打开弹窗</Button>
<Modal afterClose={handleAfterClose} bind:visible closeOnEsc footerFill onCancel={handleCancel} onOk={handleOk} title="基本对话框">
    This is the content of a basic modal.
    <br />
    More content...
</Modal>
