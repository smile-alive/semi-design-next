<script lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-svelte';

    const show = () => {
        const id = 'toastid';
        Toast.info({ content: 'Update Content By Id', id });
        setTimeout(() => {
            Toast.success({ content: 'Id By Content Update', id });
        }, 1000);
    };
</script>

<Button type="primary" onclick={show}>Update Content By Id</Button>
