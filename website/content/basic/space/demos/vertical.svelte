<script lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-svelte';

    const items = [1, 2, 3, 4];
</script>

<Space vertical>
    {#each items as item (item)}
        <Button theme="solid" type="primary">按钮</Button>
    {/each}
</Space>
