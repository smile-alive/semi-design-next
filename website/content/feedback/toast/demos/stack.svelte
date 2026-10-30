<script lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-svelte';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        stack: true,
    };
</script>

<Button onclick={() => Toast.info(opts)}>多次点击</Button>
