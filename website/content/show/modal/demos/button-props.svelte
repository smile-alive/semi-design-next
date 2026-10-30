<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = true)}>自定义按钮属性</Button>
<Modal bind:visible cancelButtonProps={{ size: 'small', disabled: true }} okButtonProps={{ size: 'small', type: 'warning' }} onOk={close} title="自定义按钮属性">
    <p>This is a modal with customized button props.</p>
    <p>More content...</p>
</Modal>
