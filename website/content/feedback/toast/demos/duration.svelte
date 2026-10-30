<script lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-svelte';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
    };
</script>

<Button onclick={() => Toast.info(opts)}>Close After 10s</Button>
