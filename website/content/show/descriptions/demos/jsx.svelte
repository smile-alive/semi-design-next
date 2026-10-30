<script lang="ts">
    import { Descriptions } from '@fibrae/semi-ui-svelte';

    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
        { key: '垂类标签', value: '电商' },
        { key: '认证状态', value: '未认证' },
    ];
</script>

<Descriptions {data}>
    {#snippet itemKey({ item })}{item.key}{/snippet}
    {#snippet value({ item })}{item.value}{/snippet}
</Descriptions>
