<script lang="ts">
    import { Cascader } from '@fibrae/semi-ui-svelte';

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

<div>
    <Cascader changeOnSelect placeholder="选择即改变" style="width: 300px" {treeData} />
    <br />
    <br />
    <Cascader changeOnSelect filterTreeNode placeholder="可搜索的选择即改变" style="width: 300px" {treeData} />
</div>
