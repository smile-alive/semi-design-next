<script lang="ts">
    import { Cascader, type CascaderChangeValue, type CascaderValue } from '@fibrae/semi-ui-svelte';

    let value = $state<CascaderValue>([]);

    const onChange = (v: CascaderChangeValue) => {
        console.log(v);
    };

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

<Cascader bind:value leafOnly multiple {onChange} placeholder="开启 leafOnly" style="width: 300px" {treeData} />
