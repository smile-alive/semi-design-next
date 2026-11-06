<script lang="ts">
    import { Button, Transfer } from '@fibrae/semi-ui-svelte';

    const data = Array.from({ length: 30 }, (_v, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    const headerStyle = 'margin: 10px 0 0 10px; height: 24px; display: flex; align-items: center';
</script>

<Transfer dataSource={data} style="width: 568px; height: 416px">
    {#snippet sourceHeader(header)}
        <div style={headerStyle}>
            <span>共 {header.num} 项</span>
            {#if header.showButton}
                <Button size="small" theme="borderless" type="tertiary" onclick={header.onAllClick}>
                    {header.allChecked ? '取消全选' : '全选'}
                </Button>
            {/if}
        </div>
    {/snippet}
    {#snippet selectedHeader(header)}
        <div style={headerStyle}>
            <span>{header.num} 项已选</span>
            {#if header.showButton}
                <Button size="small" theme="borderless" type="tertiary" onclick={header.onClear}>清空</Button>
            {/if}
        </div>
    {/snippet}
</Transfer>
