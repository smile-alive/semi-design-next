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
    {#snippet sourceHeader({ num, showButton, allChecked, onAllClick })}
        <div style={headerStyle}>
            <span>共 {num} 项</span>
            {#if showButton}
                <Button size="small" theme="borderless" type="tertiary" onclick={onAllClick}>
                    {allChecked ? '取消全选' : '全选'}
                </Button>
            {/if}
        </div>
    {/snippet}
    {#snippet selectedHeader({ num, showButton, onClear })}
        <div style={headerStyle}>
            <span>{num} 项已选</span>
            {#if showButton}
                <Button size="small" theme="borderless" type="tertiary" onclick={onClear}>清空</Button>
            {/if}
        </div>
    {/snippet}
</Transfer>
