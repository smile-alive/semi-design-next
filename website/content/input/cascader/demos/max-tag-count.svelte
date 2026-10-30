<script lang="ts">
    import { Cascader, type CascaderValue } from '@fibrae/semi-ui-svelte';

    let value = $state<CascaderValue>([
        ['zhejiang', 'ningbo', 'haishu'],
        ['zhejiang', 'hangzhou', 'xihu'],
    ]);

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
    const restTagsPopoverProps = { position: 'top' } as const;
</script>

<Cascader bind:value maxTagCount={1} multiple placeholder="请选择所在地区" {restTagsPopoverProps} showRestTagsPopover style="width: 300px" {treeData} />
