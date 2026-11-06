<script lang="ts">
    import { Cascader, Tag, Typography, type CascaderValue } from '@fibrae/semi-ui-svelte';

    let single = $state<CascaderValue>(['zhejiang', 'ningbo', 'jiangbei']);
    let multiple = $state<CascaderValue>(['zhejiang', 'ningbo', 'jiangbei']);

    const treeData = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        { label: '西湖区', value: 'xihu' },
                        { label: '萧山区', value: 'xiaoshan' },
                        { label: '临安区', value: 'linan' },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        { label: '海曙区', value: 'haishu' },
                        { label: '江北区', value: 'jiangbei' },
                    ],
                },
            ],
        },
    ];
</script>

<Typography.Title heading={6}>单选</Typography.Title>
<Cascader bind:value={single} placeholder="自定义回填时显示数据的格式" style="width: 300px" {treeData}>
    {#snippet display(display)}
        已选择：{display.labels.join(' -> ')}
    {/snippet}
</Cascader>
<br />
<br />
<Typography.Title heading={6}>多选</Typography.Title>
<Cascader bind:value={multiple} multiple placeholder="自定义回填时显示数据的格式" style="width: 300px" {treeData}>
    {#snippet tag(tag)}
        <Tag color="white" style="margin-inline-end: 4px">{tag.entity.data.label}</Tag>
    {/snippet}
</Cascader>
