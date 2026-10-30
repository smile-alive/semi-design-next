<script lang="ts">
    import { Cascader, TypographyText } from '@fibrae/semi-ui-svelte';

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

<Cascader placeholder="请选择所在地区" style="width: 300px" {treeData}>
    {#snippet bottomSlot()}
        <div style="height: 36px; display: flex; padding: 0 32px; align-items: center; cursor: pointer; border-top: 1px solid var(--semi-color-border)">
            <TypographyText>找不到相关选项？</TypographyText>
            <TypographyText link>去新建</TypographyText>
        </div>
    {/snippet}
</Cascader>
