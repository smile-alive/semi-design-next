<script lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-svelte';

    const items = Array.from({ length: 10 }, (_, index) => index);
</script>

<Space wrap>
    {#each items as item (item)}
        <Button theme="solid" type="secondary">按钮</Button>
    {/each}
</Space>
