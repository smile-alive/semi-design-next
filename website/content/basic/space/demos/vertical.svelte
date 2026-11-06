<script lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-svelte';

    const fourButtons = [1, 2, 3, 4];
</script>

<Space vertical>
    {#each fourButtons as item (item)}
        <Button theme="solid" type="primary">按钮</Button>
    {/each}
</Space>
