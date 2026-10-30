<script lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-svelte';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 3,
        theme: 'light',
    } as const;
</script>

<Button onclick={() => Toast.info(opts)}>Info</Button>
<br />
<br />
<Button style="color: var(--semi-color-success)" onclick={() => Toast.success(opts)}>Success</Button>
<br />
<br />
<Button type="warning" onclick={() => Toast.warning(opts)}>Warning</Button>
<br />
<br />
<Button type="danger" onclick={() => Toast.error(opts)}>Error</Button>
