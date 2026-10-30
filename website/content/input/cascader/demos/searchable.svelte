<script lang="ts">
    import { IconMapPinStroked } from '@fibrae/semi-icons-svelte';
    import { Cascader, TypographyTitle } from '@fibrae/semi-ui-svelte';

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

    // The label snippet adds a decorative icon in the columns; labelText holds the text that search matches
    const labelNodeTreeData = [
        {
            label: '浙江省',
            labelText: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    labelText: '杭州市',
                    value: 'hangzhou',
                    children: [
                        { label: '西湖区', labelText: '西湖区', value: 'xihu' },
                        { label: '萧山区', labelText: '萧山区', value: 'xiaoshan' },
                        { label: '临安区', labelText: '临安区', value: 'linan' },
                    ],
                },
                {
                    label: '宁波市',
                    labelText: '宁波市',
                    value: 'ningbo',
                    children: [
                        { label: '海曙区', labelText: '海曙区', value: 'haishu' },
                        { label: '江北区', labelText: '江北区', value: 'jiangbei' },
                    ],
                },
            ],
        },
    ];
</script>

<div>
    <Cascader filterTreeNode placeholder="默认对label值进行搜索" style="width: 300px" {treeData} />
    <br />
    <br />
    <Cascader filterTreeNode placeholder="对value值进行搜索" style="width: 300px" {treeData} treeNodeFilterProp="value" />
    <br />
    <br />
    <TypographyTitle heading={6}>filterLeafOnly=false:</TypographyTitle>
    <Cascader filterLeafOnly={false} filterTreeNode placeholder="filterLeafOnly=false" style="width: 300px" {treeData} />
    <br />
    <br />
    <TypographyTitle heading={6}>Label 为自定义节点，指定其他属性进行搜索</TypographyTitle>
    <Cascader displayProp="labelText" filterTreeNode placeholder="Search for labelText" style="width: 300px" treeData={labelNodeTreeData} treeNodeFilterProp="labelText">
        {#snippet label({ item })}
            <span style="display: inline-flex; align-items: center; column-gap: 4px">
                <IconMapPinStroked />
                {item.label}
            </span>
        {/snippet}
    </Cascader>
</div>
