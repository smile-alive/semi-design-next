<script lang="ts">
    import { Button, ButtonGroup } from '@fibrae/semi-ui-svelte';

    const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;
</script>

<div style="display: flex">
    {#each types as type (type)}
        <div style="margin-right: 10px">
            <ButtonGroup aria-label="操作按钮组" {type}>
                <Button>拷贝</Button>
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        </div>
    {/each}
</div>
