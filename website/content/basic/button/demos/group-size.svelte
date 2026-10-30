<script lang="ts">
    import { Button, ButtonGroup } from '@fibrae/semi-ui-svelte';

    const sizes = ['large', 'default', 'small'] as const;
</script>

<div style="display: flex">
    {#each sizes as size (size)}
        <div style="margin-right: 10px">
            <ButtonGroup aria-label="操作按钮组" {size}>
                <Button>拷贝</Button>
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        </div>
    {/each}
</div>
