<script lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-svelte';

    let toastId: string | null = null;

    const destroy = () => {
        toastId = null;
    };

    const opts = {
        content: 'Not auto close',
        duration: 0,
        onClose: destroy,
    };

    const show = () => {
        if (toastId) {
            return;
        }
        toastId = Toast.info(opts);
    };

    const hide = () => {
        if (toastId) {
            Toast.close(toastId);
        }
        destroy();
    };
</script>

<Button type="primary" onclick={show}>Show Toast</Button>
<br />
<br />
<Button type="primary" onclick={hide}>Hide Toast</Button>
