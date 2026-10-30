<script lang="ts">
    import { Cascader, type CascaderValue } from '@fibrae/semi-ui-svelte';

    let value = $state<CascaderValue>(['zhejiang', 'hangzhou', 'xihu']);

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
            ],
        },
    ];
</script>

<div>
    <Cascader disabled placeholder="请选择所在地区" style="width: 300px" {treeData} />
    <br />
    <br />
    <Cascader bind:value disabled filterTreeNode placeholder="请选择所在地区" style="width: 300px" {treeData} />
</div>
