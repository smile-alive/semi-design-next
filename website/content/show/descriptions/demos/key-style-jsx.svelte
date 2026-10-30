<script lang="ts">
    import { Descriptions, type DescriptionsData } from '@fibrae/semi-ui-svelte';

    const keyStyle = 'width: 120px; color: var(--semi-color-primary)';
    const data: DescriptionsData[] = [
        { key: '姓名', value: '李四', keyStyle },
        { key: '年龄', value: '28', keyStyle },
        { key: '职业', value: '前端工程师', keyStyle },
    ];
</script>

<Descriptions align="center" {data}>
    {#snippet itemKey({ item })}{item.key}{/snippet}
    {#snippet value({ item })}{item.value}{/snippet}
</Descriptions>
