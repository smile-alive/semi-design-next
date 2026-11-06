<script lang="ts">
    import { IconArrowUp } from '@fibrae/semi-icons-svelte';
    import { Descriptions } from '@fibrae/semi-ui-svelte';

    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
    ];
    const style = 'box-shadow: var(--semi-shadow-elevated); background-color: var(--semi-color-bg-2); border-radius: 4px; padding: 10px; margin-inline-end: 20px; width: 600px';
</script>

<div>
    <Descriptions {data} row size="small" {style}>
        {#snippet value({ item, index })}
            {#if index === 1}
                <span>
                    98%
                    <IconArrowUp size="small" style="color: red; margin-inline-start: 4px" />
                </span>
            {:else}
                {item.value}
            {/if}
        {/snippet}
    </Descriptions>
    <br />
    <Descriptions {data} row {style}>
        {#snippet value({ item, index })}
            {#if index === 1}
                <span>
                    98%
                    <IconArrowUp size="small" style="color: red; margin-inline-start: 4px" />
                </span>
            {:else}
                {item.value}
            {/if}
        {/snippet}
    </Descriptions>
    <br />
    <Descriptions {data} row size="large" {style}>
        {#snippet value({ item, index })}
            {#if index === 1}
                <span>
                    98%
                    <IconArrowUp size="small" style="color: red; margin-inline-start: 4px" />
                </span>
            {:else}
                {item.value}
            {/if}
        {/snippet}
    </Descriptions>
</div>
