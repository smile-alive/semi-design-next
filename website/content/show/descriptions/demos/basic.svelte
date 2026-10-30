<script lang="ts">
    import { IconArrowUp } from '@fibrae/semi-icons-svelte';
    import { Descriptions, Tag } from '@fibrae/semi-ui-svelte';

    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
        { key: '垂类标签', value: '电商' },
        { key: '认证状态', value: '未认证' },
    ];
</script>

<Descriptions {data}>
    {#snippet value({ item, index })}
        {#if index === 1}
            <div>
                98%
                <IconArrowUp size="small" style="color: var(--semi-color-success); margin-left: 2px" />
            </div>
        {:else if index === 3}
            <Tag style="margin: 0">电商</Tag>
        {:else}
            {item.value}
        {/if}
    {/snippet}
</Descriptions>
