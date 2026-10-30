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
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [{ label: '海曙区', value: 'haishu' }],
                },
            ],
        },
    ];
</script>

<Cascader clickToSelect multiple placeholder="请选择所在地区" showNext="hover" style="width: 300px" {treeData} />
